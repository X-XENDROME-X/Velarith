from flask import Blueprint, jsonify
from blueprints.fundamental.fundamental_core import get_fundamental_summary
from blueprints.fundamental.fundamental_signal import compute_fundamental_score
from blueprints.fundamental.peer_utils import get_peer_context 

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

    # 2. Get peer context data (NEW)
    peer_data = get_peer_context(ticker)

    # 3. Compute signals, now with peer context (CHANGED)
    scores = compute_fundamental_score(summary, peer_data)
    
    # 4. Combine into a final payload
    payload = {
        "summary": summary,
        "scores": scores,
        "peer_context": peer_data 
    }

    return jsonify(payload), 200