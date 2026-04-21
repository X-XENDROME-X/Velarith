"""
AI router — prediction-market-aware AI takes.

Thin HTTP wrapper over `services.ai_takes`. All AI calls route through
`services.ai_provider.generate` so Claude (primary) / Groq (fallback) behavior
stays uniform. Results are TTL-cached per slug (1h) and globally (6h for brief).
"""

from __future__ import annotations

import logging
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.ai_provider import generate as ai_generate
from services.ai_takes import daily_brief as svc_daily_brief, market_take as svc_market_take

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


# ==============================
# Response models
# ==============================


class MarketTake(BaseModel):
    slug: str
    mispriced: bool = False
    direction: Literal["yes", "no", "neutral"] = "neutral"
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    summary: str = ""
    yesNeeds: list[str] = Field(default_factory=list)
    noNeeds: list[str] = Field(default_factory=list)
    provider: Optional[str] = None
    fallbackUsed: Optional[bool] = None
    cachedAt: Optional[str] = None


class DailyBrief(BaseModel):
    headline: str
    body: str
    provider: Optional[str] = None
    fallbackUsed: Optional[bool] = None
    cachedAt: Optional[str] = None


# ==============================
# Routes
# ==============================


@router.get("/market-take/{slug}", response_model=MarketTake)
async def market_take(slug: str) -> MarketTake:
    """AI 'is this mispriced?' take. Cached 1h per slug (AI_MARKET_TAKE_TTL_SEC)."""
    try:
        payload = await svc_market_take(slug)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("market_take(%s) failed", slug)
        raise HTTPException(status_code=502, detail=f"AI market-take failed: {e}")
    # Normalize direction to the response model's enum.
    direction = payload.get("direction", "neutral")
    if direction not in ("yes", "no", "neutral"):
        direction = "neutral"
    return MarketTake(**{**payload, "direction": direction})


@router.get("/daily-brief", response_model=DailyBrief)
async def daily_brief() -> DailyBrief:
    """Prediction-market brief for the dashboard. Cached 6h (AI_DAILY_BRIEF_TTL_SEC)."""
    try:
        payload = await svc_daily_brief()
    except Exception as e:
        logger.exception("daily_brief failed")
        raise HTTPException(status_code=502, detail=f"AI daily-brief failed: {e}")
    return DailyBrief(**payload)


# --- Provider smoke test (kept from M3 for quick debugging) ---


class ProviderProbeResponse(BaseModel):
    text: str
    provider: str
    model: str
    fallbackUsed: bool


@router.get("/_probe", response_model=ProviderProbeResponse)
async def probe() -> ProviderProbeResponse:
    """One-shot AI call to verify the two-tier router wiring. No caching."""
    try:
        result = await ai_generate(
            "Respond with the single word: PONG",
            system="You are a connectivity probe. Respond with only the requested word.",
            max_tokens=32,
            temperature=0.0,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI probe failed: {e}")
    return ProviderProbeResponse(
        text=result.text,
        provider=result.provider,
        model=result.model,
        fallbackUsed=result.fallback_used,
    )
