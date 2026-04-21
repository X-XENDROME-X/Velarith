"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetryErrorProps {
  onRetry: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
  className?: string;
  // Render as a tighter inline row rather than a padded block.
  compact?: boolean;
}

// Shared error state with a retry button. Used wherever a backend fetch can
// fail (especially on Render cold starts, where the first request after a
// sleep can time out ~15–20s).
export function RetryError({
  onRetry,
  title = "Couldn't load data.",
  description = "The backend may still be waking up. Try again in a second.",
  loading = false,
  className,
  compact = false,
}: RetryErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-100",
        compact ? "px-3 py-2 text-xs" : "p-4 text-xs",
        className,
      )}
    >
      <AlertCircle className={cn("mt-0.5 shrink-0", compact ? "size-3.5" : "size-4")} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {description && <p className="mt-0.5 text-rose-200/80">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/20 px-2.5 py-1 font-semibold text-rose-50 transition hover:border-rose-300/60 hover:bg-rose-500/30",
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
