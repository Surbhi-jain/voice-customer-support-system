import { debugLog } from "./debug";

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playbackGeneration = 0;

export function stopPlayback(): void {
  playbackGeneration += 1;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }

  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }

  debugLog("TTS", "Playback stopped");
}

export function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  stopPlayback();
  const generation = playbackGeneration;

  const blob = new Blob([buffer], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  currentUrl = url;

  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;

    const finishIfCurrent = (onSuccess: () => void) => {
      if (generation !== playbackGeneration) {
        resolve();
        return;
      }
      onSuccess();
    };

    audio.onended = () => {
      finishIfCurrent(() => {
        stopPlayback();
        resolve();
      });
    };

    audio.onerror = () => {
      finishIfCurrent(() => {
        stopPlayback();
        reject(new Error("Failed to play the spoken reply."));
      });
    };

    debugLog("TTS", "Playback started", { bytes: buffer.byteLength });
    void audio.play().catch((err) => {
      if (generation !== playbackGeneration) {
        resolve();
        return;
      }
      reject(err);
    });
  });
}
