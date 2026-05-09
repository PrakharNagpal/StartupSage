from __future__ import annotations

import json
from functools import lru_cache

from app.core.config import settings
from app.models import FailedStartup


@lru_cache
def load_failed_startups() -> list[FailedStartup]:
    with settings.seed_data_path.open("r", encoding="utf-8") as file:
        raw = json.load(file)
    return [FailedStartup(**item) for item in raw]


def default_sage_personas() -> list[dict[str, str]]:
    failures = load_failed_startups()
    picks = [failures[0], failures[1], failures[2]]
    archetypes = [
        ("distribution", "The Distribution Skeptic", "#7b68ee"),
        ("timing", "The Timing Realist", "#00a6a6"),
        ("economics", "The Unit Economics Hawk", "#f59e0b"),
    ]
    return [
        {
            "key": key,
            "archetype": archetype,
            "startup_name": failure.name,
            "sector": failure.sector,
            "failure_lens": failure.primary_failure_reason,
            "avatar_color": color,
        }
        for (key, archetype, color), failure in zip(archetypes, picks, strict=True)
    ]
