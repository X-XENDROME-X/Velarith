import asyncio
from flask import Blueprint, jsonify
from .sentiment.news import get_news_sentiment

sent_bp = Blueprint("sentiment", __name__, url_prefix="/sentiment")

@sent_bp.route("/<ticker>", methods=["GET"])
def sentiment_route(ticker):
    """
    Run the async news sentiment pipeline and return *only* the counts
    to match the 'NewsSentiment' frontend type.
    """
    try:
        data = asyncio.run(get_news_sentiment(ticker.upper()))
        
        if "error" in data:
            return jsonify(data), 500
        
        sentiment_counts = data.get("meta", {
            "positive": 0,
            "negative": 0,
            "neutral": 0
        })
            
        return jsonify(sentiment_counts), 200
        
    except Exception as e:
        print(f"[ERROR] /sentiment/{ticker} failed: {e}")
        return jsonify({"error": f"Failed to get sentiment for {ticker}: {str(e)}"}), 500