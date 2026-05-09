from __future__ import annotations

import os
import re
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
AUDIO_ROOT = SERVER_ROOT / "data" / "audio"
DEFAULT_TTS_MODEL = "gpt-4o-mini-tts"
DEFAULT_TTS_FORMAT = "mp3"
PLACEHOLDER_API_KEY = "your_openai_api_key_here"
SAGE_VOICES = {
    "sage_1": "marin",
    "sage_2": "cedar",
    "sage_3": "coral",
}


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


def _safe_path_part(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-") or "audio"


def _voice_for_sage(sage_id: str) -> str:
    env_key = f"OPENAI_TTS_VOICE_{sage_id.upper()}"
    return os.getenv(env_key, SAGE_VOICES.get(sage_id, "marin")).strip()


async def synthesize_sage_audio(
    *,
    session_id: str,
    message_id: str,
    sage_id: str,
    sage_name: str,
    text: str,
) -> dict[str, str]:
    _load_env()
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key or api_key == PLACEHOLDER_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")

    try:
        from openai import AsyncOpenAI
    except Exception as exc:
        raise RuntimeError("OpenAI SDK is not installed. Install server/requirements-ai.txt.") from exc

    model = os.getenv("OPENAI_TTS_MODEL", DEFAULT_TTS_MODEL).strip()
    response_format = os.getenv("OPENAI_TTS_FORMAT", DEFAULT_TTS_FORMAT).strip()
    voice = _voice_for_sage(sage_id)
    input_text = text.strip()[:4096]
    if not input_text:
        raise ValueError("Cannot synthesize empty text")

    client = AsyncOpenAI(api_key=api_key)
    speech = await client.audio.speech.create(
        model=model,
        voice=voice,
        input=input_text,
        response_format=response_format,
        instructions=(
            f"Speak as {sage_name}, a concise startup validation judge. "
            "Sound direct, skeptical, and measured. Do not add words."
        ),
    )

    audio_bytes = getattr(speech, "content", None) or speech.read()
    if not audio_bytes:
        raise ValueError("OpenAI returned empty audio")

    safe_session_id = _safe_path_part(session_id)
    safe_message_id = _safe_path_part(message_id)
    session_dir = AUDIO_ROOT / safe_session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{safe_message_id}.{response_format}"
    (session_dir / filename).write_bytes(audio_bytes)

    return {
        "audio_url": f"/audio/{safe_session_id}/{filename}",
        "voice": voice,
        "format": response_format,
    }
