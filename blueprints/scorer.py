"""
scorer.py
----------
Provides scoring and normalization utilities for both
short-term and long-term stock analysis pipelines.

Used by: analysis.py, fundamentals.py, technical.py, etc.
"""

import math
import numpy as np


# ==============================
# Weight presets
# ==============================

SHORT_TERM_WEIGHTS = {
    "sentiment": 0.40,
    "technical": 0.30,
    "fundamentals": 0.20,
    "insider": 0.10,
}

LONG_TERM_WEIGHTS = {
    "fundamentals": 0.6,
    "peer": 0.25,
    "sentiment": 0.1,
    "insider": 0.05,
}


# ==============================
# Normalization helpers
# ==============================

def safe_number(value, default=0.0):
    """Convert to float safely."""
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return float(value)
    except Exception:
        return default


def normalize_growth(value, sector_avg=None):
    """
    Normalize growth values (e.g., EPS or revenue CAGR) to 0–100 scale.
    Sector_avg allows peer-relative normalization.
    """
    value = safe_number(value)
    if sector_avg is not None:
        sector_avg = safe_number(sector_avg)
        diff = value - sector_avg
        return max(0, min(100, 50 + diff * 5))  # ±10% → ±50 points window
    # no peer data → map using heuristic
    if value < 0:
        return 20 + value * 2  # penalize negatives
    if value > 0.2:
        return 90
    return value * 450  # 0.1 growth → 45


def score_volatility(std_dev):
    """
    Volatility scoring: lower = better for long term, higher = better for traders short term.
    We'll map it inversely for long-term contexts.
    """
    std_dev = safe_number(std_dev)
    if std_dev <= 0:
        return 50
    if std_dev < 0.1:
        return 90
    if std_dev < 0.2:
        return 70
    if std_dev < 0.3:
        return 50
    if std_dev < 0.5:
        return 30
    return 10


def score_consistency(series):
    """
    Compute consistency score (e.g., earnings or price stability).
    Higher = more consistent performance.
    """
    if not series or len(series) < 3:
        return 50
    std = np.std(series)
    mean = np.mean(series)
    if mean == 0:
        return 50
    ratio = std / abs(mean)
    # Lower variability → higher score
    if ratio < 0.05:
        return 95
    elif ratio < 0.1:
        return 85
    elif ratio < 0.2:
        return 70
    elif ratio < 0.3:
        return 50
    else:
        return 30


def weighted_average(scores: dict, weights: dict) -> float:
    """
    Compute weighted average from category scores.
    Unknown categories get ignored.
    """
    total_weight = 0
    weighted_sum = 0
    for key, value in scores.items():
        w = weights.get(key, 0)
        total_weight += w
        weighted_sum += safe_number(value) * w
    if total_weight == 0:
        return 0
    return round(weighted_sum / total_weight, 2)


# ==============================
# Example usage (for interns)
# ==============================
if __name__ == "__main__":
    # Demo example
    short_scores = {
        "sentiment": 85,
        "technical": 72,
        "fundamentals": 65,
        "insider": 55,
    }
    long_scores = {
        "fundamentals": 80,
        "peer": 70,
        "sentiment": 55,
        "insider": 60,
    }

    print("Short-term final:", weighted_average(short_scores, SHORT_TERM_WEIGHTS))
    print("Long-term final:", weighted_average(long_scores, LONG_TERM_WEIGHTS))

