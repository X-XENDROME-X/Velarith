"""
polymarket.py
-------------
Async Polymarket data layer.

Uses the public Gamma REST API (markets + events metadata) and CLOB REST API
(price history). All responses are normalized into stable Python dicts so the
routers never see raw JSON-encoded strings or upstream naming drift.

Caching strategy (fits Render free 512MB RAM — single-process, in-memory):
- page cache (60s):  one fat "top N by volume" fetch feeds trending / movers /
                     search / categories; keeps upstream QPS low.
- slug cache (60s):  individual market lookups.
- history cache (5m): CLOB history per (token_id, interval).

Everything else lives in the routers as thin HTTP wrappers.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Literal, Optional

import httpx
from cachetools import TTLCache

logger = logging.getLogger(__name__)

GAMMA_BASE = os.getenv("POLYMARKET_GAMMA_URL", "https://gamma-api.polymarket.com").rstrip("/")
CLOB_BASE = os.getenv("POLYMARKET_CLOB_URL", "https://clob.polymarket.com").rstrip("/")

Category = Literal["politics", "crypto", "sports", "tech", "culture", "economics", "other"]
CATEGORIES: tuple[Category, ...] = (
    "politics",
    "crypto",
    "sports",
    "tech",
    "culture",
    "economics",
    "other",
)
HistoryInterval = Literal["1h", "6h", "1d", "1w", "1m", "all", "max"]

# (category, keywords) checked in order — first match wins. Keywords are lowercased
# substrings checked against question + event title. Order = topic priority: a
# market about "Trump attends Super Bowl" should bucket as politics (the driver
# of price action), not sports.
_CATEGORY_RULES: tuple[tuple[Category, tuple[str, ...]], ...] = (
    ("politics", (
        "trump", "biden", "harris", "election", "vote", "president", "democrat",
        "republican", "congress", "senate", "governor", "impeach", "nomination",
        "primary", "caucus", "ukraine", "russia", "china", "iran", "israel",
        "gaza", "ceasefire", "peace deal", "war ", "conflict",
    )),
    ("economics", (
        "fed ", "fomc", "interest rate", "rate cut", "rate hike", "cpi", "pce",
        "inflation", "gdp", "recession", "unemployment", "jobs report", "nonfarm",
        "earnings", "s&p", "nasdaq", "dow jones", "tariff", "yield",
    )),
    ("crypto", (
        "bitcoin", "btc", "ethereum", "eth ", "$eth", "crypto", "altcoin", "solana",
        "$sol", "ripple", "xrp", "coinbase", "binance", "stablecoin", "memecoin",
        "dogecoin", "doge", "tether",
    )),
    ("sports", (
        "nfl", "nba", "mlb", "nhl", "ufc", "mma", "boxing", "soccer", "football",
        "basketball", "baseball", "hockey", "super bowl", "world cup", "olympic",
        "champion", "playoff", "tournament", "atp", "wta", "tennis", "golf",
        "match", " vs ", "f1 ", "formula 1",
    )),
    ("tech", (
        "openai", "anthropic", "chatgpt", "gpt-", "gemini", "llama", "nvidia",
        "tesla", "spacex", "apple", "iphone", "microsoft", "google", "meta ",
        "facebook", "tiktok", "twitter", "x.com", "launch", "ipo",
    )),
    ("culture", (
        "oscar", "grammy", "emmy", "academy award", "movie", "box office", "album",
        "tour", "celebrity", "kardashian", "taylor swift", "beyonce", "drake",
        "marriage", "divorce", "dating", "baby",
    )),
)

# ---- module-level clients + caches (lazy / shared) ----
_client: Optional[httpx.AsyncClient] = None
_client_lock = asyncio.Lock()

_page_cache: TTLCache = TTLCache(maxsize=8, ttl=60)     # key: "top|<limit>" → list[dict]
_slug_cache: TTLCache = TTLCache(maxsize=256, ttl=60)   # key: slug → dict
_history_cache: TTLCache = TTLCache(maxsize=256, ttl=300)  # key: (token, interval) → list

DEFAULT_PAGE_SIZE = 100  # what we prefetch to serve trending/movers/search from


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is not None:
        return _client
    async with _client_lock:
        if _client is None:
            _client = httpx.AsyncClient(
                timeout=httpx.Timeout(10.0, connect=5.0),
                headers={"User-Agent": "Velarith/0.4 (+https://github.com/X-XENDROME-X/Velarith)"},
            )
    return _client


async def aclose() -> None:
    """Called from FastAPI lifespan to close the shared httpx client cleanly."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


