# Module: Provides reusable FastAPI dependencies for API route modules.
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token
from app.db.models.user import UserRecord
from app.db.repositories.users import InMemoryUserRepository
from app.services.auth_service import AuthService
from app.services.profile_agent import ProfileChatService

bearer_scheme = HTTPBearer(auto_error=False)
user_repository = InMemoryUserRepository()
auth_service = AuthService(user_repository)
profile_chat_service = ProfileChatService()


def get_auth_service() -> AuthService:
    return auth_service


def get_profile_chat_service() -> ProfileChatService:
    return profile_chat_service


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
ProfileChatServiceDep = Annotated[ProfileChatService, Depends(get_profile_chat_service)]
BearerCredentialsDep = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(bearer_scheme),
]


def get_current_user(
    auth_service_dependency: AuthServiceDep,
    credentials: BearerCredentialsDep,
) -> UserRecord:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from None

    authenticated_user = auth_service_dependency.get_user(str(payload["sub"]))
    if authenticated_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token user",
        )

    return authenticated_user.user


CurrentUserDep = Annotated[UserRecord, Depends(get_current_user)]
