from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from .prompts import REPORT_PROMPT


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
OPENAI_REPORT_MODEL = "gpt-4o-mini"
REPORTS: dict[str, dict[str, Any]] = {}
LAST_REPORT_DEBUG: dict[str, Any] = {}


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


def _fallback_report() -> dict[str, Any]:
    return {
        "survival_score": 50,
        "overall_verdict": "Report generation is temporarily unavailable. Treat this as a neutral placeholder until the council report can be regenerated.",
        "council_summary": {
            "consensus": "We could not generate a reliable council synthesis, so this placeholder should be treated as neutral until the report can be regenerated.",
            "what_we_liked": [
                "The founder completed enough of the session to request a report.",
                "The council transcript contains material that can be reviewed manually.",
            ],
            "verdict": "pivot",
        },
        "top_risks": [
            "Risk summary unavailable.",
            "Market validation still needs review.",
            "Unit economics still need review.",
        ],
        "top_improvements": [
            "Regenerate the report after the session completes.",
            "Review the transcript for unresolved assumptions.",
            "Validate the strongest customer and margin claims.",
        ],
        "closest_parallel": {
            "name": "Unavailable",
            "why": "The report generator could not parse a reliable closest parallel.",
        },
        "next_steps": [
            "Review the council transcript.",
            "Identify the riskiest assumption.",
            "Run one focused validation test.",
        ],
    }


def _format_transcript(transcript: Any) -> str:
    return transcript if isinstance(transcript, str) else json.dumps(transcript, ensure_ascii=True, indent=2)


def _build_report_prompt(idea_text: str, all_verdicts: Any, transcript: Any) -> str:
    verdicts_json = json.dumps(all_verdicts, ensure_ascii=True, indent=2)
    return f"""Based on this startup idea and council conversation, write:
1. council_summary.consensus (paragraph, first person plural, "We believe...")
2. council_summary.what_we_liked (list of 2-3 specific things)
3. overall_verdict: a concise one-paragraph report summary
4. council_summary.verdict: the majority vote from these verdicts: {verdicts_json}
5. top_risks (list of 3 specific risks from the conversation)
6. top_improvements (list of 3 specific suggestions)
7. closest_parallel.name and closest_parallel.why
8. next_steps (list of 3 concrete actions)
9. survival_score (integer 0-100, calculated as described)

Startup idea:
{idea_text}

Council conversation:
{_format_transcript(transcript)}

survival_score must be an integer between 0 and 100.
Calculate it based on:
- Start at 50
- +10 if founder showed understanding of their market
- +10 if they have a clear distribution plan
- +10 if unit economics are plausible
- +10 if timing is right
- -15 if core unit economics are broken
- -15 if no distribution answer
- -10 if market timing is wrong
- -10 if they dodged critical questions
Never return 0 unless the idea is completely incoherent.

Return ONLY valid JSON. No markdown. No explanation.
Start your response with {{ and end with }}.
Use this exact shape:
{{
  "survival_score": 50,
  "overall_verdict": "...",
  "council_summary": {{
    "consensus": "...",
    "what_we_liked": ["...", "..."],
    "verdict": "survives|pivot|rethink"
  }},
  "top_risks": ["...", "...", "..."],
  "top_improvements": ["...", "...", "..."],
  "closest_parallel": {{
    "name": "...",
    "why": "..."
  }},
  "next_steps": ["...", "...", "..."]
}}"""


def extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])
    text = text.strip()
    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("OpenAI report response was not a JSON object")
    return parsed


def _parse_report_json(response_text: str) -> dict[str, Any]:
    return _normalize_report(extract_json(response_text))


def _require_string_list(report: dict[str, Any], key: str, expected_len: int | None = None) -> list[str]:
    value = report.get(key)
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        raise ValueError(f"{key} must be a list of strings")
    if expected_len is not None and len(value) != expected_len:
        raise ValueError(f"{key} must contain exactly {expected_len} items")
    return [item.strip() for item in value]


def _normalize_verdict(value: Any) -> str:
    verdict = str(value).strip().lower()
    if verdict not in {"survives", "pivot", "rethink"}:
        raise ValueError("council_summary.verdict was invalid")
    return verdict


