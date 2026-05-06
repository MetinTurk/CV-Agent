# Module: Defines typed response schemas for health endpoints.
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
