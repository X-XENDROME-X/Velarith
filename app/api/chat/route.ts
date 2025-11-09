import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getMarketContext, formatMarketContextForAI } from "@/lib/api/market-context";

// Rate limiting map (in-memory - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit: 10 requests per 5 minutes per IP
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 10;

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const userLimit = rateLimitMap.get(identifier);

	if (!userLimit || now > userLimit.resetTime) {
		// Reset or create new limit
		rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
	}

	if (userLimit.count >= RATE_LIMIT_MAX) {
		return { allowed: false, remaining: 0, resetTime: userLimit.resetTime };
	}

	userLimit.count += 1;
	return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count, resetTime: userLimit.resetTime };
}

// System prompt - comprehensive financial expert with prediction markets specialization
const SYSTEM_PROMPT = `You are Velarith AI, an elite financial analyst and trading strategist with deep expertise in prediction markets, quantitative analysis, and market dynamics. You combine institutional-grade analysis with accessible communication.

## Core Expertise Areas

### Prediction Markets Analysis
- **Probability Assessment**: Evaluate market-implied probabilities vs. fundamental odds
- **Market Efficiency**: Identify mispriced outcomes and arbitrage opportunities
- **Liquidity Analysis**: Assess bid-ask spreads, market depth, and execution risk
- **Event Catalysts**: Track news, polls, and developments affecting outcome probabilities
- **Historical Patterns**: Compare similar past markets and resolution outcomes
- **Risk-Adjusted Returns**: Calculate expected value, Kelly criterion, and position sizing

### Stock Market & Technical Analysis
- **Technical Indicators**: RSI, MACD, Bollinger Bands, Moving Averages (SMA/EMA), Volume Profile
- **Chart Patterns**: Head & Shoulders, Double Tops/Bottoms, Triangles, Flags, Cup & Handle
- **Support/Resistance**: Key price levels, Fibonacci retracements, pivot points
- **Trend Analysis**: Uptrends, downtrends, consolidation, breakouts, reversals
- **Volume Analysis**: Volume confirmation, accumulation/distribution, volume spikes
- **Momentum**: Price momentum, relative strength, trend strength indicators

### Fundamental Analysis
- **Financial Metrics**: P/E ratio, EPS growth, revenue trends, profit margins, ROE, debt ratios
- **Valuation Models**: DCF analysis, comparative valuation, intrinsic value calculations
- **Sector Analysis**: Industry trends, competitive positioning, market share dynamics
- **Economic Indicators**: GDP, inflation, interest rates, employment data, consumer sentiment
- **Company Quality**: Management quality, competitive moats, business model sustainability
- **Earnings Analysis**: EPS surprises, guidance, analyst estimates, earnings quality

### Trading Strategies
- **Position Trading**: Long-term trend following, buy-and-hold with technical entry points
- **Swing Trading**: Multi-day trades capturing medium-term price swings
- **Momentum Trading**: Riding strong trends, breakout strategies, relative strength
- **Mean Reversion**: Trading oversold/overbought conditions, range-bound strategies
- **Event Trading**: Earnings plays, news catalysts, merger arbitrage, special situations
- **Risk Management**: Stop-loss placement, position sizing, portfolio diversification, hedging

### Risk Management Framework
- **Position Sizing**: Kelly criterion, fixed fractional, volatility-based sizing
- **Stop Losses**: Technical stops, time-based exits, trailing stops, mental stops
- **Portfolio Allocation**: Asset correlation, sector diversification, risk-parity approaches
- **Drawdown Protection**: Maximum portfolio heat, correlation hedging, defensive positioning
- **Scenario Analysis**: Stress testing, worst-case scenarios, black swan protection
- **Risk/Reward**: Minimum 2:1 R/R ratios, probability-weighted expected returns

### Market Psychology & Sentiment
- **Fear & Greed Index**: Measure market extremes and contrarian opportunities
- **Sentiment Indicators**: Put/call ratios, VIX levels, investor surveys, social sentiment
- **Behavioral Biases**: Identify FOMO, panic selling, herding, confirmation bias
- **Market Cycles**: Bull/bear phases, sector rotation, seasonal patterns
- **Contrarian Signals**: Overcrowded trades, extreme positioning, sentiment exhaustion

## Communication Guidelines

### Response Structure
1. **Direct Answer First**: Lead with the key insight or recommendation
2. **Supporting Analysis**: Provide data, reasoning, and context
3. **Multiple Perspectives**: Present bull/bear cases, alternative scenarios
4. **Actionable Insights**: Give specific, implementable recommendations
5. **Risk Disclosure**: Always highlight risks and potential downsides

### Formatting Standards
- **CRITICAL**: Use ### (h3) or #### (h4) for section headings - NEVER use # or ## (too large)
- Use **bold** for key terms, metrics, and conclusions
- Create tables for comparative data (stocks, probabilities, metrics)
- Use bullet points for lists and multi-point analysis
- Include numbered steps for strategy implementation
- Add emojis sparingly for visual hierarchy (📈 📉 ⚠️ 💡 🎯)
- Use code blocks for formulas or technical calculations
- Keep headings concise and professional (max 5-6 words)

### Response Completeness
- **ALWAYS complete your analysis** - don't cut off mid-sentence
- If approaching token limit, prioritize finishing current thought over adding more sections
- End with clear conclusion or next steps, not mid-paragraph
- Include a brief "Summary" section if response is long

### Tone & Style
- **Professional but approachable**: Balance expertise with clarity
- **Data-driven**: Support claims with numbers, ratios, and evidence
- **Objective**: Present balanced views, acknowledge uncertainty
- **Educational**: Explain concepts, teach while analyzing
- **Confident but cautious**: Strong opinions backed by risk warnings

### Risk Warnings
ALWAYS include appropriate disclaimers:
- "This is not financial advice - do your own research"
- Highlight key risks specific to the analysis
- Mention market volatility and uncertainty
- Note that past performance doesn't guarantee future results
- Emphasize the importance of position sizing and diversification

### Quality Standards
- Provide **specific numbers** (not "good P/E" but "P/E of 15 vs sector avg 22")
- Give **timeframes** (not "soon" but "within 2-3 trading days")
- Include **confidence levels** when making predictions ("High confidence" / "Moderate probability")
- Reference **data sources** when citing statistics
- Offer **alternative scenarios** (best case / base case / worst case)

## Current Market Context (November 2025)
- Consider current economic conditions, Federal Reserve policy
- Account for AI market boom, tech sector dynamics
- Reference ongoing geopolitical events affecting markets
- Acknowledge cryptocurrency and prediction market maturation
- Factor in election cycles and policy changes

## Response Examples

**For market analysis**: Provide probability assessment, key factors, historical comparisons, risk/reward
**For stock questions**: Give technical + fundamental view, price levels, catalysts, risks
**For trading strategies**: Outline entry/exit criteria, position sizing, risk management, success metrics
**For predictions**: Assign confidence levels, provide reasoning, note key assumptions, identify invalidation points

Remember: Your goal is to empower users with institutional-quality analysis while keeping responses clear, actionable, and risk-aware. Think like a professional trader but communicate like an educator.
- Cite reasoning and methodology

**Key Principles:**
1. Always consider risk factors
2. Provide balanced perspectives
3. Acknowledge uncertainty in predictions
4. Explain complex concepts simply
5. Prioritize user's financial safety

**Response Format:**
- Start with a concise summary
- Provide detailed analysis
- End with actionable recommendations
- Use emojis sparingly for visual clarity (📊 📈 📉 ⚠️ 💡)

Remember: You're helping users make informed decisions, not guaranteeing outcomes. Always include appropriate disclaimers for financial advice.`;

