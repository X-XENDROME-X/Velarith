from matplotlib import ticker
import yfinance as yf
import pandas as pd
import numpy as np
import ta
from scipy.signal import argrelextrema

def fetch_price_data(ticker, period="6mo", interval="1d"):
    """Fetch OHLCV data safely from Yahoo Finance."""
    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)  # flatten multi-index
        df.dropna(inplace=True)
        return df
    except Exception as e:
        print(f"[ERROR] Failed to fetch data for {ticker}: {e}")
        return pd.DataFrame()

def compute_indicators(df: pd.DataFrame):
    """Compute core technical indicators."""
    # --- Ensure all columns are 1D Series ---
    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.squeeze()  # flatten (N,1) → (N,)

    high = df["High"].squeeze() if "High" in df else close
    low = df["Low"].squeeze() if "Low" in df else close
    volume = df["Volume"].squeeze() if "Volume" in df else None

    # --- Core Indicators ---
    df["RSI"] = ta.momentum.RSIIndicator(close, 14).rsi()
    df["EMA20"] = ta.trend.EMAIndicator(close, 20).ema_indicator()
    df["EMA50"] = ta.trend.EMAIndicator(close, 50).ema_indicator()
    df["EMA200"] = ta.trend.EMAIndicator(close, 200).ema_indicator()
    df["ADX"] = ta.trend.ADXIndicator(high, low, close, 14).adx()
    df["ATR"] = ta.volatility.AverageTrueRange(high, low, close, 14).average_true_range()

    bb = ta.volatility.BollingerBands(close, 20, 2)
    df["BB_H"], df["BB_L"], df["BB_%"] = bb.bollinger_hband(), bb.bollinger_lband(), bb.bollinger_pband()

    if volume is not None:
        df["OBV"] = ta.volume.OnBalanceVolumeIndicator(close, volume).on_balance_volume()
    else:
        df["OBV"] = np.nan

    return df


def find_support_resistance(df, order=10):
    """Approximate support and resistance levels using local extrema."""
    close = df["Close"]
    max_idx = argrelextrema(close.values, np.greater, order=order)[0]
    min_idx = argrelextrema(close.values, np.less, order=order)[0]
    support = float(close.iloc[min_idx[-1]]) if len(min_idx) else None
    resistance = float(close.iloc[max_idx[-1]]) if len(max_idx) else None
    return support, resistance

def get_technical_summary(ticker, period="6mo", interval="1d"):
    """Return a JSON-safe technical summary dict for AI or frontend."""
    df = fetch_price_data(ticker, period, interval)
    if df.empty:
        return {"error": f"No data for {ticker}"}

    df = compute_indicators(df)
    support, resistance = find_support_resistance(df)
    last = df.iloc[-1]

    summary = {
        "ticker": ticker.upper(),
        "close": round(float(last["Close"]), 2),
        "volume": int(last["Volume"]),
        "rsi": round(float(last["RSI"]), 2),
        "ema20": round(float(last["EMA20"]), 2),
        "ema50": round(float(last["EMA50"]), 2),
        "ema200": round(float(last["EMA200"]), 2),
        "adx": round(float(last["ADX"]), 2),
        "atr": round(float(last["ATR"]), 2),
        "bb_high": round(float(last["BB_H"]), 2),
        "bb_low": round(float(last["BB_L"]), 2),
        "bb_percent": round(float(last["BB_%"]), 2),
        "obv": round(float(last["OBV"]), 2),
        "support": support,
        "resistance": resistance,
        "data_points": len(df)
    }

    # Derived zones
    summary["momentum"] = "bullish" if summary["ema20"] > summary["ema50"] else "bearish"
    summary["trend_strength"] = "strong" if summary["adx"] >= 25 else "weak"
    summary["zone"] = (
        "overbought" if summary["rsi"] >= 70
        else "oversold" if summary["rsi"] <= 30
        else "neutral"
    )

    return summary
