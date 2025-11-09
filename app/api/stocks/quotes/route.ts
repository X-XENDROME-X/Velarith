import { NextRequest, NextResponse } from "next/server";

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY; // store in .env.local

// Simple in-memory cache
const CACHE_TTL = 30 * 1000; // 30 seconds
let cache: Record<string, { data: any; timestamp: number }> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",") || [];

  if (symbols.length === 0)
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  if (!API_KEY)
    return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });

  try {
    const now = Date.now();
    const results: any[] = [];
    const missing: string[] = [];

    // Check cache first
    for (const s of symbols) {
      const cached = cache[s];
      if (cached && now - cached.timestamp < CACHE_TTL) {
        results.push(cached.data);
      } else {
        missing.push(s);
      }
    }

    // Fetch missing symbols
    if (missing.length > 0) {
      const fetched: any[] = [];
      for (const symbol of missing) {
        const res = await fetch(
          `${FINNHUB_BASE}/quote?symbol=${symbol}&token=${API_KEY}`,
          { cache: "no-store" }
        );
        if (!res.ok) continue;
        const data = await res.json();

        const mapped = {
          symbol,
          name: symbol,
          price: data.c ?? 0, // current price
          change: data.d ?? 0, // change
          changePercent: data.dp ?? 0, // change percent

        };

        cache[symbol] = { data: mapped, timestamp: now };
        fetched.push(mapped);
      }
      results.push(...fetched);
    }

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("Error fetching Finnhub quotes:", err);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
