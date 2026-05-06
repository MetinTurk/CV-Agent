# Module: Exposes authentication endpoints for account creation and JWT sessions.
from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthServiceDep, CurrentUserDep
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import (
    DuplicateEmailError,
    InvalidCredentialsError,
    to_user_response,
)

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, auth_service: AuthServiceDep) -> AuthResponse:
    try:
        return auth_service.register(request)
    except DuplicateEmailError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta adresi zaten kayıtlı.",
        ) from None


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, auth_service: AuthServiceDep) -> AuthResponse:
    try:
        return auth_service.login(email=request.email, password=request.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı.",
        ) from None


@router.get("/me", response_model=UserResponse)
def get_current_account(current_user: CurrentUserDep) -> UserResponse:
    return to_user_response(current_user)
