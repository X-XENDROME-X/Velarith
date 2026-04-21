import math

import numpy as np
import pandas as pd
import ta
import yfinance as yf
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
    
    df["SMA50"] = ta.trend.SMAIndicator(close, 50).sma_indicator()
    df["SMA200"] = ta.trend.SMAIndicator(close, 200).sma_indicator()
    
    macd = ta.trend.MACD(close, 12, 26, 9)
    df["MACD"] = macd.macd()
    df["MACD_Signal"] = macd.macd_signal()

    bb = ta.volatility.BollingerBands(close, 20, 2)
    df["BB_H"], df["BB_L"], df["BB_%"] = bb.bollinger_hband(), bb.bollinger_lband(), bb.bollinger_pband()
    
    df["BB_W"] = bb.bollinger_wband()

    if volume is not None:
        df["OBV"] = ta.volume.OnBalanceVolumeIndicator(close, volume).on_balance_volume()
        df["Volume_SMA20"] = ta.trend.SMAIndicator(volume, 20).sma_indicator()
    else:
        df["OBV"] = np.nan
        df["Volume_SMA20"] = np.nan

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
    if df.empty or len(df) < 2:
        return {"error": f"No data for {ticker}"}

    df = compute_indicators(df)
    support, resistance = find_support_resistance(df)
    last = df.iloc[-1]
    prev = df.iloc[-2]
    
    crossover = "No Crossover"
    if last["EMA20"] > last["EMA50"] and prev["EMA20"] <= prev["EMA50"]:
        crossover = "Bullish Crossover (EMA20/50)"
    elif last["EMA20"] < last["EMA50"] and prev["EMA20"] >= prev["EMA50"]:
        crossover = "Bearish Crossover (EMA20/50)"

    # 2. Squeeze Zone Logic
    # A squeeze is when Bollinger Band Width is low relative to ATR. 
    # (e.g., BB_W < 1.5 * ATR)
    squeezeZone = "Expansion" # Default
    if (last["BB_W"] < (1.5 * last["ATR"])):
        squeezeZone = "Squeeze" # Low volatility

    # 3. Volume Spike Logic
    volumeSpike = "No"
    if last["Volume_SMA20"] > 0: # Avoid divide by zero
        if last["Volume"] > (last["Volume_SMA20"] * 2.0):
            volumeSpike = "Yes (2x Avg)"
        elif last["Volume"] > (last["Volume_SMA20"] * 1.5):
            volumeSpike = "Yes (1.5x Avg)"
            
    # 4. Trend Zone Logic (from your file)
    last_close = float(last["Close"])
    trendZone = "Strong Bull" if last["SMA50"] > last["SMA200"] and last_close > last["SMA50"] else \
                "Bullish" if last["SMA50"] > last["SMA200"] else \
                "Strong Bear" if last["SMA50"] < last["SMA200"] and last_close < last["SMA50"] else "Bearish"

    # 5. Last Candle Logic
    last_open = float(last["Open"]) if "Open" in last else 0.0
    lastCandle = "Bearish" if last_close < last_open else "Bullish"

    summary = {
        "ticker": ticker.upper(),
        "close": round(float(last["Close"]), 2),
        "macd": round(float(last["MACD"]), 2),
        "macdSignal": round(float(last["MACD_Signal"]), 2),
        "sma50": round(float(last["SMA50"]), 2),
        "sma200": round(float(last["SMA200"]), 2),
        
        "trendZone": trendZone,
                     
        "crossover": crossover,
        "squeezeZone": squeezeZone,    
        "lastCandle": lastCandle,
        "volumeSpike": volumeSpike,            
        
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
    
    for key, value in summary.items():
        # Check if the value is a float and if it's NaN
        if isinstance(value, float) and math.isnan(value):
            summary[key] = None # Replace NaN with None

    return summary
