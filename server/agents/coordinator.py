from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from .prompts import COORDINATOR_PROMPT
from .sage_agent import OPENAI_MODEL, SageAgent


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
_last_ready_for_verdicts = False


def ready_for_verdicts() -> bool:
    return _last_ready_for_verdicts


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


def _format_transcript(transcript: list[dict]) -> str:
    lines: list[str] = []
    for message in transcript:
        role = str(message.get("role", ""))
        content = str(message.get("content", "")).strip()
        if not content:
            continue

        speaker = "User" if role == "user" else str(message.get("sage_name") or role)
        lines.append(f"{speaker}: {content}")

    return "\n".join(lines) if lines else "No conversation yet."


def _last_message_from_sage(sage: SageAgent, transcript: list[dict]) -> str:
    for message in reversed(transcript):
        if message.get("role") == sage.sage_id:
            return str(message.get("content", "")).strip() or "not yet"
    return "not yet"


def _format_council_members(sages: list[SageAgent], transcript: list[dict]) -> str:
    return "\n".join(
        (
            f"- {sage.name} ({sage.failed_startup}) - focus: {sage.focus} - "
            f"last spoke: {_last_message_from_sage(sage, transcript)}"
        )
        for sage in sages
    )


def _extract_json_object(response_text: str) -> dict[str, Any]:
    text = response_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("OpenAI response did not contain a JSON object")

    parsed = json.loads(text[start : end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("OpenAI response JSON was not an object")
    return parsed


def _fallback_sage_id(sages: list[SageAgent], transcript: list[dict]) -> str:
    if not sages:
        return "sage_1"

    speak_counts = {
        sage.sage_id: sum(1 for message in transcript if message.get("role") == sage.sage_id)
        for sage in sages
    }
    return min(sages, key=lambda sage: (speak_counts.get(sage.sage_id, 0), sage.sage_id)).sage_id


async def pick_next_sage(
    sages: list[SageAgent],
    user_content: str,
    transcript: list[dict],
    exchange_count: int,
) -> str:
    global _last_ready_for_verdicts

    _last_ready_for_verdicts = False
    valid_sage_ids = {sage.sage_id for sage in sages}
    fallback_sage_id = _fallback_sage_id(sages, transcript)

    try:
        _load_env()
        api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        if not api_key:
            return fallback_sage_id

        from openai import AsyncOpenAI

        prompt = COORDINATOR_PROMPT.format(
            council_members=_format_council_members(sages, transcript),
            full_transcript=_format_transcript(transcript),
            user_content=user_content,
            exchange_count=exchange_count,
        )
        client = AsyncOpenAI(api_key=api_key)
        response = await client.responses.create(
            model=os.getenv("OPENAI_MODEL", OPENAI_MODEL),
            input=prompt,
        )
        parsed = _extract_json_object(getattr(response, "output_text", "") or "")
        _last_ready_for_verdicts = bool(parsed.get("ready_for_verdicts", False))
        next_sage = str(parsed.get("next_sage", "")).strip()
        if next_sage in valid_sage_ids:
            return next_sage
    except Exception:
        pass

    return fallback_sage_id
