# Module: Verifies FastAPI runtime settings defaults and environment overrides.
from app.core.config import get_settings


def test_default_profile_agent_model_is_supported_gemini_model(monkeypatch) -> None:
    monkeypatch.delenv("PROFILE_AGENT_MODEL", raising=False)
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.profile_agent_model == "google_genai:gemini-3-pro-preview"


def test_profile_agent_model_can_be_overridden(monkeypatch) -> None:
    monkeypatch.setenv("PROFILE_AGENT_MODEL", "google_genai:gemini-3-flash-preview")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.profile_agent_model == "google_genai:gemini-3-flash-preview"
