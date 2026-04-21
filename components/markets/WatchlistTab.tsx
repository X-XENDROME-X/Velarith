"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Star, LineChart as LineIcon } from "lucide-react";
import { fetchMarket, type MarketCard as MarketCardData } from "@/lib/api/backend";
import { MarketCard } from "./MarketCard";
import { MarketGridSkeleton } from "./MarketGrid";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { TickerAutocomplete } from "./TickerAutocomplete";
import { RetryError } from "@/components/ui/RetryError";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function WatchlistTab() {
  const { markets: watchMarkets, tickers, hydrated, removeTicker } = useWatchlist();
  const [liveMarkets, setLiveMarkets] = useState<MarketCardData[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [reload, setReload] = useState(0);

  // Refresh live market data whenever the saved slugs change.
  useEffect(() => {
    if (!hydrated || watchMarkets.length === 0) {
      setLiveMarkets([]);
      setMarketsError(null);
      return;
    }
    const ctrl = new AbortController();
    setMarketsLoading(true);
    setMarketsError(null);
    Promise.all(
      watchMarkets.map((m) =>
        fetchMarket(m.slug, { signal: ctrl.signal }).catch((e) => {
          if (e?.name === "AbortError") throw e;
          return null;
        }),
      ),
    )
      .then((results) => {
        const live: MarketCardData[] = [];
        for (const r of results) {
          if (r) {
            live.push({
              slug: r.slug,
              question: r.question,
              category: r.category,
              yesPrice: r.yesPrice,
              noPrice: r.noPrice,
              volume24h: r.volume24h,
              liquidity: r.liquidity,
              change24h: r.change24h,
              endDate: r.endDate,
              image: r.image,
            });
          }
        }
        setLiveMarkets(live);
        if (results.length > 0 && live.length === 0) {
          setMarketsError("Couldn't refresh any watched markets.");
        }
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setMarketsError(e?.message ?? "Couldn't refresh watched markets.");
      })
      .finally(() => setMarketsLoading(false));
    return () => ctrl.abort();
  }, [hydrated, watchMarkets, reload]);

  // Refresh ticker quotes.
  useEffect(() => {
    if (!hydrated || tickers.length === 0) {
      setQuotes([]);
      return;
    }
    const ctrl = new AbortController();
    setQuotesLoading(true);
    const symbols = tickers.map((t) => t.symbol).join(",");
    fetch(`/api/stocks/quotes?symbols=${encodeURIComponent(symbols)}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setQuotes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setQuotesLoading(false));
    return () => ctrl.abort();
  }, [hydrated, tickers]);

  if (!hydrated) return <MarketGridSkeleton count={4} />;

  const empty = watchMarkets.length === 0 && tickers.length === 0;

  return (
    <div className="space-y-6">
      {empty && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Star className="mx-auto size-6 text-white/30" />
          <p className="mt-3 text-sm text-white/60">
            Your watchlist is empty. Star a market card or add a ticker below.
          </p>
        </div>
      )}

      {/* Markets block */}
      {watchMarkets.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
              Markets
            </h2>
            <span className="text-xs text-white/40">{watchMarkets.length}</span>
          </div>
          {marketsLoading && liveMarkets.length === 0 ? (
            <MarketGridSkeleton count={Math.min(4, watchMarkets.length)} />
          ) : marketsError && liveMarkets.length === 0 ? (
            <RetryError
              title="Couldn't refresh your watchlist."
              description="Backend may be cold-starting. Try again."
              onRetry={() => setReload((n) => n + 1)}
              loading={marketsLoading}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {liveMarkets.map((m) => (
                <MarketCard key={m.slug} market={m} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tickers block */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
            Tickers
          </h2>
          <span className="text-xs text-white/40">{tickers.length}</span>
        </div>

        <TickerAutocomplete className="mb-3" />

        {tickers.length > 0 && (
          <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
            {tickers.map((t) => {
              const q = quotes.find((x) => x.symbol === t.symbol);
              const positive = (q?.changePercent ?? 0) >= 0;
              return (
                <div
                  key={t.symbol}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link
                    href={`/research?ticker=${t.symbol}`}
                    className="flex flex-1 items-center gap-3 text-white transition hover:text-cyan-300"
                  >
                    <div className="grid size-9 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-200">
                      {t.symbol.slice(0, 4)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">${t.symbol}</p>
                      <p className="text-[11px] text-white/40">
                        Added {new Date(t.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  {q ? (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">${q.price.toFixed(2)}</p>
                      <p
                        className={
                          positive
                            ? "text-[11px] font-medium text-emerald-300"
                            : "text-[11px] font-medium text-rose-300"
                        }
                      >
                        {positive ? "+" : ""}
                        {q.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-white/30">
                      {quotesLoading ? "…" : "—"}
                    </span>
                  )}
                  <Link
                    href={`/markets?q=${encodeURIComponent(t.symbol)}`}
                    aria-label={`Find markets related to ${t.symbol}`}
                    title="Find related markets"
                    className="rounded-lg border border-white/10 p-2 text-white/40 transition hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    <LineIcon className="size-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeTicker(t.symbol)}
                    aria-label={`Remove ${t.symbol}`}
                    className="rounded-lg border border-white/10 p-2 text-white/40 transition hover:border-rose-500/40 hover:text-rose-300"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
