import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const symbol = searchParams.get("symbol") || "AAPL";

	try {
		// Mock sentiment data - in production, analyze news from Finnhub or similar
		const sentiment = {
			positive: 9,
			neutral: 7,
			negative: 1,
		};

		return NextResponse.json(sentiment);
	} catch (error) {
		console.error("Error fetching sentiment:", error);
		return NextResponse.json({ error: "Failed to fetch sentiment" }, { status: 500 });
	}
}
