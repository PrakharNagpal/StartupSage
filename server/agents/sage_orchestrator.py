from __future__ import annotations

import inspect
from typing import Any

from database import db
from sse_router import push_event

from .sage_agent import SageAgent


active_sages: dict[str, list[SageAgent]] = {}


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


def _get_session_idea(session_id: str) -> str:
    with db() as connection:
        row = connection.execute("SELECT idea_text FROM sessions WHERE id = ?", (session_id,)).fetchone()
    return str(row["idea_text"]) if row else ""


def _get_conversation_history(session_id: str) -> str:
    with db() as connection:
        rows = connection.execute(
            """
            SELECT role, content, round_number, timestamp
            FROM messages
            WHERE session_id = ?
            ORDER BY timestamp
            """,
            (session_id,),
        ).fetchall()

    return "\n".join(
        f"Round {row['round_number']} {row['role']}: {row['content']}" for row in rows
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


async def handle_user_message(session_id: str, user_content: str, round_number: int) -> None:
    sages = active_sages.get(session_id)
    if not sages:
        raise RuntimeError(f"No active sages initialized for session {session_id}")

    idea_text = _get_session_idea(session_id)
    conversation_history = _get_conversation_history(session_id)

    if round_number < 2:
        responded_sages: list[SageAgent] = []
        for sage in sages:
            response = await sage.followup(idea_text, conversation_history)
            await _push_text(session_id, sage, response)
            responded_sages.append(sage)

        for sage in responded_sages:
            await push_event(
                session_id,
                "sage_done",
                {"sage_id": sage.sage_id, "sage_name": sage.name, "round": round_number + 1},
            )
        return

    for sage in sages:
        verdict = await sage.verdict(idea_text, conversation_history)
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

    await _trigger_report_generation(session_id)
