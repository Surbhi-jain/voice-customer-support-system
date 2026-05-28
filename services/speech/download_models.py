#!/usr/bin/env python3
"""Download Piper voice files. Whisper models download automatically on first STT use."""

from __future__ import annotations

import ssl
import sys
from pathlib import Path

import httpx

from faster_whisper import WhisperModel
from faster_whisper.utils import download_model

from config import (
    MODELS_DIR,
    VOICE_CATALOG,
    WHISPER_COMPUTE_TYPE,
    WHISPER_DEVICE,
    WHISPER_MODEL,
)


def download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        print(f"  skip (exists): {dest.name}")
        return

    print(f"  downloading: {dest.name}")

    try:
        with httpx.stream("GET", url, follow_redirects=True, timeout=300.0) as response:
            response.raise_for_status()
            with dest.open("wb") as handle:
                for chunk in response.iter_bytes(chunk_size=1024 * 64):
                    handle.write(chunk)
    except httpx.HTTPError as exc:
        dest.unlink(missing_ok=True)
        raise RuntimeError(f"Failed to download {dest.name}: {exc}") from exc


def main() -> int:
    print(f"Models directory: {MODELS_DIR}")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("\nPiper voices:")
    for entry in VOICE_CATALOG:
        print(f"  {entry['id']}")
        for key in ("onnx", "json"):
            filename = entry["files"][key]
            download_file(entry["urls"][key], MODELS_DIR / filename)

    print(f"\nWhisper STT (model: {WHISPER_MODEL}):")
    model_path = download_model(WHISPER_MODEL, local_files_only=False)
    print(f"  downloaded: {model_path}")
    print("  loading into memory (warm-up)…")
    WhisperModel(WHISPER_MODEL, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)
    print("  whisper ready")

    print("\nDone. Start the service with:")
    print("  uvicorn main:app --host 127.0.0.1 --port 8000")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ssl.SSLError as exc:
        print(
            "\nSSL error while downloading. On macOS, try:\n"
            "  /Applications/Python\\ 3.*/Install\\ Certificates.command\n"
            "Or: pip install certifi && export SSL_CERT_FILE=$(python -m certifi)",
            file=sys.stderr,
        )
        print(f"\nDetails: {exc}", file=sys.stderr)
        sys.exit(1)
