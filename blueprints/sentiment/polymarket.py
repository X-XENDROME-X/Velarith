"""
Fetches sentiment from Polymarket using the MCP (Model Context Protocol) API
and refines it with an Anthropic LLM for contextual scoring that also considers
the stock's fundamentals (price, growth, valuation) and Polymarket macro trends.
"""

import asyncio
import json
import os
from pathlib import Path
from urllib.parse import urlencode

import yfinance as yf
from dotenv import load_dotenv
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
import anthropic

# Import fundamentals data function
from blueprints.fundamental.core import get_comprehensive_fundamental_data


# --- ENV SETUP ---
_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()

SMITHERY_URL = os.getenv("SMITHERY_URL")
SMITHERY_API_KEY = os.getenv("SMITHERY_API_KEY")
SMITHERY_PROFILE = os.getenv("SMITHERY_PROFILE")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not SMITHERY_API_KEY:
    print("[Polymarket] ⚠️ SMITHERY_API_KEY not set in environment")
if not ANTHROPIC_API_KEY:
    print("[Polymarket] ⚠️ ANTHROPIC_API_KEY not set in environment")

# --- Anthropic client ---
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


# --- fallback macro-level topics for broader sentiment coverage ---
MACRO_KEYWORDS = [
    "Federal Reserve", "interest rates", "inflation", "recession",
    "government shutdown", "debt ceiling", "CPI", "unemployment",
]


# =====================================================================================
# MAIN SENTIMENT FETCH
# =====================================================================================
async def get_ai_polymarket_sentiment(keyword: str) -> dict:
    """Fetch Polymarket data via MCP and analyze it using Claude for sentiment."""
    print(f"[Polymarket] 🔍 Starting fetch for '{keyword}'")

    # --- Expand search terms ---
    expanded_terms = [keyword]
    try:
        info = yf.Ticker(keyword).info
        if info.get("longName"):
            expanded_terms.append(info["longName"])
    except Exception:
        pass

    expanded_terms += ["Nasdaq", "S&P 500"] + MACRO_KEYWORDS

    # --- Fetch fundamentals for context ---
    fundamentals = get_comprehensive_fundamental_data(keyword)
    fundamentals_json = json.dumps(fundamentals, indent=2)

    # --- Connect to MCP ---
    params = {"api_key": SMITHERY_API_KEY, "profile": SMITHERY_PROFILE}
    mcp_url = f"{SMITHERY_URL}?{urlencode(params)}"

    try:
        async with streamablehttp_client(mcp_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                tools = await session.list_tools()

                if not tools.tools:
                    return {"source": "polymarket", "score": 50, "summary": "No tools available"}

                search_tool = next(
                    (t for t in tools.tools if "search" in t.name.lower() or "sentiment" in t.name.lower()),
                    tools.tools[0],
                )

                # --- Step 1: gather macro sentiment first ---
                macro_result = await get_polymarket_macro_sentiment(session, search_tool.name)
                print(f"[Polymarket] 🌎 Macro trend detected: {macro_result}")

                # --- Step 2: query company / ticker-specific data ---
                for term in expanded_terms:
                    try:
                        print(f"[Polymarket] ⚙️ Querying '{term}' via {search_tool.name}")
                        result = await session.call_tool(search_tool.name, {"query": term})

                        if result and result.content:
                            flat_text = _flatten_content(result.content)
                            print(f"[Polymarket] 📜 Flattened text (first 500 chars):\n{flat_text[:500]}...\n")

                            # 🔥 Step 3: LLM contextual score (with fundamentals + macro)
                            llm_result = await _llm_score_polymarket(flat_text, term, fundamentals_json, macro_result)

                            return {
                                "source": "polymarket",
                                "term": term,
                                "score": llm_result["score"],
                                "summary": llm_result["summary"],
                                "macro": llm_result.get("macro"),
                                "raw_text": flat_text[:1200],
                            }
                    except Exception as e:
                        print(f"[Polymarket] ⚠️ Query failed for {term}: {e}")
                        continue

                return {"source": "polymarket", "score": 50, "summary": "No relevant market found in Polymarket."}

    except Exception as e:
        print(f"[Polymarket] ❌ MCP connection failed: {e}")
        return {"source": "polymarket", "score": 50, "summary": f"Error connecting to Polymarket MCP: {e}"}


# =====================================================================================
# MACRO SENTIMENT FETCH
# =====================================================================================
async def get_polymarket_macro_sentiment(session, search_tool_name: str) -> dict:
    """
    Queries Polymarket MCP for macro topics and infers overall macro sentiment.
    Returns a dict with {'trend': str, 'impact': int}.
    """
    print("[Polymarket] 🌍 Gathering macro sentiment from Polymarket...")
    all_text_blocks = []

    for topic in MACRO_KEYWORDS:
        try:
            result = await session.call_tool(search_tool_name, {"query": topic})
            if result and result.content:
                text = _flatten_content(result.content)
                if text:
                    all_text_blocks.append(f"{topic}: {text}")
                    print(f"   ✓ Macro topic '{topic}' retrieved ({len(text)} chars)")
        except Exception as e:
            print(f"   ⚠️ Macro query failed for '{topic}': {e}")

    if not all_text_blocks:
        return {"trend": "neutral", "impact": 0}

    joined_text = "\n\n".join(all_text_blocks)

    prompt = f"""
You are an economist analyzing prediction market data from Polymarket.

Below is a set of prediction markets about macroeconomic topics:
{joined_text}

Infer the **overall macroeconomic tone** and output **valid JSON only**:
{{
  "trend": "<extremely positive|positive|neutral|negative|extremely negative>",
  "impact": <integer between -10 and +15>
}}

Guidelines:
- Markets predicting rate cuts, disinflation, or strong growth → positive.
- Markets predicting recession, inflation, or instability → negative.
- Weigh probability and number of active markets for each tone.
"""

    try:
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]
        data = json.loads(text)
        return data

    except Exception as e:
        print(f"[Polymarket] ⚠️ Macro sentiment analysis failed: {e}")
        return {"trend": "neutral", "impact": 0}


