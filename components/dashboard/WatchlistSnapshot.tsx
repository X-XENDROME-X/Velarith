"use client";

import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { CategoryBadge } from "@/components/markets/CategoryBadge";
import type { MarketCategory } from "@/lib/api/backend";

const MAX_ITEMS = 4;

export function WatchlistSnapshot() {
  const { markets, tickers, hydrated } = useWatchlist();

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
          <p className="text-xs text-white/60">
            Star a market or add a ticker to pin it here.
          </p>
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
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Markets
              </p>
              <div className="space-y-1.5">
                {markets.slice(0, MAX_ITEMS).map((m) => (
                  <Link
                    key={m.slug}
                    href={`/markets/${m.slug}`}
                    className="flex min-h-[44px] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-white/15 hover:bg-white/[0.05] active:bg-white/[0.08]"
                  >
                    <CategoryBadge category={m.category as MarketCategory} />
                    <span className="flex-1 truncate text-xs text-white/80">{m.question}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tickers.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Tickers
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tickers.slice(0, 8).map((t) => (
                  <Link
                    key={t.symbol}
                    href={`/research?ticker=${t.symbol}`}
                    className="inline-flex min-h-[36px] items-center rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 active:scale-95"
                  >
                    ${t.symbol}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
