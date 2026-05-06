# Module: Exposes the authenticated profile collection chat endpoint.
from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUserDep, ProfileChatServiceDep
from app.schemas.profile_chat import ProfileChatRequest, ProfileChatResponse
from app.services.profile_agent import (
    MissingLLMConfigurationError,
    ProfileAgentError,
    ProfileAgentTimeoutError,
)

router = APIRouter(prefix="/profile-chat")


@router.post("/message", response_model=ProfileChatResponse)
def send_profile_chat_message(
    request: ProfileChatRequest,
    current_user: CurrentUserDep,
    profile_chat_service: ProfileChatServiceDep,
) -> ProfileChatResponse:
    try:
        return profile_chat_service.chat(current_user, request)
    except MissingLLMConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except ProfileAgentTimeoutError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Profil asistanı zamanında yanıt veremedi. "
                "Lütfen kısa bir süre sonra tekrar deneyin."
            ),
        ) from None
    except ProfileAgentError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Profil asistanı yanıt üretemedi. Lütfen tekrar deneyin.",
        ) from None
