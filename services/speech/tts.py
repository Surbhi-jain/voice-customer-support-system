import io
import wave
from pathlib import Path

from piper import PiperVoice

from config import DEFAULT_PIPER_VOICE, MODELS_DIR, VOICE_CATALOG

_voices: dict[str, PiperVoice] = {}


def voice_paths(voice_id: str) -> tuple[Path, Path]:
    for entry in VOICE_CATALOG:
        if entry["id"] == voice_id:
            onnx = MODELS_DIR / entry["files"]["onnx"]
            config = MODELS_DIR / entry["files"]["json"]
            return onnx, config
    onnx = MODELS_DIR / f"{voice_id}.onnx"
    config = MODELS_DIR / f"{voice_id}.onnx.json"
    return onnx, config


def get_piper_voice(voice_id: str | None = None) -> PiperVoice:
    selected = voice_id or DEFAULT_PIPER_VOICE
    if selected in _voices:
        return _voices[selected]

    onnx_path, config_path = voice_paths(selected)
    if not onnx_path.exists():
        raise FileNotFoundError(
            f"Piper voice not found: {onnx_path}. Run: python download_models.py"
        )

    voice = PiperVoice.load(str(onnx_path), config_path=str(config_path))
    _voices[selected] = voice
    return voice


def synthesize_speech(text: str, voice_id: str | None = None) -> bytes:
    voice = get_piper_voice(voice_id)
    buffer = io.BytesIO()

    audio_bytes = b""
    sample_rate = 22050
    sample_channels = 1
    sample_width = 2

    for chunk in voice.synthesize(text):
        audio_bytes += chunk.audio_int16_bytes
        sample_rate = chunk.sample_rate
        sample_channels = chunk.sample_channels
        sample_width = chunk.sample_width

    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(sample_channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_bytes)

    return buffer.getvalue()


def list_voices() -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for entry in VOICE_CATALOG:
        onnx, _config = voice_paths(entry["id"])
        result.append(
            {
                "id": entry["id"],
                "name": entry["name"],
                "lang": entry["lang"],
                "ready": str(onnx.exists()).lower(),
            }
        )
    return result
