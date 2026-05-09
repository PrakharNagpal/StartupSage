from __future__ import annotations

import asyncio
import json
import uuid

from fastapi import APIRouter, HTTPException, Query
from sse_starlette.sse import EventSourceResponse

from app.agents.dummy import EchoAgent
from app.core.database import db
from app.data.seed_loader import default_sage_personas, load_failed_startups
from app.models import IdeaSubmission, Message, Report, SessionCreated, UserMessage
from app.services.llm_clients import smoke_test_gemini, smoke_test_openai

router = APIRouter()
agent = EchoAgent()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "startupsage-api"}


@router.get("/failed-startups")
def failed_startups() -> list[dict]:
    return [startup.dict() for startup in load_failed_startups()]


@router.post("/sessions", response_model=SessionCreated)
async def create_session(payload: IdeaSubmission) -> SessionCreated:
    session_id = str(uuid.uuid4())
    with db() as connection:
        connection.execute(
            "INSERT INTO sessions (id, idea, status) VALUES (?, ?, ?)",
            (session_id, payload.idea, "created"),
        )
        opening = await agent.run(payload.idea)
        connection.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, "system", opening),
        )

    return SessionCreated(session_id=session_id, status="created", sages=default_sage_personas())


@router.get("/sessions/{session_id}/messages", response_model=list[Message])
def get_messages(session_id: str) -> list[Message]:
    with db() as connection:
        rows = connection.execute(
            "SELECT role, sage_key, content FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        ).fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="Session not found or has no messages.")
    return [Message(role=row["role"], sage_key=row["sage_key"], content=row["content"]) for row in rows]


@router.post("/sessions/{session_id}/messages", response_model=Message)
def add_message(session_id: str, payload: UserMessage) -> Message:
    with db() as connection:
        exists = connection.execute("SELECT 1 FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Session not found.")
        connection.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, "user", payload.content),
        )
    return Message(role="user", content=payload.content)


@router.get("/sessions/{session_id}/stream")
async def stream_fake_conversation(session_id: str) -> EventSourceResponse:
    with db() as connection:
        session = connection.execute("SELECT idea FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    async def events():
        # Guard: if this session was already streamed, just signal done immediately
        with db() as connection:
            already_run = connection.execute(
                "SELECT COUNT(*) AS cnt FROM messages WHERE session_id = ? AND role = 'sage'",
                (session_id,),
            ).fetchone()
        if already_run and already_run["cnt"] > 0:
            yield {"event": "done", "data": json.dumps({"session_id": session_id})}
            return

        scripts = [
            (
                "distribution",
                "The Distribution Skeptic",
                "Your idea may be useful, but who repeatedly discovers it without paid acquisition eating the margin?",
            ),
            (
                "timing",
                "The Timing Realist",
                "What recent market shift makes this inevitable now, instead of merely interesting?",
            ),
            (
                "economics",
                "The Unit Economics Hawk",
                "Show me the math: customer value, support burden, and the payback period you can survive.",
            ),
        ]
        for sage_key, sage_name, text in scripts:
            for token in text.split(" "):
                yield {
                    "event": "token",
                    "data": json.dumps(
                        {"sage_key": sage_key, "sage_name": sage_name, "token": f"{token} "}
                    ),
                }
                await asyncio.sleep(0.06)
            with db() as connection:
                connection.execute(
                    "INSERT INTO messages (session_id, role, sage_key, content) VALUES (?, ?, ?, ?)",
                    (session_id, "sage", sage_key, text),
                )
            yield {
                "event": "message_done",
                "data": json.dumps({"sage_key": sage_key, "sage_name": sage_name}),
            }
        yield {"event": "done", "data": json.dumps({"session_id": session_id})}

    return EventSourceResponse(events())


@router.get("/sessions/{session_id}/report", response_model=Report)
def get_report(session_id: str) -> Report:
    with db() as connection:
        session = connection.execute("SELECT idea FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
        report = connection.execute(
            "SELECT score, markdown FROM reports WHERE session_id = ?", (session_id,)
        ).fetchone()
        if not report:
            markdown = f"""# StartupSage Baseline Report

**Idea reviewed:** {session["idea"]}

## Verdict Summary
This is a placeholder phase 0 report. The live hackathon build will replace it with a generated report from the council transcript.

## Top Risks
- Distribution assumptions are still unproven.
- Market timing needs sharper evidence.
- Unit economics need a concrete payback model.

## Recommended Next Steps
- Interview 5 target customers.
- Define one narrow beachhead segment.
- Build a rough CAC and retention model before writing product code.
"""
            connection.execute(
                "INSERT INTO reports (session_id, score, markdown) VALUES (?, ?, ?)",
                (session_id, 62, markdown),
            )
            score = 62
        else:
            score = report["score"]
            markdown = report["markdown"]
    return Report(session_id=session_id, score=score, markdown=markdown)


@router.get("/llm/smoke")
async def llm_smoke(provider: str = Query(pattern="^(gemini|openai)$")) -> dict[str, str | bool]:
    if provider == "gemini":
        return await smoke_test_gemini()
    return await smoke_test_openai()
