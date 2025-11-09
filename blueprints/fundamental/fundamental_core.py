from flask import Blueprint, request, jsonify
import yfinance as yf
import pandas as pd
from functools import lru_cache

# =========================
# Core Data Fetcher
# =========================
@lru_cache(maxsize=128) # Keep the cache
def get_comprehensive_fundamental_data(ticker: str) -> dict:
    """
    Fetch and compute a wide range of fundamental and context-aware
    data for a single ticker.
    """
    try:
        tkr = yf.Ticker(ticker)
        
        # --- Fetch core data objects ---
        info = tkr.info or {}
        
        # Check for valid data
        if not info or info.get('trailingEps', None) is None:
            return {"error": f"No fundamental data found for {ticker}."}
            
        hist_1y = tkr.history(period="1y")

        # --- Price + Identification ---
        price = info.get("currentPrice") or info.get("regularMarketPrice")
        sector = info.get("sector")
        industry = info.get("industry")
        summary = info.get("longBusinessSummary")

        # --- Valuation ---
        pe = info.get("trailingPE")
        fpe = info.get("forwardPE")
        pb = info.get("priceToBook")
        peg = info.get("pegRatio")
        div_yield = info.get("dividendYield")
        market_cap = info.get("marketCap")
        ps = info.get("priceToSalesTrailing12Months")
        ev_ebitda = info.get("enterpriseToEbitda")

        # --- Profitability & Efficiency ---
        roe = info.get("returnOnEquity")
        op_margin = info.get("operatingMargins")
        net_margin = info.get("profitMargins") # Use 'profitMargins' for net

        # --- Debt & Liquidity ---
        debt_eq = info.get("debtToEquity")
        current_ratio = info.get("currentRatio")
        quick_ratio = info.get("quickRatio")

        # --- Growth ---
        earnings_g = info.get("earningsGrowth")
        revenue_g = info.get("revenueGrowth")
        fcf = info.get("freeCashflow")

        # --- Technical Context (from 1y history) ---
        low52 = float(hist_1y["Low"].min())
        high52 = float(hist_1y["High"].max())
        
        # --- Earnings calendar ---
        calendar = info.get("nextEarningsDate") # yfinance changed this key

        return {
            "ticker": ticker.upper(),
            "longName": info.get("longName"),
            "sector": sector or "Unknown",
            "industry": industry or "Unknown",
            "longBusinessSummary": summary,
            "website": info.get("website"),
            "country": info.get("country"),
            
            "currentPrice": round(price, 2) if price else None,
            "marketCap": market_cap,
            "beta": info.get("beta"),
            
            # Valuation
            "trailingPE": pe,
            "forwardPE": fpe,
            "priceToBook": pb,
            "pegRatio": peg,
            "priceToSales": ps,
            "enterpriseToEbitda": ev_ebitda,
            "dividendYield": div_yield,

            # Profitability
            "returnOnEquity": roe,
            "operatingMargin": op_margin,
            "netMargin": net_margin,

            # Health
            "debtToEquity": debt_eq,
            "currentRatio": current_ratio,
            "quickRatio": quick_ratio,

            # Growth
            "earningsGrowth": earnings_g,
            "revenueGrowth": revenue_g,
            "freeCashFlow": fcf,

            # Context
            "low52Week": round(low52, 2),
            "high52Week": round(high52, 2),
            "nextEarningsDate": str(calendar) if calendar else None,
        }

    except Exception as e:
        print(f"[ERROR] fundamentals fetch failed for {ticker}: {e}")
        return {"error": f"Failed to fetch fundamental data: {str(e)}"}