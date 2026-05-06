# Module: Registers versionless API routers for the FastAPI application.
from fastapi import APIRouter

from app.api.routes import auth, health, profile_chat

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(profile_chat.router, tags=["profile-chat"])
