import os
import httpx 
from textblob import TextBlob
from typing import Dict

# --- Load key from .env ---
FINNHUB_KEY = os.getenv("FINNHUB_API_KEY", "")

async def get_news_sentiment(ticker: str) -> Dict:
    """Analyze recent news sentiment for the ticker."""
    if not FINNHUB_KEY:
        print("[WARN] FINNHUB_API_KEY not set. Skipping news.")
        return {"score": 50, "source": "news", "error": "API key not set"}

    url = f"https://finnhub.io/api/v1/company-news?symbol={ticker}&from=2024-10-01&to=2024-11-01&token={FINNHUB_KEY}"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            resp.raise_for_status() 
            resp_data = resp.json()
    except Exception as e:
        print(f"[ERROR] News fetch failed: {e}")
        return {"score": 50, "source": "news", "error": str(e)}

    if not resp_data:
        return {"score": 50, "source": "news"}

    sentiments = []
    for article in resp_data[:10]: # Get top 10 articles
        score = TextBlob(article.get("headline", "")).sentiment.polarity
        sentiments.append(score)

    avg = (sum(sentiments) / len(sentiments)) if sentiments else 0
    normalized = int((avg + 1) * 50)  # map -1 -> 0, 1 -> 100
    
    return {
        "score": normalized, 
        "source": "news",
        "meta": {
            "total": len(resp_data),
            "analyzed": len(sentiments),
            "avg_polarity": round(avg, 3)
        }
    }