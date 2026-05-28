# Speech Service (Phase 2)

Local open-source STT and TTS for the Voice Customer Support System.

| Component | Library |
|-----------|---------|
| STT | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| TTS | [Piper](https://github.com/rhasspy/piper) |

## Prerequisites

- Python 3.10+
- **ffmpeg** (required for WebM audio from the browser)

```bash
brew install ffmpeg   # macOS
```

## Setup

```bash
cd speech-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python download_models.py
```

## Run

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

Health check: http://127.0.0.1:8000/health

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL` | `small` | `tiny`, `base`, `small`, `medium`, `turbo` (see `speech-service/.env`) |
| `PIPER_VOICE` | `en_US-lessac-medium` | Default TTS voice |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` |
| `WHISPER_COMPUTE_TYPE` | `int8` | Quantization for CPU |
