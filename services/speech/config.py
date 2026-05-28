import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
WHISPER_BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
WHISPER_VAD_MIN_SILENCE_MS = int(os.getenv("WHISPER_VAD_MIN_SILENCE_MS", "400"))

DEFAULT_PIPER_VOICE = os.getenv("PIPER_VOICE", "en_US-lessac-medium")

LANGUAGE_TO_WHISPER = {
    "en-US": "en",
    "en-IN": "en",
    "hi-IN": "hi",
}

VOICE_CATALOG = [
    {
        "id": "en_US-lessac-medium",
        "name": "Lessac (US English)",
        "lang": "en-US",
        "files": {
            "onnx": "en_US-lessac-medium.onnx",
            "json": "en_US-lessac-medium.onnx.json",
        },
        "urls": {
            "onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
            "json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
        },
    },
    {
        "id": "en_GB-alan-medium",
        "name": "Alan (UK English)",
        "lang": "en-IN",
        "files": {
            "onnx": "en_GB-alan-medium.onnx",
            "json": "en_GB-alan-medium.onnx.json",
        },
        "urls": {
            "onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx",
            "json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json",
        },
    },
    {
        "id": "hi_IN-pratham-medium",
        "name": "Pratham (Hindi)",
        "lang": "hi-IN",
        "files": {
            "onnx": "hi_IN-pratham-medium.onnx",
            "json": "hi_IN-pratham-medium.onnx.json",
        },
        "urls": {
            "onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx",
            "json": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json",
        },
    },
]
