from flask import Blueprint, jsonify
import asyncio

# import local submodules
from blueprints.sentiment.news import get_news_sentiment
from blueprints.sentiment.gtrends import get_google_trends
from blueprints.sentiment.polymarket import get_ai_polymarket_sentiment

sentiment_bp = Blueprint("sentiment", __name__)

async def gather_all_sentiments(ticker: str):
    """Aggregate sentiment from news, trends, and polymarket."""
    news_task = get_news_sentiment(ticker)
    trends_task = get_google_trends(ticker)
    poly_task = get_ai_polymarket_sentiment(ticker)

    news_score, trends_score, poly_score = await asyncio.gather(
        news_task, trends_task, poly_task
    )

    combined = {
        "ticker": ticker.upper(),
        "sources": {
            "news": news_score,
            "google_trends": trends_score,
            "polymarket": poly_score,
        },
        "composite": int(
            (news_score["score"] + trends_score["score"] + poly_score["score"]) / 3
        ),
    }
    return combined


@sentiment_bp.route("/sentiment/<ticker>", methods=["GET"])
def sentiment_route(ticker):
    """Unified endpoint: /sentiment/<ticker>"""
    data = asyncio.run(gather_all_sentiments(ticker))
    return jsonify(data)
