"""
analysis.py
------------
Core scoring engine for ticker-level research. Exposes:
- `get_score_breakdown(ticker, mode)` — fused technical + fundamental + sentiment + insider score.

Originally a Flask blueprint; M3 migrated the routes into `backend/routers/research.py`.
Flask is no longer imported here so the backend no longer pulls the Flask/Werkzeug/Jinja
stack at runtime.
"""

import asyncio

from .fundamental.core import get_comprehensive_fundamental_data
from .fundamental.peer_utils import get_peer_context
from .scorer import (
    LONG_TERM_WEIGHTS,
    SHORT_TERM_WEIGHTS,
    normalize_growth,
    safe_number,
    score_consistency,
    weighted_average,
)
from .technical.core import get_technical_summary
from .technical.signal import compute_signal as compute_technical_signal

# Sentiment sources — news + Google Trends. The old MCP-based Polymarket
# sentiment path was deleted in M8 (see .agents/decisions.md 2026-04-21).
try:
    from .sentiment.gtrends import get_google_trends
    from .sentiment.news import get_news_sentiment
    HAS_SENTIMENT = True
except ImportError as e:  # defensive — keep scoring alive if a sub-dep is missing
    print(f"[WARN] Could not import sentiment modules: {e}. Sentiment score will default to 50.")
    HAS_SENTIMENT = False


def _get_historical_trend(_ticker: str, days: int) -> tuple[float, float]:
    """Placeholder insider-trend signal. Returns a neutral 50/50 split until a real
    data source is wired in (see known-issues.md: MockSupabase / insider stub)."""
    _ = days  # reserved for future real lookback logic
    return 0.5, 0.5


async def get_score_breakdown(ticker: str, mode: str) -> dict:
    """Composite score + component breakdown for `ticker` in short|long mode."""
    tech_summary = get_technical_summary(ticker)
    fundamentals = get_comprehensive_fundamental_data(ticker)

    if "error" in tech_summary:
        return tech_summary
    if "error" in fundamentals:
        return fundamentals

    if HAS_SENTIMENT:
        results = await asyncio.gather(
            get_news_sentiment(ticker),
            get_google_trends(ticker),
            return_exceptions=True,
        )
        news_data, trends_data = results
        news_score = news_data.get("score", 50) if not isinstance(news_data, Exception) else 50
        trends_score = trends_data.get("score", 50) if not isinstance(trends_data, Exception) else 50
        sentiment_score = int((news_score + trends_score) / 2)
    else:
        sentiment_score = 50.0

    insider_avg, _ = _get_historical_trend(ticker, days=30)
    insider_score = safe_number(insider_avg, 0.5) * 100

    if mode == "long":
        peer_data = get_peer_context(ticker)
        sector_avg = peer_data.get("peer_averages") if peer_data else {}

        growth = fundamentals.get("revenueGrowth")
        roe = fundamentals.get("returnOnEquity")
        growth_score = normalize_growth(growth, sector_avg.get("revenueGrowth"))
        stability_score = score_consistency([growth, roe])
        fundamental_score = (growth_score * 0.7) + (stability_score * 0.3)

        peer_score = 50.0
        if sector_avg:
            pe = safe_number(fundamentals.get("trailingPE"))
            peer_pe = safe_number(sector_avg.get("trailingPE"))
            if pe > 0 and peer_pe > 0:
                pe_adj = (1.0 - (pe / peer_pe)) * 30
                peer_score += max(-30, min(30, pe_adj))

            roe_val = safe_number(fundamentals.get("returnOnEquity"))
            peer_roe = safe_number(sector_avg.get("returnOnEquity"))
            if peer_roe != 0:
                roe_adj = ((roe_val / peer_roe) - 1.0) * 20
                peer_score += max(-20, min(20, roe_adj))
        peer_score = max(0, min(100, peer_score))

        final_scores = {
            "fundamentals": fundamental_score,
            "peer": peer_score,
            "sentiment": sentiment_score,
            "insider": insider_score,
        }
        final_score = weighted_average(final_scores, LONG_TERM_WEIGHTS)
    else:  # short-term
        tech_signal = compute_technical_signal(tech_summary)
        technical_score = tech_signal.get("score", 50)
        fundamental_score = normalize_growth(fundamentals.get("earningsGrowth"))

        final_scores = {
            "technical": technical_score,
            "sentiment": sentiment_score,
            "fundamentals": fundamental_score,
            "insider": insider_score,
        }
        final_score = weighted_average(final_scores, SHORT_TERM_WEIGHTS)

    return {
        "fundamentals": final_scores.get("fundamentals", 50.0),
        "technical": final_scores.get("technical", 50.0),
        "news": final_scores.get("sentiment", 50.0),
        "insider": final_scores.get("insider", 50.0),
        "finalScore": final_score,
    }