# ==============================
# Gamma fetchers
# ==============================


async def _fetch_markets_page(limit: int = DEFAULT_PAGE_SIZE) -> list[dict[str, Any]]:
    """Top-N active markets ordered by 24h volume. Cached 60s."""
    key = f"top|{limit}"
    cached = _page_cache.get(key)
    if cached is not None:
        return cached
    client = await _get_client()
    try:
        resp = await client.get(
            f"{GAMMA_BASE}/markets",
            params={
                "active": "true",
                "closed": "false",
                "archived": "false",
                "order": "volume24hr",
                "ascending": "false",
                "limit": str(limit),
            },
        )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Gamma /markets fetch failed: %s", e)
        raise RuntimeError(f"Polymarket Gamma unavailable: {e}") from e
    data = resp.json()
    if not isinstance(data, list):
        raise RuntimeError("Polymarket Gamma returned unexpected payload")
    _page_cache[key] = data
    return data


async def _fetch_market_by_slug(slug: str) -> dict[str, Any]:
    """Single market by slug. Cached 60s."""
    cached = _slug_cache.get(slug)
    if cached is not None:
        return cached
    client = await _get_client()
    try:
        resp = await client.get(f"{GAMMA_BASE}/markets", params={"slug": slug})
        resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Gamma /markets?slug=%s failed: %s", slug, e)
        raise RuntimeError(f"Polymarket Gamma unavailable: {e}") from e
    data = resp.json()
    if not isinstance(data, list) or not data:
        raise LookupError(f"Market not found: {slug}")
    market = data[0]
    _slug_cache[slug] = market
    return market


# ==============================
# Normalization
# ==============================


def _parse_json_list(value: Any) -> list[Any]:
    """Gamma returns some list fields as JSON-encoded strings. Decode safely."""
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value:
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


def _as_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _categorize(market: dict[str, Any]) -> Category:
    question = str(market.get("question") or "").lower()
    events = market.get("events") or []
    event_title = ""
    if isinstance(events, list) and events:
        event_title = str(events[0].get("title") or "").lower()
    haystack = f"{question} {event_title}"
    for category, keywords in _CATEGORY_RULES:
        for kw in keywords:
            if kw in haystack:
                return category
    return "other"


def _extract_yes_no(prices: list[Any], outcomes: list[Any]) -> tuple[float, float]:
    """Map outcomes → (yesPrice, noPrice). Some markets aren't binary; we pick the
    two highest-liquidity sides and label them yes/no in outcome order."""
    parsed = [_as_float(p) for p in prices]
    if not parsed:
        return 0.0, 0.0
    if len(parsed) == 1:
        return parsed[0], max(0.0, 1.0 - parsed[0])
    # Binary YES/NO (most common)
    if len(outcomes) == 2 and any(str(o).lower() == "yes" for o in outcomes):
        yes_idx = next(
            (i for i, o in enumerate(outcomes) if str(o).lower() == "yes"), 0
        )
        no_idx = 1 - yes_idx
        return parsed[yes_idx], parsed[no_idx] if no_idx < len(parsed) else 0.0
    # Non-binary: treat first outcome as "yes", remainder aggregated as "no".
    yes = parsed[0]
    return yes, max(0.0, 1.0 - yes)


def _market_card(market: dict[str, Any]) -> dict[str, Any]:
    """Normalize a Gamma market dict into the `MarketCard` shape."""
    prices = _parse_json_list(market.get("outcomePrices"))
    outcomes = _parse_json_list(market.get("outcomes"))
    yes_price, no_price = _extract_yes_no(prices, outcomes)
    events = market.get("events") or []
    image = (
        market.get("image")
        or market.get("icon")
        or (events[0].get("image") if events and isinstance(events, list) else None)
    )
    return {
        "slug": market.get("slug") or "",
        "question": market.get("question") or "",
        "category": _categorize(market),
        "yesPrice": round(max(0.0, min(1.0, yes_price)), 4),
        "noPrice": round(max(0.0, min(1.0, no_price)), 4),
        "volume24h": _as_float(market.get("volume24hr")),
        "liquidity": _as_float(market.get("liquidityClob") or market.get("liquidity")),
        "change24h": _as_float(market.get("oneDayPriceChange")),
        "endDate": market.get("endDate"),
        "image": image,
    }


