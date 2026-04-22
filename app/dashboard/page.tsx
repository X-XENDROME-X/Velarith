// Today — real-time Polymarket overview.
// Reads: /polymarket/movers, /polymarket/trending, /ai/daily-brief + local watchlist.

import { MoversRow } from "@/components/dashboard/MoversRow";
import { TrendingList } from "@/components/dashboard/TrendingList";
import { DailyBriefCard } from "@/components/dashboard/DailyBriefCard";
import { WatchlistSnapshot } from "@/components/dashboard/WatchlistSnapshot";
import { QuickAskBar } from "@/components/dashboard/QuickAskBar";

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
      <header className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
          Today on Velarith
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Where market sentiment stands right now
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Live prediction market movers, a Velarith Assistant brief of the day, and the markets you&apos;re
          tracking all in one pane.
        </p>
      </header>

      <MoversRow />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendingList />
        </div>
        <div className="space-y-5">
          <DailyBriefCard />
          <WatchlistSnapshot />
          <QuickAskBar />
        </div>
      </div>
    </div>
  );
}
