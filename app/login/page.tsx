"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const TODO_ITEMS = [
  "Hook up OAuth provider connectors",
  "Build signup and forgot password flows",
  "Add captcha + rate limiting",
  "Wire secure session + refresh tokens",
  "Design account recovery notifications",
] as const;

function LoginFormCard({
  onSubmit,
  className = "",
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border border-white/12 bg-slate-900/80 shadow-[0_45px_150px_-60px_rgba(56,189,248,0.55)] backdrop-blur ${className}`}
    >
      <div className="absolute -left-28 top-[-12%] h-60 w-60 rounded-full bg-cyan-500/35 blur-3xl" />
      <div className="absolute -right-24 bottom-[-18%] h-52 w-52 rounded-full bg-indigo-500/30 blur-3xl" />

      <div className="relative space-y-6 px-6 py-7 sm:px-8 sm:py-9">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm text-slate-200/70">Enter your credentials to continue.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-200/80">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/70" />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                required
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-slate-200/80">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/70" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="********"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled
            className="w-full rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-80"
            aria-disabled="true"
          >
            Log in (coming soon)
          </button>

          <p className="text-center text-xs text-slate-200/55">
            Full authentication suite launching soon.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Log in is coming soon. We're finishing the secure auth stack.");
  };

  return (
  <div className="login-page-container relative bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.22),_transparent_55%)] opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />

  <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:grid lg:min-h-full lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-28">
        <section className="order-1 space-y-10 lg:order-1 lg:space-y-12">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <header className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              Secure Access
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Log in to your Velarith cockpit
              </h1>
              <p className="max-w-xl text-base text-slate-200/85 sm:text-lg">
                Personalize alerts, sync favorite markets, and orchestrate automated strategies. Authentication
                is rolling out now, and you can preview the experience here.
              </p>
            </div>
          </header>

          <LoginFormCard onSubmit={handleSubmit} className="lg:hidden" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white/90">SOC2-ready architecture</p>
                <p className="text-xs text-white/60 sm:text-[13px]">Audit logging, encryption, and secrets rotation baked in.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-200">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white/90">Passwordless + MFA roadmap</p>
                <p className="text-xs text-white/60 sm:text-[13px]">Magic links, passkeys, and hardware keys under active build.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="order-2 hidden lg:block lg:order-2">
          <LoginFormCard onSubmit={handleSubmit} />
        </section>
      </main>

  <section className="relative mx-auto w-full max-w-6xl flex-shrink-0 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_-70px_rgba(59,130,246,0.8)] sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                Rollout Plan
              </div>
              <h3 className="text-lg font-semibold sm:text-xl">Authentication launch checklist</h3>
              <p className="text-sm text-slate-200/70">
                We're shipping authentication in phases. Follow along below and tell us what matters most for your team.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 sm:gap-4 lg:w-1/2">
              {TODO_ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/85 sm:px-5 sm:py-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-200">
                    <CheckCircle className="h-[18px] w-[18px]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-6 py-3 text-sm text-cyan-100 shadow-lg shadow-cyan-500/30">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
