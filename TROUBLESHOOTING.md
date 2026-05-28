# Troubleshooting Guide — Voice Support Phase 2

Step-by-step fixes for the local voice support app (Ollama + speech-service + Next.js).

**Startup order:**

1. Terminal 1: `ollama serve`
2. Terminal 2: speech-service — `uvicorn main:app --host 127.0.0.1 --port 8000`
3. Terminal 3: `npm run dev`
4. Browser: **http://localhost:3000** (not port 8000)

---

## Which URL to open?

| URL | What it is | Open in browser? |
|-----|------------|------------------|
| **http://localhost:3000** | Voice Support web app (UI) | **Yes — use this** |
| http://127.0.0.1:8000 | Python speech-service (API only) | Only for `/health` checks |
| http://localhost:11434 | Ollama API | No (terminal / API only) |

---

## Table of contents

1. [Speech service setup](#speech-service-setup)
2. [Speech service errors](#speech-service-errors)
3. [Ollama server errors](#ollama-server-errors)
4. [Web app / port errors](#web-app--port-errors)
5. [Microphone and recording errors](#microphone-and-recording-errors)
6. [AI reply errors](#ai-reply-errors)
7. [Quick diagnostic commands](#quick-diagnostic-commands)

---

## Speech service setup

Full setup (run once, then start `uvicorn` every time):

```bash
cd voice_customer_support_system/speech-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python download_models.py
uvicorn main:app --host 127.0.0.1 --port 8000
```

Keep the last terminal open. Verify:

```bash
curl http://127.0.0.1:8000/health
```

---

### Browser shows `{"detail":"Not Found"}` at http://127.0.0.1:8000

**When it happens:** You open `http://127.0.0.1:8000` in Chrome and see JSON: `{"detail":"Not Found"}`.

**This is normal.** The speech-service has **no home page** at `/`. The server is running correctly.

**What to do instead:**

- Check the service: **http://127.0.0.1:8000/health** — you should see `"ok": true` and Piper voices with `"ready": "true"`.
- Use the **web app** for talking: **http://localhost:3000** (after `npm run dev`).

Useful speech-service URLs:

| Path | Purpose |
|------|---------|
| `/health` | Status of STT + TTS |
| `/voices` | List of Piper voices |

---

### `SSL: CERTIFICATE_VERIFY_FAILED` when running `download_models.py`

**When it happens:** On macOS, `python download_models.py` fails with:

```text
ssl.SSLCertVerificationError: certificate verify failed: unable to get local issuer certificate
```

**Cause:** Python on macOS sometimes cannot verify HTTPS certificates when downloading Piper models from Hugging Face.

**Fix (try in order):**

1. **Use the latest project code** — `download_models.py` uses `httpx`, which usually fixes this. Pull latest code and run again:
   ```bash
   source .venv/bin/activate
   python download_models.py
   ```

2. **Install Python certificates (macOS):**
   ```bash
   /Applications/Python\ 3.*/Install\ Certificates.command
   ```
   Then run `python download_models.py` again.

3. **Manual fallback:**
   ```bash
   pip install certifi
   export SSL_CERT_FILE=$(python -c "import certifi; print(certifi.where())")
   python download_models.py
   ```

---

### `TTS failed: # channels not specified` or HTTP 500 on `/tts`

**When it happens:** Health check passes but speaking a reply fails, or:

```bash
curl -X POST http://127.0.0.1:8000/tts ...
# {"detail":"TTS failed: # channels not specified"}
```

**Cause:** Older `tts.py` code was written for an older Piper API. Piper 1.4+ returns audio chunks differently.

**Fix:** Use the current `speech-service/tts.py` from the repo (builds WAV from `AudioChunk` data). Then **restart uvicorn**:

```bash
lsof -ti :8000 | xargs kill -9
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Test TTS:

```bash
curl -X POST http://127.0.0.1:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello test","voice":"en_US-lessac-medium"}' \
  -o /tmp/test.wav
file /tmp/test.wav
# Should say: WAVE audio ... mono 22050 Hz
```

---

### `uvicorn` exits immediately or exit code 137

**When it happens:** The speech-service terminal closes right away, or a diagnostic command shows `exit_code: 137`.

**Common causes:**

| Cause | Fix |
|-------|-----|
| Port 8000 already in use | `lsof -i :8000` then `kill -9 <PID>`, start uvicorn again |
| Started from wrong directory | `cd speech-service` before `uvicorn main:app ...` |
| Second uvicorn killed the first | Only one instance on port 8000 |
| Process killed (137) | Often SIGKILL from duplicate start or low memory — restart once |

**Correct start:**

```bash
cd voice_customer_support_system/speech-service
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

You should see:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

---

### `Speech engine not running` / `Speech service not running on port 8000`

**When it happens:** You click **Start conversation** in the web app and see an error about the speech engine.

**Fix:**

```bash
cd voice_customer_support_system/speech-service
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Verify:

```bash
curl http://127.0.0.1:8000/health
```

---

### `Piper voice not found` / `models_missing` in health

**When it happens:** speech-service runs but `/health` shows `"tts": "models_missing"` or voices with `"ready": "false"`.

**Fix:**

```bash
cd speech-service
source .venv/bin/activate
python download_models.py
```

Restart `uvicorn`. Check **http://127.0.0.1:8000/health** — each voice should show `"ready": "true"`.

---

### `STT failed` / ffmpeg errors

**When it happens:** Transcription fails after you click **Stop**.

**Cause:** faster-whisper uses **ffmpeg** to decode WebM audio from the browser.

**Fix (macOS):**

```bash
brew install ffmpeg
ffmpeg -version
```

Restart the speech-service after installing.

---

### First STT request is very slow

**Normal:** The Whisper model downloads and loads on the first transcription (10–60 seconds depending on model size).

**Faster option:** Before starting uvicorn:

```bash
export WHISPER_MODEL=tiny
uvicorn main:app --host 127.0.0.1 --port 8000
```

Smaller models are faster but less accurate. Default is `small` (better than `base`). For best accuracy on a fast Mac, try `WHISPER_MODEL=medium` (slower).

**Inaccurate transcripts:** After you click **Stop**, check the **You said** box, fix any wrong words, then click **Send question**. Speak in a quiet room, hold the mic close, and finish your full sentence before stopping.

---

### Python / pip install errors

Use Python 3.10+ and a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

On Apple Silicon, if `faster-whisper` fails, install Xcode command line tools:

```bash
xcode-select --install
```

---

## Ollama server errors

### `Error: could not connect to ollama server, run 'ollama serve' to start it`

**Fix:**

```bash
ollama serve
```

Wait for `Listening on 127.0.0.1:11434`, then retry in a **new** terminal.

---

### `Cannot reach Ollama` (web app)

**Fix:**

```bash
curl http://localhost:11434/api/version
```

Start Ollama if curl fails. Refresh the browser.

---

### `Model "llama3.2" not found`

```bash
ollama pull llama3.2
```

While `ollama serve` is running.

---

## Web app / port errors

### Opened port 8000 instead of 3000

**Symptom:** You see `{"detail":"Not Found"}` or raw JSON in the browser.

**Fix:** The UI is on **http://localhost:3000**. Port 8000 is only the speech API backend.

```bash
cd voice_customer_support_system
npm run dev
```

---

### `EADDRINUSE :::3000`

Another process uses port 3000:

```bash
lsof -i :3000
kill -9 <PID>
```

Or:

```bash
npm run dev -- -p 3001
```

Then open http://localhost:3001

---

### `EADDRINUSE :::8000`

Another speech-service instance is running:

```bash
lsof -i :8000
kill -9 <PID>
```

Then start uvicorn again.

---

### `Cannot find module` / broken `.next` build

```bash
rm -rf .next
npm run dev
```

Do not run `npm run build` while `npm run dev` is active — it can corrupt `.next`. If that happens, delete `.next` and restart dev.

---

### `GET /api/voices 500` / `ENOENT ... api/voices/route.js`

**When it happens:** Browser console shows:

```text
GET http://localhost:3000/api/voices 500 (Internal Server Error)
[VoiceSupport:TTS] Could not load voices from API — using fallback list
```

**Cause:** The Next.js `.next` cache is stale or corrupted (common after adding new API routes or running `npm run build` while `dev` is running). The server cannot find the compiled route file.

**Fix:**

1. Stop the dev server (Ctrl+C).
2. Clean and restart:
   ```bash
   cd voice_customer_support_system
   rm -rf .next
   npm run dev
   ```
3. Hard refresh the browser (Cmd+Shift+R).
4. Verify:
   ```bash
   curl http://localhost:3000/api/voices
   ```
   You should get JSON with a `voices` array (not HTML error page).

**Note:** The yellow fallback warning is harmless if speech-service is down — the app still works with built-in voice names. After this fix, `/api/voices` should return **200** even when speech-service is offline.

---

## Microphone and recording errors

### `Could not start recording` / `NotSupportedError` on MediaRecorder

**When it happens:** You click **Start speaking** and see a red error: *"Could not start recording. Try again."*  
In the browser console (F12): `NotSupportedError: Failed to execute 'start' on 'MediaRecorder'`.

**Common causes:**

| Cause | Fix |
|-------|-----|
| Browser reports a MIME type as supported but `start()` still fails | Fixed in latest code — app tries several formats automatically |
| Microphone stream was stopped after first recording | Click **End session**, then **Start conversation** again; or pull latest code (stream is re-acquired) |
| Mic permission revoked mid-session | Re-allow microphone in browser settings |
| Non-HTTPS site (not localhost) | Use `http://localhost:3000` only |

**Try this:**

1. **End session** → **Start conversation** (fresh mic permission).
2. Use **Chrome or Edge** for best `MediaRecorder` support.
3. Check console for `[VoiceSupport:STT] MediaRecorder started` — if missing, note the error text.
4. Confirm no other app is using the microphone exclusively.

**Safari / Firefox:** Recording usually works with fallback formats; if not, try Chrome.

---

### Microphone permission denied

1. Browser: allow microphone for `localhost`.
2. macOS: **System Settings → Privacy & Security → Microphone** — enable your browser.
3. Click **End session**, then **Start conversation** again.

---

### `No audio captured`

- Confirm the correct mic is selected in system settings.
- Speak **after** clicking **Start speaking**, **before** **Stop**.
- Check that no other app has exclusive mic access.

---

### `No speech detected in the recording`

- Speak louder and closer to the mic.
- Record at least 1–2 seconds of speech.
- Check STT logs in the speech-service terminal.

---

### `Speech-to-text failed` after Stop

1. Confirm speech-service is running: `curl http://127.0.0.1:8000/health`
2. Confirm ffmpeg is installed: `ffmpeg -version`
3. Enable debug logs in `.env` and check browser console + all three terminals.

---

## AI reply errors

### Reply in wrong language

Set **Language** in Settings **before** starting the session. Phase 2 uses Whisper + Ollama language rules together.

---

### `Failed to play the spoken reply` / TTS error in web app

1. Check speech-service terminal for errors.
2. Run `python download_models.py` if voices are missing.
3. Test TTS directly (see [TTS failed: # channels not specified](#tts-failed--channels-not-specified-or-http-500-on-tts)).
4. Try another **Piper voice** in Settings.

---

### First Ollama reply slow (10–30 s)

Normal while the model loads into memory. Later replies are faster.

---

## Quick diagnostic commands

```bash
# Ollama
curl http://localhost:11434/api/version
ollama list

# Speech service (use /health — not the root URL)
curl http://127.0.0.1:8000/health

# TTS smoke test
curl -X POST http://127.0.0.1:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","voice":"en_US-lessac-medium"}' \
  -o /tmp/test.wav && file /tmp/test.wav

# Combined check (Next.js must be running)
curl http://localhost:3000/api/health

# ffmpeg
ffmpeg -version
```

---

## Phase 1 (browser STT/TTS) — no longer used

Phase 2 replaced browser `SpeechRecognition` and `speechSynthesis`. If you see errors about **Chrome or Edge only** for speech recognition, you are on an old build — use the latest code and start the **speech-service**.

---

## Still stuck?

1. Confirm all three services are running:
   - `curl http://localhost:11434/api/version` (Ollama)
   - `curl http://127.0.0.1:8000/health` (speech-service)
   - `npm run dev` → http://localhost:3000 (web app)
2. Run `npm run test:e2e` to verify app logic with mocks.
3. Enable `VOICE_DEBUG=true` in `.env` and check browser console + all terminals.
