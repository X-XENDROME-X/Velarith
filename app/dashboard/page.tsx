"use client";

import Image from "next/image";

import BrokerDashboardView from "@/components/dashboard/BrokerDashboardView";
import { Button } from "@/components/ui/button";
import robinhoodMock from "@/lib/mock-data/robinhood-dashboard.json";
import type { BrokerDashboardData } from "@/lib/types/broker-dashboard";
import { cn } from "@/lib/utils";

const BROKER_LINKS = [
  {
    label: "Robinhood",
    href: "https://robinhood.com/",
    accentGradient: "from-emerald-400 via-emerald-500 to-emerald-600",
    logo: "/images/robinhood.png",
  },
  {
    label: "Fidelity",
    href: "https://www.fidelity.com/",
    accentGradient: "from-sky-400 via-blue-500 to-indigo-500",
    logo: "/images/fidelity.png",
  },
  {
    label: "E*TRADE",
    href: "https://us.etrade.com/",
    accentGradient: "from-fuchsia-400 via-purple-500 to-violet-500",
    logo: "/images/etrade.png",
  },
];

const ROBINHOOD_DASHBOARD = robinhoodMock as BrokerDashboardData;
const ROBINHOOD_ACCENT_BORDER = "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Monitor every brokerage in one destination with consolidated analytics tuned for high-velocity decision making.
        </p>
      </header>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_120px_-80px_rgba(59,130,246,0.6)] backdrop-blur sm:p-7">
        <div className="mx-auto flex flex-col items-stretch gap-3 sm:max-w-3xl sm:flex-row sm:flex-wrap sm:justify-center lg:max-w-4xl lg:gap-4">
          {BROKER_LINKS.map((link) => (
            <Button
              key={link.label}
              asChild
              variant="outline"
              className={cn(
                "relative w-full overflow-hidden rounded-full border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition focus-visible:ring-white/40 focus-visible:ring-offset-0 sm:w-auto lg:px-8 lg:py-4 lg:text-base",
                "bg-gradient-to-r",
                link.accentGradient,
                "before:pointer-events-none before:absolute before:inset-0 before:bg-black/0 before:transition before:duration-200 hover:before:bg-black/20",
              )}
            >
              <a href={link.href} target="_blank" rel="noreferrer">
                <span className="relative flex items-center justify-center gap-3 text-white">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
                    <Image src={link.logo} alt={`${link.label} logo`} width={20} height={20} className="h-5 w-5 object-contain" />
                  </span>
                  <span className="relative z-[1]">{link.label}</span>
                </span>
              </a>
            </Button>
          ))}
        </div>
      </section>

      <BrokerDashboardView
        data={ROBINHOOD_DASHBOARD}
        accentGradient={BROKER_LINKS[0].accentGradient}
        accentBorder={ROBINHOOD_ACCENT_BORDER}
      />
    </div>
  );
}
