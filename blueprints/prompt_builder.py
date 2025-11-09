"""
prompt_builder.py
-----------------
Builds a detailed prompt for the Claude AI, using
the exact data keys from our analysis pipelines.
"""

def build_prompt(ticker: str, mode: str, final_scores: dict, fundamentals: dict = None, tech_summary: dict = None, user_context: dict = None, peer_data: dict = None):    
    # --- 1. User Context ---
    # Build a profile from the form data
    user_section = ""
    if user_context and user_context.get('risk'):
        user_section = f"""
        User Context:
        • Investor Age: {user_context.get('age', 'N/A')}
        • Risk Profile: {user_context.get('risk', 'N/A')}
        • Stated Term: {mode}
        """

    # --- 2. Technical Section (from technical/core.py) ---
    tech_section = ""
    if tech_summary and "error" not in tech_summary:
        tech_section = f"""
        Technical Indicators for {ticker}:
        • Current Price: ${tech_summary.get('close', 'N/A')}
        • 52-Week Range: ${tech_summary.get('low52', 'N/A')} - ${tech_summary.get('high52', 'N/A')}
        • Key EMAs: EMA20 (${tech_summary.get('ema20', 'N/A')}), EMA50 (${tech_summary.get('ema50', 'N/A')}), EMA200 (${tech_summary.get('ema200', 'N/A')})
        • Momentum: {tech_summary.get('momentum', 'N/A')} (based on EMA20/50 cross)
        • RSI (14): {tech_summary.get('rsi', 'N/A')} (Zone: {tech_summary.get('zone', 'N/A')})
        • Trend Strength (ADX): {tech_summary.get('adx', 'N/A')} ({tech_summary.get('trend_strength', 'N/A')})
        • Bollinger Bands: ${tech_summary.get('bb_low', 'N/A')} - ${tech_summary.get('bb_high', 'N/A')} (Percent: {tech_summary.get('bb_percent', 'N/A')})
        • Support/Resistance: S: ${tech_summary.get('support', 'N/A')}, R: ${tech_summary.get('resistance', 'N/A')}
        """

    # --- 3. Fundamental Section (from fundamental_core.py) ---
    fund_section = ""
    if fundamentals and "error" not in fundamentals:
        fund_section = f"""
        Fundamental Indicators for {ticker}:
        • Market Cap: {fundamentals.get('marketCap', 'N/A')}
        • P/E Ratio (Trailing): {fundamentals.get('trailingPE', 'N/A')}
        • P/E Ratio (Forward): {fundamentals.get('forwardPE', 'N/A')}
        • P/B Ratio: {fundamentals.get('priceToBook', 'N/A')}
        • Dividend Yield: {fundamentals.get('dividendYield', 'N/A')}
        • Revenue Growth (QoQ): {fundamentals.get('revenueGrowth', 'N/A')}
        • Earnings Growth (QoQ): {fundamentals.get('earningsGrowth', 'N/A')}
        • Free Cash Flow: {fundamentals.get('freeCashFlow', 'N/A')}
        • Debt to Equity: {fundamentals.get('debtToEquity', 'N/A')}
        • Return on Equity: {fundamentals.get('returnOnEquity', 'N/A')}
        • Next Earnings Date: {fundamentals.get('nextEarningsDate', 'N/A')}
        """
    
    peer_section = ""
    if peer_data and "error" not in peer_data:
        peers_list = peer_data.get('peers_list', [])
        peer_avg = peer_data.get('peer_averages', {})

        # Format the averages nicely
        avg_text = "\n".join([f"        • {key.capitalize()}: {value}" for key, value in peer_avg.items() if value is not None])

        peer_section = f"""
        Peer Context:
        • Competitors: {', '.join(peers_list) if peers_list else 'N/A'}
        • Peer Averages:
    {avg_text if avg_text else '        • N/A'}
        """

    # --- 4. The Main Prompt Template ---
    return f"""
You are an expert equity analyst. Generate a clear, concise, and professional analysis.

⚙️ OUTPUT FORMAT:
Return ONLY valid JSON, using this exact structure:

{{
  "verdict": "STRONG BUY / HOLD / SELL / etc.",
  "rationale": "2–3 lines explaining why this verdict was chosen.",
  "strengths": [
    "Strong insider buying",
    "Bullish EMA crossover", 
    "etc."
  ],
  "weaknesses": [
    "High valuation vs. peers",
    "Low growth compared to sector"
    "etc."
  ],
  "summary": "2–4 line synthesis of fundamentals, technicals, and sentiment. + advice for the user based on strength and weakness.",
}}

Do not include any extra text, markdown, or commentary outside the JSON object.

Here is all the data for {ticker}. Use it to generate your analysis.

{user_section}

Final Scores (0–100):
• Composite Score: {final_scores.get('score', 'N/A')}
• Fundamental Score: {final_scores.get('fundamentals', 'N/A')}
• Technical Score: {final_scores.get('technical', 'N/A')}
• Sentiment Score: {final_scores.get('sentiment', 'N/A')}
• Insider Score: {final_scores.get('insider', 'N/A')}

{tech_section}
{fund_section}
{peer_section}
"""
