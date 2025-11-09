from flask import Blueprint, jsonify
from blueprints.fundamental.core import get_comprehensive_fundamental_data
from blueprints.fundamental.signal import compute_fundamental_score
from blueprints.fundamental.peer_utils import get_peer_context 

# Create the blueprint
fund_bp = Blueprint("fundamental", __name__, url_prefix="/fundamental")

@fund_bp.route("/<ticker>", methods=["GET"])
def analyze_ticker(ticker):
    """
    Main endpoint to get a comprehensive set of fundamental
    and context-aware data for a stock.
    
    This endpoint *only* serves data. All scoring is handled
    by the /analysis endpoint.
    """
    data = get_comprehensive_fundamental_data(ticker.upper())
    
    if "error" in data:
        return jsonify(data), 400 

    return jsonify(data), 200