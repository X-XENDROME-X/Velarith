"""
analysis.py
------------
Provides two endpoints for the frontend:
1. /ai/<ticker>: Returns the full AI analysis (for AIAnalysisView)
2. /score/<ticker>: Returns just the score breakdown (for ScoreIndicatorsView)
"""

import asyncio
import math
import json
from datetime import datetime
from flask import Blueprint, request, jsonify

# --- AI & Prompt Imports ---
from .ai_summary import get_claude_analysis, HAS_CLAUDE
from .prompt_builder import build_prompt

# --- Scorer Imports ---
from .scorer import (
    weighted_average,
    SHORT_TERM_WEIGHTS,
    LONG_TERM_WEIGHTS,
    normalize_growth,
    score_consistency,
    safe_number
)

# --- Data Fetcher Imports ---
from .fundamental.core import get_comprehensive_fundamental_data
from .fundamental.peer_utils import get_peer_context
from .technical.core import get_technical_summary
from .technical.signal import compute_signal as compute_technical_signal

# --- Sentiment (for scoring) ---
# Assuming you have sentiment functions in these files
try:
    from .sentiment.news import get_news_sentiment
    from .sentiment.gtrends import get_google_trends
    from .sentiment.polymarket import get_ai_polymarket_sentiment
    HAS_SENTIMENT = True
except ImportError as e:
    print(f"[WARN] Could not import sentiment modules: {e}. Sentiment score will be 50.")
    HAS_SENTIMENT = False
    
# --- Mocks (as in your file) ---
class MockSupabase:
    def table(self, name): return self
    def insert(self, data): return self
    def execute(self): print("[MOCK DB] Analysis saved.")
supabase = MockSupabase()

def get_historical_trend(ticker: str, days: int):
    return 0.5, 0.5 

an_bp = Blueprint("analysis", __name__, url_prefix="/analysis")

# ==================================================
# NEW HELPER 1: Core Score Calculation Logic
# This combines your 'analyze_long_term' and 'analyze_short_term' logic
# into one reusable async function.
# ==================================================
async def get_score_breakdown(ticker: str, mode: str):
    """
    Calculates and returns the score breakdown for a given mode.
    This is the new engine for scoring.
    """
    
    # --- 1. Fetch Synchronous Data for Scoring ---
    tech_summary = get_technical_summary(ticker)
    fundamentals = get_comprehensive_fundamental_data(ticker)
    
    if "error" in tech_summary: return tech_summary
    if "error" in fundamentals: return fundamentals

    # --- 2. Gather Asynchronous Sentiment Data Concurrently ---
    if HAS_SENTIMENT:
        # Use asyncio.gather to run all awaitable sentiment functions in parallel
        results = await asyncio.gather(
            get_news_sentiment(ticker),
            get_google_trends(ticker),
            get_ai_polymarket_sentiment(ticker),
            return_exceptions=True # Prevents one failure from crashing all
        )
        news_data, trends_data, poly_data = results
        
        # Safely extract scores, defaulting to 50 on error
        news_score = news_data.get("score", 50) if not isinstance(news_data, Exception) else 50
        trends_score = trends_data.get("score", 50) if not isinstance(trends_data, Exception) else 50
        poly_score = poly_data.get("score", 50) if not isinstance(poly_data, Exception) else 50
        
        sentiment_score = int((news_score + trends_score + poly_score) / 3)
    else:
        sentiment_score = 50.0

    # --- 3. Insider Score ---
    insider_avg, _ = get_historical_trend(ticker, days=30)
    insider_score = safe_number(insider_avg, 0.5) * 100

    # --- 4. Calculate Scores based on Mode ---
    if mode == "long":
        peer_data = get_peer_context(ticker)
        sector_avg = peer_data.get("peer_averages") if peer_data else {}
        
        growth = fundamentals.get("revenueGrowth")
        roe = fundamentals.get("returnOnEquity")
        growth_score = normalize_growth(growth, sector_avg.get("revenueGrowth"))
        stability_score = score_consistency([growth, roe])
        fundamental_score = (growth_score * 0.7) + (stability_score * 0.3)

        # Using your well-defined peer scoring logic
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
        
    else: # Short term
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

    # --- 5. Format for 'ScoreBreakdown' frontend type ---
    # This structure exactly matches what your frontend expects
    return {
        "fundamentals": final_scores.get("fundamentals", 50.0),
        "technical": final_scores.get("technical", 50.0),
        "news": final_scores.get("sentiment", 50.0), # Map sentiment -> news key
        "insider": final_scores.get("insider", 50.0),
        "finalScore": final_score
    }


