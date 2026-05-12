"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchDailyBrief, type DailyBrief } from "@/lib/api/backend";
import { RetryError } from "@/components/ui/RetryError";
import { BackendWakingHint } from "@/components/ui/BackendWakingHint";
import { cn } from "@/lib/utils";

function normalizeBrief(brief: DailyBrief | null): DailyBrief | null {
  if (!brief) return null;

  const rawBody = (brief.body ?? "").trim();
  if (!rawBody) return brief;

  const parsed = tryParseBriefPayload(rawBody);
  if (!parsed) return brief;

  return {
    ...brief,
    headline: (parsed.headline || brief.headline || "Today on Polymarket").trim(),
    body: (parsed.body || "").trim() || brief.body,
  };
}

function tryParseBriefPayload(text: string): { headline?: string; body?: string } | null {
  // Change start: tolerate malformed JSON payloads from model output
  const source = text.trim();

  try {
    const payload = JSON.parse(source);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    const candidate = payload as Record<string, unknown>;
    return {
      headline: typeof candidate.headline === "string" ? candidate.headline : undefined,
      body: typeof candidate.body === "string" ? candidate.body : undefined,
    };
  } catch {
    const fenced = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const body = fenced?.[1] ?? source;
    const slicedStart = body.indexOf("{");
    const slicedEnd = body.lastIndexOf("}");
    const candidate = slicedStart >= 0 && slicedEnd > slicedStart ? body.slice(slicedStart, slicedEnd + 1) : body;

    const headline = candidate.match(
      /"headline"\s*:\s*"([\s\S]*?)"\s*(?=,?\s*"body"\s*:|\s*}\s*$)/i,
    )?.[1];
    const briefBody = candidate.match(
      /"body"\s*:\s*"([\s\S]*?)"\s*(?=,?\s*"[a-zA-Z0-9_]+"\s*:|\s*}\s*$)/i,
    )?.[1];

    if (!headline && !briefBody) return null;
    return {
      headline: headline?.replace(/\\"/g, '"').trim(),
      body: briefBody?.replace(/\\"/g, '"').trim(),
    };
  }
  // Change end: tolerate malformed JSON payloads from model output
}

export function DailyBriefCard({ className }: { className?: string } = {}) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);
  const displayBrief = normalizeBrief(brief);

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
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 via-slate-900/70 to-purple-950/40 p-4 shadow-[0_30px_80px_-50px_rgba(34,211,238,0.4)] sm:p-6",
        className,
      )}
    >
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
            {/* Provider badge intentionally hidden for cleaner product presentation. */}
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

        {!loading && !error && displayBrief && (
          <div className="mt-5 space-y-3">
            <h3 className="text-lg font-semibold leading-snug text-white sm:text-xl">
              {displayBrief.headline}
            </h3>
            <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line">
              {displayBrief.body}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