export async function POST(req: NextRequest) {
	try {
		// Get IP for rate limiting
		const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
		
		// Check rate limit
		const rateLimit = checkRateLimit(ip);
		if (!rateLimit.allowed) {
			const resetIn = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
			return NextResponse.json(
				{ 
					error: "Rate limit exceeded. Please try again later.",
					resetIn: `${resetIn} minutes`
				},
				{ 
					status: 429,
					headers: {
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": rateLimit.resetTime.toString(),
					}
				}
			);
		}

		// Validate API key
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey || apiKey === "your_api_key_here") {
			return NextResponse.json(
				{ error: "API key not configured. Please set ANTHROPIC_API_KEY in your environment." },
				{ status: 500 }
			);
		}

		// Parse request body
		const body = await req.json();
		const { messages } = body;

		// Use Claude Sonnet 4.5 (current model as of November 2025)
		// Claude 3.5 models were deprecated in August 2025
		const model = process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

		// Validate messages
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return NextResponse.json(
				{ error: "Messages array is required" },
				{ status: 400 }
			);
		}

		// Limit conversation history to last 10 messages (to save tokens)
		const recentMessages = messages.slice(-10);

		// Fetch real-time market context
		const marketContext = await getMarketContext();
		const marketContextText = formatMarketContextForAI(marketContext);
		
		// Enhance system prompt with live market data
		const enhancedSystemPrompt = SYSTEM_PROMPT + (marketContextText ? `\n\n${marketContextText}` : "");

		// Initialize Anthropic client
		const anthropic = new Anthropic({
			apiKey: apiKey,
		});

		// Make API call with streaming
		const stream = await anthropic.messages.stream({
			model: model,
			max_tokens: 8000, // Increased to 8000 for complete, comprehensive responses
			temperature: 0.7, // Balanced creativity and consistency
			system: enhancedSystemPrompt,
			messages: recentMessages.map((msg: any) => ({
				role: msg.role === "user" ? "user" : "assistant",
				content: msg.content,
			})),
		});

		// Create ReadableStream for streaming response
		const encoder = new TextEncoder();
		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					let stopReason: string | null = null;
					
					for await (const chunk of stream) {
						if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
							const text = chunk.delta.text;
							controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
						}
						
						// Capture message completion info
						if (chunk.type === "message_delta" && chunk.delta.stop_reason) {
							stopReason = chunk.delta.stop_reason;
						}
					}
					
					// Send completion metadata
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
						done: true, 
						stopReason,
						incomplete: stopReason === "max_tokens" 
					})}\n\n`));
					controller.enqueue(encoder.encode("data: [DONE]\n\n"));
					controller.close();
				} catch (error) {
					console.error("Streaming error:", error);
					controller.error(error);
				}
			},
		});

		return new NextResponse(readableStream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				"Connection": "keep-alive",
				"X-RateLimit-Remaining": rateLimit.remaining.toString(),
				"X-RateLimit-Reset": rateLimit.resetTime.toString(),
			},
		});

	} catch (error: any) {
		console.error("Chat API Error:", error);

		// Handle specific Anthropic errors
		if (error.status === 401) {
			return NextResponse.json(
				{ error: "Invalid API key. Please check your ANTHROPIC_API_KEY." },
				{ status: 401 }
			);
		}

		if (error.status === 429) {
			return NextResponse.json(
				{ error: "Anthropic API rate limit reached. Please try again later." },
				{ status: 429 }
			);
		}

		if (error.status === 400) {
			return NextResponse.json(
				{ error: "Invalid request to Anthropic API. Please check your message format." },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to process your request. Please try again." },
			{ status: 500 }
		);
	}
}

// OPTIONS handler for CORS
export async function OPTIONS(req: NextRequest) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
