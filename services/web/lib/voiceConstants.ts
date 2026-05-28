export const MAX_HISTORY_TURNS = 10;

export const DEFAULT_PIPER_VOICE =
  process.env.NEXT_PUBLIC_PIPER_VOICE ?? "en_US-lessac-medium";

export const FALLBACK_PIPER_VOICES = [
  { id: "en_US-lessac-medium", name: "Lessac (US English)", lang: "en-US" },
  { id: "en_GB-alan-medium", name: "Alan (UK English)", lang: "en-IN" },
  { id: "hi_IN-pratham-medium", name: "Pratham (Hindi)", lang: "hi-IN" },
] as const;

export function filterPiperVoicesForLanguage<T extends { lang: string }>(
  voices: T[],
  language: string,
): T[] {
  const prefix = language.split("-")[0]?.toLowerCase() ?? language.toLowerCase();
  const filtered = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(prefix),
  );
  return filtered.length > 0 ? filtered : [...voices];
}

export function pickDefaultPiperVoice(
  voices: { id: string; lang: string }[],
  language: string,
): string {
  const options = filterPiperVoicesForLanguage(voices, language);
  const exact = options.find((voice) => voice.lang === language);
  return exact?.id ?? options[0]?.id ?? DEFAULT_PIPER_VOICE;
}

export function getOllamaServiceUrl(): string {
  return (
    process.env.NEXT_PUBLIC_OLLAMA_SERVICE_URL?.replace(/\/$/, "") ??
    "http://localhost:4000"
  );
}

export function getSpeechServiceUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SPEECH_URL?.replace(/\/$/, "") ??
    "http://127.0.0.1:8000"
  );
}