def _market_detail(market: dict[str, Any]) -> dict[str, Any]:
    card = _market_card(market)
    outcomes = [str(o) for o in _parse_json_list(market.get("outcomes"))]
    events = market.get("events") or []
    event_title = None
    event_ticker = None
    event_slug = None
    if isinstance(events, list) and events:
        event_title = events[0].get("title")
        event_ticker = events[0].get("ticker")
        event_slug = events[0].get("slug")
    return {
        **card,
        "description": market.get("description"),
        "outcomes": outcomes,
        "totalVolume": _as_float(market.get("volume")),
        "createdAt": market.get("createdAt"),
        "conditionId": market.get("conditionId"),
        "clobTokenIds": _parse_json_list(market.get("clobTokenIds")),
        "eventTitle": event_title,
        "eventTicker": event_ticker,
        "eventSlug": event_slug,
        "oneHourPriceChange": _as_float(market.get("oneHourPriceChange")),
        "oneWeekPriceChange": _as_float(market.get("oneWeekPriceChange")),
        "oneMonthPriceChange": _as_float(market.get("oneMonthPriceChange")),
    }


# ==============================
# Public service API
# ==============================


async def get_trending(limit: int = 10, category: Optional[Category] = None) -> list[dict[str, Any]]:
    raw = await _fetch_markets_page(DEFAULT_PAGE_SIZE)
    cards = [_market_card(m) for m in raw]
    if category and category != "other":
        cards = [c for c in cards if c["category"] == category]
    return cards[:limit]


async def get_movers(limit: int = 10, category: Optional[Category] = None) -> list[dict[str, Any]]:
    raw = await _fetch_markets_page(DEFAULT_PAGE_SIZE)
    cards = [_market_card(m) for m in raw]
    if category and category != "other":
        cards = [c for c in cards if c["category"] == category]
    cards.sort(key=lambda c: abs(c["change24h"]), reverse=True)
    return cards[:limit]


async def get_categories() -> list[dict[str, Any]]:
    """Return the fixed canonical category list with counts from the top page.
    Counts are approximate (sampled from the cached top-100) — fine for UI chips."""
    raw = await _fetch_markets_page(DEFAULT_PAGE_SIZE)
    counts: dict[str, int] = {c: 0 for c in CATEGORIES}
    for m in raw:
        counts[_categorize(m)] += 1
    return [{"category": c, "count": counts[c]} for c in CATEGORIES if c != "other" or counts[c] > 0]


async def search_markets(
    q: str,
    category: Optional[Category] = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    q_norm = (q or "").strip().lower()
    raw = await _fetch_markets_page(DEFAULT_PAGE_SIZE)
    cards = [_market_card(m) for m in raw]
    if q_norm:
        cards = [c for c in cards if q_norm in c["question"].lower()]
    if category and category != "other":
        cards = [c for c in cards if c["category"] == category]
    return cards[:limit]


async def get_market(slug: str) -> dict[str, Any]:
    market = await _fetch_market_by_slug(slug)
    return _market_detail(market)


async def get_history(slug: str, interval: HistoryInterval = "1w") -> dict[str, Any]:
    """Fetch YES-side price history from the CLOB. Cached 5min per (token, interval)."""
    market = await _fetch_market_by_slug(slug)
    token_ids = _parse_json_list(market.get("clobTokenIds"))
    if not token_ids:
        raise LookupError(f"Market {slug} has no CLOB tokens (not tradable)")
    yes_token = str(token_ids[0])
    cache_key = (yes_token, interval)
    cached = _history_cache.get(cache_key)
    if cached is not None:
        return {"slug": slug, "interval": interval, "points": cached}

    fidelity = _fidelity_for(interval)
    client = await _get_client()
    try:
        resp = await client.get(
            f"{CLOB_BASE}/prices-history",
            params={"market": yes_token, "interval": interval, "fidelity": str(fidelity)},
        )
        resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("CLOB /prices-history for %s failed: %s", slug, e)
        raise RuntimeError(f"Polymarket CLOB unavailable: {e}") from e
    payload = resp.json() or {}
    points = [
        {"t": int(pt.get("t", 0)), "yes": _as_float(pt.get("p"))}
        for pt in (payload.get("history") or [])
        if pt.get("t") is not None
    ]
    _history_cache[cache_key] = points
    return {"slug": slug, "interval": interval, "points": points}


def _fidelity_for(interval: HistoryInterval) -> int:
    """Resolution per interval, in minutes. Keeps each response at ~100-500 points."""
    return {
        "1h": 1,
        "6h": 5,
        "1d": 15,
        "1w": 60,
        "1m": 240,
        "all": 1440,
        "max": 1440,
    }.get(interval, 60)
