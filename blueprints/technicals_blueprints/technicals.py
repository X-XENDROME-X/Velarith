from flask import Blueprint, jsonify
from .technical_core import get_technical_summary, compute_indicators, fetch_price_data
from .technical_visuals import plot_technical_chart
from .technical_signal import compute_signal

tech_bp = Blueprint("technical", __name__, url_prefix="/technical")

@tech_bp.route("/<ticker>", methods=["GET"])
def analyze_ticker(ticker):
    summary = get_technical_summary(ticker)
    if "error" in summary:
        return jsonify(summary), 400

    df = fetch_price_data(ticker)
    df = compute_indicators(df)
    chart_b64 = plot_technical_chart(df, ticker)
    signal = compute_signal(summary)

    payload = {
        **summary,
        "signal": signal,
        "chart": chart_b64
    }

    return jsonify(payload), 200

if __name__ == "__main__":
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(tech_bp)
    app.run(debug=True, port=5001)
    
