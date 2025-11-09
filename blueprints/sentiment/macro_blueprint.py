import asyncio
from flask import Blueprint, jsonify
from .macro import get_macro_sentiment # <-- Imports the new SYNC function

macro_bp = Blueprint("macro", __name__, url_prefix="/macro")

@macro_bp.route("/", methods=["GET"])
def macro_route():
    """
    Run the macro pipeline.
    """
    try:
        # --- THE FIX ---
        # We must run the SYNCHRONOUS get_macro_sentiment 
        # in a separate thread so it doesn't block the server.
        data_df = asyncio.run(asyncio.to_thread(get_macro_sentiment))
        # --- END OF FIX ---
        
        payload = data_df.to_dict(orient="records")
        return jsonify(payload), 200
    except Exception as e:
        print(f"[ERROR] /macro failed: {e}")
        return jsonify({"error": f"Failed to get macro data: {str(e)}"}), 500