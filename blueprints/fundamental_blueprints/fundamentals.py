from flask import Blueprint, jsonify
from .fundamental_core import get_fundamental_summary
from .fundamental_signal import compute_fundamental_score

fund_bp = Blueprint("fundamental", __name__, url_prefix="/fundamental")

@fund_bp.route("/<ticker>", methods=["GET"])
def analyze_ticker(ticker):
    """
    Main endpoint to get a full fundamental analysis 
    and proprietary score for a stock.
    """
    summary = get_fundamental_summary(ticker)
    
    if "error" in summary:
        return jsonify(summary), 400

    scores = compute_fundamental_score(summary)
    
    payload = {
        "summary": summary,
        "scores": scores
    }

    return jsonify(payload), 200