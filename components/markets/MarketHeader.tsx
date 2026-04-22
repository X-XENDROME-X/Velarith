"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MessageSquare, ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketDetail } from "@/lib/api/backend";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { CategoryBadge } from "./CategoryBadge";
import {
  formatPercent,
  formatChange,
  formatVolume,
  formatFullDate,
} from "./format";

interface MarketHeaderProps {
  detail: MarketDetail;
}

export function MarketHeader({ detail }: MarketHeaderProps) {
  const { isMarketSaved, toggleMarket } = useWatchlist();
  const saved = isMarketSaved(detail.slug);
  const positive = detail.change24h >= 0;
  const externalEventSlug = detail.eventSlug || detail.eventTicker || detail.slug;

  return (
    <div className="space-y-4">
      <Link
        href="/markets"
        className="inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" /> All markets
      </Link>

      <div className="flex items-start gap-4">
        {detail.image ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:size-16">
            <Image
              src={detail.image}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-[11px] font-semibold uppercase tracking-wider text-cyan-200 sm:size-16">
            {detail.category.slice(0, 3)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={detail.category} />
            {detail.eventTitle && (
              <span className="text-[11px] text-white/40">· {detail.eventTitle}</span>
            )}
          </div>
          <h1 className="mt-2 text-xl font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
            {detail.question}
          </h1>
          {detail.endDate && (
            <p className="mt-1.5 text-xs text-white/50">
              Resolves {formatFullDate(detail.endDate)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-300/70">
            YES
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            {formatPercent(detail.yesPrice)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-rose-300/70">
            NO
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-300">
            {formatPercent(detail.noPrice)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
            24h change
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              positive ? "text-emerald-300" : "text-rose-300",
            )}
          >
            {formatChange(detail.change24h)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
            24h volume
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatVolume(detail.volume24h)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            toggleMarket({
              slug: detail.slug,
              question: detail.question,
              category: detail.category,
            })
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition",
            saved
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400/60"
              : "border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10",
          )}
        >
          <Star className={cn("size-4", saved && "fill-current")} />
          {saved ? "Saved" : "Add to watchlist"}
        </button>
        <Link
          href={`/assistant?market=${detail.slug}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/60 hover:from-cyan-500/20 hover:to-teal-500/20"
        >
          <MessageSquare className="size-4" /> Ask assistant about this
        </Link>
        <a
          href={`https://polymarket.com/event/${externalEventSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/20 hover:text-white"
        >
          <ExternalLink className="size-3.5" /> Polymarket
        </a>
      </div>

      {detail.description && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/70">
          {detail.description}
        </div>
      )}
    </div>
  );
}
