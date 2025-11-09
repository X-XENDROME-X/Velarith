from flask import Blueprint, jsonify
from blueprints.technical.core import fetch_price_data, compute_indicators, get_technical_summary
from blueprints.technical.visuals import plot_technical_chart
from blueprints.technical.signal import compute_signal

technicals = Blueprint("technical", __name__, url_prefix="/technical")

@technicals.route("/<ticker>", methods=["GET"])
def get_technicals(ticker):
    """
    Returns only the technical summary object for the frontend.
    """
    summary = get_technical_summary(ticker)
    if "error" in summary:
        return jsonify(summary), 400

    return jsonify(summary), 200