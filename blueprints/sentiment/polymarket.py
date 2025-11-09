# blueprints/sentiment/polymarket.py

import pandas as pd
from typing import Dict
from py_clob_client.client import ClobClient
import numpy as np
import os # <-- Import os

def normalize(value: float, min_v: float, max_v: float) -> int:
    if max_v == min_v:
        return 50
    return int(100 * (value - min_v) / (max_v - min_v))

async def get_polymarket_sentiment(keyword: str) -> Dict:
    """
    Fetch Polymarket data (current + historical) and compute:
    - weighted probability
    - liquidity
    - 24h volatility score
    """
    try:
        # FIXED: Initialize ClobClient with the host URL from environment variables
        host = os.getenv("POLYMARKET_API_URL", "https://clob.polymarket.com")
        client = ClobClient(host=host)

        markets = client.get_markets(search=keyword)
        if not markets:
            return {"score": 0, "source": "polymarket"}

        df = pd.DataFrame([{
            "question": m.get("question"),
            "volume": float(m.get("volume", 0)),
            "liquidity": float(m.get("liquidity", 0)),
            "yes_price": float(m.get("best_bid", 0.0)),
            "no_price": float(m.get("best_ask", 0.0))
        } for m in markets])

        # Weighted avg probability
        df["weight"] = df["volume"] / (df["volume"].sum() + 1e-9)
        weighted_prob = (df["yes_price"] * df["weight"]).sum()

        # Liquidity adjustment
        liquidity_factor = normalize(df["liquidity"].mean(), 0, df["liquidity"].max() or 1)

        # Historical volatility (simulate via variation in yes_price across markets)
        volatility = np.std(df["yes_price"]) * 100
        volatility_score = int(min(100, volatility * 5))  # scaled sensitivity

        # Combine everything
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
        return {"score": 0, "source": "polymarket"}