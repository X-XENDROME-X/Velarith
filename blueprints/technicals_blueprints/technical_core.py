import yfinance as yf
import pandas as pd
import numpy as np
import ta
from scipy.signal import argrelextrema

# ----------------------------------------------------------
# Core Computation Layer
# ----------------------------------------------------------

def fetch_price_data(ticker, period="6mo", interval="1d"):
    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=False)
        df.dropna(inplace=True)
        return df
    except Exception as e:
        print(f"[ERROR] Fetching {ticker}: {e}")
        return pd.DataFrame()

def compute_indicators(df: pd.DataFrame):
    df["RSI"] = ta.momentum.RSIIndicator(df["Close"], 14).rsi()
    df["EMA20"] = ta.trend.EMAIndicator(df["Close"], 20).ema_indicator()
    df["EMA50"] = ta.trend.EMAIndicator(df["Close"], 50).ema_indicator()
    df["EMA200"] = ta.trend.EMAIndicator(df["Close"], 200).ema_indicator()
    df["ADX"] = ta.trend.ADXIndicator(df["High"], df["Low"], df["Close"], 14).adx()
    df["ATR"] = ta.volatility.AverageTrueRange(df["High"], df["Low"], df["Close"], 14).average_true_range()

    bb = ta.volatility.BollingerBands(df["Close"], 20, 2)
    df["BB_H"], df["BB_L"], df["BB_%"] = bb.bollinger_hband(), bb.bollinger_lband(), bb.bollinger_pband()

    df["OBV"] = ta.volume.OnBalanceVolumeIndicator(df["Close"], df["Volume"]).on_balance_volume()
    return df

def find_support_resistance(df, order=10):
    close = df["Close"]
    max_idx = argrelextrema(close.values, np.greater, order=order)[0]
    min_idx = argrelextrema(close.values, np.less, order=order)[0]
    support = float(close.iloc[min_idx[-1]]) if len(min_idx) else None
    resistance = float(close.iloc[max_idx[-1]]) if len(max_idx) else None
    return support, resistance

def get_technical_summary(ticker, period="6mo", interval="1d"):
    df = fetch_price_data(ticker, period, interval)
    if df.empty:
        return {"error": f"No data for {ticker}"}

    df = compute_indicators(df)
    support, resistance = find_support_resistance(df)
    last = df.iloc[-1]

    summary = {
        "ticker": ticker.upper(),
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
        "close": round(float(last["Close"]), 2),
        "volume": int(last["Volume"]),
        "data_points": len(df)
    }

    # Derived interpretations
    summary["momentum"] = "bullish" if summary["ema20"] > summary["ema50"] else "bearish"
    summary["trend_strength"] = "strong" if summary["adx"] >= 25 else "weak"
    if summary["rsi"] >= 70:
        summary["zone"] = "overbought"
    elif summary["rsi"] <= 30:
        summary["zone"] = "oversold"
    else:
        summary["zone"] = "neutral"

    return summary
