from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from .prompts import SAGE_FOLLOWUP_PROMPT, SAGE_OPENING_PROMPT, SAGE_VERDICT_PROMPT


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
OPENAI_MODEL = "gpt-4o-mini"
VALID_VERDICTS = {"survives", "pivot", "rethink"}


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

    async def opening_message(self, idea_text: str) -> str:
        prompt = SAGE_OPENING_PROMPT.format(
            sage_name=self.name,
            failed_startup_name=self.failed_startup,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
        )
        return await self._call_openai(prompt)

    async def followup(self, idea_text: str, conversation_history: str) -> str:
        prompt = SAGE_FOLLOWUP_PROMPT.format(
            sage_name=self.name,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
            conversation_history=conversation_history,
        )
        return await self._call_openai(prompt)

    async def verdict(self, idea_text: str, conversation_history: str) -> dict:
        prompt = SAGE_VERDICT_PROMPT.format(
            sage_name=self.name,
            failure_lesson=self.failure_lesson,
            idea_text=idea_text,
            full_conversation=conversation_history,
        )
        parsed = _extract_json_object(await self._call_openai(prompt))
        verdict = str(parsed.get("verdict", "")).strip().lower()
        rationale = str(parsed.get("rationale", "")).strip()

        if verdict not in VALID_VERDICTS:
            raise ValueError(f"OpenAI returned invalid verdict: {verdict}")
        if not rationale:
            raise ValueError("OpenAI response did not include a rationale")

        return {"verdict": verdict, "rationale": rationale}
