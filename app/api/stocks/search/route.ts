import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    q
  )}&quotesCount=6&newsCount=0`;

  try {
    const res = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0", // Required to avoid blocking
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Yahoo request failed: ${res.status}`);
    }

    const data = await res.json();

    // ✅ Normalize Yahoo's output for frontend
    const results =
      data?.quotes?.map((item: any) => ({
        symbol: item.symbol,
        name: item.longname || item.shortname || "Unknown",
        exchange: item.exchange || "N/A",
      })) || [];

    return NextResponse.json(results);
  } catch (err) {
    console.error("Yahoo search failed:", err);
    return NextResponse.json({ error: "Yahoo fetch failed" }, { status: 500 });
  }
}
