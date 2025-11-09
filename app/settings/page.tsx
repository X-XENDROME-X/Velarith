"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  BellRing,
  Boxes,
  Palette,
  CreditCard,
  Bot,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { SettingCard } from "@/components/settings/SettingCard";

const SETTINGS_SECTIONS = [
  {
    title: "Account & Security",
    description: "Manage passwords, two-factor authentication, and approved devices.",
    accent: "from-cyan-500/40 via-sky-500/30 to-teal-500/30",
    icon: <ShieldCheck className="h-7 w-7 text-cyan-100" />,
  },
  {
    title: "Notifications & Alerts",
    description: "Configure email, push, and in-app alerts for market movements.",
    accent: "from-purple-500/40 via-pink-500/30 to-orange-500/20",
    icon: <BellRing className="h-7 w-7 text-pink-100" />,
  },
  {
    title: "Integrations",
    description: "Connect external exchanges, calendars, and data providers.",
    accent: "from-emerald-500/40 via-teal-500/30 to-sky-500/30",
    icon: <Boxes className="h-7 w-7 text-emerald-100" />,
  },
  {
    title: "Appearance",
    description: "Personalize themes, typography, and compact layouts for your workspace.",
    accent: "from-blue-500/40 via-indigo-500/30 to-purple-500/30",
    icon: <Palette className="h-7 w-7 text-indigo-100" />,
  },
  {
    title: "Billing & Usage",
    description: "Review plans, invoices, usage caps, and upcoming renewals.",
    accent: "from-amber-500/40 via-orange-500/30 to-rose-500/30",
    icon: <CreditCard className="h-7 w-7 text-amber-100" />,
  },
  {
    title: "Automation Studio",
    description: "Design workflows, bots, and auto-trading strategies with guardrails.",
    accent: "from-fuchsia-500/40 via-purple-500/30 to-cyan-500/30",
    icon: <Bot className="h-7 w-7 text-fuchsia-100" />,
  },
] as const;

export default function SettingsPage() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handleComingSoon = (feature: string) => {
    setNotice(`${feature} is coming soon. Stay tuned!`);
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-900/40 via-slate-900/60 to-purple-900/40 p-8 sm:p-10 shadow-[0_40px_120px_-60px_rgba(14,165,233,0.75)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-cyan-500/40 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-500/10 shadow-2xl">
                <SettingsIcon className="h-8 w-8 text-cyan-100" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                Velarith Settings Hub
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Customize your trading cockpit</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Fine-tune alerts, automate workflows, and tailor your Velarith experience. We&apos;re adding
                powerful controls every week—let us know what you want to see next.
              </p>
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/20">
          {notice}
        </div>
      )}

      <section className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
        {SETTINGS_SECTIONS.map((section) => (
          <SettingCard
            key={section.title}
            title={section.title}
            description={section.description}
            icon={section.icon}
            accent={section.accent}
            onClick={() => handleComingSoon(section.title)}
          />
        ))}
      </section>
    </div>
  );
}
