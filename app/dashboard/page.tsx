"use client";

import { useEffect, useState } from "react";
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
    label: "Acorns",
    href: "https://acorns.com/",
    accentGradient: "from-fuchsia-400 via-pink-400 to-rose-500",
    logo: "/images/acorns.png",
  },
];

const ROBINHOOD_DASHBOARD = robinhoodMock as BrokerDashboardData;
const ROBINHOOD_ACCENT_BORDER =
  "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";

export default function DashboardPage() {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedBroker");
    const timestamp = localStorage.getItem("brokerTimestamp");

    if (stored && timestamp) {
      const diff = Date.now() - Number(timestamp);
      const tenMinutes = 10 * 60 * 1000;
      if (diff < tenMinutes) setSelectedBroker(stored);
      else {
        localStorage.removeItem("selectedBroker");
        localStorage.removeItem("brokerTimestamp");
      }
    }
  }, []);

  const handleSelect = (broker: string) => {
    localStorage.setItem("selectedBroker", broker);
    localStorage.setItem("brokerTimestamp", Date.now().toString());
    setSelectedBroker(broker);
  };

  const handleLogout = () => {
    localStorage.removeItem("selectedBroker");
    localStorage.removeItem("brokerTimestamp");
    setSelectedBroker(null);
  };

  if (!selectedBroker) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Welcome to Your Portfolio Dashboard
        </h1>
        <p className="max-w-md mx-auto text-sm text-muted-foreground sm:text-base">
          Log in with one of your brokerages below to view your consolidated
          portfolio analytics and P&amp;L insights.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:gap-4">
          {BROKER_LINKS.map((link) => (
            <Button
              key={link.label}
              onClick={() => handleSelect(link.label)}
              className={cn(
                "relative w-full sm:w-auto overflow-hidden rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition focus-visible:ring-white/40 focus-visible:ring-offset-0",
                "bg-gradient-to-r",
                link.accentGradient,
                "before:pointer-events-none before:absolute before:inset-0 before:bg-black/0 before:transition before:duration-200 hover:before:bg-black/20"
              )}
            >
              <span className="relative flex items-center justify-center gap-3 text-white">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
                  <Image
                    src={link.logo}
                    alt={`${link.label} logo`}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </span>
                <span className="relative z-[1]">
                  Login with {link.label}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Session expires automatically after 10 minutes of inactivity.
      </p>
    </div>
  );
}
  // When logged in to broker
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
          {selectedBroker} Dashboard
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <BrokerDashboardView
        data={ROBINHOOD_DASHBOARD}
        accentGradient={BROKER_LINKS[0].accentGradient}
        accentBorder={ROBINHOOD_ACCENT_BORDER}
      />
    </div>
  );
}
