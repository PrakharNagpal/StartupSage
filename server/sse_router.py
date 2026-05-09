from __future__ import annotations

import asyncio
import json
import uuid
from collections import defaultdict
from typing import Any, AsyncIterator

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from database import db


router = APIRouter()
_queues: dict[str, set[asyncio.Queue[dict[str, Any]]]] = defaultdict(set)
_bootstrapped_sessions: set[str] = set()


async def push_event(session_id: str, event_type: str, data: dict[str, Any]) -> None:
    event = {"event": event_type, "data": data}
    queues = list(_queues.get(session_id, set()))
    for queue in queues:
        await queue.put(event)


async def stream_tokens(session_id: str, sage_id: str, text: str, round_number: int) -> None:
    message_id = f"sage-{uuid.uuid4()}"
    for word in text.split():
        await push_event(
            session_id,
            "sage_token",
            {"message_id": message_id, "sage_id": sage_id, "token": f"{word} "},
        )
        await asyncio.sleep(0.03)
    await push_event(session_id, "sage_done", {"message_id": message_id, "sage_id": sage_id, "round": round_number})


def session_exists(session_id: str) -> bool:
    with db() as connection:
        row = connection.execute("SELECT 1 FROM sessions WHERE id = ?", (session_id,)).fetchone()
    return row is not None


async def emit_opening_stub(session_id: str) -> None:
    try:
        from agents import sage_orchestrator
    except Exception:
        sage_orchestrator = None

    if sage_orchestrator is not None:
        emitted = await sage_orchestrator.emit_current_sage_prompt(session_id)
        if emitted:
            return

    if session_id in _bootstrapped_sessions:
        return
    _bootstrapped_sessions.add(session_id)

    openings = [
        (
            "sage_1",
            "I watched beautiful content fail when distribution was wishful thinking. Who finds this repeatedly without paid acquisition swallowing your margin?",
        ),
        (
            "sage_2",
            "I know what it feels like to be early with expensive operations. What changed in the market this year that makes customers ready now?",
        ),
        (
            "sage_3",
            "Scale does not forgive weak economics. Show me the payback math before you ask this product to grow.",
        ),
    ]
    for sage_id, text in openings:
        await stream_tokens(session_id, sage_id, text, 1)


@router.get("/sessions/{session_id}/stream")
async def stream_session(session_id: str) -> EventSourceResponse:
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
    _queues[session_id].add(queue)

    async def events() -> AsyncIterator[dict[str, str]]:
        try:
            await emit_opening_stub(session_id)
            while True:
                event = await queue.get()
                yield {
                    "event": event["event"],
                    "data": json.dumps(event["data"]),
                }
        finally:
            _queues[session_id].discard(queue)

    return EventSourceResponse(events())
