import numpy as np

DEFAULT_AVERAGES = {
    'trailingPE': 25.0, 'priceToBook': 4.0, 'returnOnEquity': 0.18,
    'revenueGrowth': 0.10, 'earningsGrowth': 0.12, 'profitMargins': 0.15,
    'debtToEquity': 80.0
}

def compute_fundamental_score(summary: dict, peer_data: dict = None):
    """
    Generates proprietary scores (0.0 to 1.0) for Value, Growth, 
    and Health, now normalized against peer averages.
    """
    scores = {
        "value_score": None, "growth_score": None, "health_score": None,
        "final_score": None, "scoring_context": "hardcoded" 
    }
    
    if peer_data and peer_data.get('peer_averages'):
        avg = peer_data['peer_averages']
        # Fill in any missing peer metrics with our defaults
        for key, default_val in DEFAULT_AVERAGES.items():
            if avg.get(key) is None:
                avg[key] = default_val
        scores["scoring_context"] = "peer_normalized"
    else:
        avg = DEFAULT_AVERAGES

    try:
        
        # === Value Score (Lower is better) ===
        pe = summary.get('forwardPE', 0) or summary.get('trailingPE', 0) or avg['trailingPE'] * 2
        pb = summary.get('priceToBook', 0) or avg['priceToBook'] * 2
        
        # Normalize vs. peers: 1.0 = at peer avg, 0.5 = 50% below avg
        pe_norm = pe / (avg['trailingPE'] or 25.0)
        pb_norm = pb / (avg['priceToBook'] or 4.0)
        
        # Inverse normalize: A score of 0.5 (good) -> 1.0 score
        # A score of 2.0 (bad) -> 0.0 score
        pe_score = 1 - np.clip((pe_norm - 0.5) / (2.0 - 0.5), 0, 1)
        pb_score = 1 - np.clip((pb_norm - 0.5) / (2.0 - 0.5), 0, 1)
        scores["value_score"] = round((pe_score + pb_score) / 2, 4)

        # === Growth Score (Higher is better) ===
        rev_growth = summary.get('revenueGrowth', 0) or 0
        earn_growth = summary.get('earningsGrowth', 0) or 0
        
        # Normalize vs. peers: 2.0 = 2x peer avg
        rev_g_norm = rev_growth / (avg['revenueGrowth'] or 0.1)
        earn_g_norm = earn_growth / (avg['earningsGrowth'] or 0.1)

        # Normalize: 0.5 (50% of avg) -> 0.0 score
        # 2.0 (200% of avg) -> 1.0 score
        rev_g_score = np.clip((rev_g_norm - 0.5) / (2.0 - 0.5), 0, 1)
        earn_g_score = np.clip((earn_g_norm - 0.5) / (2.0 - 0.5), 0, 1)
        scores["growth_score"] = round((rev_g_score + earn_g_score) / 2, 4)

        # === Health Score (Higher ROE/Margins, Lower Debt) ===
        roe = summary.get('returnOnEquity', 0) or 0
        margins = summary.get('profitMargins', 0) or 0
        dte = summary.get('debtToEquity', 0) or 200
        
        # Normalize ROE/Margins (Higher is better)
        roe_score = np.clip((roe / (avg['returnOnEquity'] or 0.1) - 0.5) / (2.0 - 0.5), 0, 1)
        margin_score = np.clip((margins / (avg['profitMargins'] or 0.1) - 0.5) / (2.0 - 0.5), 0, 1)

        # Inverse normalize D/E (Lower is better)
        dte_norm = dte / (avg['debtToEquity'] or 80.0)
        dte_score = 1 - np.clip((dte_norm - 0.5) / (2.0 - 0.5), 0, 1)
        scores["health_score"] = round((roe_score + margin_score + dte_score) / 3, 4)

        # === Final Score (Weighted Average) ===
        score_values = [scores['value_score'], scores['growth_score'], scores['health_score']]
        weights = [0.4, 0.4, 0.2]
        
        valid_scores = [v for v in score_values if v is not None]
        if not valid_scores:
            final_score = 0.0
        else:
            weighted_scores = [v * w for v, w in zip(score_values, weights) if v is not None]
            total_weight = sum([w for v, w in zip(score_values, weights) if v is not None])
            final_score = np.nansum(weighted_scores) / (total_weight or 1.0)

        scores["final_score"] = round(final_score, 4)

    except Exception as e:
        print(f"[ERROR] Scoring fundamentals: {e}")
        return scores

    return scores