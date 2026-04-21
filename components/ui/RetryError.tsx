"use client";

import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLikelyColdStart } from "@/lib/api/backend";

interface RetryErrorProps {
  onRetry: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
  className?: string;
  // Render as a tighter inline row rather than a padded block.
  compact?: boolean;
  // Pass the fetcher's error so the component can swap copy + iconography
  // when the failure looks like a cold-start (502/503/504/network/abort).
  error?: unknown;
}

// Shared error state with a retry button. Used wherever a backend fetch can
// fail (especially on Render cold starts, where the first request after a
// sleep can time out ~15–30s).
export function RetryError({
  onRetry,
  title,
  description,
  loading = false,
  className,
  compact = false,
  error,
}: RetryErrorProps) {
  const cold = isLikelyColdStart(error);
  // Cold-start copy is authoritative — it tells the user something concrete
  // about what's happening. Per-site `title`/`description` only apply when
  // the failure is NOT a wake-up (e.g. genuine 500, bad slug, parse error).
  const resolvedTitle = cold
    ? "Backend is waking up…"
    : title ?? "Couldn't load data.";
  const resolvedDesc = cold
    ? "Free-tier servers sleep after 15 min idle. First load can take up to 30 seconds — try again in a moment."
    : description ?? "Something went wrong fetching this. Try again in a second.";

  const tone = cold
    ? {
        wrap: "border-amber-500/25 bg-amber-500/10 text-amber-100",
        subtle: "text-amber-200/80",
        btn: "border-amber-400/40 bg-amber-500/20 text-amber-50 hover:border-amber-300/60 hover:bg-amber-500/30",
      }
    : {
        wrap: "border-rose-500/20 bg-rose-500/10 text-rose-100",
        subtle: "text-rose-200/80",
        btn: "border-rose-400/40 bg-rose-500/20 text-rose-50 hover:border-rose-300/60 hover:bg-rose-500/30",
      };

  const Icon = cold ? Loader2 : AlertCircle;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border",
        tone.wrap,
        compact ? "px-3 py-2 text-xs" : "p-4 text-xs",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 shrink-0",
          compact ? "size-3.5" : "size-4",
          cold && "animate-spin",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{resolvedTitle}</p>
        {resolvedDesc && <p className={cn("mt-0.5", tone.subtle)}>{resolvedDesc}</p>}
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 font-semibold transition",
          tone.btn,
          compact ? "text-[11px]" : "text-xs",
          loading && "opacity-60",
        )}
      >
        <RefreshCcw className={cn("size-3", loading && "animate-spin")} />
        {loading ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
