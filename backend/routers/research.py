"""
Research router — ticker-level "evidence engine" for prediction-market bets.

Mounts the legacy /technical, /fundamental, /sentiment, /analysis URL paths so
the existing Next.js AnalysisPanel keeps working. Internally wraps the business
logic in `backend/blueprints/*/core.py` (unchanged in M3).
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from blueprints.analysis import get_score_breakdown
from blueprints.fundamental.core import get_comprehensive_fundamental_data
from blueprints.fundamental.peer_utils import get_peer_context
from blueprints.prompt_builder import build_prompt
from blueprints.sentiment.news import get_news_sentiment
from blueprints.technical.core import get_technical_summary

from services.ai_provider import generate as ai_generate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["research"])

AnalysisMode = Literal["short", "long"]

# ==============================
# Response models
# ==============================


class NewsSentimentCounts(BaseModel):
    total: int = 0
    positive: int = 0
    negative: int = 0
    neutral: int = 0


class ScoreBreakdown(BaseModel):
    fundamentals: float = 50.0
    technical: float = 50.0
    news: float = 50.0
    insider: float = 50.0
    finalScore: float = 0.0


class AIAnalysis(BaseModel):
    recommendation: str = "HOLD"
    summary: str = "N/A"
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    fundamentalAnalysis: str = "N/A"
    technicalAnalysis: str = "N/A"
    provider: Optional[str] = None
    fallbackUsed: Optional[bool] = None


# ==============================
# Helpers
# ==============================


def _raise_if_error(payload: dict) -> None:
    """Blueprints return {'error': ...} on failure — convert to HTTP 400."""
    if isinstance(payload, dict) and "error" in payload:
        raise HTTPException(status_code=400, detail=payload["error"])


def _parse_ai_json(raw: str) -> dict[str, Any]:
    """Strip code fences + parse JSON. Returns an error dict on parse failure."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:].strip("` \n")
    elif text.startswith("```"):
        text = text[3:].strip("` \n")
    if text.endswith("```"):
        text = text[:-3].strip()
    try:
        return json.loads(text)
    except Exception as e:
        logger.error("Failed to parse AI JSON: %s\nRaw: %s", e, raw[:500])
        return {"error": f"Failed to parse AI summary: {e}"}


# ==============================
# Routes
# ==============================


@router.get("/technical/{ticker}")
async def technical(ticker: str) -> dict[str, Any]:
    """Technical indicators (RSI, EMAs, ADX, Bollinger, S/R) for `ticker`."""
    summary = await asyncio.to_thread(get_technical_summary, ticker.upper())
    _raise_if_error(summary)
    return summary


@router.get("/fundamental/{ticker}")
async def fundamental(ticker: str) -> dict[str, Any]:
    """Fundamentals + peer context for `ticker`."""
    data = await asyncio.to_thread(get_comprehensive_fundamental_data, ticker.upper())
    _raise_if_error(data)
    return data


@router.get("/sentiment/{ticker}", response_model=NewsSentimentCounts)
async def sentiment(ticker: str) -> NewsSentimentCounts:
    """News sentiment counts for `ticker` (matches frontend `NewsSentiment` type)."""
    data = await get_news_sentiment(ticker.upper())
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    meta = data.get("meta") or {}
    return NewsSentimentCounts(
        total=int(meta.get("total", 0)),
        positive=int(meta.get("positive", 0)),
        negative=int(meta.get("negative", 0)),
        neutral=int(meta.get("neutral", 0)),
    )


@router.get("/analysis/score/{ticker}", response_model=ScoreBreakdown)
async def analysis_score(
    ticker: str,
    mode: AnalysisMode = Query("long", description="short or long"),
) -> ScoreBreakdown:
    """Composite score breakdown across fundamentals / technical / sentiment / insider."""
    data = await get_score_breakdown(ticker.upper(), mode)
    _raise_if_error(data)
    return ScoreBreakdown(**data)


@router.get("/analysis/ai/{ticker}", response_model=AIAnalysis)
async def analysis_ai(
    ticker: str,
    mode: AnalysisMode = Query("long"),
    age: Optional[str] = Query(None),
    risk_profile: Optional[str] = Query(None),
) -> AIAnalysis:
    """AI-authored ticker analysis, routed through Claude primary + Groq fallback."""
    ticker = ticker.upper()

    score_breakdown = await get_score_breakdown(ticker, mode)
    _raise_if_error(score_breakdown)

    fundamentals, tech_summary, peer_data = await asyncio.gather(
        asyncio.to_thread(get_comprehensive_fundamental_data, ticker),
        asyncio.to_thread(get_technical_summary, ticker),
        asyncio.to_thread(get_peer_context, ticker),
    )
    _raise_if_error(fundamentals)
    _raise_if_error(tech_summary)

    prompt = build_prompt(
        ticker=ticker,
        mode=mode,
        final_scores=score_breakdown,
        fundamentals=fundamentals,
        tech_summary=tech_summary,
        user_context={"age": age, "risk": risk_profile},
        peer_data=peer_data if isinstance(peer_data, dict) and "error" not in peer_data else None,
    )

    try:
        result = await ai_generate(
            prompt,
            system=(
                "You are a professional, no-nonsense equity analyst. "
                "Return a single minified JSON object matching the exact schema "
                "requested, with no prose, no preamble, and no code fences."
            ),
            max_tokens=1024,
            temperature=0.3,
        )
    except Exception as e:
        logger.error("AI provider failed for /analysis/ai/%s: %s", ticker, e)
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    parsed = _parse_ai_json(result.text)
    if "error" in parsed:
        raise HTTPException(status_code=502, detail=parsed["error"])

    return AIAnalysis(
        recommendation=str(parsed.get("recommendation", "HOLD")).upper(),
        summary=parsed.get("summary", "N/A"),
        strengths=parsed.get("strengths", []) or [],
        weaknesses=parsed.get("weaknesses", []) or [],
        fundamentalAnalysis=parsed.get("fundamentalAnalysis", "N/A"),
        technicalAnalysis=parsed.get("technicalAnalysis", "N/A"),
        provider=result.provider,
        fallbackUsed=result.fallback_used,
    )
