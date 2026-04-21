"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchMarketTake, type MarketTake } from "@/lib/api/backend";
import { RetryError } from "@/components/ui/RetryError";
import { BackendWakingHint } from "@/components/ui/BackendWakingHint";

interface AITakeSectionProps {
  slug: string;
}

// Fetches the AI market take once and renders both the mispricing card and
// the YES/NO needs panel from the same payload.
export function AITakeSection({ slug }: AITakeSectionProps) {
  const [take, setTake] = useState<MarketTake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchMarketTake(slug, { signal: ctrl.signal })
      .then(setTake)
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [slug, reload]);

  const onRetry = () => setReload((n) => n + 1);

  return (
    <div className="space-y-4">
      <AITakeCard take={take} loading={loading} error={error} onRetry={onRetry} />
      <NeedsPanel
        yesNeeds={take?.yesNeeds ?? []}
        noNeeds={take?.noNeeds ?? []}
        loading={loading}
      />
    </div>
  );
}

interface AITakeCardProps {
  take: MarketTake | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}

function AITakeCard({ take, loading, error, onRetry }: AITakeCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 via-slate-900/70 to-purple-950/40 p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_60%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2">
            <Sparkles className="size-5 text-cyan-300" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              AI take · Is this mispriced?
            </p>
            {take?.provider && (
              <p className="text-[10px] text-white/40">
                Powered by {take.provider}
                {take.fallbackUsed ? " (fallback)" : ""}
              </p>
            )}
          </div>
          {take && !loading && (
            <VerdictPill mispriced={take.mispriced} direction={take.direction} />
          )}
        </div>

        {loading && (
          <div className="mt-5 space-y-3">
            <BackendWakingHint loading={loading} compact />
            <div className="space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        )}

        {!!error && !loading && (
          <div className="mt-5">
            <RetryError
              title="Couldn't load the AI take."
              description="Claude takes ~10s cold. The answer is cached for an hour once it lands."
              error={error}
              onRetry={onRetry}
              loading={loading}
              compact
            />
          </div>
        )}

        {take && !loading && !error && (
          <>
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-white/80">
              {take.summary}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                    style={{ width: `${Math.min(100, take.confidence * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-cyan-200/90">
                {(take.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VerdictPill({
  mispriced,
  direction,
}: {
  mispriced: boolean;
  direction: "yes" | "no" | "neutral";
}) {
  if (!mispriced) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
        <CheckCircle2 className="size-3" />
        Fair
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        direction === "yes"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          : direction === "no"
          ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
          : "border-amber-500/40 bg-amber-500/10 text-amber-200",
      )}
    >
      <XCircle className="size-3" />
      Mispriced · lean {direction.toUpperCase()}
    </span>
  );
}

function NeedsPanel({
  yesNeeds,
  noNeeds,
  loading,
}: {
  yesNeeds: string[];
  noNeeds: string[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <NeedsColumn title="For YES to hit" accent="emerald" items={yesNeeds} />
      <NeedsColumn title="For NO to hit" accent="rose" items={noNeeds} />
    </div>
  );
}

function NeedsColumn({
  title,
  accent,
  items,
}: {
  title: string;
  accent: "emerald" | "rose";
  items: string[];
}) {
  const border = accent === "emerald" ? "border-emerald-500/20" : "border-rose-500/20";
  const text = accent === "emerald" ? "text-emerald-200" : "text-rose-200";
  const dot = accent === "emerald" ? "bg-emerald-400" : "bg-rose-400";

  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4", border)}>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.2em]", text)}>
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-white/40">No conditions listed.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-white/75">
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", dot)} />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
