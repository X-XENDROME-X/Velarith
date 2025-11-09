import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const symbol = searchParams.get("symbol") || "AAPL";

	try {
		// Mock fundamental data - in production, fetch from financial APIs
		const fundamentals = {
			pbRatio: 53.79,
			trailingPE: 35.99,
			forwardPE: 32.31,
			marketCap: "$3967.0B",
			earningsGrowth: 0.912,
			revenueGrowth: 0.079,
		};

		return NextResponse.json(fundamentals);
	} catch (error) {
		console.error("Error fetching fundamentals:", error);
		return NextResponse.json({ error: "Failed to fetch fundamentals" }, { status: 500 });
	}
}
