# Module: Defines typed runtime settings for the FastAPI application.
from functools import lru_cache
from os import getenv

from pydantic import BaseModel, Field

DEFAULT_CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
DEFAULT_DEVELOPMENT_CORS_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1):[0-9]+$"


class Settings(BaseModel):
    app_name: str = "CV Agent API"
    api_version: str = "0.1.0"
    environment: str = "development"
    access_token_secret: str = "development-only-change-me"
    access_token_expire_minutes: int = 60
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: DEFAULT_CORS_ALLOWED_ORIGINS.copy()
    )
    cors_allowed_origin_regex: str | None = DEFAULT_DEVELOPMENT_CORS_ORIGIN_REGEX
    google_api_key: str | None = None
    profile_agent_model: str = "google_genai:gemini-3-pro-preview"
    profile_agent_request_timeout_seconds: float = 20.0
    profile_agent_max_retries: int = 1


def parse_csv_env(value: str | None, default: list[str]) -> list[str]:
    if value is None:
        return default

    parsed_values = [item.strip() for item in value.split(",") if item.strip()]
    if not parsed_values:
        return default

    return parsed_values


@lru_cache
def get_settings() -> Settings:
    environment = getenv("ENVIRONMENT", "development")
    default_cors_allowed_origin_regex = (
        DEFAULT_DEVELOPMENT_CORS_ORIGIN_REGEX if environment == "development" else None
    )

    return Settings(
        app_name=getenv("APP_NAME", "CV Agent API"),
        api_version=getenv("API_VERSION", "0.1.0"),
        environment=environment,
        access_token_secret=getenv("ACCESS_TOKEN_SECRET", "development-only-change-me"),
        access_token_expire_minutes=int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
        cors_allowed_origins=parse_csv_env(
            getenv("CORS_ALLOWED_ORIGINS"),
            DEFAULT_CORS_ALLOWED_ORIGINS,
        ),
        cors_allowed_origin_regex=getenv(
            "CORS_ALLOWED_ORIGIN_REGEX",
            default_cors_allowed_origin_regex,
        ),
        google_api_key=getenv("GOOGLE_API_KEY"),
        profile_agent_model=getenv(
            "PROFILE_AGENT_MODEL",
            "google_genai:gemini-3-pro-preview",
        ),
        profile_agent_request_timeout_seconds=float(
            getenv("PROFILE_AGENT_REQUEST_TIMEOUT_SECONDS", "20")
        ),
        profile_agent_max_retries=int(getenv("PROFILE_AGENT_MAX_RETRIES", "1")),
    )
