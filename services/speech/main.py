import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from stt import transcribe_audio
from tts import list_voices, synthesize_speech

app = FastAPI(title="Voice Support Speech Service", version="2.0.0")

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3099").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class TtsRequest(BaseModel):
    text: str
    voice: str | None = None
    language: str | None = None


@app.get("/health")
def health() -> dict:
    voices = list_voices()
    tts_ready = any(v["ready"] == "true" for v in voices)
    return {
        "ok": True,
        "stt": "ready",
        "tts": "ready" if tts_ready else "models_missing",
        "voices": voices,
    }


@app.get("/voices")
def voices() -> dict:
    return {"voices": list_voices()}


@app.post("/stt")
async def stt(
    audio: UploadFile = File(...),
    language: str = Form("en-US"),
    initial_prompt: str = Form(""),
) -> dict:
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio upload.")

    try:
        result = transcribe_audio(
            data,
            language=language,
            initial_prompt=initial_prompt or None,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"STT failed: {exc}") from exc

    transcript = result.get("transcript", "").strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="No speech detected in audio.")

    return result


@app.post("/tts")
def tts(body: TtsRequest) -> Response:
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    try:
        wav_bytes = synthesize_speech(text, voice_id=body.voice)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"TTS failed: {exc}") from exc

    return Response(content=wav_bytes, media_type="audio/wav")
