from pydantic import BaseModel, Field


class IdeaSubmission(BaseModel):
    idea: str = Field(min_length=12, max_length=4000)


class SagePersona(BaseModel):
    key: str
    archetype: str
    startup_name: str
    sector: str
    failure_lens: str
    avatar_color: str


class SessionCreated(BaseModel):
    session_id: str
    status: str
    sages: list[SagePersona]


class UserMessage(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class Message(BaseModel):
    role: str
    content: str
    sage_key: str | None = None


class Report(BaseModel):
    session_id: str
    score: int
    markdown: str


class FailedStartup(BaseModel):
    name: str
    year_founded: int | None = None
    year_failed: int | None = None
    sector: str
    one_line_pitch: str
    primary_failure_reason: str
    key_lessons: list[str]
