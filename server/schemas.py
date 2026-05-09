from __future__ import annotations

from pydantic import BaseModel, Field


class SessionCreateRequest(BaseModel):
    idea_text: str = Field(min_length=1, max_length=4000)


class SessionCreateResponse(BaseModel):
    session_id: str
    status: str


class Sage(BaseModel):
    id: str
    name: str
    persona: str
    failed_startup: str
    failure_lesson: str | None = None


class ResearchResponse(BaseModel):
    sages: list[Sage]
    debug: dict[str, str] | None = None


class UserMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class StatusResponse(BaseModel):
    status: str


class SageVerdict(BaseModel):
    sage_id: str
    sage_name: str
    persona: str
    verdict: str
    rationale: str


class ClosestParallel(BaseModel):
    name: str
    why: str


class ReportResponse(BaseModel):
    survival_score: int
    overall_verdict: str
    sage_verdicts: list[SageVerdict]
    top_risks: list[str]
    top_improvements: list[str]
    closest_parallel: ClosestParallel
    next_steps: list[str]