# ==================================================
# NEW HELPER 2: Parse AI Summary Markdown
# ==================================================
def parse_ai_summary_to_json(json_string: str) -> dict:
    """
    Parses Claude's JSON string response into a dict that matches the frontend type.
    """
    try:
        # Clean the string (in case Claude adds ```json or markdown fences)
        if json_string.startswith("```json"):
            json_string = json_string[7:].strip("` \n")
        elif json_string.startswith("```"):
             json_string = json_string[3:].strip("` \n")
        if json_string.endswith("```"):
            json_string = json_string[:-3].strip()
        
        data = json.loads(json_string)
        
        # Standardize keys to match the frontend 'AIAnalysis' type
        return {
            "recommendation": data.get("recommendation", "HOLD").upper(),
            "summary": data.get("summary", "N/A"),
            "strengths": data.get("strengths", []),
            "weaknesses": data.get("weaknesses", []),
            "fundamentalAnalysis": data.get("fundamentalAnalysis", "N/A"),
            "technicalAnalysis": data.get("technicalAnalysis", "N/A")
        }
    except Exception as e:
        print(f"[ERROR] Failed to parse AI JSON: {e}")
        print(f"[ERROR] Raw Claude output: {json_string}")
        return {"error": f"Failed to parse AI summary: {e}"}

# ==================================================
# NEW ROUTE 1: Get Score Breakdown (for Score & Indicators tab)
# ==================================================
@an_bp.route("/score/<ticker>", methods=["GET"])
async def score_route(ticker):
    mode = request.args.get("mode", "long").lower()
    try:
        # Await the new async helper function
        score_data = await get_score_breakdown(ticker.upper(), mode)
        if "error" in score_data:
            return jsonify(score_data), 400
        return jsonify(score_data), 200
    except Exception as e:
        print(f"[ERROR] /score/{ticker} failed: {e}")
        return jsonify({"error": "Failed to calculate score", "details": str(e)}), 500

# ==================================================
# NEW ROUTE 2: Get AI Analysis (for AI Summary tab)
# ==================================================
@an_bp.route("/ai/<ticker>", methods=["GET"])
async def ai_analysis_route(ticker):
    mode = request.args.get("mode", "long").lower()
    ticker = ticker.upper()
    
    user_context = {
        "age": request.args.get('age'),
        "risk_profile": request.args.get('risk_profile')
    }

    try:
        # 1. We need all data for the prompt
        score_breakdown = await get_score_breakdown(ticker, mode)
        fundamentals = get_comprehensive_fundamental_data(ticker)
        tech_summary = get_technical_summary(ticker)
        peer_data = get_peer_context(ticker)
        
        # Error check all data sources
        if "error" in score_breakdown: return jsonify(score_breakdown), 400
        if "error" in fundamentals: return jsonify(fundamentals), 400
        if "error" in tech_summary: return jsonify(tech_summary), 400

        # 2. Build the detailed prompt for the AI
        prompt = build_prompt(
            ticker=ticker,
            mode=mode,
            final_scores=score_breakdown,
            fundamentals=fundamentals,
            tech_summary=tech_summary,
            user_context=user_context,
            peer_data=peer_data if "error" not in peer_data else None
        )
        
        # 3. Get the AI summary (this is a synchronous function call)
        ai_summary_markdown = get_claude_analysis(prompt)
        
        # 4. Parse the Markdown into the structured 'AIAnalysis' object
        ai_analysis_object = parse_ai_summary_to_json(ai_summary_markdown)
        if "error" in ai_analysis_object:
            return jsonify(ai_analysis_object), 500

        return jsonify(ai_analysis_object), 200
        
    except Exception as e:
        print(f"[ERROR] /ai/{ticker} failed: {e}")
        return jsonify({"error": "AI Analysis failed", "details": str(e)}), 500