"""
ai_takes.py
-----------
Cached AI-backed takes over Polymarket data.

Every call combines fresh Polymarket context with `services.ai_provider.generate`
so the user always sees Claude (primary) / Groq (fallback) output. The results
are aggressively cached because prediction-market AI analysis is expensive and
doesn't need to change minute-to-minute.

Cache TTLs (env-overridable):
    AI_MARKET_TAKE_TTL_SEC      default 3600  (1h)
    AI_DAILY_BRIEF_TTL_SEC      default 21600 (6h)
    AI_RELATED_TICKERS_TTL_SEC  default 86400 (24h)
"""

from __future__ import annotations

import datetime as dt
import json
import logging
import os
import re
from typing import Any, Optional

from cachetools import TTLCache

from services.ai_provider import AIResponse, generate as ai_generate
from services.polymarket import (
    get_history,
    get_market,
    get_movers,
    get_trending,
)

logger = logging.getLogger(__name__)


def _ttl(name: str, default_sec: int) -> int:
    raw = os.getenv(name)
    if not raw:
        return default_sec
    try:
        return max(60, int(raw))
    except ValueError:
        return default_sec


_take_cache: TTLCache = TTLCache(maxsize=256, ttl=_ttl("AI_MARKET_TAKE_TTL_SEC", 3600))
_brief_cache: TTLCache = TTLCache(maxsize=4, ttl=_ttl("AI_DAILY_BRIEF_TTL_SEC", 21600))
_tickers_cache: TTLCache = TTLCache(
    maxsize=512, ttl=_ttl("AI_RELATED_TICKERS_TTL_SEC", 86400)
)


# ==============================
# JSON helpers
# ==============================

_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", re.DOTALL)


def _parse_ai_json(text: str) -> Optional[Any]:
    """Best-effort JSON extraction from an LLM response (handles fences + prose)."""
    if not text:
        return None
    fence = _JSON_FENCE_RE.search(text)
    candidate = fence.group(1) if fence else text.strip()
    start = min(
        (i for i in (candidate.find("{"), candidate.find("[")) if i >= 0),
        default=-1,
    )
    if start > 0:
        candidate = candidate[start:]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def _extract_bool(text: str, key: str) -> Optional[bool]:
    m = re.search(rf'"{re.escape(key)}"\s*:\s*(true|false)', text, flags=re.IGNORECASE)
    if not m:
        return None
    return m.group(1).lower() == "true"


def _extract_number(text: str, key: str) -> Optional[float]:
    m = re.search(rf'"{re.escape(key)}"\s*:\s*([-+]?\d*\.?\d+)', text)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _extract_string(text: str, key: str) -> Optional[str]:
    # Change start: tolerate missing commas between JSON keys from LLM output.
    # Handles multiline values reasonably well even when model output isn't strict JSON.
    m = re.search(
        rf'"{re.escape(key)}"\s*:\s*"((?:\\.|[^"\\])*)"\s*(?=,?\s*"[A-Za-z0-9_]+"\s*:|\s*}}\s*$)',
        text,
        flags=re.IGNORECASE,
    )
    if not m:
        return None
    return m.group(1).strip().replace('\\"', '"')
    # Change end: tolerate missing commas between JSON keys from LLM output.


def _extract_string_list(text: str, key: str) -> list[str]:
    block = re.search(rf'"{re.escape(key)}"\s*:\s*\[(.*?)\]', text, flags=re.DOTALL)
    if not block:
        return []
    return [s.strip() for s in re.findall(r'"([^"]+)"', block.group(1)) if s.strip()]


def _recover_market_take(text: str) -> dict[str, Any]:
    direction = _extract_string(text, "direction")
    return {
        "mispriced": _extract_bool(text, "mispriced"),
        "direction": direction.lower() if direction else None,
        "confidence": _extract_number(text, "confidence"),
        "summary": _extract_string(text, "summary"),
        "yesNeeds": _extract_string_list(text, "yesNeeds"),
        "noNeeds": _extract_string_list(text, "noNeeds"),
    }


