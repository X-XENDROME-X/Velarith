import os
import requests
import numpy as np
from functools import lru_cache

try:
    from .fundamental_core import get_comprehensive_fundamental_data
except ImportError:
    from fundamental_core import get_comprehensive_fundamental_data

# Get Finnhub API Key from environment variables
FINNHUB_KEY = os.getenv("FINNHUB_API_KEY", None)
FINNHUB_PEERS_URL = "https://finnhub.io/api/v1/stock/peers"

# --- FIX 2: Update keys to match the new function's output ---
# (Changed 'profitMargins' to 'netMargin')
METRICS_TO_AVERAGE = [
    'trailingPE', 'priceToBook', 'returnOnEquity', 'revenueGrowth',
    'earningsGrowth', 'netMargin', 'debtToEquity'
]

@lru_cache(maxsize=32)
def fetch_peers(ticker: str, limit: int = 5):
    """Fetch up to N peer tickers from Finnhub."""
    if not FINNHUB_KEY:
        print("[WARN] FINNHUB_API_KEY not set. Skipping peer fetch.")
        return []
    
    try:
        url = f"{FINNHUB_PEERS_URL}?symbol={ticker}&token={FINNHUB_KEY}"
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        peers = res.json()
        
        if not peers or not isinstance(peers, list):
            return []
            
        peers = [p for p in peers if p != ticker and p] # remove self
        return peers[:limit]
        
    except Exception as e:
        print(f"[WARN] Failed to fetch peers for {ticker}: {e}")
        return []

def compute_peer_averages(peers: list[str]):
    """
    Compute average fundamental metrics across a list of peer tickers.
    """
    metrics = {k: [] for k in METRICS_TO_AVERAGE}
    
    for p in peers:
        # --- FIX 3: Call the new function ---
        fundamentals = get_comprehensive_fundamental_data(p) 
        
        if "error" in fundamentals:
            continue
        
        for key in METRICS_TO_AVERAGE:
            val = fundamentals.get(key)
            if val is not None and isinstance(val, (int, float)) and not np.isnan(val):
                metrics[key].append(val)

    # Calculate the average for each metric
    return {
        key: round(np.mean(values), 3) if values else None
        for key, values in metrics.items()
    }

def get_peer_context(ticker: str, peer_limit: int = 5):
    """
    Main helper: get peers, compute sector averages, return dict.
    """
    peers = fetch_peers(ticker, limit=peer_limit)
    if not peers:
        return None # Return None, not an empty dict

    averages = compute_peer_averages(peers)
    
    return {
        "peers_list": peers,
        "peer_averages": averages
    }

if __name__ == "__main__":
    ticker = "AAPL"
    print(f"Fetching peer context for {ticker}...")
    context = get_peer_context(ticker)
    if context:
        import json
        print(json.dumps(context, indent=2))