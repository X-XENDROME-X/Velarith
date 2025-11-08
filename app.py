from dotenv import load_dotenv
load_dotenv()  # Load environment variables early

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint

# --- Blueprints ---
from blueprints.technicals import technicals as tech_bp
from blueprints.sentiments import sentiment_bp

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
    tech_bp,          # ✅ from blueprints/technicals
    sentiment_bp,     # ✅ from blueprints/sentiment
):
    app.register_blueprint(bp)

if HAS_MACRO:
    app.register_blueprint(macro_bp)

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
