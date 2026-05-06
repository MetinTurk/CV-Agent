# Module: Defines Pydantic contracts for the profile collection chat agent.
from pydantic import BaseModel, Field, field_validator

REQUIRED_PROFILE_FIELDS = ["full_name", "location", "skills", "education"]


class ProfileData(BaseModel):
    full_name: str | None = None
    location: str | None = None
    skills: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    work_experiences: list[str] = Field(default_factory=list)
    education: str | None = None
    additional_information: str | None = None


class ProfileChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="default", min_length=1, max_length=80)

    @field_validator("message", "session_id")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return " ".join(value.strip().split())


class ProfileChatResponse(BaseModel):
    reply: str
    session_id: str
    profile: ProfileData
    missing_required_fields: list[str]
    is_profile_ready: bool
