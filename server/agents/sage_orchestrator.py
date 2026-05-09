from __future__ import annotations

import inspect
from datetime import UTC, datetime
from typing import Any

from database import db
from sse_router import push_event

from . import memory
from .sage_agent import SageAgent


active_sages: dict[str, list[SageAgent]] = {}
session_states: dict[str, dict[str, Any]] = {}


async def _maybe_await(value: Any) -> Any:
    if inspect.isawaitable(value):
        return await value
    return value


def _sage_value(sage_data: dict[str, Any], *keys: str, default: str = "") -> str:
    for key in keys:
        value = sage_data.get(key)
        if value:
            return str(value)
    return default


def init_sages(session_id: str, sage_data_list: list[dict[str, Any]]) -> None:
    active_sages[session_id] = [
        SageAgent(
            sage_id=_sage_value(sage_data, "id", "sage_id", "key", default=f"sage_{index}"),
            name=_sage_value(sage_data, "name", "sage_name", default=f"Sage {index}"),
            persona=_sage_value(sage_data, "persona"),
            failed_startup=_sage_value(sage_data, "failed_startup", "failedStartup"),
            failure_lesson=_sage_value(sage_data, "failure_lesson", "failureLesson"),
        )
        for index, sage_data in enumerate(sage_data_list[:3], start=1)
    ]
    session_states[session_id] = {
        "exchange_count": 0,
        "phase": "questions",
        "transcript": [],
    }


def _get_state(session_id: str) -> dict[str, Any]:
    return session_states.setdefault(
        session_id,
        {
            "exchange_count": 0,
            "phase": "questions",
            "transcript": [],
        },
    )


def _get_session_idea(session_id: str) -> str:
    with db() as connection:
        row = connection.execute("SELECT idea_text FROM sessions WHERE id = ?", (session_id,)).fetchone()
    return str(row["idea_text"]) if row else ""


def _set_session_round(session_id: str, exchange_count: int) -> None:
    round_number = 2 if exchange_count >= 4 else 1
    with db() as connection:
        connection.execute(
            "UPDATE sessions SET current_round = ? WHERE id = ?",
            (round_number, session_id),
        )


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _append_transcript_message(
    session_id: str,
    role: str,
    content: str,
    sage_name: str = "",
) -> None:
    _get_state(session_id)["transcript"].append(
        {
            "role": role,
            "content": content,
            "sage_name": sage_name,
            "timestamp": _timestamp(),
        }
    )


def _format_transcript(transcript: list[dict]) -> str:
    lines: list[str] = []
    for message in transcript:
        content = str(message.get("content", "")).strip()
        if not content:
            continue
        speaker = "User" if message.get("role") == "user" else message.get("sage_name") or message.get("role")
        lines.append(f"{speaker}: {content}")
    return "\n".join(lines)


def _sage_by_id(sages: list[SageAgent], sage_id: str) -> SageAgent:
    return next((sage for sage in sages if sage.sage_id == sage_id), sages[0])


def _fallback_response(sage: SageAgent, user_content: str) -> str:
    return (
        f"You said: {user_content} I am still testing this against {sage.failed_startup}'s "
        f"failure lesson: {sage.failure_lesson} What concrete proof shows this risk is handled?"
    )


async def _push_active_sage(
    session_id: str,
    sage: SageAgent,
    awaiting_reply: bool,
) -> None:
    state = _get_state(session_id)
    await push_event(
        session_id,
        "active_sage",
        {
            "sage_id": sage.sage_id,
            "sage_name": sage.name,
            "round": 2 if int(state["exchange_count"]) >= 4 else 1,
            "awaiting_reply": awaiting_reply,
        },
    )


async def _push_text(session_id: str, sage: SageAgent, text: str) -> None:
    for word in text.split():
        await push_event(
            session_id,
            "sage_token",
            {
                "sage_id": sage.sage_id,
                "sage_name": sage.name,
                "token": f"{word} ",
            },
        )


async def _trigger_report_generation(session_id: str) -> None:
    try:
        from agents import report_generator
    except Exception:
        await push_event(session_id, "report_ready", {"session_id": session_id})
        return

    for function_name in ("generate_report", "create_report", "run"):
        generator = getattr(report_generator, function_name, None)
        if generator is None:
            continue
        await _maybe_await(generator(session_id))
        break

    await push_event(session_id, "report_ready", {"session_id": session_id})


