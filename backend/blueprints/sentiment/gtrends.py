from pytrends.request import TrendReq
from typing import Dict

async def get_google_trends(keyword: str) -> Dict:
    """Fetch Google Trends score for last 30 days."""
    try:
        pytrends = TrendReq(hl="en-US", tz=360)
        pytrends.build_payload([keyword], timeframe="today 1-m")
        data = pytrends.interest_over_time()
        if data.empty:
            return {"score": 0, "source": "google_trends"}

        avg_interest = data[keyword].mean()
        score = int(min(100, avg_interest))
        return {"score": score, "source": "google_trends"}
    except Exception:
        return {"score": 0, "source": "google_trends"}
