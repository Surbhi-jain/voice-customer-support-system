import { debugLog, debugWarn } from "./debug";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "",
];

function isStreamActive(stream: MediaStream): boolean {
  const tracks = stream.getAudioTracks();
  return tracks.length > 0 && tracks.every((track) => track.readyState === "live");
}

function createMediaRecorder(stream: MediaStream): MediaRecorder {
  const errors: string[] = [];

  for (const mimeType of MIME_CANDIDATES) {
    if (mimeType && !MediaRecorder.isTypeSupported(mimeType)) {
      continue;
    }

    try {
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      debugLog("STT", "MediaRecorder created", {
        mimeType: mimeType || "browser-default",
      });

      return recorder;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${mimeType || "default"}: ${message}`);
    }
  }

  throw new Error(
    `No supported audio recording format in this browser. ${errors.join("; ")}`,
  );
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  async start(stream: MediaStream): Promise<void> {
    if (!isStreamActive(stream)) {
      throw new Error("Microphone stream is not active. Restart the session.");
    }

    this.releaseRecorderOnly();
    this.chunks = [];

    this.mediaRecorder = createMediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    try {
      this.mediaRecorder.start(250);
      debugLog("STT", "MediaRecorder started", {
        mimeType: this.mediaRecorder.mimeType,
      });
    } catch (err) {
      this.mediaRecorder = null;
      throw err;
    }
  }

  async stop(): Promise<Blob> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === "inactive") {
      debugWarn("STT", "MediaRecorder.stop called while inactive");
      return new Blob(this.chunks, { type: "audio/webm" });
    }

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        debugLog("STT", "Recording finished", { bytes: blob.size, type });
        this.mediaRecorder = null;
        resolve(blob);
      };

      recorder.onerror = () => {
        reject(new Error("Recording failed."));
      };

      if (recorder.state === "recording") {
        try {
          recorder.requestData();
        } catch {
          // ignore — some browsers omit requestData
        }
      }

      recorder.stop();
    });
  }

  /** Stop recording without stopping the shared session microphone stream. */
  abort(): void {
    this.releaseRecorderOnly();
    this.chunks = [];
  }

  private releaseRecorderOnly(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore — recorder may already be stopping
      }
    }
    this.mediaRecorder = null;
  }
}

export { isStreamActive };
