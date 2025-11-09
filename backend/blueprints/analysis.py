"""
analysis.py
------------
Combines fundamentals, technicals, sentiment, and peer data
to produce a composite stock analysis score.

This is the main orchestration file for the API.
"""

import asyncio
import math
import ta
from datetime import datetime
from flask import Blueprint, request, jsonify
from .ai_summary import get_claude_analysis, HAS_CLAUDE
from .prompt_builder import build_prompt

# Import the scorer (from its sibling file 'scorer.py')
from .scorer import (
    weighted_average,
    SHORT_TERM_WEIGHTS,
    LONG_TERM_WEIGHTS,
    normalize_growth,
    score_volatility,
    score_consistency,
    safe_number
)

# Import data fetchers (from sibling folders)
from .fundamental.core import get_comprehensive_fundamental_data
from .fundamental.peer_utils import get_peer_context
from .technical.core import get_technical_summary, fetch_price_data
from .technical.signal import compute_signal as compute_technical_signal

# Import the main sentiment pipeline
try:
    from blueprints.sentiments import gather_all_sentiments
    HAS_SENTIMENT = True
except ImportError:
    print("[WARN] Could not import sentiment module. Sentiment score will be 50.")
    HAS_SENTIMENT = False
    
# --- 2. Mock Placeholders (as seen in your template) ---

# Mock Supabase client so the app doesn't crash
class MockSupabase:
    def table(self, name): return self
    def insert(self, data): return self
    def execute(self): print("[MOCK DB] Analysis saved.")
supabase = MockSupabase()

# Mock Insider Trading (as a placeholder)
def get_historical_trend(ticker: str, days: int):
    """Mock function for insider trading data."""
    print(f"[MOCK Insider] Fetching trend for {ticker} over {days} days.")
    # Returns (average_sentiment, raw_score)
    return 0.5, 0.5 

# --- End of Mocks ---

# Create the blueprint
an_bp = Blueprint("analysis", __name__, url_prefix="/analysis")

# ==================================================
# Helper: blue chip identifier
# ==================================================
def is_blue_chip(market_cap):
    try:
        return market_cap and market_cap >= 50_000_000_000
    except Exception:
        return False

