import os
import tempfile
from pathlib import Path

from faster_whisper import WhisperModel

from config import (
    LANGUAGE_TO_WHISPER,
    WHISPER_BEAM_SIZE,
    WHISPER_COMPUTE_TYPE,
    WHISPER_DEVICE,
    WHISPER_MODEL,
    WHISPER_VAD_MIN_SILENCE_MS,
)

_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
    return _model


def _confidence_label(avg_logprob: float) -> str:
    if avg_logprob >= -0.45:
        return "high"
    if avg_logprob >= -0.85:
        return "medium"
    return "low"


def transcribe_audio(
    audio_bytes: bytes,
    language: str = "en-US",
    initial_prompt: str | None = None,
) -> dict:
    whisper_lang = LANGUAGE_TO_WHISPER.get(language, "en")
    prompt = initial_prompt.strip() if initial_prompt else None

    suffix = ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = Path(tmp.name)

    try:
        model = get_whisper_model()
        segments, _info = model.transcribe(
            str(tmp_path),
            language=whisper_lang,
            task="transcribe",
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": WHISPER_VAD_MIN_SILENCE_MS,
                "speech_pad_ms": 300,
            },
            beam_size=WHISPER_BEAM_SIZE,
            temperature=0,
            condition_on_previous_text=False,
            initial_prompt=prompt,
        )

        parts: list[str] = []
        log_probs: list[float] = []
        for segment in segments:
            parts.append(segment.text)
            if segment.avg_logprob is not None:
                log_probs.append(segment.avg_logprob)

        text = "".join(parts).strip()
        avg_logprob = sum(log_probs) / len(log_probs) if log_probs else -2.0

        return {
            "transcript": text,
            "confidence": _confidence_label(avg_logprob),
            "avg_logprob": round(avg_logprob, 3),
        }
    finally:
        tmp_path.unlink(missing_ok=True)
