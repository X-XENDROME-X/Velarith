import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const symbol = searchParams.get("symbol") || "AAPL";

	try {
		// Mock score breakdown
		const score = {
			fundamentals: 0.672,
			technical: 0.728,
			news: 0.195,
			insider: 0.5,
			finalScore: 0.6183,
		};

		return NextResponse.json(score);
	} catch (error) {
		console.error("Error fetching score:", error);
		return NextResponse.json({ error: "Failed to fetch score" }, { status: 500 });
	}
}
