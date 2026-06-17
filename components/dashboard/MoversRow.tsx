"use client";

import { useEffect, useState } from "react";
import { fetchMovers, type MarketCard as MarketCardData } from "@/lib/api/backend";
import { MarketCard } from "@/components/markets/MarketCard";
import { TrendingUp } from "lucide-react";
import { RetryError } from "@/components/ui/RetryError";
import { BackendWakingHint } from "@/components/ui/BackendWakingHint";

export function MoversRow() {
  const [movers, setMovers] = useState<MarketCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
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
        setError(e);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [reload]);

  return (
    <section className="w-full max-w-full min-w-0 overflow-x-clip">
      {/* Change start: keep movers grid constrained on small screens */}
      <div className="mb-3 flex min-w-0 items-baseline justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <TrendingUp className="size-4 shrink-0 text-emerald-400" />
          <h2 className="truncate text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80 min-[380px]:text-sm min-[380px]:tracking-[0.15em]">
            Top movers · 24h
          </h2>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <BackendWakingHint loading={loading} />
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[200px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      )}

      {!!error && !loading && (
        <RetryError
          title="Couldn't load movers."
          error={error}
          onRetry={() => setReload((n) => n + 1)}
          loading={loading}
        />
      )}

      {!loading && !error && (
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {movers.map((m) => (
            <MarketCard key={m.slug} market={m} />
          ))}
        </div>
      )}
      {/* Change end: keep movers grid constrained on small screens */}
    </section>
  );
}
