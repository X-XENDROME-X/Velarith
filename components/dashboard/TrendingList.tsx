"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";
import { fetchTrending, type MarketCard as MarketCardData } from "@/lib/api/backend";
import { CategoryBadge } from "@/components/markets/CategoryBadge";
import { formatPercent, formatVolume, formatChange } from "@/components/markets/format";
import { RetryError } from "@/components/ui/RetryError";
import { BackendWakingHint } from "@/components/ui/BackendWakingHint";
import { cn } from "@/lib/utils";

export function TrendingList() {
  const [markets, setMarkets] = useState<MarketCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchTrending({ limit: 8, signal: ctrl.signal })
      .then((r) => {
        setMarkets(r.markets);
        setError(null);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [reload]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
            Trending by volume
          </h2>
        </div>
        <Link
          href="/markets"
          className="text-[11px] font-medium text-white/60 transition hover:text-white"
        >
          View all →
        </Link>
      </div>

      {loading && (
        <div className="space-y-2">
          <BackendWakingHint loading={loading} compact />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}

      {!!error && !loading && (
        <RetryError
          title="Couldn't load trending markets."
          error={error}
          onRetry={() => setReload((n) => n + 1)}
          loading={loading}
          compact
        />
      )}

      {!loading && !error && (
        <div className="space-y-1.5">
          {markets.map((m) => {
            const positive = m.change24h >= 0;
            return (
              <Link
                key={m.slug}
                href={`/markets/${m.slug}`}
                className="flex min-h-[48px] items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/[0.03] active:bg-white/[0.05] sm:gap-3 sm:px-3"
              >
                {m.image ? (
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-white/10">
                    <Image src={m.image} alt="" fill sizes="32px" className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="size-8 shrink-0 rounded-md border border-white/10 bg-white/5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-white sm:text-sm">{m.question}</p>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px] text-white/50">
                    <CategoryBadge category={m.category} />
                    <span className="truncate">Vol {formatVolume(m.volume24h)}</span>
                  </div>
                </div>
                <div className="ml-2 flex w-14 shrink-0 flex-col items-end text-[11px]">
                  <span className="font-semibold text-emerald-300">{formatPercent(m.yesPrice)}</span>
                  <span
                    className={cn(
                      "font-medium",
                      positive ? "text-emerald-400/80" : "text-rose-400/80",
                    )}
                  >
                    {formatChange(m.change24h)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
