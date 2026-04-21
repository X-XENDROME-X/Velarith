"use client";

import Link from "next/link";
import { Star, MessageSquare, LineChart as LineIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/lib/hooks/useWatchlist";

interface ResearchToolbarProps {
  symbol: string;
}

// Shown beneath the search bar on /research. Gives the user a clear path
// back to the markets context (which is where bets happen) instead of
// treating ticker research as the endpoint.
export function ResearchToolbar({ symbol }: ResearchToolbarProps) {
  const { isTickerSaved, toggleTicker } = useWatchlist();
  const saved = isTickerSaved(symbol);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
        Evidence for
      </div>
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
        ${symbol}
      </div>
      <button
        type="button"
        onClick={() => toggleTicker(symbol)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
          saved
            ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400/60"
            : "border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:text-white",
        )}
      >
        <Star className={cn("size-3.5", saved && "fill-current")} />
        {saved ? "Watching" : "Watchlist"}
      </button>
      <Link
        href={`/markets?q=${encodeURIComponent(symbol)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-cyan-500/40 hover:text-cyan-200"
      >
        <LineIcon className="size-3.5" /> Find related markets
      </Link>
      <Link
        href={`/assistant?ticker=${encodeURIComponent(symbol)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400/60 hover:from-cyan-500/20 hover:to-teal-500/20"
      >
        <MessageSquare className="size-3.5" /> Ask Claude
      </Link>
    </div>
  );
}
