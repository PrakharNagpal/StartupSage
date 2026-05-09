from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


SERVER_ROOT = Path(__file__).resolve().parent
DEFAULT_DATABASE_PATH = SERVER_ROOT / "data" / "startupsage_devb.db"


SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  idea_text TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  current_round INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
"""


def get_database_path() -> Path:
    configured_path = os.getenv("DATABASE_PATH")
    if not configured_path:
        return DEFAULT_DATABASE_PATH

    path = Path(configured_path)
    if path.is_absolute():
        return path
    return SERVER_ROOT / path


def init_db() -> None:
    database_path = get_database_path()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(database_path) as connection:
        connection.executescript(SCHEMA)


@contextmanager
def db() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(get_database_path())
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
