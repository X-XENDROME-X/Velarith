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
from fastapi import FastAPI
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


def _parse_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(research.router)
app.include_router(polymarket.router)
app.include_router(ai.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "10000")),
        reload=True,
    )
