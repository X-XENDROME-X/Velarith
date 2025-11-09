import { NextRequest, NextResponse } from "next/server";

// Mock data for demonstration - replace with real API calls
const MOCK_QUOTES = {
	AAPL: { price: 268.47, change: -1.30, changePercent: -0.48, name: "Apple Inc." },
	NVDA: { price: 188.15, change: 0.07, changePercent: 0.04, name: "NVIDIA Corporation" },
	MSFT: { price: 496.82, change: -0.28, changePercent: -0.06, name: "Microsoft Corporation" },
	AMZN: { price: 244.41, change: 1.3, changePercent: 0.53, name: "Amazon.com Inc." },
	GOOGL: { price: 201.52, change: 2.15, changePercent: 1.08, name: "Alphabet Inc." },
	META: { price: 638.42, change: -3.25, changePercent: -0.51, name: "Meta Platforms Inc." },
	TSLA: { price: 436.23, change: 8.45, changePercent: 1.98, name: "Tesla Inc." },
	NFLX: { price: 915.37, change: -5.62, changePercent: -0.61, name: "Netflix Inc." },
};

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const symbols = searchParams.get("symbols")?.split(",") || [];

	try {
		// In production, fetch real-time data from Finnhub, Alpha Vantage, or Polygon.io
		// Example with Finnhub:
		// const apiKey = process.env.FINNHUB_API_KEY;
		// const promises = symbols.map(symbol =>
		//   fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`)
		// );
		// const responses = await Promise.all(promises);
		// const quotes = await Promise.all(responses.map(r => r.json()));

		const quotes = symbols.map((symbol) => {
			const data = MOCK_QUOTES[symbol.toUpperCase() as keyof typeof MOCK_QUOTES];
			return {
				symbol: symbol.toUpperCase(),
				name: data?.name || symbol,
				price: data?.price || 0,
				change: data?.change || 0,
				changePercent: data?.changePercent || 0,
				logo: undefined, // Add logo URLs if available
			};
		});

		return NextResponse.json(quotes);
	} catch (error) {
		console.error("Error fetching quotes:", error);
		return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
	}
}
