# Module: Runs the Deep Agents powered profile collection conversation.
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.db.models.user import UserRecord
from app.schemas.profile_chat import (
    ProfileChatRequest,
    ProfileChatResponse,
    ProfileData,
)


FIELD_LABELS: dict[str, str] = {
    "full_name": "Ad Soyad",
    "location": "Şehir/Ülke",
    "skills": "Yetenekler",
    "education": "Eğitim/Ortalama",
}


class MissingLLMConfigurationError(RuntimeError):
    pass


class ProfileAgentError(RuntimeError):
    pass


class ProfilePatch(BaseModel):
    full_name: str | None = Field(default=None, description="Kullanıcının ad soyadı.")
    location: str | None = Field(default=None, description="Kullanıcının şehir ve ülke bilgisi.")
    skills: list[str] | None = Field(default=None, description="Teknik ve profesyonel yetenekler.")
    projects: list[str] | None = Field(default=None, description="Proje adı, rol, teknoloji ve sonuçlar.")
    certifications: list[str] | None = Field(default=None, description="Sertifika adları ve sağlayıcıları.")
    languages: list[str] | None = Field(default=None, description="Dil ve seviye bilgileri.")
    work_experiences: list[str] | None = Field(default=None, description="İş deneyimi özeti.")
    education: str | None = Field(default=None, description="Okul, bölüm, tarih ve not ortalaması.")
    additional_information: str | None = Field(default=None, description="Ek profil bilgileri.")


@dataclass
class ProfileConversationState:
    messages: list[dict[str, str]] = field(default_factory=list)
    profile: ProfileData = field(default_factory=ProfileData)


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None

    normalized_value = " ".join(value.strip().split())
    return normalized_value or None


def _merge_list(current_values: list[str], next_values: list[str] | None) -> list[str]:
    if not next_values:
        return current_values

    merged_values = list(current_values)
    normalized_existing = {value.casefold() for value in merged_values}

    for value in next_values:
        cleaned_value = _clean_text(value)
        if cleaned_value is None:
            continue

        normalized_value = cleaned_value.casefold()
        if normalized_value not in normalized_existing:
            merged_values.append(cleaned_value)
            normalized_existing.add(normalized_value)

    return merged_values


def _merge_profile(profile: ProfileData, patch: ProfilePatch) -> ProfileData:
    return ProfileData(
        full_name=_clean_text(patch.full_name) or profile.full_name,
        location=_clean_text(patch.location) or profile.location,
        skills=_merge_list(profile.skills, patch.skills),
        projects=_merge_list(profile.projects, patch.projects),
        certifications=_merge_list(profile.certifications, patch.certifications),
        languages=_merge_list(profile.languages, patch.languages),
        work_experiences=_merge_list(profile.work_experiences, patch.work_experiences),
        education=_clean_text(patch.education) or profile.education,
        additional_information=(
            _clean_text(patch.additional_information) or profile.additional_information
        ),
    )


def _get_missing_required_fields(profile: ProfileData) -> list[str]:
    missing_fields: list[str] = []

    if not profile.full_name:
        missing_fields.append("full_name")
    if not profile.location:
        missing_fields.append("location")
    if len(profile.skills) == 0:
        missing_fields.append("skills")
    if not profile.education:
        missing_fields.append("education")

    return missing_fields


def _format_profile_context(profile: ProfileData) -> str:
    return json.dumps(profile.model_dump(exclude_none=True), ensure_ascii=False, indent=2)


def _extract_reply(result: dict[str, Any]) -> str:
    messages = result.get("messages")
    if not isinstance(messages, list):
        raise ProfileAgentError("Agent response did not include messages.")

    for message in reversed(messages):
        if isinstance(message, dict) and message.get("role") == "assistant":
            content = message.get("content")
        elif getattr(message, "type", None) == "ai":
            content = getattr(message, "content", None)
        else:
            continue

        if isinstance(content, str) and content.strip():
            return content.strip()

        if isinstance(content, list):
            text_parts = [
                item.get("text", "")
                for item in content
                if isinstance(item, dict) and isinstance(item.get("text"), str)
            ]
            joined_text = "\n".join(text_parts).strip()
            if joined_text:
                return joined_text

    raise ProfileAgentError("Agent response did not include an assistant reply.")