async def run_verdicts(session_id: str) -> None:
    sages = active_sages.get(session_id, [])
    if not sages:
        return

    state = _get_state(session_id)
    idea_text = _get_session_idea(session_id)
    full_transcript = _format_transcript(state["transcript"])

    state["phase"] = "verdicts"
    for sage in sages:
        try:
            verdict = await sage.verdict(idea_text, full_transcript)
        except Exception:
            verdict = {
                "verdict": "pivot",
                "rationale": (
                    f"{sage.name} needs stronger proof against {sage.failed_startup}'s failure "
                    "pattern before calling this idea resilient."
                ),
            }

        verdict_text = f"Verdict: {verdict['verdict']}. {verdict['rationale']}"
        _append_transcript_message(
            session_id,
            sage.sage_id,
            verdict_text,
            sage.name,
        )
        await memory.store_message(
            session_id,
            sage.sage_id,
            verdict_text,
            sage.name,
        )
        await push_event(
            session_id,
            "verdict",
            {
                "sage_id": sage.sage_id,
                "sage_name": sage.name,
                "verdict": verdict["verdict"],
                "rationale": verdict["rationale"],
            },
        )

    state["phase"] = "complete"
    await _trigger_report_generation(session_id)


async def emit_current_sage_prompt(session_id: str) -> bool:
    sages = active_sages.get(session_id)
    if not sages:
        return False

    state = _get_state(session_id)
    if state["phase"] != "questions" or state["transcript"]:
        return True

    sage = sages[0]
    idea_text = _get_session_idea(session_id)
    await _push_active_sage(session_id, sage, awaiting_reply=False)

    try:
        response = await sage.opening_message(idea_text)
    except Exception:
        response = (
            f"I am {sage.name}, carrying the lesson from {sage.failed_startup}: "
            f"{sage.failure_lesson} Why will your idea avoid that same failure?"
        )

    _append_transcript_message(session_id, sage.sage_id, response, sage.name)
    await memory.store_message(session_id, sage.sage_id, response, sage.name)
    await _push_text(session_id, sage, response)
    await push_event(session_id, "sage_done", {"sage_id": sage.sage_id, "sage_name": sage.name})
    await _push_active_sage(session_id, sage, awaiting_reply=True)
    return True


async def handle_user_message(session_id: str, user_content: str, round_number: int) -> None:
    sages = active_sages.get(session_id)
    if not sages:
        raise RuntimeError(f"No active sages initialized for session {session_id}")

    state = _get_state(session_id)
    if state["phase"] != "questions":
        return

    transcript = state["transcript"]
    _append_transcript_message(session_id, "user", user_content)
    await memory.store_message(session_id, "user", user_content)
    state["exchange_count"] = int(state["exchange_count"]) + 1
    exchange_count = int(state["exchange_count"])

    try:
        from agents import coordinator

        next_sage_id = await coordinator.pick_next_sage(
            sages=sages,
            user_content=user_content,
            transcript=transcript,
            exchange_count=exchange_count,
        )
        ready_for_verdicts = coordinator.ready_for_verdicts()
    except Exception:
        speak_counts = {
            sage.sage_id: sum(1 for message in transcript if message["role"] == sage.sage_id)
            for sage in sages
        }
        next_sage_id = min(sages, key=lambda sage: (speak_counts[sage.sage_id], sage.sage_id)).sage_id
        ready_for_verdicts = False

    if ready_for_verdicts or exchange_count >= 8:
        await run_verdicts(session_id)
        return

    sage = _sage_by_id(sages, next_sage_id)
    await _push_active_sage(session_id, sage, awaiting_reply=False)
    recalled = await memory.recall_relevant(session_id, user_content)

    try:
        response = await sage.respond(
            user_content,
            transcript,
            _get_session_idea(session_id),
            memory_context=recalled,
        )
    except Exception:
        response = _fallback_response(sage, user_content)

    _append_transcript_message(session_id, sage.sage_id, response, sage.name)
    await memory.store_message(session_id, sage.sage_id, response, sage.name)
    await _push_text(session_id, sage, response)
    await push_event(session_id, "sage_done", {"sage_id": sage.sage_id, "sage_name": sage.name})
    await _push_active_sage(session_id, sage, awaiting_reply=True)
    _set_session_round(session_id, exchange_count)
