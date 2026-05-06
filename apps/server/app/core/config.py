# Module: Defines typed runtime settings for the FastAPI application.
from functools import lru_cache
from os import getenv

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "CV Agent API"
    api_version: str = "0.1.0"
    environment: str = "development"
    access_token_secret: str = "development-only-change-me"
    access_token_expire_minutes: int = 60
    cors_allowed_origins: list[str] = ["http://localhost:5173"]
    google_api_key: str | None = None
    profile_agent_model: str = "google_genai:gemini-3.1-pro-preview"


def parse_csv_env(value: str | None, default: list[str]) -> list[str]:
    if value is None:
        return default

    parsed_values = [item.strip() for item in value.split(",") if item.strip()]
    if not parsed_values:
        return default

    return parsed_values


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=getenv("APP_NAME", "CV Agent API"),
        api_version=getenv("API_VERSION", "0.1.0"),
        environment=getenv("ENVIRONMENT", "development"),
        access_token_secret=getenv("ACCESS_TOKEN_SECRET", "development-only-change-me"),
        access_token_expire_minutes=int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
        cors_allowed_origins=parse_csv_env(
            getenv("CORS_ALLOWED_ORIGINS"),
            ["http://localhost:5173"],
        ),
        google_api_key=getenv("GOOGLE_API_KEY"),
        profile_agent_model=getenv(
            "PROFILE_AGENT_MODEL",
            "google_genai:gemini-3.1-pro-preview",
        ),
    )
