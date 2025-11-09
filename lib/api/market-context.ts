/**
 * Market Context API
 * Fetches real-time market data to enhance AI responses with current information
 */

interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

interface MarketContext {
  timestamp: string;
  majorIndices: MarketQuote[];
  topMovers: {
    gainers: MarketQuote[];
    losers: MarketQuote[];
  };
  summary: string;
}

/**
 * Fetch market data for a single symbol
 */
async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return null;

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    return {
      symbol,
      price: data.c || 0,
      change: data.d || 0,
      changePercent: data.dp || 0,
      high: data.h || 0,
      low: data.l || 0,
      volume: data.v || 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get comprehensive market context for AI responses
 */
export async function getMarketContext(): Promise<MarketContext> {
  try {
    // Major indices to track
    const indices = ["SPY", "QQQ", "DIA", "IWM"]; // S&P 500, NASDAQ, Dow, Russell 2000
    
    // Fetch all quotes in parallel
    const quotePromises = indices.map(symbol => fetchQuote(symbol));
    const quotes = await Promise.all(quotePromises);
    
    const validQuotes = quotes.filter((q): q is MarketQuote => q !== null);
    
    if (validQuotes.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        majorIndices: [],
        topMovers: { gainers: [], losers: [] },
        summary: "Market data currently unavailable",
      };
    }

    // Generate summary
    const spy = validQuotes.find(q => q.symbol === "SPY");
    const qqq = validQuotes.find(q => q.symbol === "QQQ");
    
    let marketTrend = "mixed";
    if (spy && qqq) {
      if (spy.changePercent > 0 && qqq.changePercent > 0) {
        marketTrend = "bullish";
      } else if (spy.changePercent < 0 && qqq.changePercent < 0) {
        marketTrend = "bearish";
      }
    }

    const summary = `Market is ${marketTrend}. ${
      spy ? `S&P 500 (SPY): ${spy.changePercent > 0 ? "+" : ""}${spy.changePercent.toFixed(2)}%` : ""
    }${qqq ? `, NASDAQ (QQQ): ${qqq.changePercent > 0 ? "+" : ""}${qqq.changePercent.toFixed(2)}%` : ""}`;

    return {
      timestamp: new Date().toISOString(),
      majorIndices: validQuotes,
      topMovers: {
        gainers: validQuotes.filter(q => q.changePercent > 0).slice(0, 3),
        losers: validQuotes.filter(q => q.changePercent < 0).slice(0, 3),
      },
      summary,
    };
  } catch (error) {
    console.error("Error fetching market context:", error);
    return {
      timestamp: new Date().toISOString(),
      majorIndices: [],
      topMovers: { gainers: [], losers: [] },
      summary: "Market data temporarily unavailable",
    };
  }
}

/**
 * Format market context for AI prompt injection
 */
export function formatMarketContextForAI(context: MarketContext): string {
  if (context.majorIndices.length === 0) {
    return "";
  }

  const indicesData = context.majorIndices
    .map(q => {
      const arrow = q.changePercent > 0 ? "📈" : q.changePercent < 0 ? "📉" : "➡️";
      return `${q.symbol}: $${q.price.toFixed(2)} (${q.changePercent > 0 ? "+" : ""}${q.changePercent.toFixed(2)}%) ${arrow}`;
    })
    .join("\n");

  return `
## Real-Time Market Data (${new Date(context.timestamp).toLocaleString()})

**Major Indices:**
${indicesData}

**Market Summary:** ${context.summary}

Use this live data to provide current, accurate market insights.
`;
}
