import { NextRequest, NextResponse } from "next/server";

// Mock search results - replace with real API
const MOCK_STOCKS = [
	{ symbol: "AAPL", name: "Apple Inc.", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "MSFT", name: "Microsoft Corporation", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "GOOGL", name: "Alphabet Inc.", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "AMZN", name: "Amazon.com Inc.", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "NVDA", name: "NVIDIA Corporation", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "META", name: "Meta Platforms Inc.", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "TSLA", name: "Tesla Inc.", type: "Common Stock", exchange: "NASDAQ" },
	{ symbol: "JPM", name: "JPMorgan Chase & Co.", type: "Common Stock", exchange: "NYSE" },
	{ symbol: "V", name: "Visa Inc.", type: "Common Stock", exchange: "NYSE" },
	{ symbol: "WMT", name: "Walmart Inc.", type: "Common Stock", exchange: "NYSE" },
];

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q")?.toLowerCase() || "";

	try {
		// In production, use Finnhub symbol search:
		// const apiKey = process.env.FINNHUB_API_KEY;
		// const response = await fetch(
		//   `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`
		// );
		// const data = await response.json();

		const results = MOCK_STOCKS.filter(
			(stock) =>
				stock.symbol.toLowerCase().includes(query) ||
				stock.name.toLowerCase().includes(query),
		).slice(0, 8);

		return NextResponse.json(results);
	} catch (error) {
		console.error("Error searching stocks:", error);
		return NextResponse.json({ error: "Failed to search stocks" }, { status: 500 });
	}
}
