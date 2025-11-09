import yfinance as yf
from functools import lru_cache

# ----------------------------------------------------------
# Data Access Layer
# ----------------------------------------------------------

@lru_cache(maxsize=128) # Cache results to avoid re-fetching
def fetch_fundamental_data(ticker: str):
    """
    Fetches the complete 'info' dictionary from yfinance for a ticker.
    This dictionary contains all fundamental data.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # yfinance can return an empty dict or a dict with an error
        if not info or info.get('trailingEps', None) is None:
            # 'trailingEps' is a good proxy to see if we got real data
            return {"error": f"No fundamental data found for {ticker}."}
            
        return info
    except Exception as e:
        print(f"[ERROR] Fetching fundamentals for {ticker}: {e}")
        return {"error": f"API error fetching data for {ticker}: {str(e)}"}

# ----------------------------------------------------------
# Core Computation Layer
# ----------------------------------------------------------

# Define the exact metrics we want to expose to the frontend.
# This keeps our API clean and protects against yfinance changing
# a key's name and breaking the frontend.
KEYS_TO_EXTRACT = [
    # Company Info
    'longName', 'sector', 'industry', 'country', 'website', 'longBusinessSummary',
    
    # Key Valuation Ratios (from your screenshot)
    'marketCap', 'trailingPE', 'forwardPE', 'priceToBook',
    
    # Growth (from your screenshot)
    'revenueGrowth', 'earningsGrowth', 
    
    # Profitability
    'profitMargins', 'returnOnEquity', 'returnOnAssets',
    
    # Financial Health
    'debtToEquity', 'currentRatio', 'quickRatio',
    
    # Dividends & Stock Info
    'dividendYield', 'payoutRatio', 'sharesOutstanding',
    'beta', '52WeekChange'
]

def get_fundamental_summary(ticker: str):
    """
    Fetches raw fundamental data and distills it into a clean, 
    frontend-ready dictionary.
    """
    raw_data = fetch_fundamental_data(ticker)
    
    if "error" in raw_data:
        return raw_data
        
    summary = {"ticker": ticker.upper()}
    
    for key in KEYS_TO_EXTRACT:
        # Use .get() to safely handle missing keys (returns None)
        summary[key] = raw_data.get(key, None)

    # Clean up data types that might not be JSON serializable
    # (e.g., numpy types)
    for key, value in summary.items():
        if isinstance(value, (int, float, str, bool)) or value is None:
            continue
        summary[key] = str(value) # Fallback to string

    return summary

if __name__ == "__main__":
    # Test the core module
    summary = get_fundamental_summary("AAPL")
    import json
    print(json.dumps(summary, indent=2))
    
    summary_err = get_fundamental_summary("ASDFQWER")
    print(summary_err)