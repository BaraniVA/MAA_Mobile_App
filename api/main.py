from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import tempfile
from datetime import date
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from google import genai
from google.genai import types as genai_types
from dotenv import load_dotenv
from pydantic import BaseModel, Field

APP_DIR = Path(__file__).resolve().parent
CACHE_FILE = APP_DIR / ".cache" / "affirmations.json"
VOICE_DIR = APP_DIR.parent / "assets" / "voices"
load_dotenv(APP_DIR / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = FastAPI(title="Maa Local API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
    language: str = "English"
    web_search: bool = True


class TtsRequest(BaseModel):
    text: str
    voice: str = "default"


class SttRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/m4a"
    language: str = "English"


def _read_affirmation_cache() -> dict[str, str]:
    if not CACHE_FILE.exists():
        return {}

    try:
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _write_affirmation_cache(cache: dict[str, str]) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=True, indent=2), encoding="utf-8")


def _resolve_voice_file(voice: str) -> Path:
    if voice == "default":
        candidates = sorted(VOICE_DIR.glob("*.onnx"))
        if not candidates:
            raise HTTPException(status_code=400, detail="No Piper voices found in assets/voices")
        return candidates[0]

    requested = (VOICE_DIR / voice).resolve()
    if requested.suffix != ".onnx" or not requested.exists():
        raise HTTPException(status_code=404, detail=f"Voice file not found: {voice}")

    return requested


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY.strip():
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set")
    return genai.Client(api_key=GEMINI_API_KEY)


def _normalize_messages(messages: list[ChatMessage]) -> str:
    lines: list[str] = []
    for message in messages:
        if message.role == "system":
            continue
        lines.append(f"{message.role.upper()}: {message.content.strip()}")
    return "\n".join(lines)


def _system_prompt(language: str) -> str:
    return (
        "You are Maa, an empathetic maternal health assistant. "
        "Provide practical, medically cautious, concise support. "
        "If the user asks for urgent symptoms, suggest contacting emergency care immediately. "
        f"Always respond in this language: {language}. "
        "When web search grounding is available, include current and verifiable information."
    )


def _extract_links(text: str) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    urls = re.findall(r"https?://[^\s)\]]+", text)
    seen: set[str] = set()
    media: list[dict[str, str]] = []
    sources: list[dict[str, str]] = []

    for url in urls:
        clean_url = url.strip().rstrip(".,")
        if clean_url in seen:
            continue
        seen.add(clean_url)

        lower = clean_url.lower()
        if any(lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]) or "images" in lower:
            media.append({"type": "image", "title": "Image source", "url": clean_url})
        elif "youtube.com" in lower or "youtu.be" in lower or lower.endswith(".mp4"):
            media.append({"type": "video", "title": "Video source", "url": clean_url})
        else:
            sources.append({"title": "Web source", "url": clean_url})

    return sources[:8], media[:6]


def _build_config(web_search: bool) -> genai_types.GenerateContentConfig:
    tools = [genai_types.Tool(google_search=genai_types.GoogleSearch())] if web_search else []
    return genai_types.GenerateContentConfig(
        tools=tools,
        temperature=0.55,
        top_p=0.9,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
def chat(payload: ChatRequest) -> dict[str, object]:
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    client = _get_client()
    transcript = _normalize_messages(payload.messages)
    prompt = f"{_system_prompt(payload.language)}\n\nConversation:\n{transcript}"

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=_build_config(payload.web_search),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    text = (response.text or "").strip()
    if not text:
        text = "I am here with you. Could you ask that again in a different way?"

    sources, media = _extract_links(text)
    return {"text": text, "sources": sources, "media": media}


@app.post("/chat/stream")
def chat_stream(payload: ChatRequest):
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    client = _get_client()
    transcript = _normalize_messages(payload.messages)
    prompt = f"{_system_prompt(payload.language)}\n\nConversation:\n{transcript}"

    def event_stream():
        full_text = ""
        try:
            for chunk in client.models.generate_content_stream(
                model=GEMINI_MODEL,
                contents=prompt,
                config=_build_config(payload.web_search),
            ):
                token = (chunk.text or "")
                if not token:
                    continue
                full_text += token
                yield f"event: token\ndata: {json.dumps({'text': token}, ensure_ascii=True)}\n\n"

            sources, media = _extract_links(full_text)
            done_payload = {"text": full_text.strip(), "sources": sources, "media": media}
            yield f"event: done\ndata: {json.dumps(done_payload, ensure_ascii=True)}\n\n"
        except Exception as exc:
            yield f"event: error\ndata: {json.dumps({'message': str(exc)}, ensure_ascii=True)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/stt")
def stt(payload: SttRequest) -> dict[str, str]:
    client = _get_client()

    encoded = payload.audio_base64.strip()
    if "," in encoded and encoded.startswith("data:"):
        encoded = encoded.split(",", 1)[1]

    try:
        audio_bytes = base64.b64decode(encoded)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 audio: {exc}") from exc

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="audio_base64 must not be empty")

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                genai_types.Part.from_bytes(data=audio_bytes, mime_type=payload.mime_type),
                (
                    "Transcribe this speech accurately. "
                    f"Return plain text only in {payload.language}. "
                    "Do not add explanations."
                ),
            ],
            config=genai_types.GenerateContentConfig(temperature=0.0),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini transcription failed: {exc}") from exc

    text = (response.text or "").strip()
    if not text:
        raise HTTPException(status_code=502, detail="Empty transcription response")

    return {"text": text}


@app.get("/affirmation")
def affirmation() -> dict[str, str]:
    today = str(date.today())
    cache = _read_affirmation_cache()
    if today in cache:
        return {"text": cache[today]}

    client = _get_client()
    prompt = (
        "Generate one concise, warm pregnancy affirmation in 1 sentence. "
        "No fear language, no emojis, no markdown."
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(temperature=0.7),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to generate affirmation: {exc}") from exc

    text = (response.text or "").strip()
    if not text:
        text = "Your body and your heart are doing meaningful work, one calm breath at a time."

    cache[today] = text
    _write_affirmation_cache(cache)
    return {"text": text}


@app.post("/tts")
def tts(payload: TtsRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    voice_path = _resolve_voice_file(payload.voice)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        output_path = Path(temp_audio.name)

    command = [
        "piper",
        "--model",
        str(voice_path),
        "--output_file",
        str(output_path),
    ]

    try:
        process = subprocess.run(
            command,
            input=payload.text.encode("utf-8"),
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="piper CLI not found in PATH") from exc
    except subprocess.CalledProcessError as exc:
        output_path.unlink(missing_ok=True)
        stderr = exc.stderr.decode("utf-8", errors="ignore")
        raise HTTPException(status_code=500, detail=f"piper failed: {stderr}") from exc

    if process.returncode != 0 or not output_path.exists():
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="piper did not produce audio")

    return FileResponse(path=output_path, media_type="audio/wav", filename="maa-tts.wav")
