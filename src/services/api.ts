import { apiBaseUrl } from "@/constants/theme";
import { Buffer } from "buffer";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatMedia = { type: "image" | "video" | "web"; title: string; url: string };
export type ChatSource = { title: string; url: string };
export type ChatResult = { text: string; sources?: ChatSource[]; media?: ChatMedia[] };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchAffirmation() {
  return request<{ text: string }>("/affirmation");
}

export async function sendChat(messages: ChatMessage[], language: string) {
  return request<ChatResult>("/chat", {
    method: "POST",
    body: JSON.stringify({ messages, language, web_search: true })
  });
}

export async function streamChat(
  messages: ChatMessage[],
  language: string,
  handlers: {
    onToken: (token: string) => void;
    onDone: (result: ChatResult) => void;
    onError: (message: string) => void;
  }
) {
  const response = await fetch(`${apiBaseUrl}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages, language, web_search: true })
  });

  if (!response.ok || !response.body) {
    const body = await response.text();
    throw new Error(body || "Streaming request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let eventName = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const lines = frame.split("\n");
      let dataPayload = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        }
        if (line.startsWith("data:")) {
          dataPayload += line.slice(5).trim();
        }
      }

      if (!dataPayload) continue;

      try {
        const parsed = JSON.parse(dataPayload) as ChatResult & { message?: string };
        if (eventName === "token") {
          handlers.onToken(parsed.text ?? "");
        } else if (eventName === "done") {
          handlers.onDone(parsed);
        } else if (eventName === "error") {
          handlers.onError(parsed.message ?? "Streaming error");
        }
      } catch {
        handlers.onError("Could not parse streaming payload");
      }
    }
  }
}

export async function transcribeAudio(audioBase64: string, mimeType: string, language: string) {
  return request<{ text: string }>("/stt", {
    method: "POST",
    body: JSON.stringify({
      audio_base64: audioBase64,
      mime_type: mimeType,
      language,
    })
  });
}

export async function requestTts(text: string, voice: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${apiBaseUrl}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || "TTS generation failed");
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const base64 = Buffer.from(bytes).toString("base64");
    return { base64, mimeType: "audio/wav" as const };
  } finally {
    clearTimeout(id);
  }
}