class ProfileChatService:
    def __init__(self) -> None:
        self._conversations: dict[str, ProfileConversationState] = {}

    def chat(self, user: UserRecord, request: ProfileChatRequest) -> ProfileChatResponse:
        settings = get_settings()
        if not settings.google_api_key:
            raise MissingLLMConfigurationError(
                "Gemini API anahtarı eksik. Server ortamında GOOGLE_API_KEY tanımlayın."
            )

        try:
            from deepagents import create_deep_agent
            from langchain_core.tools import tool
        except ImportError as error:
            raise MissingLLMConfigurationError(
                "Deep Agents bağımlılıkları eksik. apps/server içinde "
                'python -m pip install -e ".[dev]" komutunu çalıştırın.'
            ) from error

        os.environ.setdefault("GOOGLE_API_KEY", settings.google_api_key)

        conversation_key = f"{user.id}:{request.session_id}"
        conversation = self._conversations.setdefault(
            conversation_key,
            ProfileConversationState(),
        )

        def save_profile_fields(
            full_name: str | None = None,
            location: str | None = None,
            skills: list[str] | None = None,
            projects: list[str] | None = None,
            certifications: list[str] | None = None,
            languages: list[str] | None = None,
            work_experiences: list[str] | None = None,
            education: str | None = None,
            additional_information: str | None = None,
        ) -> str:
            """Save structured CV profile fields extracted from the user conversation."""
            patch = ProfilePatch(
                full_name=full_name,
                location=location,
                skills=skills,
                projects=projects,
                certifications=certifications,
                languages=languages,
                work_experiences=work_experiences,
                education=education,
                additional_information=additional_information,
            )
            conversation.profile = _merge_profile(conversation.profile, patch)
            missing_labels = [
                FIELD_LABELS[field_name]
                for field_name in _get_missing_required_fields(conversation.profile)
            ]
            if missing_labels:
                return f"Kaydedildi. Eksik zorunlu alanlar: {', '.join(missing_labels)}."

            return "Kaydedildi. Zorunlu profil alanları tamamlandı."

        save_profile_fields_tool = tool(args_schema=ProfilePatch)(save_profile_fields)
        missing_fields = _get_missing_required_fields(conversation.profile)
        missing_labels = [FIELD_LABELS[field_name] for field_name in missing_fields]

        system_prompt = (
            "Sen CV Agent'ın Türkçe konuşan profil toplama asistanısın. "
            "Amacın kullanıcının CV ve iş ilanı eşleşmesi için gereken bilgilerini "
            "soru cevapla toplamak, yetersiz cevaplarda netleştirme istemek ve "
            "kullanıcıya daha güçlü CV bilgisi vermesi için kısa tavsiyeler üretmektir.\n\n"
            "Zorunlu alanlar: Ad Soyad, Şehir/Ülke, Yetenekler, Eğitim/Ortalama. "
            "Kullanıcı bu alanları boş, belirsiz veya çok eksik bırakırsa kibarca uyar "
            "ve aynı alanı tekrar iste. Opsiyonel alanlar: Projeler, Sertifikalar, "
            "Diller, İş Deneyimleri, Ek bilgiler.\n\n"
            "Kullanıcı bilgi verdiğinde save_profile_fields aracını çağır. "
            "Tek yanıtta en fazla iki soru sor. Cevapların kısa, konuşkan ve doğrudan olsun. "
            "Kullanıcının verdiği bilgiyi geliştirmek için ölçülebilir sonuç, teknoloji, "
            "seviye, tarih, rol ve kapsam gibi detayları isteyebilirsin. "
            "Türkçe karakterleri doğru kullan.\n\n"
            f"Mevcut profil:\n{_format_profile_context(conversation.profile)}\n\n"
            f"Eksik zorunlu alanlar: {', '.join(missing_labels) if missing_labels else 'Yok'}."
        )

        agent = create_deep_agent(
            model=settings.profile_agent_model,
            tools=[save_profile_fields_tool],
            system_prompt=system_prompt,
        )
        messages = [*conversation.messages, {"role": "user", "content": request.message}]

        try:
            result = agent.invoke(
                {"messages": messages},
                config={"configurable": {"thread_id": conversation_key}},
            )
        except Exception as error:
            raise ProfileAgentError(str(error)) from error

        reply = _extract_reply(result)
        conversation.messages = [*messages, {"role": "assistant", "content": reply}]

        final_missing_fields = _get_missing_required_fields(conversation.profile)
        return ProfileChatResponse(
            reply=reply,
            session_id=request.session_id,
            profile=conversation.profile,
            missing_required_fields=final_missing_fields,
            is_profile_ready=len(final_missing_fields) == 0,
        )
