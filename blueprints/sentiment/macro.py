import pandas as pd
from py_clob_client.client import ClobClient

MACRO_KEYWORDS = [
    "Federal Reserve", "interest rates", "inflation", "recession",
    "government shutdown", "debt ceiling", "CPI", "election",
    "unemployment", "Fed"
]

# --- THE FIX: This is now a regular 'def' function ---
def get_macro_sentiment() -> pd.DataFrame:
    """
    Collect Polymarket sentiment across key macro topics.
    This is a SYNCHRONOUS (blocking) function.
    """
    client = ClobClient(host="https://clob.polymarket.com") 
    records = []

    for kw in MACRO_KEYWORDS:
        try:
            markets_response = client.get_markets()
            
            if not isinstance(markets_response, dict) or "data" not in markets_response:
                print(f"[Macro fetch warning] Unexpected response")
                continue
                
            all_markets = markets_response["data"]
            
            markets = [
                m for m in all_markets 
                if kw.lower() in m.get("question", "").lower()
            ]

            if not markets:
                continue

            df = pd.DataFrame([{
                "keyword": kw,
                "question": m.get("question"),
                "volume": float(m.get("volume", 0)),
                "yes_price": float(m.get("best_bid", 0.0))
            } for m in markets])

            score = int(df["yes_price"].mean() * 100)
            volume = df["volume"].sum()

            records.append({
                "keyword": kw, "score": score,
                "total_volume": round(volume, 2), "market_count": len(df)
            })

        except Exception as e:
            print(f"[Macro fetch error] {kw}: {e}")
            continue

    return pd.DataFrame(records)