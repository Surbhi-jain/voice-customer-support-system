import type { Page } from "@playwright/test";

const MINIMAL_WAV = Buffer.from(createMinimalWav());

function createMinimalWav(): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, 0, true);
  return buffer;
}

/** Stub browser APIs for voice flow (MediaRecorder + service HTTP mocks). */
export async function installVoiceBrowserMocks(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const mockAudioTrack = {
      kind: "audio",
      readyState: "live",
      stop: () => {},
    };

    navigator.mediaDevices.getUserMedia = async () =>
      ({
        getTracks: () => [mockAudioTrack],
        getAudioTracks: () => [mockAudioTrack],
      }) as MediaStream;

    class MockMediaRecorder {
      static isTypeSupported() {
        return true;
      }

      state: RecordingState = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(_stream: MediaStream) {}

      start(_timeslice?: number) {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["fake-audio-bytes"], { type: "audio/webm" }),
        } as BlobEvent);
        this.onstop?.();
      }
    }

    window.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });

  await page.route("**/stt", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transcript: "What is artificial intelligence?",
        confidence: "high",
      }),
    });
  });

  await page.route("**/tts", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "audio/wav",
      body: MINIMAL_WAV,
    });
  });

  await page.route("**/health", async (route) => {
    const url = route.request().url();
    const isOllamaApi = url.includes(":4000") || url.endsWith("/4000/health");

    if (isOllamaApi) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          ollama: true,
          ollamaError: "",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        stt: "ready",
        tts: "ready",
        voices: [
          { id: "en_US-lessac-medium", name: "Lessac (US English)", lang: "en-US" },
        ],
      }),
    });
  });

  await page.route("**/voices", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        voices: [
          { id: "en_US-lessac-medium", name: "Lessac (US English)", lang: "en-US" },
          { id: "hi_IN-pratham-medium", name: "Pratham (Hindi)", lang: "hi-IN" },
        ],
      }),
    });
  });

  await page.route("**/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Mock assistant reply.",
        refusal: false,
      }),
    });
  });
}