def _recover_daily_brief(text: str) -> dict[str, Any]:
    return {
        "headline": _extract_string(text, "headline"),
        "body": _extract_string(text, "body"),
    }


def _now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def _meta(result: AIResponse) -> dict[str, Any]:
    return {
        "provider": result.provider,
        "fallbackUsed": result.fallback_used,
        "cachedAt": _now_iso(),
    }


# ==============================
# Market take
# ==============================

_MARKET_TAKE_SYSTEM = (
    "You are Velarith, a professional prediction-market analyst. "
    "Evaluate whether a Polymarket contract looks fairly priced given the evidence. "
    "Be concrete, quantitative, and skeptical of hype. "
    "Respond with a single JSON object matching the requested schema — nothing else."
)


def _build_market_take_prompt(detail: dict[str, Any], history: dict[str, Any]) -> str:
    recent_points = history.get("points") or []
    trail = recent_points[-20:]  # last 20 samples keeps the prompt small
    trail_fmt = ", ".join(f"{pt['yes']:.3f}" for pt in trail) or "n/a"
    return (
        f"Market: {detail.get('question')}\n"
        f"Slug: {detail.get('slug')}\n"
        f"Event: {detail.get('eventTitle') or 'n/a'}\n"
        f"End date: {detail.get('endDate') or 'n/a'}\n"
        f"Current YES price: {detail.get('yesPrice'):.3f}\n"
        f"Current NO price: {detail.get('noPrice'):.3f}\n"
        f"24h volume: ${detail.get('volume24h', 0):,.0f}\n"
        f"Liquidity: ${detail.get('liquidity', 0):,.0f}\n"
        f"1h/24h/1w/1m YES change: "
        f"{detail.get('oneHourPriceChange', 0):+.3f} / "
        f"{detail.get('change24h', 0):+.3f} / "
        f"{detail.get('oneWeekPriceChange', 0):+.3f} / "
        f"{detail.get('oneMonthPriceChange', 0):+.3f}\n"
        f"Recent YES trail (oldest→newest): [{trail_fmt}]\n\n"
        f"Description:\n{(detail.get('description') or '').strip()[:1500]}\n\n"
        "Return JSON with exactly these keys:\n"
        "{\n"
        '  "mispriced": boolean,\n'
        '  "direction": "yes" | "no" | "neutral",\n'
        '  "confidence": number between 0 and 1,\n'
        '  "summary": string (2-3 sentences, plain prose),\n'
        '  "yesNeeds": string[] (3-5 concrete conditions that would push YES higher),\n'
        '  "noNeeds": string[] (3-5 concrete conditions that would push NO higher)\n'
        "}"
    )


async def market_take(slug: str) -> dict[str, Any]:
    cached = _take_cache.get(slug)
    if cached is not None:
        return cached

    detail = await get_market(slug)
    try:
        history = await get_history(slug, interval="1w")
    except Exception as e:  # history is nice-to-have, not critical
        logger.warning("history fetch for %s failed: %s", slug, e)
        history = {"points": []}

    prompt = _build_market_take_prompt(detail, history)
    result = await ai_generate(
        prompt,
        system=_MARKET_TAKE_SYSTEM,
        max_tokens=900,
        temperature=0.2,
    )
    parsed = _parse_ai_json(result.text)
    if not isinstance(parsed, dict):
        parsed = _recover_market_take(result.text)

    take = {
        "slug": slug,
        "mispriced": bool(parsed.get("mispriced", False)),
        "direction": str(parsed.get("direction") or "neutral").lower(),
        "confidence": max(0.0, min(1.0, float(parsed.get("confidence") or 0.0))),
        "summary": str(parsed.get("summary") or result.text or "").strip(),
        "yesNeeds": [str(x) for x in (parsed.get("yesNeeds") or []) if x][:5],
        "noNeeds": [str(x) for x in (parsed.get("noNeeds") or []) if x][:5],
        **_meta(result),
    }
    _take_cache[slug] = take
    return take


# ==============================
# Daily brief
# ==============================

