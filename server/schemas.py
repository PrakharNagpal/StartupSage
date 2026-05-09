from __future__ import annotations

from pydantic import BaseModel, Field


class SessionCreateRequest(BaseModel):
    idea_text: str = Field(min_length=1, max_length=4000)


class SessionCreateResponse(BaseModel):
    session_id: str
    status: str
