import numpy as np

def compute_signal(summary: dict):
    """Estimate bullish/bearish probability based on key metrics."""
    ema_bull = summary["ema20"] > summary["ema50"]
    adx = summary["adx"]
    rsi = summary["rsi"]

    bias = 0
    if rsi > 70:
        bias = -0.25
    elif rsi < 30:
        bias = 0.25

    base = 0.55 if ema_bull else 0.45
    confidence = base + (0.1 if adx >= 25 else 0) + bias
    confidence = np.clip(confidence, 0.05, 0.95)

    return {
        "signal": "bullish" if confidence > 0.5 else "bearish",
        "confidence": round(float(confidence), 2),
        "score": round(float(confidence * 100), 1)
    }
