"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Compass, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoverTab } from "@/components/markets/DiscoverTab";
import { WatchlistTab } from "@/components/markets/WatchlistTab";
import type { MarketCategory } from "@/lib/api/backend";

const VALID_CATEGORIES: MarketCategory[] = [
  "politics",
  "economics",
  "crypto",
  "sports",
  "tech",
  "culture",
];

type Tab = "discover" | "watchlist";

function MarketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTab: Tab = searchParams.get("tab") === "watchlist" ? "watchlist" : "discover";
  const initialQuery = searchParams.get("q") ?? "";
  const catParam = searchParams.get("category");
  const initialCategory =
    catParam && (VALID_CATEGORIES as string[]).includes(catParam)
      ? (catParam as MarketCategory)
      : null;

  const [tab, setTab] = useState<Tab>(initialTab);

  // Keep URL in sync when switching tabs (but don't thrash on every input).
  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    if (tab === "watchlist") sp.set("tab", "watchlist");
    else sp.delete("tab");
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5 pb-10 sm:space-y-6">
      <header className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70 sm:text-[11px]">
          Market discovery
        </p>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
          Browse every live
          <span className="gradient-text"> prediction market</span>
        </h1>
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
          Filter by category, sort by volume or movers, and track the ones worth following.
        </p>
      </header>

      {/* Tabs */}
      <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:inline-flex sm:w-auto">
        <TabButton
          active={tab === "discover"}
          onClick={() => setTab("discover")}
          icon={<Compass className="size-3.5" />}
        >
          Discover
        </TabButton>
        <TabButton
          active={tab === "watchlist"}
          onClick={() => setTab("watchlist")}
          icon={<Star className="size-3.5" />}
        >
          My Watchlist
        </TabButton>
      </div>

      {tab === "discover" ? (
        <DiscoverTab initialQuery={initialQuery} initialCategory={initialCategory} />
      ) : (
        <WatchlistTab />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-white/60 hover:bg-white/5 hover:text-white",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />}>
      <MarketsContent />
    </Suspense>
  );
}
