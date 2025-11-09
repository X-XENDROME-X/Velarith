import os
import requests
from datetime import datetime, timedelta
from textblob import TextBlob

async def get_news_sentiment(ticker: str):
    """
    Analyze company news headlines using TextBlob polarity.
    Returns both overall sentiment score and headline-level breakdown.
    """
    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        print("[News Error] FINNHUB_API_KEY missing in .env")
        return {"score": 50, "source": "news", "meta": {"total": 0, "positive": 0, "negative": 0, "neutral": 0}}

    today = datetime.now()
    week_ago = today - timedelta(days=7)
    url = (
        f"https://finnhub.io/api/v1/company-news?"
        f"symbol={ticker}&from={week_ago.date()}&to={today.date()}&token={api_key}"
    )

    resp = requests.get(url).json()

    if not isinstance(resp, list) or len(resp) == 0:
        print(f"[News Info] No articles returned for {ticker}")
        return {"score": 50, "source": "news", "meta": {"total": 0, "positive": 0, "negative": 0, "neutral": 0}}

    sentiments = []
    breakdown = {"positive": 0, "negative": 0, "neutral": 0}

    for article in resp[:20]:  # read up to 20 latest articles
        headline = article.get("headline", "")
        if not headline.strip():
            continue
        polarity = TextBlob(headline).sentiment.polarity
        sentiments.append(polarity)

        if polarity > 0.05:
            breakdown["positive"] += 1
        elif polarity < -0.05:
            breakdown["negative"] += 1
        else:
            breakdown["neutral"] += 1

    if not sentiments:
        return {"score": 50, "source": "news", "meta": {**breakdown, "total": 0}}

    avg = sum(sentiments) / len(sentiments)
    normalized = int((avg + 1) * 50)

    breakdown["total"] = len(sentiments)

    return {
        "score": normalized,
        "source": "news",
        "meta": breakdown
    }
