from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx


REPO_ROOT = Path(__file__).resolve().parents[2]
SERVER_ROOT = Path(__file__).resolve().parents[1]
UPSERT_URL = "https://api.hyperspell.com/v1/upsert"
QUERY_URL = "https://api.hyperspell.com/v1/query"


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except Exception:
        return

    load_dotenv(REPO_ROOT / ".env")
    load_dotenv(SERVER_ROOT / ".env")


def _api_key() -> str:
    _load_env()
    return (os.getenv("HYPERSPELL_API_KEY") or "").strip()


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


async def store_message(
    session_id: str,
    role: str,
    content: str,
    sage_name: str | None = None,
) -> None:
    api_key = _api_key()
    if not api_key or not content.strip():
        return

    timestamp = _timestamp()
    document = {
        "id": f"{session_id}-{role}-{timestamp}",
        "text": content,
        "metadata": {
            "session_id": session_id,
            "role": role,
            "sage_name": sage_name,
            "timestamp": timestamp,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            await client.post(
                UPSERT_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json={"document": document},
            )
    except Exception:
        return


def _result_text(result: dict[str, Any]) -> str:
    text = result.get("text")
    if isinstance(text, str):
        return text

    document = result.get("document")
    if isinstance(document, dict) and isinstance(document.get("text"), str):
        return document["text"]

    return ""


async def recall_relevant(session_id: str, query: str, top_k: int = 4) -> list[str]:
    api_key = _api_key()
    if not api_key or not query.strip():
        return []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                QUERY_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "query": query,
                    "top_k": top_k,
                    "filter": {"session_id": session_id},
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    results = payload.get("results", []) if isinstance(payload, dict) else []
    if not isinstance(results, list):
        return []

    return [text for result in results if isinstance(result, dict) and (text := _result_text(result))]
