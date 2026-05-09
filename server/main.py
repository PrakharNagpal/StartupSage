from __future__ import annotations

import inspect
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import db, init_db
from schemas import (
    ReportResponse,
    ResearchResponse,
    SessionCreateRequest,
    SessionCreateResponse,
    StatusResponse,
    UserMessageRequest,
)


SERVER_ROOT = Path(__file__).resolve().parent


def load_environment() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(SERVER_ROOT / ".env")


load_environment()


STUB_SAGES = [
    {
        "id": "sage_1",
        "name": "The Distribution Skeptic",
        "persona": "Quibi founder",
        "failed_startup": "Quibi",
        "failure_lesson": "A polished product still fails when repeatable distribution is missing.",
    },
    {
        "id": "sage_2",
        "name": "The Timing Realist",
        "persona": "Webvan founder",
        "failed_startup": "Webvan",
        "failure_lesson": "Demand can be real while the market and infrastructure are still too early.",
    },
    {
        "id": "sage_3",
        "name": "The Unit Economics Hawk",
        "persona": "Jawbone founder",
        "failed_startup": "Jawbone",
        "failure_lesson": "Growth without durable margins turns scale into a liability.",
    },
]


async def maybe_await(value: Any) -> Any:
    if inspect.isawaitable(value):
        return await value
    return value


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def get_session_or_404(session_id: str) -> dict[str, Any]:
    with db() as connection:
        row = connection.execute(
            "SELECT id, idea_text, status, created_at, current_round FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Session not found.")
    return dict(row)


async def run_researcher(idea_text: str) -> tuple[list[dict[str, Any]], dict[str, str]]:
    try:
        from agents import researcher

        if hasattr(researcher, "run_with_debug"):
            sages, debug = await maybe_await(researcher.run_with_debug(idea_text))
        else:
            sages = await maybe_await(researcher.run(idea_text))
            debug = {"source": "agent", "reason": "debug_unavailable"}
    except Exception as exc:
        return STUB_SAGES, {"source": "fallback", "reason": exc.__class__.__name__}

    if not isinstance(sages, list) or len(sages) != 3:
        return STUB_SAGES, {"source": "fallback", "reason": "invalid_sage_count"}
    return sages, debug


async def call_orchestrator(session_id: str, content: str, round_number: int) -> None:
    try:
        from agents import sage_orchestrator
    except Exception:
        return

    handler = getattr(sage_orchestrator, "handle_user_message", None)
    if handler is None:
        return

    try:
        await maybe_await(handler(session_id, content, round_number))
    except TypeError:
        await maybe_await(handler(session_id, content))


async def get_agent_report(session_id: str) -> dict[str, Any] | None:
    try:
        from agents import report_generator
    except Exception:
        return None

    getter = getattr(report_generator, "get_report", None)
    if getter is None:
        return None

    try:
        report = await maybe_await(getter(session_id))
    except Exception:
        return None

    if isinstance(report, dict):
        return report
    return None


def fallback_report(session_id: str, idea_text: str) -> dict[str, Any]:
    return {
        "survival_score": 50,
        "overall_verdict": (
            "Agent report generation is not connected yet. This placeholder confirms the "
            f"report endpoint is reachable for session {session_id}."
        ),
        "sage_verdicts": [
            {
                "sage_id": sage["id"],
                "sage_name": sage["name"],
                "persona": sage["persona"],
                "verdict": "pivot",
                "rationale": f"Validate the idea against {sage['failed_startup']}'s failure pattern.",
            }
            for sage in STUB_SAGES
        ],
        "top_risks": [
            "The initial customer acquisition channel is not proven.",
            "The timing assumptions need evidence from real buyers.",
            "The margin and retention model still needs validation.",
        ],
        "top_improvements": [
            "Narrow the first customer segment before building more features.",
            "Run customer interviews focused on urgency and willingness to pay.",
            "Create a basic CAC, payback, and retention model.",
        ],
        "closest_parallel": {
            "name": "Quibi",
            "why": f"The idea needs proof that customers will repeatedly seek out {idea_text[:80]}.",
        },
        "next_steps": [
            "Interview 5 target customers.",
            "Define the smallest paid pilot.",
            "Test one distribution channel before expanding the product.",
        ],
    }


def create_app() -> FastAPI:
    app = FastAPI(title="StartupSage API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup() -> None:
        init_db()

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/sessions", response_model=SessionCreateResponse)
    def create_session(payload: SessionCreateRequest) -> SessionCreateResponse:
        session_id = str(uuid.uuid4())
        with db() as connection:
            connection.execute(
                """
                INSERT INTO sessions (id, idea_text, status, created_at, current_round)
                VALUES (?, ?, ?, ?, ?)
                """,
                (session_id, payload.idea_text, "idle", utc_now(), 1),
            )
        return SessionCreateResponse(session_id=session_id, status="idle")

    @app.post("/sessions/{session_id}/research", response_model=ResearchResponse)
    async def research_session(session_id: str) -> ResearchResponse:
        session = get_session_or_404(session_id)
        with db() as connection:
            connection.execute(
                "UPDATE sessions SET status = ? WHERE id = ?",
                ("researching", session_id),
            )

        sages, debug = await run_researcher(session["idea_text"])

        with db() as connection:
            connection.execute(
                "UPDATE sessions SET status = ? WHERE id = ?",
                ("in_session", session_id),
            )
        return ResearchResponse(sages=sages, debug=debug)

    @app.post("/sessions/{session_id}/messages", response_model=StatusResponse)
    async def add_message(session_id: str, payload: UserMessageRequest) -> StatusResponse:
        session = get_session_or_404(session_id)
        message_id = str(uuid.uuid4())
        round_number = int(session["current_round"])

        with db() as connection:
            connection.execute(
                """
                INSERT INTO messages (id, session_id, role, content, round_number, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (message_id, session_id, "user", payload.content, round_number, utc_now()),
            )

        await call_orchestrator(session_id, payload.content, round_number)
        return StatusResponse(status="ok")

    @app.get("/sessions/{session_id}/report", response_model=ReportResponse)
    async def report(session_id: str) -> ReportResponse:
        session = get_session_or_404(session_id)
        report_data = await get_agent_report(session_id)
        if report_data is None:
            report_data = fallback_report(session_id, session["idea_text"])
        return ReportResponse(**report_data)

    return app


app = create_app()
