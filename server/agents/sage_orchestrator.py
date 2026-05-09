from __future__ import annotations

import asyncio
import inspect
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from database import db
from sse_router import push_event

from . import memory
from .sage_agent import OPENAI_MODEL, SageAgent


active_sages: dict[str, list[SageAgent]] = {}
session_states: dict[str, dict[str, Any]] = {}
REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
INTERJECTION_COOLDOWN_EXCHANGES = 2


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
        "last_sage_id": None,
        "last_spoke_at": {},
        "phase": "questions",
        "transcript": [],
    }


def _get_state(session_id: str) -> dict[str, Any]:
    return session_states.setdefault(
        session_id,
        {
            "exchange_count": 0,
            "last_sage_id": None,
            "last_spoke_at": {},
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


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


def _append_transcript_message(
    session_id: str,
    role: str,
    content: str,
    sage_name: str = "",
) -> None:
    state = _get_state(session_id)
    state["transcript"].append(
        {
            "role": role,
            "content": content,
            "sage_name": sage_name,
            "timestamp": _timestamp(),
        }
    )
    if role != "user":
        state["last_sage_id"] = role


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


def _sage_by_name(sages: list[SageAgent], sage_name: str) -> SageAgent | None:
    return next((sage for sage in sages if sage.name == sage_name), None)


def _spoke_within_cooldown(state: dict[str, Any], sage_id: str, exchange_count: int) -> bool:
    last_spoke = state["last_spoke_at"].get(sage_id)
    if last_spoke is None:
        return False
    return exchange_count - int(last_spoke) <= INTERJECTION_COOLDOWN_EXCHANGES


def _session_state_for_sages(sages: list[SageAgent]) -> dict[str, Any] | None:
    for session_id, session_sages in active_sages.items():
        if session_sages is sages:
            return _get_state(session_id)
    return None


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


async def _call_openai_json(prompt: str) -> dict[str, Any]:
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
    return _extract_json_object(getattr(response, "output_text", "") or "")


def _fallback_response(sage: SageAgent, user_content: str) -> str:
    return (
        f"You said: {user_content} I am still testing this against {sage.failed_startup}'s "
        f"failure lesson: {sage.failure_lesson} What concrete proof shows this risk is handled?"
    )


async def detect_addressed_sage(user_content: str, sages: list[SageAgent]) -> str | None:
    state = _session_state_for_sages(sages) or {}
    last_sage_id = state.get("last_sage_id")
    last_sage = next((sage for sage in sages if sage.sage_id == last_sage_id), None)
    last_sage_name = last_sage.name if last_sage else "none"
    last_sage_failed_startup = last_sage.failed_startup if last_sage else "none"
    council_members = "\n".join(
        f"- {sage.sage_id}: {sage.name} from {sage.failed_startup}" for sage in sages
    )
    prompt = f"""The user just said: "{user_content}"

Council members:
{council_members}

Is the user's message clearly directed at one specific council member?
This includes:
- Directly naming them ("Beepi, what did you mean...", "what was YOUR downfall")
- Using "you" or "your" in reply to the last sage who spoke
- Asking a follow-up that only makes sense in context of one sage's last message

Last sage who spoke: {last_sage_id or "none"} ({last_sage_name} from {last_sage_failed_startup})

Return JSON only:
{{"addressed": true | false, "sage_id": "sage_1" | "sage_2" | "sage_3" | null}}
"""

    try:
        parsed = await _call_openai_json(prompt)
    except Exception:
        return None

    sage_id = parsed.get("sage_id")
    if bool(parsed.get("addressed")) and isinstance(sage_id, str):
        if any(sage.sage_id == sage_id for sage in sages):
            return sage_id
    return None


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


def _interjection_prompt(
    sage: SageAgent,
    primary_sage_name: str,
    primary_company_name: str,
    primary_response: str,
    transcript: list[dict],
    idea_text: str,
    target: str,
) -> str:
    return f"""You are {sage.name}, one of three failed-founder sages evaluating a startup idea.

Startup idea:
{idea_text}

Your focus area:
{sage.focus}

Your failed startup:
{sage.failed_startup}

Your failure lesson:
{sage.failure_lesson}

Full transcript so far:
{_format_transcript(transcript) or "No conversation yet."}

{primary_sage_name} ({primary_company_name}) just gave this {target}:
{primary_response}

If this is a verdict reaction, react to this verdict. Do not ask a new discovery question.

You should stay SILENT in most cases. Only interject if ALL of these are true:
- You have a direct contradiction from your own failure experience
- What was just said is factually wrong or dangerously optimistic
- Your point cannot wait — it changes the meaning of the conversation

Do NOT interject if:
- You are just adding a related point or general advice
- The previous sage already covered the key risk adequately
- You would just be agreeing or slightly extending what was said
- You already spoke in the last 2 exchanges

When in doubt, return interject: false. Silence is better than noise.
If interjecting, reference {primary_company_name} by company name and write max one sentence.

Return JSON only, no markdown:
{{"interject":true|false,"message":"..."|null}}
"""


async def _maybe_interject_about(
    sage: SageAgent,
    primary_sage_name: str,
    primary_response: str,
    transcript: list[dict],
    idea_text: str,
    target: str,
) -> str | None:
    sages = [agent for agents in active_sages.values() for agent in agents]
    primary_sage = _sage_by_name(sages, primary_sage_name)
    primary_company_name = primary_sage.failed_startup if primary_sage else primary_sage_name

    try:
        parsed = await _call_openai_json(
            _interjection_prompt(
                sage=sage,
                primary_sage_name=primary_sage_name,
                primary_company_name=primary_company_name,
                primary_response=primary_response,
                transcript=transcript,
                idea_text=idea_text,
                target=target,
            )
        )
    except Exception:
        return None

    message = parsed.get("message")
    if bool(parsed.get("interject")) and isinstance(message, str) and message.strip():
        return sage._strip_self_label(message)
    return None


async def maybe_interject(
    sage: SageAgent,
    primary_sage_name: str,
    primary_response: str,
    transcript: list[dict],
    idea_text: str,
) -> str | None:
    return await _maybe_interject_about(
        sage=sage,
        primary_sage_name=primary_sage_name,
        primary_response=primary_response,
        transcript=transcript,
        idea_text=idea_text,
        target="response",
    )


async def _trigger_report_generation(
    session_id: str,
    idea_text: str,
    all_verdicts: list[dict[str, Any]],
    transcript: str,
) -> None:
    try:
        from agents import report_generator
    except Exception:
        await push_event(session_id, "report_ready", {"session_id": session_id})
        return

    for function_name in ("generate_report", "create_report", "run"):
        generator = getattr(report_generator, function_name, None)
        if generator is None:
            continue
        await _maybe_await(generator(session_id, idea_text, all_verdicts, transcript))
        break

    await push_event(session_id, "report_ready", {"session_id": session_id})


async def run_verdicts(session_id: str) -> None:
    sages = active_sages.get(session_id, [])
    if not sages:
        return

    state = _get_state(session_id)
    if state["phase"] in {"verdicts", "complete"}:
        return

    idea_text = _get_session_idea(session_id)

    state["phase"] = "verdicts"
    await push_event(
        session_id,
        "session_ending",
        {"message": "The council has heard enough. Deliberating..."},
    )

    all_verdicts: list[dict[str, Any]] = []
    verdict_transcript = _format_transcript(state["transcript"]).strip()
    if not verdict_transcript:
        verdict_transcript = (
            "No user replies have been recorded yet. The session is ending manually, so assess "
            "the startup idea from the available context and state uncertainty clearly."
        )
    for sage in sages:
        try:
            verdict = await sage.verdict(idea_text, verdict_transcript)
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
        await _push_text(session_id, sage, verdict_text)
        await push_event(session_id, "sage_done", {"sage_id": sage.sage_id, "sage_name": sage.name})
        all_verdicts.append(
            {
                "sage_id": sage.sage_id,
                "sage_name": sage.name,
                "persona": sage.persona,
                "failed_startup": sage.failed_startup,
                "verdict": verdict["verdict"],
                "rationale": verdict["rationale"],
            }
        )
        await asyncio.sleep(1)

    for reacting_sage in sages:
        other_verdicts = [
            verdict
            for verdict in all_verdicts
            if verdict["sage_id"] != reacting_sage.sage_id
        ]
        if not other_verdicts:
            continue

        primary_response = "\n".join(
            f"{verdict['sage_name']}: Verdict: {verdict['verdict']}. {verdict['rationale']}"
            for verdict in other_verdicts
        )
        reaction = await _maybe_interject_about(
            sage=reacting_sage,
            primary_sage_name="the council",
            primary_response=primary_response,
            transcript=state["transcript"],
            idea_text=idea_text,
            target="verdict to react to",
        )
        if reaction is None:
            continue

        _append_transcript_message(session_id, reacting_sage.sage_id, reaction, reacting_sage.name)
        await memory.store_message(session_id, reacting_sage.sage_id, reaction, reacting_sage.name)
        await push_event(
            session_id,
            "verdict_reaction",
            {
                "sage_id": reacting_sage.sage_id,
                "reacting_to_sage_id": ",".join(verdict["sage_id"] for verdict in other_verdicts),
                "reaction": reaction,
            },
        )

    state["phase"] = "complete"
    try:
        from agents import report_generator

        await _maybe_await(
            report_generator.generate_report(
                session_id,
                idea_text,
                all_verdicts,
                _format_transcript(state["transcript"]),
            )
        )
    except Exception:
        pass

    with db() as connection:
        connection.execute("UPDATE sessions SET status = ? WHERE id = ?", ("completed", session_id))

    await push_event(session_id, "report_ready", {"session_id": session_id})


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
    state["last_spoke_at"][sage.sage_id] = int(state["exchange_count"])
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

    addressed_sage_id = await detect_addressed_sage(user_content, sages)
    if addressed_sage_id:
        next_sage_id = addressed_sage_id
        ready_for_verdicts = False
    else:
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
    state["last_spoke_at"][sage.sage_id] = exchange_count
    await _push_text(session_id, sage, response)
    await push_event(session_id, "sage_done", {"sage_id": sage.sage_id, "sage_name": sage.name})

    for interjecting_sage in sages:
        if interjecting_sage.sage_id == sage.sage_id:
            continue

        if _spoke_within_cooldown(state, interjecting_sage.sage_id, exchange_count):
            continue

        interjection = await maybe_interject(
            interjecting_sage,
            sage.name,
            response,
            transcript,
            _get_session_idea(session_id),
        )
        if interjection is None:
            continue

        await asyncio.sleep(0.8)
        _append_transcript_message(
            session_id,
            interjecting_sage.sage_id,
            interjection,
            interjecting_sage.name,
        )
        await memory.store_message(session_id, interjecting_sage.sage_id, interjection, interjecting_sage.name)
        state["last_spoke_at"][interjecting_sage.sage_id] = exchange_count
        await _push_text(session_id, interjecting_sage, interjection)
        await push_event(
            session_id,
            "sage_done",
            {"sage_id": interjecting_sage.sage_id, "sage_name": interjecting_sage.name},
        )
        break

    await _push_active_sage(session_id, sage, awaiting_reply=True)
    _set_session_round(session_id, exchange_count)
