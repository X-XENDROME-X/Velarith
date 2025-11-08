from flask import Blueprint, jsonify
from blueprints.technical.core import fetch_price_data, compute_indicators, get_technical_summary
from blueprints.technical.visuals import plot_technical_chart
from blueprints.technical.signal import compute_signal

technicals = Blueprint("technical", __name__, url_prefix="/technical")

@technicals.route("/<ticker>", methods=["GET"])
def analyze_ticker(ticker):
    summary = get_technical_summary(ticker)
    if "error" in summary:
        return jsonify(summary), 400

    df = fetch_price_data(ticker)
    df = compute_indicators(df)
    chart_b64 = plot_technical_chart(df, ticker)
    signal = compute_signal(summary)

    payload = {**summary, "signal": signal, "chart": chart_b64}
    return jsonify(payload), 200