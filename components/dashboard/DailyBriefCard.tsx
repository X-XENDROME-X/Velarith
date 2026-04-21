"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchDailyBrief, type DailyBrief } from "@/lib/api/backend";
import { RetryError } from "@/components/ui/RetryError";
import { BackendWakingHint } from "@/components/ui/BackendWakingHint";

export function DailyBriefCard() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchDailyBrief({ signal: ctrl.signal })
      .then((b) => {
        setBrief(b);
        setError(null);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [reload]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 via-slate-900/70 to-purple-950/40 p-5 shadow-[0_30px_80px_-50px_rgba(34,211,238,0.4)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_60%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2">
            <Sparkles className="size-5 text-cyan-300" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              Today&apos;s AI brief
            </p>
            {brief?.provider && (
              <p className="text-[10px] text-white/40">
                Powered by {brief.provider}
                {brief.fallbackUsed ? " (fallback)" : ""}
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-5 space-y-3">
            <BackendWakingHint loading={loading} compact />
            <div className="space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        )}

        {!!error && !loading && (
          <div className="mt-5">
            <RetryError
              title="Couldn't load today's brief."
              error={error}
              onRetry={() => setReload((n) => n + 1)}
              loading={loading}
              compact
            />
          </div>
        )}

        {!loading && !error && brief && (
          <div className="mt-5 space-y-3">
            <h3 className="text-lg font-semibold leading-snug text-white sm:text-xl">
              {brief.headline}
            </h3>
            <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line">
              {brief.body}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
