"""
Velarith backend — FastAPI app entry point.

Replaces the old Flask `app.py` (deleted in M3). Reuses the business logic in
`backend/blueprints/*/core.py` via the routers in `backend/routers/`.

Run locally:
    cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 10000
Auto-generated docs: http://localhost:10000/docs
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import ai, health, polymarket, research  # noqa: E402
from services import polymarket as pm_service  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: nothing to do — clients are lazy-initialized on first use.
    yield
    # shutdown: close the shared httpx client to avoid "event loop is closed" warnings.
    await pm_service.aclose()


app = FastAPI(
    title="Velarith API",
    description=(
        "AI-powered prediction market research. Polymarket data + stock evidence "
        "+ two-tier AI (Claude primary, Groq fallback)."
    ),
    version="0.4.0",
    docs_url="/docs",
    redoc_url=None,
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ==============================
# CORS lockdown (M7)
# ==============================
# Explicit allowlist via ALLOWED_ORIGINS (comma-separated). Preview deploys on
# Vercel can match ALLOWED_ORIGIN_REGEX (e.g. ^https://velarith-.*\.vercel\.app$)
# without expanding the explicit list. Wildcard ("*") is intentionally not
# supported — a misconfigured Render env shouldn't silently open the API.

def _parse_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [o.strip() for o in raw.split(",") if o.strip() and o.strip() != "*"]
    # De-duplicate while preserving order.
    seen: set[str] = set()
    unique: list[str] = []
    for o in origins:
        if o not in seen:
            seen.add(o)
            unique.append(o)
    return unique


_origins = _parse_origins()
_origin_regex = os.getenv("ALLOWED_ORIGIN_REGEX") or None
logger = logging.getLogger("velarith.cors")
logger.info(
    "CORS allowed origins: %s%s",
    _origins or "(none)",
    f" + regex={_origin_regex!r}" if _origin_regex else "",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=[
        "X-AI-Provider",
        "X-AI-Model",
        "X-AI-Fallback-Used",
        "X-Cache",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
    max_age=600,
)

app.include_router(health.router)
app.include_router(research.router)
app.include_router(polymarket.router)
app.include_router(ai.router)


# ==============================
# Cache-Control middleware (M7)
# ==============================
# Hints for the browser / Vercel edge / any CDN in front of Render. All values
# are conservative: we serve short fresh windows + longer SWR so the UI shows
# instant data while a background refetch hits the backend.

_CACHE_RULES: tuple[tuple[str, str], ...] = (
    # AI reads — server-side TTL-cached, mirror to the edge.
    ("/ai/daily-brief", "public, max-age=600, stale-while-revalidate=3600"),
    ("/ai/market-take/", "public, max-age=300, stale-while-revalidate=1800"),
    # Polymarket reads — fresh prices matter, but stale data is tolerable for a blink.
    ("/polymarket/trending", "public, max-age=30, stale-while-revalidate=60"),
    ("/polymarket/movers", "public, max-age=30, stale-while-revalidate=60"),
    ("/polymarket/search", "public, max-age=30, stale-while-revalidate=60"),
    ("/polymarket/categories", "public, max-age=300, stale-while-revalidate=900"),
    ("/polymarket/market/", "public, max-age=30, stale-while-revalidate=60"),
    # Research (stock evidence) — upstream data updates slowly.
    ("/technical/", "public, max-age=120, stale-while-revalidate=300"),
    ("/fundamental/", "public, max-age=300, stale-while-revalidate=1800"),
    ("/sentiment/", "public, max-age=120, stale-while-revalidate=600"),
    ("/analysis/score/", "public, max-age=120, stale-while-revalidate=600"),
    ("/analysis/ai/", "public, max-age=300, stale-while-revalidate=1800"),
)

# Override per-path specificity: /polymarket/market/{slug}/history is stable,
# /polymarket/market/{slug}/related-tickers is AI-cached for hours.
_CACHE_SUFFIX_RULES: tuple[tuple[str, str], ...] = (
    ("/history", "public, max-age=300, stale-while-revalidate=900"),
    ("/related-tickers", "public, max-age=1800, stale-while-revalidate=3600"),
)


def _cache_control_for(path: str) -> str | None:
    for suffix, rule in _CACHE_SUFFIX_RULES:
        if path.endswith(suffix):
            return rule
    for prefix, rule in _CACHE_RULES:
        if path.startswith(prefix):
            return rule
    return None


@app.middleware("http")
async def add_cache_control(request: Request, call_next):
    response = await call_next(request)
    if request.method != "GET":
        return response
    if response.status_code >= 400:
        response.headers.setdefault("Cache-Control", "no-store")
        return response
    rule = _cache_control_for(request.url.path)
    if rule and "Cache-Control" not in response.headers:
        response.headers["Cache-Control"] = rule
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "10000")),
        reload=True,
    )
