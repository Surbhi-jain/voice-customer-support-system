import { debugLog } from "./debug";
import { getSpeechServiceUrl } from "./voiceConstants";

export interface TranscribeResult {
  transcript: string;
  confidence?: "high" | "medium" | "low";
}

export async function transcribeAudio(
  audio: Blob,
  language: string,
  signal?: AbortSignal,
  options?: { topicId?: string },
): Promise<TranscribeResult> {
  const form = new FormData();
  form.append("audio", audio, "recording.webm");
  form.append("language", language);
  if (options?.topicId) {
    form.append("topicId", options.topicId);
  }

  const url = `${getSpeechServiceUrl()}/stt`;
  debugLog("STT", "POST /stt", {
    language,
    topicId: options?.topicId,
    bytes: audio.size,
    url,
  });

  const response = await fetch(url, {
    method: "POST",
    body: form,
    signal,
  });

  const data = (await response.json()) as TranscribeResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Speech-to-text failed.");
  }

  if (!data.transcript?.trim()) {
    throw new Error("No speech detected in the recording.");
  }

  return {
    transcript: data.transcript.trim(),
    confidence: data.confidence ?? "medium",
  };
}

export async function synthesizeSpeech(
  text: string,
  voice: string,
  language: string,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const url = `${getSpeechServiceUrl()}/tts`;
  debugLog("TTS", "POST /tts", { voice, language, textLength: text.length, url });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({ text, voice, language }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody === "object" &&
      errorBody &&
      "error" in errorBody &&
      typeof errorBody.error === "string"
        ? errorBody.error
        : "Text-to-speech failed.";
    throw new Error(message);
  }

  return response.arrayBuffer();
}
