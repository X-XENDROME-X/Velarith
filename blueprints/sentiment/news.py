import requests
from textblob import TextBlob
from typing import Dict

async def get_news_sentiment(ticker: str) -> Dict:
    """Analyze recent news sentiment for the ticker."""
    url = f"https://finnhub.io/api/v1/company-news?symbol={ticker}&from=2024-10-01&to=2024-11-01&token=YOUR_KEY"
    resp = requests.get(url).json()

    if not resp:
        return {"score": 50, "source": "news"}

    sentiments = []
    for article in resp[:10]:
        score = TextBlob(article.get("headline", "")).sentiment.polarity
        sentiments.append(score)

    avg = (sum(sentiments) / len(sentiments)) if sentiments else 0
    normalized = int((avg + 1) * 50)  # map -1→0, 1→100
    return {"score": normalized, "source": "news"}
