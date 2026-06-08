"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { useWatchlist, type WatchlistMarket, type WatchlistTicker } from "@/lib/hooks/useWatchlist";
import { fetchMarket, type MarketDetail, type MarketCategory } from "@/lib/api/backend";
import { CategoryBadge } from "@/components/markets/CategoryBadge";
import { formatPercent, formatChange } from "@/components/markets/format";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 4;

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function WatchlistSnapshot() {
  const { markets, tickers, hydrated } = useWatchlist();
  const [liveMarkets, setLiveMarkets] = useState<Record<string, MarketDetail>>({});
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});

  // Fetch live odds for each saved market.
  useEffect(() => {
    if (!hydrated || markets.length === 0) {
      setLiveMarkets({});
      return;
    }
    const ctrl = new AbortController();
    Promise.all(
      markets.slice(0, MAX_ITEMS).map((m) =>
        fetchMarket(m.slug, { signal: ctrl.signal }).catch(() => null),
      ),
    ).then((results) => {
      const map: Record<string, MarketDetail> = {};
      for (const r of results) {
        if (r) map[r.slug] = r;
      }
      setLiveMarkets(map);
    });
    return () => ctrl.abort();
  }, [hydrated, markets]);

  // Fetch live stock quotes for saved tickers.
  useEffect(() => {
    if (!hydrated || tickers.length === 0) {
      setQuotes({});
      return;
    }
    const ctrl = new AbortController();
    const symbols = tickers
      .slice(0, MAX_ITEMS)
      .map((t) => t.symbol)
      .join(",");
    fetch(`/api/stocks/quotes?symbols=${encodeURIComponent(symbols)}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: StockQuote[]) => {
        const map: Record<string, StockQuote> = {};
        for (const q of data) map[q.symbol] = q;
        setQuotes(map);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [hydrated, tickers]);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-white/5" />
          <div className="h-10 animate-pulse rounded-lg bg-white/5" />
        </div>
      </div>
    );
  }

  const hasAny = markets.length > 0 || tickers.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
          <Star className="size-3.5 fill-current" />
          Watchlist
        </div>
        {hasAny && (
          <Link
            href="/markets?tab=watchlist"
            className="text-[11px] font-medium text-white/60 transition hover:text-white"
          >
            View all →
          </Link>
        )}
      </div>

      {!hasAny ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-white/60">Star a market or add a ticker to pin it here.</p>
          <Link
            href="/markets"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Browse markets <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {markets.length > 0 && (
            <MarketRows markets={markets.slice(0, MAX_ITEMS)} liveMarkets={liveMarkets} />
          )}
          {tickers.length > 0 && (
            <TickerRows tickers={tickers.slice(0, MAX_ITEMS)} quotes={quotes} />
          )}
        </div>
      )}
    </div>
  );
}

// --- Sub-components ----------------------------------------------------------

function MarketRows({
  markets,
  liveMarkets,
}: {
  markets: WatchlistMarket[];
  liveMarkets: Record<string, MarketDetail>;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
        Markets
      </p>
      <div className="space-y-1.5">
        {markets.map((m) => {
          const live = liveMarkets[m.slug];
          const positive = (live?.change24h ?? 0) >= 0;
          return (
            <Link
              key={m.slug}
              href={`/markets/${m.slug}`}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-white/15 hover:bg-white/[0.05] active:bg-white/[0.08]"
            >
              <CategoryBadge category={(live?.category ?? m.category) as MarketCategory} />
              <span className="flex-1 truncate text-xs text-white/80">
                {live?.question ?? m.question}
              </span>
              {live ? (
                <div className="flex shrink-0 flex-col items-end text-[11px]">
                  <span className="font-semibold text-emerald-300">
                    {formatPercent(live.yesPrice)}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      positive ? "text-emerald-400/80" : "text-rose-400/80",
                    )}
                  >
                    {formatChange(live.change24h)}
                  </span>
                </div>
              ) : (
                <div className="h-7 w-12 animate-pulse rounded bg-white/5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TickerRows({
  tickers,
  quotes,
}: {
  tickers: WatchlistTicker[];
  quotes: Record<string, StockQuote>;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
        Tickers
      </p>
      <div className="space-y-1.5">
        {tickers.map((t) => {
          const q = quotes[t.symbol];
          const positive = (q?.changePercent ?? 0) >= 0;
          return (
            <Link
              key={t.symbol}
              href={`/research?ticker=${t.symbol}`}
              className="flex min-h-[40px] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-white/15 hover:bg-white/[0.05] active:bg-white/[0.08]"
            >
              <div className="grid size-6 shrink-0 place-items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 text-[9px] font-bold text-cyan-200">
                {t.symbol.slice(0, 4)}
              </div>
              <span className="flex-1 text-xs font-semibold text-white/80">${t.symbol}</span>
              {q ? (
                <div className="flex shrink-0 flex-col items-end text-[11px]">
                  <span className="font-semibold text-white">${q.price.toFixed(2)}</span>
                  <span
                    className={cn(
                      "font-medium",
                      positive ? "text-emerald-400/80" : "text-rose-400/80",
                    )}
                  >
                    {positive ? "+" : ""}
                    {q.changePercent.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <div className="h-7 w-14 animate-pulse rounded bg-white/5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
