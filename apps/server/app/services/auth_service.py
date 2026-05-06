# Module: Implements authentication use cases independently from HTTP routes.
from dataclasses import dataclass
from datetime import timedelta

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models.user import UserRecord
from app.db.repositories.users import InMemoryUserRepository
from app.schemas.auth import AuthResponse, RegisterRequest, UserResponse


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


@dataclass(frozen=True)
class AuthenticatedUser:
    user: UserRecord


class AuthService:
    def __init__(self, user_repository: InMemoryUserRepository) -> None:
        self._user_repository = user_repository

    def register(self, request: RegisterRequest) -> AuthResponse:
        existing_user = self._user_repository.get_by_email(request.email)
        if existing_user is not None:
            raise DuplicateEmailError

        user = self._user_repository.create(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            password_hash=hash_password(request.password),
        )

        return self._create_auth_response(user)

    def login(self, *, email: str, password: str) -> AuthResponse:
        user = self._user_repository.get_by_email(email)
        if user is None:
            raise InvalidCredentialsError

        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError

        return self._create_auth_response(user)

    def get_user(self, user_id: str) -> AuthenticatedUser | None:
        user = self._user_repository.get_by_id(user_id)
        if user is None:
            return None

        return AuthenticatedUser(user=user)

    def _create_auth_response(self, user: UserRecord) -> AuthResponse:
        settings = get_settings()
        access_token = create_access_token(
            subject=user.id,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        )

        return AuthResponse(
            access_token=access_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=to_user_response(user),
        )


def to_user_response(user: UserRecord) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        created_at=user.created_at,
    )
