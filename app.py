from dotenv import load_dotenv
load_dotenv()  # Load environment variables early

# Added jsonify for the new analyze endpoint
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint

# --- Blueprints ---
from blueprints.technicals import technicals as tech_bp
from blueprints.sentiments import sentiment_bp
# MERGED: Added import for the fundamentals blueprint from app_f.py
# Note: I've standardized the import path to match the others.
# Please ensure your fundamentals blueprint is located at 'blueprints/fundamentals.py'
from blueprints.fundamentals import fund_bp


# Optional (macro market context)
try:
    from blueprints.sentiment.macro import macro_bp
    HAS_MACRO = True
except ImportError:
    HAS_MACRO = False

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- Register Blueprints ---
for bp in (
    tech_bp,          # from blueprints/technicals
    sentiment_bp,     # from blueprints/sentiment
    fund_bp,          # MERGED: Registered the fundamentals blueprint
):
    app.register_blueprint(bp)

if HAS_MACRO:
    app.register_blueprint(macro_bp)


# ------------------------------------------------------------------
# MERGED: Added the combined analysis endpoint from app_f.py
# ------------------------------------------------------------------
@app.route("/analyze/<ticker>", methods=["GET"])
def analyze_full_ticker(ticker):
    """
    A single, combined endpoint to get technicals, fundamentals, and sentiment.
    This is the primary endpoint for frontend applications.
    """
    
    # --- Fetch Technicals ---
    # We use app.test_client() to "call" our own endpoints internally.
    with app.test_client() as client:
        tech_response = client.get(f"/technical/{ticker}")
        tech_data = tech_response.get_json()

    # --- Fetch Fundamentals ---
    with app.test_client() as client:
        fund_response = client.get(f"/fundamental/{ticker}")
        fund_data = fund_response.get_json()
        
    # --- Fetch Sentiment ---
    with app.test_client() as client:
        # Assuming your sentiment blueprint is registered with a '/sentiment' prefix
        sent_response = client.get(f"/sentiment/{ticker}")
        sent_data = sent_response.get_json()

    # --- Error Handling ---
    if tech_response.status_code != 200:
        return jsonify({"error": f"Failed to get technical data: {tech_data.get('error', 'Unknown error')}"}), 400
        
    if fund_response.status_code != 200:
        return jsonify({"error": f"Failed to get fundamental data: {fund_data.get('error', 'Unknown error')}"}), 400

    # Sentiment is treated as optional; if it fails, the rest of the analysis can proceed.
    if sent_response.status_code != 200:
        sent_data = {"error": "Sentiment data not available"}


    # --- Combine and Return ---
    payload = {
        "ticker": ticker.upper(),
        "technical_analysis": tech_data,
        "fundamental_analysis": fund_data,
        "sentiment_analysis": sent_data  # Added sentiment to the combined payload
    }
    
    return jsonify(payload), 200


# --- Swagger UI ---
SWAGGER_URL = "/docs"
API_URL = "/openapi.yaml"  # should exist in project root

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={"app_name": "Stock Analyzer API"}
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# --- Serve OpenAPI Spec ---
@app.route("/openapi.yaml")
def openapi_spec():
    """Serve the OpenAPI spec file for documentation."""
    return send_from_directory(".", "openapi.yaml")

# --- Health Check ---
@app.route("/")
def index():
    return {"status": "ok", "message": "Stock Analyzer API is live."}, 200

# --- Entry Point ---
if __name__ == "__main__":
    app.run(debug=True, port=10000, host="0.0.0.0")
