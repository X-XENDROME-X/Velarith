"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  fetchTrending,
  fetchSearch,
  type MarketCard as MarketCardData,
  type MarketCategory,
} from "@/lib/api/backend";
import { CategoryChips } from "./CategoryChips";
import { MarketGrid, MarketGridSkeleton } from "./MarketGrid";

type SortKey = "volume" | "movers" | "liquidity" | "endingSoon";

interface DiscoverTabProps {
  initialQuery?: string;
  initialCategory?: MarketCategory | null;
}

export function DiscoverTab({
  initialQuery = "",
  initialCategory = null,
}: DiscoverTabProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [category, setCategory] = useState<MarketCategory | null>(initialCategory);
  const [sort, setSort] = useState<SortKey>("volume");
  const [markets, setMarkets] = useState<MarketCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch whenever the debounced query or category changes.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const q = debounced.trim();
    const task =
      q.length > 0
        ? fetchSearch({ q, category: category ?? undefined, limit: 50, signal: ctrl.signal })
        : fetchTrending({ limit: 50, category: category ?? undefined, signal: ctrl.signal });
    task
      .then((r) => setMarkets(r.markets))
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load markets");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced, category]);

  const sorted = useMemo(() => {
    const copy = [...markets];
    switch (sort) {
      case "volume":
        copy.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case "movers":
        copy.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        break;
      case "liquidity":
        copy.sort((a, b) => b.liquidity - a.liquidity);
        break;
      case "endingSoon":
        copy.sort((a, b) => {
          const ta = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const tb = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return ta - tb;
        });
        break;
    }
    return copy;
  }, [markets, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets — Fed, Trump, Bitcoin…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 transition focus:border-cyan-500/50 focus:bg-white/[0.05] focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80 transition focus:border-cyan-500/50 focus:outline-none sm:w-44"
        >
          <option value="volume">Top volume</option>
          <option value="movers">Biggest movers</option>
          <option value="liquidity">Most liquid</option>
          <option value="endingSoon">Ending soon</option>
        </select>
      </div>

      <CategoryChips selected={category} onSelect={setCategory} />

      {loading ? (
        <MarketGridSkeleton count={8} />
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : (
        <>
          <div className="text-xs text-white/40">
            {sorted.length} {sorted.length === 1 ? "market" : "markets"}
          </div>
          <MarketGrid
            markets={sorted}
            emptyLabel={debounced ? `No markets match "${debounced}".` : "No markets found."}
          />
        </>
      )}
    </div>
  );
}
