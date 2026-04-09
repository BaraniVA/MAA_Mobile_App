from __future__ import annotations

import json
import os
import subprocess
import tempfile
from datetime import date
from pathlib import Path
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

APP_DIR = Path(__file__).resolve().parent
CACHE_FILE = APP_DIR / ".cache" / "affirmations.json"
VOICE_DIR = APP_DIR.parent / "assets" / "voices"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:27b")

app = FastAPI(title="Maa Local API", version="1.0.0")

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


class TtsRequest(BaseModel):
    text: str
    voice: str = "default"


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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
async def chat(payload: ChatRequest) -> dict[str, str]:
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    body = {
        "model": OLLAMA_MODEL,
        "messages": [message.model_dump() for message in payload.messages],
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{OLLAMA_URL}/api/chat", json=body)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ollama request failed: {exc}") from exc

    text = data.get("message", {}).get("content", "").strip()
    return {"text": text or "I am here with you. Could you rephrase that one more time?"}


@app.get("/affirmation")
async def affirmation() -> dict[str, str]:
    today = str(date.today())
    cache = _read_affirmation_cache()
    if today in cache:
        return {"text": cache[today]}

    prompt = (
        "Generate one concise, warm pregnancy affirmation in 1 sentence. "
        "No medical fear language, no emojis, no markdown."
    )

    body = {
        "model": OLLAMA_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You write calm, supportive maternal wellness affirmations.",
            },
            {"role": "user", "content": prompt},
        ],
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(f"{OLLAMA_URL}/api/chat", json=body)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to generate affirmation: {exc}") from exc

    text = data.get("message", {}).get("content", "").strip()
    if not text:
        text = "Your body and your heart are doing meaningful work, one calm breath at a time."

    cache[today] = text
    _write_affirmation_cache(cache)
    return {"text": text}


@app.post("/tts")
async def tts(payload: TtsRequest):
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
