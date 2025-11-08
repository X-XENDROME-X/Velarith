import pandas as pd
from py_clob_client.client import ClobClient

# Predefined macro topics to monitor
MACRO_KEYWORDS = [
    "Federal Reserve",
    "interest rates",
    "inflation",
    "recession",
    "government shutdown",
    "debt ceiling",
    "CPI",
    "election",
    "unemployment",
    "Fed"
]

async def get_macro_sentiment() -> pd.DataFrame:
    """
    Collect Polymarket sentiment across key macro topics.
    Useful for AI context injection or macro correlation studies.
    """
    client = ClobClient()
    records = []

    for kw in MACRO_KEYWORDS:
        try:
            markets = client.get_markets(search=kw)
            if not markets:
                continue

            df = pd.DataFrame([{
                "keyword": kw,
                "question": m.get("question"),
                "volume": float(m.get("volume", 0)),
                "yes_price": float(m.get("best_bid", 0.0))
            } for m in markets])

            # Compute sentiment score (simple yes_price scaled to 100)
            score = int(df["yes_price"].mean() * 100)
            volume = df["volume"].sum()

            records.append({
                "keyword": kw,
                "score": score,
                "total_volume": round(volume, 2),
                "market_count": len(df)
            })

        except Exception as e:
            print(f"[Macro fetch error] {kw}: {e}")
            continue

    return pd.DataFrame(records)
