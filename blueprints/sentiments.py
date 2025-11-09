import asyncio
from flask import Blueprint, jsonify

# Import the logic from sibling files
from .sentiment.news import get_news_sentiment
from .sentiment.gtrends import get_google_trends
from .sentiment.polymarket import get_polymarket_sentiment
from .sentiment.macro import get_macro_sentiment

# Import scorer
from .scorer import weighted_average, safe_number

sent_bp = Blueprint("sentiment", __name__, url_prefix="/sentiment")
macro_bp = Blueprint("macro", __name__, url_prefix="/macro")

SENTIMENT_WEIGHTS = {
    "news": 0.4, "google_trends": 0.2, "polymarket": 0.4,
}

async def gather_all_sentiments(ticker: str):
    """
    Runs all sentiment collectors concurrently.
    Wraps blocking calls in to_thread.
    """
    
    # --- THE FIX ---
    # news.py is ASYNC, so we call it directly
    news_task = get_news_sentiment(ticker)
    gtrends_task = get_google_trends(ticker)
    poly_task = asyncio.to_thread(get_polymarket_sentiment, ticker)
    # --- END OF FIX ---

    results = await asyncio.gather(news_task, gtrends_task, poly_task)
    news_data, gtrends_data, poly_data = results
    
    scores_for_weighting = {
        "news": safe_number(news_data.get("score")),
        "google_trends": safe_number(gtrends_data.get("score")),
        "polymarket": safe_number(poly_data.get("score")),
    }
    
    composite_score = weighted_average(scores_for_weighting, SENTIMENT_WEIGHTS)
    
    return {
        "composite": int(composite_score),
        "sources": {
            "news": news_data,
            "google_trends": gtrends_data,
            "polymarket": poly_data
        }
    }

@sent_bp.route("/<ticker>", methods=["GET"])
def sentiment_route(ticker):
    """Run the async sentiment pipeline."""
    try:
        data = asyncio.run(gather_all_sentiments(ticker.upper()))
        return jsonify(data), 200
    except Exception as e:
        print(f"[ERROR] /sentiment/{ticker} failed: {e}")
        return jsonify({"error": f"Failed to get sentiment for {ticker}: {str(e)}"}), 500

@macro_bp.route("/", methods=["GET"])
def macro_route():
    """Run the async macro pipeline."""
    try:
        # --- THE FIX ---
        # macro.py is now SYNC, so we MUST use to_thread
        data_df = asyncio.run(asyncio.to_thread(get_macro_sentiment))
        # --- END OF FIX ---
        
        payload = data_df.to_dict(orient="records")
        return jsonify(payload), 200
    except Exception as e:
        print(f"[ERROR] /macro failed: {e}")
        return jsonify({"error": f"Failed to get macro data: {str(e)}"}), 500