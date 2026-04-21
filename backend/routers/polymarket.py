"""
Polymarket router — thin HTTP wrapper over `services.polymarket` + `services.ai_takes`.

All data comes from Polymarket's public Gamma REST + CLOB APIs, cached in-memory.
Route shapes match the contract the frontend codes against (see .agents/pages.md).
"""

from __future__ import annotations

import logging
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel, Field

from services import polymarket as pm
from services.ai_takes import related_tickers as ai_related_tickers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/polymarket", tags=["polymarket"])

Category = Literal["politics", "crypto", "sports", "tech", "culture", "economics", "other"]
HistoryInterval = Literal["1h", "6h", "1d", "1w", "1m", "all", "max"]

# Polymarket slugs are kebab-case lowercase alphanumerics. Keep the pattern
# loose enough to cover long titles but tight enough to reject junk / path
# traversal attempts before they hit the upstream API.
SLUG_PATTERN = r"^[a-z0-9][a-z0-9-]{1,199}$"
SlugPath = Annotated[
    str,
    Path(
        ...,
        pattern=SLUG_PATTERN,
        min_length=2,
        max_length=200,
        description="Polymarket market slug (kebab-case).",
    ),
]


# ==============================
# Response models
# ==============================


class MarketCard(BaseModel):
    slug: str
    question: str
    category: Category = "other"
    yesPrice: float = Field(0.0, ge=0.0, le=1.0)
    noPrice: float = Field(0.0, ge=0.0, le=1.0)
    volume24h: float = 0.0
    liquidity: float = 0.0
    change24h: float = 0.0
    endDate: Optional[str] = None
    image: Optional[str] = None


class MarketDetail(MarketCard):
    description: Optional[str] = None
    outcomes: list[str] = Field(default_factory=list)
    totalVolume: float = 0.0
    createdAt: Optional[str] = None
    conditionId: Optional[str] = None
    clobTokenIds: list[str] = Field(default_factory=list)
    eventTitle: Optional[str] = None
    eventTicker: Optional[str] = None
    oneHourPriceChange: float = 0.0
    oneWeekPriceChange: float = 0.0
    oneMonthPriceChange: float = 0.0


class HistoryPoint(BaseModel):
    t: int = Field(..., description="Unix timestamp, seconds")
    yes: float = Field(..., ge=0.0, le=1.0)


class MarketHistoryResponse(BaseModel):
    slug: str
    interval: str
    points: list[HistoryPoint]


class RelatedTicker(BaseModel):
    symbol: str
    relevance: float = Field(..., ge=0.0, le=1.0)
    rationale: Optional[str] = None


class RelatedTickersResponse(BaseModel):
    slug: str
    tickers: list[RelatedTicker]
    provider: Optional[str] = None
    fallbackUsed: Optional[bool] = None
    cachedAt: Optional[str] = None


class CategoryCount(BaseModel):
    category: Category
    count: int


class CategoriesResponse(BaseModel):
    categories: list[CategoryCount]


class MarketListResponse(BaseModel):
    markets: list[MarketCard]
    total: int


# ==============================
# Error helpers
# ==============================


def _handle_service_error(e: Exception) -> HTTPException:
    if isinstance(e, LookupError):
        return HTTPException(status_code=404, detail=str(e))
    return HTTPException(status_code=502, detail=f"Polymarket upstream error: {e}")


# ==============================
# Routes
# ==============================


@router.get("/trending", response_model=MarketListResponse)
async def trending(
    limit: int = Query(10, ge=1, le=50),
    category: Optional[Category] = Query(None),
) -> MarketListResponse:
    try:
        cards = await pm.get_trending(limit=limit, category=category)
    except Exception as e:
        raise _handle_service_error(e)
    return MarketListResponse(markets=[MarketCard(**c) for c in cards], total=len(cards))


@router.get("/movers", response_model=MarketListResponse)
async def movers(
    limit: int = Query(10, ge=1, le=50),
    category: Optional[Category] = Query(None),
) -> MarketListResponse:
    try:
        cards = await pm.get_movers(limit=limit, category=category)
    except Exception as e:
        raise _handle_service_error(e)
    return MarketListResponse(markets=[MarketCard(**c) for c in cards], total=len(cards))


@router.get("/categories", response_model=CategoriesResponse)
async def categories() -> CategoriesResponse:
    try:
        rows = await pm.get_categories()
    except Exception as e:
        raise _handle_service_error(e)
    return CategoriesResponse(categories=[CategoryCount(**r) for r in rows])


@router.get("/search", response_model=MarketListResponse)
async def search(
    q: str = Query(
        "",
        description="Free-text match against the question",
        max_length=200,
    ),
    category: Optional[Category] = Query(None),
    limit: int = Query(20, ge=1, le=100),
) -> MarketListResponse:
    try:
        cards = await pm.search_markets(q=q, category=category, limit=limit)
    except Exception as e:
        raise _handle_service_error(e)
    return MarketListResponse(markets=[MarketCard(**c) for c in cards], total=len(cards))


@router.get("/market/{slug}", response_model=MarketDetail)
async def market(slug: SlugPath) -> MarketDetail:
    try:
        detail = await pm.get_market(slug)
    except Exception as e:
        raise _handle_service_error(e)
    return MarketDetail(**detail)


@router.get("/market/{slug}/history", response_model=MarketHistoryResponse)
async def market_history(
    slug: SlugPath,
    interval: HistoryInterval = Query("1w"),
) -> MarketHistoryResponse:
    try:
        payload = await pm.get_history(slug, interval=interval)
    except Exception as e:
        raise _handle_service_error(e)
    return MarketHistoryResponse(
        slug=payload["slug"],
        interval=payload["interval"],
        points=[HistoryPoint(**p) for p in payload["points"]],
    )


@router.get("/market/{slug}/related-tickers", response_model=RelatedTickersResponse)
async def market_related_tickers(slug: SlugPath) -> RelatedTickersResponse:
    try:
        payload = await ai_related_tickers(slug)
    except Exception as e:
        if isinstance(e, LookupError):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=502, detail=f"AI related-tickers failed: {e}")
    return RelatedTickersResponse(
        slug=payload["slug"],
        tickers=[RelatedTicker(**t) for t in payload["tickers"]],
        provider=payload.get("provider"),
        fallbackUsed=payload.get("fallbackUsed"),
        cachedAt=payload.get("cachedAt"),
    )
