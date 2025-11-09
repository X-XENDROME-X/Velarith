import pandas as pd
from typing import Dict
from py_clob_client.client import ClobClient
import numpy as np

# ... (Your ClobClient setup and other functions are fine) ...
# ... (Make sure your ClobClient is initialized with the Private Key) ...
# ... (This file should NOT have the 'get_ai_polymarket_sentiment' function,
#     this file should only contain the logic from your earlier 'polymarket.py')

def normalize(value: float, min_v: float, max_v: float) -> int:
    if max_v == min_v: return 50
    return int(100 * (value - min_v) / (max_v - min_v))

# --- THE FIX: This is now a regular 'def' function ---
def get_polymarket_sentiment(keyword: str) -> Dict:
    """
    Fetch Polymarket data and compute a sentiment score.
    """
    try:
        # This is a synchronous call
        client = ClobClient(host="https://clob.polymarket.com")
        markets_response = client.get_markets()

        if not isinstance(markets_response, dict) or "data" not in markets_response:
            return {"score": 50, "source": "polymarket", "reason": "Invalid API response"}
        
        all_markets = markets_response["data"]
        
        markets = [
            m for m in all_markets 
            if keyword.lower() in m.get("question", "").lower()
        ]

        if not markets:
            return {"score": 50, "source": "polymarket", "reason": f"No markets found for {keyword}"}

        df = pd.DataFrame([{
            "question": m.get("question"),
            "volume": float(m.get("volume", 0)),
            "liquidity": float(m.get("liquidity", 0)),
            "yes_price": float(m.get("best_bid", 0.0)),
            "no_price": float(m.get("best_ask", 0.0))
        } for m in markets])

        df["weight"] = df["volume"] / (df["volume"].sum() + 1e-9)
        weighted_prob = (df["yes_price"] * df["weight"]).sum()
        liquidity_factor = normalize(df["liquidity"].mean(), 0, df["liquidity"].max() or 1)
        volatility = np.std(df["yes_price"]) * 100
        volatility_score = int(min(100, volatility * 5))

        final_score = int(
            min(100, (weighted_prob * 100 * 0.6) + (liquidity_factor * 0.3) + (volatility_score * 0.1))
        )

        return {
            "score": final_score,
            "weighted_probability": round(weighted_prob, 3),
            "avg_liquidity": round(df["liquidity"].mean(), 2),
            "volatility_score": volatility_score,
            "source": "polymarket"
        }

    except Exception as e:
        print(f"[Polymarket Error] {e}")
        return {"score": 50, "source": "polymarket", "error": str(e)}