"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackendWakingHintProps {
  // Parent is currently loading. Hint only appears while this is true.
  loading: boolean;
  // Delay (ms) before showing the hint. Under this, the normal skeleton is
  // enough; no need to tell the user about cold starts on warm cache.
  delayMs?: number;
  className?: string;
  compact?: boolean;
  // Override the default copy if the parent has more specific context.
  message?: string;
}

// Inline hint after delayMs when a backend fetch is still loading.
export function BackendWakingHint({
  loading,
  delayMs = 4000,
  className,
  compact = false,
  message = "Still loading — thanks for your patience.",
}: BackendWakingHintProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(t);
  }, [loading, delayMs]);

  if (!loading || !show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-100 animate-in fade-in duration-200",
        compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
        className,
      )}
    >
      <Loader2 className={cn("shrink-0 animate-spin", compact ? "size-3" : "size-3.5")} />
      <span className="min-w-0 flex-1 text-amber-200/90">{message}</span>
    </div>
  );
}
