from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


FAILED_STARTUPS_PATH = Path(__file__).with_name("failed_startups.json")
REPO_ROOT = Path(__file__).resolve().parents[2]
RESEARCHER_MODEL = "gpt-4o-mini"
PLACEHOLDER_API_KEY = "your_openai_api_key_here"


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")


def _load_failed_startups() -> list[dict[str, Any]]:
    with FAILED_STARTUPS_PATH.open(encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("failed_startups.json must contain a JSON list")

    return data


def _fallback_sages(failed_startups: list[dict[str, Any]]) -> list[dict[str, str]]:
    sages: list[dict[str, str]] = []
    for index, startup in enumerate(failed_startups[:3], start=1):
        company_name = str(startup.get("name", "Unknown startup"))
        failure_reason = str(
            startup.get("primary_failure_reason", "The company failed before finding a durable model.")
        )
        sages.append(
            {
                "id": f"sage_{index}",
                "name": f"{company_name} Sage",
                "persona": f"A cautionary advisor shaped by {company_name}'s failure.",
                "failed_startup": company_name,
                "failure_lesson": failure_reason,
            }
        )
    return sages


def _build_prompt(idea_text: str, failed_startups: list[dict[str, Any]]) -> str:
    return (
        "Given the startup idea, find the 3 most relevant failed startups from the provided "
        "list. Return ONLY a JSON array -- no markdown, no explanation -- where each item has: "
        "id (sage_1/2/3), name (a sage archetype name), persona (short description), "
        "failed_startup (company name from the list), failure_lesson (one sentence on what "
        "killed them).\n\n"
        f"Startup idea:\n{idea_text.strip()}\n\n"
        "Provided failed startups list:\n"
        f"{json.dumps(failed_startups, ensure_ascii=True)}"
    )


def _extract_json_array(response_text: str) -> list[Any]:
    text = response_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise ValueError("OpenAI response did not contain a JSON array")

    parsed = json.loads(text[start : end + 1])
    if not isinstance(parsed, list):
        raise ValueError("OpenAI response JSON was not a list")
    return parsed


def _normalize_sages(items: list[Any]) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for index, item in enumerate(items[:3], start=1):
        if not isinstance(item, dict):
            raise ValueError("OpenAI response item was not an object")

        normalized.append(
            {
                "id": str(item.get("id") or f"sage_{index}"),
                "name": str(item["name"]),
                "persona": str(item["persona"]),
                "failed_startup": str(item["failed_startup"]),
                "failure_lesson": str(item["failure_lesson"]),
            }
        )

    if len(normalized) != 3:
        raise ValueError("OpenAI response did not contain 3 sages")

    return normalized


async def run_with_debug(idea_text: str) -> tuple[list[dict], dict[str, str]]:
    _load_env()
    failed_startups = _load_failed_startups()
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key or api_key == PLACEHOLDER_API_KEY:
        return _fallback_sages(failed_startups), {"source": "fallback", "reason": "missing_key"}

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        prompt = _build_prompt(idea_text, failed_startups)
        response = await client.responses.create(
            model=RESEARCHER_MODEL,
            input=prompt,
        )
        response_text = getattr(response, "output_text", "") or ""
        return _normalize_sages(_extract_json_array(response_text)), {
            "source": "openai",
            "model": RESEARCHER_MODEL,
        }
    except Exception as exc:
        return _fallback_sages(failed_startups), {
            "source": "fallback",
            "reason": exc.__class__.__name__,
        }


async def run(idea_text: str) -> list[dict]:
    sages, _debug = await run_with_debug(idea_text)
    return sages
