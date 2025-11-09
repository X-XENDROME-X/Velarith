import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const symbol = searchParams.get("symbol") || "AAPL";

	try {
		// Mock technical indicators - in production, calculate from price data or use APIs
		const technicals = {
			rsi: 63.6,
			macd: 5.56,
			macdSignal: 5.71,
			sma50: 252.25,
			sma200: 224.11,
			trendZone: "Strong Bull",
			crossover: "Bullish Crossover",
			squeezeZone: "Expansion",
			lastCandle: "Bearish",
			volumeSpike: "No",
		};

		return NextResponse.json(technicals);
	} catch (error) {
		console.error("Error fetching technicals:", error);
		return NextResponse.json({ error: "Failed to fetch technical indicators" }, { status: 500 });
	}
}
