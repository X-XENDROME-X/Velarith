// Tiny event-bus toast. No dep. Callable from anywhere (hooks, components,
// non-React code). The <Toaster /> mounted in the root layout is the single
// listener that renders them.

export type ToastVariant = "default" | "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  // How long the toast stays on screen before auto-dismiss.
  durationMs?: number;
  // Optional action rendered as a right-aligned link/button.
  action?: { label: string; href?: string; onClick?: () => void };
}

export interface ToastPayload extends ToastOptions {
  id: string;
}

const EVENT = "velarith:toast";

export function toast(opts: ToastOptions): string {
  if (typeof window === "undefined") return "";
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload: ToastPayload = { id, variant: "default", durationMs: 3500, ...opts };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: payload }));
  return id;
}

toast.success = (title: string, description?: string) =>
  toast({ title, description, variant: "success" });
toast.error = (title: string, description?: string) =>
  toast({ title, description, variant: "error", durationMs: 5000 });
toast.info = (title: string, description?: string) =>
  toast({ title, description, variant: "info" });

export const TOAST_EVENT = EVENT;
