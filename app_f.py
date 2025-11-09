from flask import Flask, jsonify
from blueprints.technicals_blueprints.technicals import tech_bp
from blueprints.fundamental_blueprints.fundamentals import fund_bp

# Initialize Flask App
app = Flask(__name__)

# Register Blueprints
app.register_blueprint(tech_bp)
app.register_blueprint(fund_bp)

# ----------------------------------------------------------
# Main App Routes
# ----------------------------------------------------------

@app.route("/")
def home():
    """Home route to show available endpoints."""
    return jsonify({
        "message": "Stock Analysis API is running.",
        "endpoints": [
            "/technical/<ticker>",
            "/fundamental/<ticker>"
        ]
    })

@app.route("/analyze/<ticker>", methods=["GET"])
def analyze_full_ticker(ticker):
    """
    A single, combined endpoint to get BOTH technicals and fundamentals.
    This is what your frontend will probably call.
    """
    
    # --- Fetch Technicals ---
    # We use test_client to "call" our own technical endpoint internally
    with app.test_client() as client:
        tech_response = client.get(f"/technical/{ticker}")
        tech_data = tech_response.get_json()

    # --- Fetch Fundamentals ---
    with app.test_client() as client:
        fund_response = client.get(f"/fundamental/{ticker}")
        fund_data = fund_response.get_json()

    # Handle errors from either service
    if tech_response.status_code != 200:
        return jsonify({"error": f"Failed to get technical data: {tech_data.get('error')}"}), 400
        
    if fund_response.status_code != 200:
        return jsonify({"error": f"Failed to get fundamental data: {fund_data.get('error')}"}), 400

    # --- Combine and Return ---
    payload = {
        "ticker": ticker.upper(),
        "technical_analysis": tech_data,
        "fundamental_analysis": fund_data
    }
    
    return jsonify(payload), 200


# ----------------------------------------------------------
# Run the App
# ----------------------------------------------------------

if __name__ == "__main__":
    # Note: Set debug=False for production
    app.run(debug=True, port=5001)