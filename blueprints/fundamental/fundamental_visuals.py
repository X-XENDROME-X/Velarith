from flask import Blueprint, jsonify
from .fundamental_core import get_fundamental_summary
from .fundamental_signal import compute_fundamental_score

# Create the blueprint
fund_bp = Blueprint("fundamental", __name__, url_prefix="/fundamental")

@fund_bp.route("/<ticker>", methods=["GET"])
def analyze_ticker(ticker):
    """
    Main endpoint to get a full fundamental analysis 
    and proprietary score for a stock.
    """
    # 1. Get core data
    summary = get_fundamental_summary(ticker)
    
    if "error" in summary:
        return jsonify(summary), 400

    # 2. Compute signals/scores from core data
    scores = compute_fundamental_score(summary)
    
    # 3. Combine into a final payload
    payload = {
        "summary": summary,
        "scores": scores
    }

    return jsonify(payload), 200