"use client";

import { useEffect, useState } from "react";
import { fetchMovers, type MarketCard as MarketCardData } from "@/lib/api/backend";
import { MarketCard } from "@/components/markets/MarketCard";
import { TrendingUp } from "lucide-react";
import { RetryError } from "@/components/ui/RetryError";

export function MoversRow() {
  const [movers, setMovers] = useState<MarketCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchMovers({ limit: 4, signal: ctrl.signal })
      .then((r) => {
        setMovers(r.markets);
        setError(null);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load movers");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [reload]);

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-400" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
            Top movers · 24h
          </h2>
        </div>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <RetryError
          title="Couldn't load movers."
          description="Backend may still be waking up."
          onRetry={() => setReload((n) => n + 1)}
          loading={loading}
        />
      )}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {movers.map((m) => (
            <MarketCard key={m.slug} market={m} />
          ))}
        </div>
      )}
    </section>
  );
}