# =====================================================================================
# HELPERS
# =====================================================================================
def _flatten_content(content) -> str:
    """Convert MCP TextContent / structured objects into raw text for analysis."""
    if isinstance(content, list):
        parts = []
        for c in content:
            if hasattr(c, "text"):
                parts.append(c.text)
            elif isinstance(c, dict) and "text" in c:
                parts.append(c["text"])
            else:
                parts.append(str(c))
        return " ".join(parts)
    elif hasattr(content, "text"):
        return content.text
    elif isinstance(content, dict) and "text" in content:
        return content["text"]
    return str(content)


async def _llm_score_polymarket(flat_text: str, term: str, fundamentals_json: str, macro_result: dict) -> dict:
    """Send Polymarket text + fundamentals + Polymarket macro sentiment to Claude for contextual scoring."""
    macro_json = json.dumps(macro_result, indent=2)
    prompt = f"""
You are a financial analyst interpreting both company and macro prediction markets.

Inputs:

1️⃣ Polymarket listings for **{term}**:
{flat_text}

2️⃣ Company fundamentals for {term}:
{fundamentals_json}

3️⃣ Macro sentiment from Polymarket markets:
{macro_json}

Output **valid JSON only**:
{{
  "score": <0–100>,
  "summary": "<short overall sentiment summary>",
  "macro": {{
      "trend": "<extremely positive|positive|neutral|negative|extremely negative>",
      "impact": <integer between -10 and +15>
  }}
}}

Rules:
- Use company Polymarket listings as base sentiment.
- Adjust using fundamentals.
- Then factor in macro tone and its 'impact'.
"""

    try:
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]

        data = json.loads(text)

        # --- Apply macro adjustment if present ---
        base_score = int(data.get("score", 50))
        macro_info = data.get("macro", {}) or {}
        impact = int(macro_info.get("impact", 0))

        adjusted = max(0, min(100, base_score + impact))
        macro_info["adjusted_score"] = adjusted

        return {
            "score": adjusted,
            "summary": data.get("summary", "No summary provided."),
            "macro": macro_info,
        }

    except Exception as e:
        print(f"[Polymarket] ⚠️ Claude scoring failed: {e}")
        return {
            "score": 50,
            "summary": f"LLM scoring error: {e}",
            "macro": {"trend": "unknown", "impact": 0, "adjusted_score": 50},
        }


# =====================================================================================
# TEST MODE
# =====================================================================================
if __name__ == "__main__":
    async def test():
        result = await get_ai_polymarket_sentiment("META")
        print(json.dumps(result, indent=2))

    asyncio.run(test())
