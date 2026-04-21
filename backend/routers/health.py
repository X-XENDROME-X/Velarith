"""Health + root routes. `/health` is the UptimeRobot keepalive target."""

from fastapi import APIRouter
from pydantic import BaseModel

from services.ai_provider import provider_status

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str


class RootResponse(BaseModel):
    status: str
    service: str
    version: str
    ai: dict


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/", response_model=RootResponse)
async def root() -> RootResponse:
    return RootResponse(
        status="ok",
        service="Velarith API",
        version="0.4.0",
        ai=provider_status(),
    )
