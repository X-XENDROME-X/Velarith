"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOAST_EVENT, type ToastPayload, type ToastVariant } from "@/lib/toast";

const variantStyles: Record<ToastVariant, string> = {
  default: "border-white/15 bg-neutral-900/95 text-white",
  success: "border-emerald-500/30 bg-emerald-950/90 text-emerald-100",
  error: "border-rose-500/30 bg-rose-950/90 text-rose-100",
  info: "border-cyan-500/30 bg-cyan-950/90 text-cyan-100",
};

const variantIcons: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: Check,
  error: AlertCircle,
  info: Info,
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<ToastPayload>).detail;
      setToasts((prev) => [...prev, payload]);
      const ttl = payload.durationMs ?? 3500;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, ttl);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const variant = t.variant ?? "default";
        const Icon = variantIcons[variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-3 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)] backdrop-blur",
              "animate-in fade-in slide-in-from-bottom-2",
              variantStyles[variant],
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-snug opacity-80">{t.description}</p>
              )}
              {t.action && (
                <div className="mt-1.5">
                  {t.action.href ? (
                    <Link
                      href={t.action.href}
                      onClick={() => dismiss(t.id)}
                      className="text-xs font-semibold underline-offset-2 hover:underline"
                    >
                      {t.action.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick?.();
                        dismiss(t.id);
                      }}
                      className="text-xs font-semibold underline-offset-2 hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
