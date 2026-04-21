"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/lib/hooks/useWatchlist";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface TickerAutocompleteProps {
  className?: string;
}

export function TickerAutocomplete({ className }: TickerAutocompleteProps) {
  const { addTicker, isTickerSaved } = useWatchlist();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data.slice(0, 6) : []);
          setOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const handleAdd = (symbol: string) => {
    addTicker(symbol);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) handleAdd(query.trim().toUpperCase());
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setOpen(true)}
            placeholder="Add a ticker — AAPL, NVDA, SPY…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/40 transition focus:border-cyan-500/50 focus:bg-white/[0.05] focus:outline-none"
          />
          {loading && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" /> Add
        </button>
      </form>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-md">
          {results.map((r) => {
            const saved = isTickerSaved(r.symbol);
            return (
              <button
                key={`${r.symbol}-${r.exchange}`}
                type="button"
                onClick={() => !saved && handleAdd(r.symbol)}
                disabled={saved}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition",
                  saved
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-white/[0.05]",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{r.symbol}</p>
                  <p className="truncate text-[11px] text-white/50">{r.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
                  {saved ? "Added" : r.exchange}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