# ==================================================
# Core Long-Term Pipeline
# ==================================================
def analyze_long_term(ticker: str, user_context: dict = None):
    
    # --- 1. Fetch Data ---
    fundamentals = get_comprehensive_fundamental_data(ticker)
    if "error" in fundamentals:
        return fundamentals # Pass the error up
        
    peer_data = get_peer_context(ticker)
    sector_avg = peer_data.get("peer_averages") if peer_data else {}
    
    # --- 2. Score Components (using scorer.py) ---
    
    # Fundamental Score: A mix of growth and stability
    growth = fundamentals.get("revenueGrowth")
    roe = fundamentals.get("returnOnEquity")
    growth_score = normalize_growth(growth, sector_avg.get("revenueGrowth"))
    stability_score = score_consistency([growth, roe])
    fundamental_score = (growth_score * 0.7) + (stability_score * 0.3)

    # Peer Score: How does it stack up on key ratios?
    peer_score = 50.0 # Start at average
    if sector_avg:
        
        # 1. P/E Score (Lower is better)
        pe = safe_number(fundamentals.get("trailingPE"))
        peer_pe = safe_number(sector_avg.get("trailingPE"))
        
        if pe > 0 and peer_pe > 0:
            # (pe / peer_pe) ratio. 1.0 = same. 0.5 = 2x better. 2.0 = 2x worse.
            pe_ratio = pe / peer_pe
            # (1.0 - pe_ratio) gives a +/- adjustment.
            # (1.0 - 0.5) = +0.5 (good). (1.0 - 2.0) = -1.0 (bad).
            # We will scale this adjustment by 30 points
            pe_adj = (1.0 - pe_ratio) * 30
            # Clip adjustment to be max +/- 30 points
            peer_score += max(-30, min(30, pe_adj))

        # 2. ROE Score (Higher is better)
        roe = safe_number(fundamentals.get("returnOnEquity"))
        peer_roe = safe_number(sector_avg.get("returnOnEquity"))
        
        if peer_roe != 0: # Avoid divide by zero
            # (roe / peer_roe) ratio. 1.0 = same. 2.0 = 2x better. 0.5 = 2x worse.
            roe_ratio = roe / peer_roe
            # (roe_ratio - 1.0) gives a +/- adjustment.
            # (2.0 - 1.0) = +1.0 (good). (0.5 - 1.0) = -0.5 (bad).
            # We will scale this adjustment by 20 points
            roe_adj = (roe_ratio - 1.0) * 20
            # Clip adjustment to be max +/- 20 points
            peer_score += max(-20, min(20, roe_adj))
            
    # Final score, clipped between 0 and 100
    peer_score = max(0, min(100, peer_score))

    # Sentiment Score: (Long-term view)
    if HAS_SENTIMENT:
        sentiment_data = asyncio.run(gather_all_sentiments(ticker))
        sentiment_score = sentiment_data.get("composite", 50)
    else:
        sentiment_score = 50.0

    # Insider Score: (Long-term view)
    insider_avg, _ = get_historical_trend(ticker, days=90)
    insider_score = safe_number(insider_avg, 0.5) * 100

    # --- 3. Combine and Weight ---
    final_scores = {
        "fundamentals": fundamental_score,
        "peer": peer_score,
        "sentiment": sentiment_score,
        "insider": insider_score,
    }

    final_score = weighted_average(final_scores, LONG_TERM_WEIGHTS)
    
    payload = {
        "mode": "long",
        "ticker": ticker,
        "score": final_score,
        "breakdown": final_scores,
        "is_blue_chip": is_blue_chip(fundamentals.get("marketCap")),
        "peer_context": peer_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if user_context and HAS_CLAUDE:
        print(f"[AI] Building LONG-TERM prompt for {ticker}...")
        prompt = build_prompt(
            ticker=ticker,
            mode="long",
            final_scores={**payload['breakdown'], "score": payload['score']},
            fundamentals=fundamentals,
            tech_summary=None, # No tech summary in long-term
            user_context=user_context,
            peer_data=peer_data
        )
        payload["ai_summary"] = get_claude_analysis(prompt)
    # === END OF AI SUMMARY STEP ===

    return payload

# ==================================================
# Core Short-Term Pipeline
# ==================================================
def analyze_short_term(ticker: str, user_context: dict = None):

    # --- 1. Fetch Data ---
    tech_summary = get_technical_summary(ticker, period="3mo")
    if "error" in tech_summary:
        return tech_summary # Pass the error up
    
    fundamentals = get_comprehensive_fundamental_data(ticker)

    # --- 2. Score Components (using scorer.py) ---
    
    # Technical Score: Use your dedicated signal generator
    tech_signal = compute_technical_signal(tech_summary)
    technical_score = tech_signal.get("score", 50) # This is already 0-100

    # Sentiment Score: (Short-term view)
    if HAS_SENTIMENT:
        sentiment_data = asyncio.run(gather_all_sentiments(ticker))
        sentiment_score = sentiment_data.get("composite", 50)
    else:
        sentiment_score = 50.0

    # Insider Score: (Short-term view)
    insider_avg, _ = get_historical_trend(ticker, days=30)
    insider_score = safe_number(insider_avg, 0.5) * 100

    # Fundamental Score: For short-term, we only care about earnings momentum
    fundamental_score = 50.0
    if "error" not in fundamentals:
        fundamental_score = normalize_growth(fundamentals.get("earningsGrowth"))

    # --- 3. Combine and Weight ---
    final_scores = {
        "technical": technical_score,
        "sentiment": sentiment_score,
        "fundamentals": fundamental_score,
        "insider": insider_score,
    }

    final_score = weighted_average(final_scores, SHORT_TERM_WEIGHTS)
    
    payload = {
        "mode": "short",
        "ticker": ticker,
        "score": final_score,
        "breakdown": final_scores,
        "momentum": tech_summary.get("momentum", "neutral"), 
        "timestamp": datetime.utcnow().isoformat()
    }
    if user_context and HAS_CLAUDE:
        print(f"[AI] Building SHORT-TERM prompt for {ticker}...")
        prompt = build_prompt(
            ticker=ticker,
            mode="short",
            final_scores={**payload['breakdown'], "score": payload['score']},
            fundamentals=fundamentals if "error" not in fundamentals else None,
            tech_summary=tech_summary,
            user_context=user_context,
            peer_data=None
        )
        payload["ai_summary"] = get_claude_analysis(prompt)
    # === END OF AI SUMMARY STEP ===
    
    return payload

# ==================================================
# Save to Supabase (from your template)
# ==================================================
def sanitize_breakdown(breakdown):
    return {
        k: 0 if (v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v)))) else float(v)
        for k, v in breakdown.items()
    }

def save_analysis_to_db(ticker, mode, score, breakdown):
    try:
        breakdown = sanitize_breakdown(breakdown)
        supabase.table("analysis_history").insert({
            "ticker": ticker,
            "mode": mode,
            "score": float(score),
            "breakdown": breakdown,
            "recorded_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"[WARN] Failed to save analysis: {e}")


# ==================================================
# Flask Route
# ==================================================
@an_bp.route("/<ticker>", methods=["GET"])
def analyze_ticker(ticker):
    mode = request.args.get("mode", "short").lower()
    ticker = ticker.upper()
    
    # Check if we should generate an AI summary
    should_summarize = request.args.get('summarize', 'false').lower() == 'true'
    user_context = None
    
    if should_summarize:
        user_context = {
            "age": request.args.get('age'),
            "risk": request.args.get('risk_profile')
        }
    try:
        if mode == "long":
            result = analyze_long_term(ticker, user_context=user_context)
        else:
            result = analyze_short_term(ticker, user_context=user_context)
            
        if "error" in result:
            return jsonify(result), 400
            
        save_analysis_to_db(ticker, result["mode"], result["score"], result["breakdown"])
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[ERROR] Analysis failed for {ticker}: {e}")
        return jsonify({"error": "Analysis failed", "details": str(e)}), 500