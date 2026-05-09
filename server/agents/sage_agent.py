from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from .prompts import (
    SAGE_FOLLOWUP_PROMPT,
    SAGE_OPENING_PROMPT,
    SAGE_RESPOND_PROMPT,
    SAGE_VERDICT_PROMPT,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
OPENAI_MODEL = "gpt-4o-mini"
VALID_VERDICTS = {"survives", "pivot", "rethink"}
SAGE_FOCUS = {
    "sage_1": "distribution and go-to-market",
    "sage_2": "market timing and readiness",
    "sage_3": "unit economics and margins",
}


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


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


class SageAgent:
    def __init__(
        self,
        sage_id: str,
        name: str,
        persona: str,
        failed_startup: str,
        failure_lesson: str,
    ) -> None:
        self.sage_id = sage_id
        self.name = name
        self.persona = persona
        self.failed_startup = failed_startup
        self.failure_lesson = failure_lesson
        self.focus = SAGE_FOCUS.get(sage_id, "startup failure risk")

    async def _call_openai(self, prompt: str) -> str:
        _load_env()
        api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")

        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        response = await client.responses.create(
            model=os.getenv("OPENAI_MODEL", OPENAI_MODEL),
            input=prompt,
        )
        response_text = getattr(response, "output_text", "") or ""
        if not response_text.strip():
            raise ValueError("OpenAI returned an empty response")
        return response_text.strip()

    def _strip_self_label(self, text: str) -> str:
        labels = [self.name, self.failed_startup]
        cleaned = text.strip()
        for label in labels:
            if not label:
                continue
            cleaned = re.sub(
                rf"^\s*{re.escape(label)}\s*:\s*",
                "",
                cleaned,
                count=1,
                flags=re.IGNORECASE,
            )
        return cleaned.strip()

    async def opening_message(self, idea_text: str) -> str:
        prompt = SAGE_OPENING_PROMPT.format(
            sage_name=self.name,
            failed_startup_name=self.failed_startup,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
        )
        return self._strip_self_label(await self._call_openai(prompt))

    async def followup(self, idea_text: str, full_transcript: str) -> str:
        prompt = SAGE_FOLLOWUP_PROMPT.format(
            sage_name=self.name,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
            full_transcript=full_transcript,
        )
        return self._strip_self_label(await self._call_openai(prompt))

    async def respond(
        self,
        user_content: str,
        transcript: list[dict],
        idea_text: str,
        memory_context: list[str] | None = None,
    ) -> str:
        lines: list[str] = []
        for message in transcript:
            speaker = "User" if message.get("role") == "user" else message.get("sage_name") or message.get("role")
            content = str(message.get("content", "")).strip()
            if content:
                lines.append(f"{speaker}: {content}")

        full_transcript = "\n".join(lines)
        prompt = SAGE_RESPOND_PROMPT.format(
            sage_name=self.name,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
            full_transcript=full_transcript,
            memory_context="\n".join(memory_context or []) if memory_context else "Nothing yet",
            user_content=user_content,
        )
        return self._strip_self_label(await self._call_openai(prompt))

    async def verdict(self, idea_text: str, full_transcript: str) -> dict:
        prompt = SAGE_VERDICT_PROMPT.format(
            sage_name=self.name,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
            full_conversation=full_transcript,
        )
        parsed = _extract_json_object(await self._call_openai(prompt))
        verdict = str(parsed.get("verdict", "")).strip().lower()
        rationale = str(parsed.get("rationale", "")).strip()

        if verdict not in VALID_VERDICTS:
            raise ValueError(f"OpenAI returned invalid verdict: {verdict}")
        if not rationale:
            raise ValueError("OpenAI response did not include a rationale")

        return {"verdict": verdict, "rationale": rationale}
