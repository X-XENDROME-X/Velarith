from dotenv import load_dotenv
load_dotenv()  # Load environment variables early

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint

# --- Blueprints ---
# (FIX 1: Imports now match your file structure)
from blueprints.technicals import technicals
from blueprints.fundamentals import fund_bp
from blueprints.sentiments import sent_bp, macro_bp  # Import both from sentiments.py
from blueprints.analysis import an_bp 
from blueprints.prompt import prompt_bp

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- Register Blueprints ---
# (FIX 2: Simplified registration)
app.register_blueprint(technicals)
app.register_blueprint(fund_bp)
app.register_blueprint(sent_bp)
app.register_blueprint(macro_bp)
app.register_blueprint(an_bp)  # This provides the /analysis/<ticker> endpoint
app.register_blueprint(prompt_bp)


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
    """Health check and list of available endpoints."""
    # (FIX 4: Updated to show all your *real* endpoints)
    return jsonify({
        "status": "ok",
        "message": "Stock Analyzer API is live.",
        "endpoints": {
            "/technical/<ticker>": "Tech analysis (RSI, EMA, etc.)",
            "/fundamental/<ticker>": "Fundamental data (P/E, ROE, etc.)",
            "/sentiment/<ticker>": "Sentiment (News, Google, Polymarket)",
            "/macro": "Macro-economic sentiment",
            "/analysis/<ticker>?mode=short": "Composite short-term score",
            "/analysis/<ticker>?mode=long": "Composite long-term score"
        }
    }), 200

# --- Entry Point ---
if __name__ == "__main__":
    app.run(debug=True, port=10000, host="0.0.0.0")