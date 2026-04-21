"use client";

// M2: fake broker login + mock portfolio UI removed.
// M5 rebuilds this page as "Prediction Pulse" — movers, trending markets,
// daily AI brief, watchlist snapshot. This is the interim placeholder.

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const TEASER_CARDS = [
  {
    icon: TrendingUp,
    title: "Top movers & trending markets",
    copy: "Real-time Polymarket odds shifts ranked by volume and conviction.",
  },
  {
    icon: Sparkles,
    title: "Daily AI brief",
    copy: "A Claude-authored sentiment summary of the day's market action.",
  },
  {
    icon: MessageSquare,
    title: "Watchlist snapshot",
    copy: "Quick pulse on the markets and tickers you're tracking locally.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-2xl space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          Prediction Pulse · coming soon
        </span>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Your prediction market briefing,
          <span className="block gradient-text">built from live evidence.</span>
        </h1>

        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          The dashboard is being rebuilt around Polymarket. For now, dive into market
          discovery or ask the assistant anything about a ticker or event.
        </p>

        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/markets" className="gap-2">
              Explore markets <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/assistant" className="gap-2">
              Ask the assistant
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {TEASER_CARDS.map(({ icon: Icon, title, copy }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur-sm"
          >
            <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icon className="h-4 w-4 text-cyan-300" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
