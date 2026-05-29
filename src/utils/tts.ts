import * as Speech from "expo-speech";

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch {}
}

export function localeForLanguage(selectedLanguage: string): string {
  const map: Record<string, string> = {
    English: "en-US",
    "தமிழ்": "ta-IN",
    "हिन्दी": "hi-IN",
    "తెలుగు": "te-IN",
    "मराठी": "mr-IN",
    "മലയാളം": "ml-IN",
  };
  return map[selectedLanguage] || "en-US";
}

export async function speakText(text: string, locale = "en-US", timeoutMs = 12000): Promise<void> {
  if (!text || !text.trim()) return;
  try {
    await stopSpeaking();
  } catch {}

  return new Promise(async (resolve) => {
    const fallback = setTimeout(() => {
      stopSpeaking().catch(() => undefined);
      resolve();
    }, timeoutMs);

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      let voiceId: string | undefined;
      if (voices && voices.length) {
        const short = locale.split("-")[0].toLowerCase();
        const match = voices.find((v) => {
          const lang = (v.language || "").toLowerCase();
          return lang === locale.toLowerCase() || lang.startsWith(short);
        });
        if (match) voiceId = (match.identifier || match.name) as string;
      }

      Speech.speak(text, {
        voice: voiceId,
        language: locale,
        pitch: 1,
        rate: 0.95,
        onDone: () => {
          clearTimeout(fallback);
          resolve();
        },
        onStopped: () => {
          clearTimeout(fallback);
          resolve();
        },
        onError: () => {
          clearTimeout(fallback);
          resolve();
        },
      });
    } catch (err) {
      clearTimeout(fallback);
      resolve();
    }
  });
}
