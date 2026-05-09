from __future__ import annotations

import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe"
PLACEHOLDER_API_KEY = "your_openai_api_key_here"


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


async def transcribe_audio_bytes(
    audio_bytes: bytes,
    *,
    filename: str,
    content_type: str | None = None,
) -> str:
    _load_env()
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key or api_key == PLACEHOLDER_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")

    try:
        from openai import AsyncOpenAI
    except Exception as exc:
        raise RuntimeError("OpenAI SDK is not installed. Install server/requirements-ai.txt.") from exc

    client = AsyncOpenAI(api_key=api_key)
    model = os.getenv("OPENAI_TRANSCRIPTION_MODEL", DEFAULT_TRANSCRIPTION_MODEL)
    response = await client.audio.transcriptions.create(
        model=model,
        file=(filename, audio_bytes, content_type or "application/octet-stream"),
        prompt=(
            "Transcribe a founder answering startup validation judges. Preserve startup names, "
            "metrics, acronyms, punctuation, and concise wording."
        ),
    )

    text = response if isinstance(response, str) else getattr(response, "text", "")
    if not text.strip():
        raise ValueError("OpenAI returned an empty transcript")
    return text.strip()
