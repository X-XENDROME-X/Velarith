import numpy as np

# ----------------------------------------------------------
# Signal Computation Layer
# ----------------------------------------------------------

def compute_fundamental_score(summary: dict):
    """
    Generates proprietary scores (0.0 to 1.0) for Value, Growth, 
    and Health to create a final fundamental score.
    """
    scores = {
        "value_score": None,
        "growth_score": None,
        "health_score": None,
        "final_score": None
    }
    
    try:
        # 1. Value Score (Lower P/E, P/B is better)
        # We normalize them: e.g., P/E of 40 = 0 score, P/E of 10 = 1.0 score
        pe = summary.get('forwardPE', 0) or summary.get('trailingPE', 0) or 100
        pb = summary.get('priceToBook', 0) or 10
        
        # Inverse normalize P/E: (1 - (val-min)/(max-min))
        pe_score = 1 - np.clip((pe - 10) / (40 - 10), 0, 1)
        # Inverse normalize P/B:
        pb_score = 1 - np.clip((pb - 1) / (8 - 1), 0, 1)
        
        scores["value_score"] = round((pe_score + pb_score) / 2, 4)

        # 2. Growth Score (Higher is better)
        rev_growth = summary.get('revenueGrowth', 0) or 0
        earn_growth = summary.get('earningsGrowth', 0) or 0
        
        # Normalize: 20% growth (0.2) = 1.0 score
        rev_g_score = np.clip(rev_growth / 0.2, 0, 1)
        earn_g_score = np.clip(earn_growth / 0.2, 0, 1)
        
        scores["growth_score"] = round((rev_g_score + earn_g_score) / 2, 4)

        # 3. Health Score (Higher ROE/Margins, Lower Debt)
        roe = summary.get('returnOnEquity', 0) or 0
        margins = summary.get('profitMargins', 0) or 0
        dte = summary.get('debtToEquity', 0) or 100
        
        # Normalize: 25% ROE (0.25) = 1.0 score
        roe_score = np.clip(roe / 0.25, 0, 1)
        # Normalize: 20% margin (0.2) = 1.0 score
        margin_score = np.clip(margins / 0.2, 0, 1)
        # Inverse normalize D/E:
        dte_score = 1 - np.clip((dte - 50) / (200 - 50), 0, 1)
        
        scores["health_score"] = round((roe_score + margin_score + dte_score) / 3, 4)

        # 4. Final Score (Weighted Average)
        # Give more weight to Value and Growth
        score_values = [scores['value_score'], scores['growth_score'], scores['health_score']]
        weights = [0.4, 0.4, 0.2]
        
        # Use nanmean to safely calculate even if one is None
        final_score = np.nansum([v * w for v, w in zip(score_values, weights)])
        scores["final_score"] = round(final_score, 4)

    except Exception as e:
        print(f"[ERROR] Scoring fundamentals: {e}")
        # Return Nones if any calculation failed
        return scores

    return scores

if __name__ == "__main__":
    # Test the signal module
    from fundamental_core import get_fundamental_summary
    summary = get_fundamental_summary("MSFT")
    scores = compute_fundamental_score(summary)
    print(scores)
    
    summary_bank = get_fundamental_summary("JPM")
    scores_bank = compute_fundamental_score(summary_bank)
    print(scores_bank)