"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart as LineIcon, Plus, Check } from "lucide-react";
import { fetchRelatedTickers, type RelatedTicker } from "@/lib/api/backend";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { RetryError } from "@/components/ui/RetryError";
import { cn } from "@/lib/utils";

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface RelatedTickersPanelProps {
  slug: string;
}

export function RelatedTickersPanel({ slug }: RelatedTickersPanelProps) {
  const [tickers, setTickers] = useState<RelatedTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [reload, setReload] = useState(0);
  const { addTicker, isTickerSaved } = useWatchlist();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchRelatedTickers(slug, { signal: ctrl.signal })
      .then((r) => {
        setTickers(r.tickers);
        setError(null);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load related tickers");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [slug, reload]);

  useEffect(() => {
    if (tickers.length === 0) return;
    const ctrl = new AbortController();
    const symbols = tickers.map((t) => t.symbol).join(",");
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
  }, [tickers]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <LineIcon className="size-4 text-cyan-300" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Evidence · related tickers
        </p>
      </div>
      <p className="mt-1 text-xs text-white/50">
        AI-extracted equities whose fundamentals move with this market.
      </p>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-4">
          <RetryError
            title="Couldn't extract related tickers."
            description="This call is AI-backed — Claude may be busy. Try again."
            onRetry={() => setReload((n) => n + 1)}
            loading={loading}
            compact
          />
        </div>
      )}

      {!loading && !error && tickers.length === 0 && (
        <p className="mt-4 text-xs text-white/40">
          No clear public-equity linkage for this market.
        </p>
      )}

      {!loading && tickers.length > 0 && (
        <div className="mt-4 space-y-2">
          {tickers.map((t) => {
            const q = quotes[t.symbol];
            const positive = (q?.changePercent ?? 0) >= 0;
            const saved = isTickerSaved(t.symbol);
            return (
              <div
                key={t.symbol}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/research?ticker=${t.symbol}`}
                    className="grid size-10 shrink-0 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-200 transition group-hover:border-cyan-400/60"
                    title="Open in Research"
                  >
                    {t.symbol.slice(0, 4)}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/research?ticker=${t.symbol}`}
                        className="text-sm font-semibold text-white transition hover:text-cyan-300"
                      >
                        ${t.symbol}
                      </Link>
                      {q && (
                        <div className="text-right text-[11px]">
                          <span className="font-semibold text-white">
                            ${q.price.toFixed(2)}
                          </span>
                          <span
                            className={cn(
                              "ml-2 font-medium",
                              positive ? "text-emerald-300" : "text-rose-300",
                            )}
                          >
                            {positive ? "+" : ""}
                            {q.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                    {t.rationale && (
                      <p className="mt-1 text-xs leading-snug text-white/60">{t.rationale}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400"
                          style={{ width: `${Math.min(100, t.relevance * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40">
                        {(t.relevance * 100).toFixed(0)}% relevance
                      </span>
                      <button
                        type="button"
                        onClick={() => addTicker(t.symbol)}
                        disabled={saved}
                        className={cn(
                          "ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition",
                          saved
                            ? "cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-white/15 bg-white/5 text-white/70 hover:border-cyan-500/40 hover:text-cyan-200",
                        )}
                      >
                        {saved ? <Check className="size-3" /> : <Plus className="size-3" />}
                        {saved ? "Saved" : "Watch"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
