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
    <AITakeCard take={take} loading={loading} error={error} onRetry={onRetry} />
  );
}

interface AITakeCardProps {
  take: MarketTake | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}

function AITakeCard({ take, loading, error, onRetry }: AITakeCardProps) {
  const displayTake = normalizeTake(take);

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
          </div>
          {displayTake && !loading && (
            <VerdictPill mispriced={displayTake.mispriced} direction={displayTake.direction} />
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

        {displayTake && !loading && !error && (
          <>
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-white/80">
              {displayTake.summary}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                    style={{ width: `${Math.min(100, displayTake.confidence * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-cyan-200/90">
                {(displayTake.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function normalizeTake(take: MarketTake | null): MarketTake | null {
  if (!take) return null;
  const parsed = parseTakeFromSummary(take.summary);
  if (!parsed) return take;

  const direction =
    parsed.direction === "yes" || parsed.direction === "no" || parsed.direction === "neutral"
      ? parsed.direction
      : take.direction;

  return {
    ...take,
    mispriced: parsed.mispriced ?? take.mispriced,
    direction,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : take.confidence,
    summary: parsed.summary || take.summary,
    yesNeeds: parsed.yesNeeds?.length ? parsed.yesNeeds : take.yesNeeds,
    noNeeds: parsed.noNeeds?.length ? parsed.noNeeds : take.noNeeds,
  };
}

function parseTakeFromSummary(text: string): Partial<MarketTake> | null {
  if (!text) return null;
  const payload = extractJSON(text);
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const v = payload as Record<string, unknown>;
    return {
      mispriced: typeof v.mispriced === "boolean" ? v.mispriced : undefined,
      direction: typeof v.direction === "string" ? (v.direction.toLowerCase() as MarketTake["direction"]) : undefined,
      confidence: typeof v.confidence === "number" ? v.confidence : undefined,
      summary: typeof v.summary === "string" ? v.summary.trim() : undefined,
      yesNeeds: Array.isArray(v.yesNeeds) ? v.yesNeeds.filter((x): x is string => typeof x === "string") : undefined,
      noNeeds: Array.isArray(v.noNeeds) ? v.noNeeds.filter((x): x is string => typeof x === "string") : undefined,
    };
  }

  // Change start: tolerate malformed JSON (missing commas/fences/noise)
  const recovered = recoverTakeFields(text);
  if (!recovered) return null;
  return {
    mispriced: recovered.mispriced,
    direction: recovered.direction as MarketTake["direction"] | undefined,
    confidence: recovered.confidence,
    summary: recovered.summary,
    yesNeeds: recovered.yesNeeds,
    noNeeds: recovered.noNeeds,
  };
  // Change end: tolerate malformed JSON (missing commas/fences/noise)
}

function extractJSON(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = (fenced?.[1] ?? text).trim();

  try {
    return JSON.parse(source);
  } catch {
    // Best effort: parse the first object-looking slice.
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(source.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function recoverTakeFields(text: string): {
  mispriced?: boolean;
  direction?: string;
  confidence?: number;
  summary?: string;
  yesNeeds?: string[];
  noNeeds?: string[];
} | null {
  const source = text.trim();
  const boolMatch = source.match(/"mispriced"\s*:\s*(true|false)/i);
  const directionMatch = source.match(/"direction"\s*:\s*"([^"]+)"/i);
  const confidenceMatch = source.match(/"confidence"\s*:\s*([-+]?\d*\.?\d+)/i);
  const summaryMatch = source.match(
    /"summary"\s*:\s*"([\s\S]*?)"\s*(?=,?\s*"(?:yesNeeds|noNeeds|confidence|direction|mispriced)"\s*:|\s*}\s*$)/i,
  );
  const yesNeedsBlock = source.match(/"yesNeeds"\s*:\s*\[([\s\S]*?)\]/i);
  const noNeedsBlock = source.match(/"noNeeds"\s*:\s*\[([\s\S]*?)\]/i);

  const yesNeeds = yesNeedsBlock
    ? Array.from(yesNeedsBlock[1].matchAll(/"([^"]+)"/g)).map((m) => m[1].trim()).filter(Boolean)
    : undefined;
  const noNeeds = noNeedsBlock
    ? Array.from(noNeedsBlock[1].matchAll(/"([^"]+)"/g)).map((m) => m[1].trim()).filter(Boolean)
    : undefined;

  const recovered = {
    mispriced: boolMatch ? boolMatch[1].toLowerCase() === "true" : undefined,
    direction: directionMatch?.[1]?.toLowerCase(),
    confidence: confidenceMatch ? Number(confidenceMatch[1]) : undefined,
    summary: summaryMatch?.[1]?.replace(/\\"/g, '"').trim(),
    yesNeeds,
    noNeeds,
  };

  if (
    recovered.mispriced === undefined &&
    recovered.direction === undefined &&
    recovered.confidence === undefined &&
    !recovered.summary &&
    (!recovered.yesNeeds || recovered.yesNeeds.length === 0) &&
    (!recovered.noNeeds || recovered.noNeeds.length === 0)
  ) {
    return null;
  }
  return recovered;
}

function VerdictPill({
  mispriced,
  direction,
}: {
  mispriced: boolean;
  direction: "yes" | "no" | "neutral";
}) {
  if (!mispriced && direction === "neutral") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
        <CheckCircle2 className="size-3" />
        Fair
      </span>
    );
  }
  if (!mispriced) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
        <CheckCircle2 className="size-3" />
        Lean {direction.toUpperCase()}
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