def _normalize_council_summary(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("council_summary must be an object")

    consensus = str(value["consensus"]).strip()
    if not consensus:
        raise ValueError("council_summary.consensus must not be empty")

    what_we_liked = value.get("what_we_liked")
    if not isinstance(what_we_liked, list) or not 2 <= len(what_we_liked) <= 3:
        raise ValueError("council_summary.what_we_liked must contain 2-3 items")
    liked_items = [str(item).strip() for item in what_we_liked]
    if any(not item for item in liked_items):
        raise ValueError("council_summary.what_we_liked contained empty items")

    return {
        "consensus": consensus,
        "what_we_liked": liked_items,
        "verdict": _normalize_verdict(value["verdict"]),
    }


def _normalize_report(report: dict[str, Any]) -> dict[str, Any]:
    closest_parallel = report.get("closest_parallel")
    if not isinstance(closest_parallel, dict):
        raise ValueError("closest_parallel must be an object")

    survival_score = int(report["survival_score"])
    council_summary = _normalize_council_summary(report.get("council_summary"))
    overall_verdict = str(report["overall_verdict"]).strip()
    if survival_score == 0 and "incoherent" not in f"{overall_verdict} {council_summary['consensus']}".lower():
        survival_score = 50

    return {
        "survival_score": max(0, min(100, survival_score)),
        "overall_verdict": overall_verdict,
        "council_summary": council_summary,
        "top_risks": _require_string_list(report, "top_risks", expected_len=3),
        "top_improvements": _require_string_list(report, "top_improvements", expected_len=3),
        "closest_parallel": {
            "name": str(closest_parallel["name"]).strip(),
            "why": str(closest_parallel["why"]).strip(),
        },
        "next_steps": _require_string_list(report, "next_steps"),
    }


async def call_openai(prompt: str, model: str = "gpt-4o") -> str:
    _load_env()
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    response = await client.responses.create(
        model=model,
        input=prompt,
    )
    response_text = getattr(response, "output_text", "") or ""
    if not response_text.strip():
        raise ValueError("OpenAI returned an empty report response")
    return response_text.strip()


async def _generate_with_model(prompt: str, model: str) -> dict[str, Any]:
    raw = await call_openai(prompt, model=model)
    print("RAW REPORT RESPONSE:", raw[:500])
    LAST_REPORT_DEBUG.clear()
    LAST_REPORT_DEBUG.update({"model": model, "raw": raw[:2000], "error": None})
    return _parse_report_json(raw)


async def generate_report(
    session_id: str,
    idea_text: str,
    all_verdicts: Any,
    transcript: Any,
) -> dict[str, Any]:
    prompt = _build_report_prompt(idea_text, all_verdicts, transcript)
    raw = None
    try:
        raw = await call_openai(prompt, model="gpt-4o")
        print("RAW REPORT RESPONSE:", raw[:500])
        report = _parse_report_json(raw)
        LAST_REPORT_DEBUG.clear()
        LAST_REPORT_DEBUG.update({"model": "gpt-4o", "raw": raw[:2000], "error": None})
    except Exception as first_error:
        print("REPORT GENERATION FAILED:", str(first_error))
        print("RAW WAS:", raw if raw is not None else "never received")
        raw = None
        try:
            raw = await call_openai(prompt, model=OPENAI_REPORT_MODEL)
            print("RAW REPORT RESPONSE:", raw[:500])
            report = _parse_report_json(raw)
            LAST_REPORT_DEBUG.clear()
            LAST_REPORT_DEBUG.update({"model": OPENAI_REPORT_MODEL, "raw": raw[:2000], "error": None})
        except Exception as second_error:
            print("REPORT GENERATION FAILED:", str(second_error))
            print("RAW WAS:", raw if raw is not None else "never received")
            LAST_REPORT_DEBUG.clear()
            LAST_REPORT_DEBUG.update(
                {
                    "model": OPENAI_REPORT_MODEL,
                    "raw": raw if raw is not None else "never received",
                    "error": str(second_error),
                    "first_error": str(first_error),
                }
            )
            report = _fallback_report()

    REPORTS[session_id] = report
    return report


def get_report(session_id: str) -> dict[str, Any] | None:
    return REPORTS.get(session_id)


async def run(session_id: str, idea_text: str, all_verdicts: Any, transcript: Any) -> dict[str, Any]:
    return await generate_report(session_id, idea_text, all_verdicts, transcript)
