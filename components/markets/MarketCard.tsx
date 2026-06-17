"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, ArrowUpRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketCard as MarketCardData } from "@/lib/api/backend";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { formatPercent, formatChange, formatVolume, formatEndDate } from "./format";
import { CategoryBadge } from "./CategoryBadge";

interface MarketCardProps {
  market: MarketCardData;
  // Compact skips the change/volume row — used in dense sidebars.
  compact?: boolean;
}

export function MarketCard({ market, compact = false }: MarketCardProps) {
  const router = useRouter();
  const { isMarketSaved, toggleMarket } = useWatchlist();
  const saved = isMarketSaved(market.slug);
  const positive = market.change24h >= 0;

  const handleToggleWatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMarket({
      slug: market.slug,
      question: market.question,
      category: market.category,
    });
  };

  const handleAsk = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/assistant?market=${market.slug}`);
  };

  return (
    <Link
      href={`/markets/${market.slug}`}
      className={cn(
        "group relative flex w-full max-w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm transition min-[380px]:p-4",
        "hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_20px_40px_-30px_rgba(34,211,238,0.3)]",
      )}
    >
      {/* Change start: make market cards shrink cleanly on mobile */}
      <div className="flex min-w-0 items-start gap-3">
        {market.image ? (
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <Image
              src={market.image}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/80">
            {market.category.slice(0, 3)}
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-start gap-2">
            <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white line-clamp-2 [overflow-wrap:anywhere]">
              {market.question}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={handleAsk}
                aria-label="Ask assistant about this market"
                title="Ask assistant about this market"
                className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:border-cyan-500/40 hover:text-cyan-300 active:scale-95 sm:size-8 sm:rounded-md"
              >
                <MessageSquare className="size-4 sm:size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleToggleWatch}
                aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
                className={cn(
                  "grid size-9 place-items-center rounded-lg border transition active:scale-95 sm:size-8 sm:rounded-md",
                  saved
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white",
                )}
              >
                <Star className={cn("size-4 sm:size-3.5", saved && "fill-current")} />
              </button>
            </div>
          </div>
          <div className="mt-1.5 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] text-white/50">
            <CategoryBadge category={market.category} className="shrink-0" />
            {market.endDate && <span className="truncate">· Ends {formatEndDate(market.endDate)}</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-300/70">Yes</p>
          <p className="mt-0.5 text-lg font-semibold text-emerald-300">
            {formatPercent(market.yesPrice)}
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-rose-300/70">No</p>
          <p className="mt-0.5 text-lg font-semibold text-rose-300">
            {formatPercent(market.noPrice)}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex min-w-0 items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-1 rounded-lg px-2 py-1 font-medium",
              positive ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300",
            )}
          >
            <ArrowUpRight
              className={cn("size-3", !positive && "rotate-90")}
            />
            {formatChange(market.change24h)} 24h
          </span>
          <span className="min-w-0 truncate text-white/50">Vol {formatVolume(market.volume24h)}</span>
        </div>
      )}
      {/* Change end: make market cards shrink cleanly on mobile */}
    </Link>
  );
}
