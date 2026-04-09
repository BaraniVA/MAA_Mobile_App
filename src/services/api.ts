import { apiBaseUrl } from "@/constants/theme";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

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

export async function sendChat(messages: ChatMessage[]) {
  return request<{ text: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ messages })
  });
}

export async function requestTts(text: string, voice: string) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000);

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

    return response.blob();
  } finally {
    clearTimeout(id);
  }
}