_DAILY_BRIEF_SYSTEM = (
    "You are Velarith, a prediction-market editor. Write a concise daily brief "
    "highlighting what's moving on Polymarket and why it matters. "
    "Respond as a single JSON object matching the schema — no prose outside it."
)


def _build_daily_brief_prompt(trending: list[dict], movers: list[dict]) -> str:
    def fmt(rows: list[dict], label: str) -> str:
        lines = [f"{label}:"]
        for row in rows:
            lines.append(
                f"- {row['question']}  "
                f"[yes={row['yesPrice']:.2f}, Δ24h={row['change24h']:+.3f}, "
                f"vol24h=${row['volume24h']:,.0f}]"
            )
        return "\n".join(lines)

    return (
        f"{fmt(trending[:8], 'TOP BY VOLUME')}\n\n"
        f"{fmt(movers[:8], 'TOP MOVERS (|Δ24h|)')}\n\n"
        "Return JSON with exactly these keys:\n"
        "{\n"
        '  "headline": string (≤90 chars, punchy),\n'
        '  "body": string (2-4 short paragraphs, plain markdown, no headings)\n'
        "}"
    )


async def daily_brief() -> dict[str, Any]:
    cached = _brief_cache.get("global")
    if cached is not None:
        return cached

    trending = await get_trending(limit=10)
    movers = await get_movers(limit=10)
    prompt = _build_daily_brief_prompt(trending, movers)

    result = await ai_generate(
        prompt,
        system=_DAILY_BRIEF_SYSTEM,
        max_tokens=900,
        temperature=0.3,
    )
    parsed = _parse_ai_json(result.text)
    if not isinstance(parsed, dict):
        parsed = _recover_daily_brief(result.text)

    brief = {
        "headline": str(parsed.get("headline") or "Today in prediction markets").strip(),
        "body": str(parsed.get("body") or result.text or "").strip(),
        **_meta(result),
    }
    _brief_cache["global"] = brief
    return brief


# ==============================
# Related tickers
# ==============================

_RELATED_TICKERS_SYSTEM = (
    "You extract US-listed stock tickers whose price could reasonably move on the "
    "resolution of a prediction market. Only list tickers with a direct causal link. "
    "Respond as a single JSON object matching the schema — no prose outside it."
)


def _build_related_tickers_prompt(detail: dict[str, Any]) -> str:
    return (
        f"Prediction market: {detail.get('question')}\n"
        f"Event: {detail.get('eventTitle') or 'n/a'}\n\n"
        f"Description:\n{(detail.get('description') or '').strip()[:1500]}\n\n"
        "Return JSON:\n"
        "{\n"
        '  "tickers": [\n'
        '    { "symbol": "TSLA", "relevance": 0.8, "rationale": "one sentence why" }\n'
        "  ]\n"
        "}\n"
        "Rules: 0-5 tickers. US equities only (NYSE/Nasdaq). `symbol` uppercase. "
        "`relevance` between 0 and 1. Skip if no clear link exists (return empty list)."
    )


async def related_tickers(slug: str) -> dict[str, Any]:
    cached = _tickers_cache.get(slug)
    if cached is not None:
        return cached

    detail = await get_market(slug)
    prompt = _build_related_tickers_prompt(detail)
    result = await ai_generate(
        prompt,
        system=_RELATED_TICKERS_SYSTEM,
        max_tokens=400,
        temperature=0.1,
    )
    parsed = _parse_ai_json(result.text) or {}
    raw_list = parsed.get("tickers") if isinstance(parsed, dict) else parsed
    tickers: list[dict[str, Any]] = []
    for row in raw_list or []:
        if not isinstance(row, dict):
            continue
        symbol = str(row.get("symbol") or "").strip().upper()
        if not symbol or not re.fullmatch(r"[A-Z.\-]{1,6}", symbol):
            continue
        tickers.append(
            {
                "symbol": symbol,
                "relevance": max(0.0, min(1.0, float(row.get("relevance") or 0.0))),
                "rationale": str(row.get("rationale") or "").strip() or None,
            }
        )

    payload = {"slug": slug, "tickers": tickers[:5], **_meta(result)}
    _tickers_cache[slug] = payload
    return payload
