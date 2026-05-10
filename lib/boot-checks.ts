// Boot-time readiness probes for the FastAPI backend. Pure async functions —
// no React. Used by <BootGate> to drive the loading screen's stage progression
// from real backend signals (Render free-tier cold-starts in 30–60s, so each
// check is a single tick the gate can poll, not a final pass/fail).

// Boot probes hit our own /api/boot/* route handlers (see app/api/boot/),
// which server-side proxy to the FastAPI backend. Same-origin requests slip
// past extensions and DNS filters that block the Render hostname directly.

export type CheckFailureReason = 'timeout' | 'http' | 'network' | 'aborted';

export type CheckResult =
  | { ok: true; durationMs: number }
  | { ok: false; reason: CheckFailureReason; status?: number; durationMs: number };

interface FetchOptions {
  timeoutMs: number;
  retries: number;
  signal?: AbortSignal;
}

// Single-attempt fetch with a hard timeout. Throws on non-2xx so the caller
// can distinguish HTTP failures from network/timeout failures by error type.
async function fetchOnce(url: string, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs);

  const onParentAbort = () => ctrl.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) ctrl.abort(signal.reason);
    else signal.addEventListener('abort', onParentAbort, { once: true });
  }

  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    return res;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onParentAbort);
  }
}

async function probe(url: string, opts: FetchOptions): Promise<CheckResult> {
  const start = performance.now();
  const totalAttempts = opts.retries + 1;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    if (opts.signal?.aborted) {
      return { ok: false, reason: 'aborted', durationMs: performance.now() - start };
    }
    try {
      const res = await fetchOnce(url, opts.timeoutMs, opts.signal);
      if (res.ok) return { ok: true, durationMs: performance.now() - start };
      // 5xx → worth retrying. 4xx → permanent, bail.
      if (res.status < 500 || attempt === totalAttempts - 1) {
        return { ok: false, reason: 'http', status: res.status, durationMs: performance.now() - start };
      }
    } catch (err) {
      const reason = classifyError(err);
      if (reason === 'aborted' || attempt === totalAttempts - 1) {
        return { ok: false, reason, durationMs: performance.now() - start };
      }
    }
  }

  return { ok: false, reason: 'network', durationMs: performance.now() - start };
}

function classifyError(err: unknown): CheckFailureReason {
  if (err instanceof DOMException) {
    if (err.name === 'TimeoutError') return 'timeout';
    if (err.name === 'AbortError') return 'aborted';
  }
  if (err instanceof Error && err.name === 'AbortError') return 'aborted';
  return 'network';
}

// --- Public probes ---------------------------------------------------------

// /health is the cheapest possible signal. Use it as a heartbeat — BootGate
// calls this in a loop with backoff to ride out Render cold-starts. Each call
// times out at 5s so the gate can keep the percentage advancing. retries:0
// because BootGate already retries with backoff; an internal retry here would
// just double the wait per failed probe and shrink the effective poll window.
export function checkBackendHealth(signal?: AbortSignal): Promise<CheckResult> {
  return probe(`/api/boot/health`, { timeoutMs: 5000, retries: 0, signal });
}

// Confirms the markets pipeline is end-to-end ready (FastAPI → Polymarket
// upstream). Server-side TTL-cached for 60s, so this is fast once health
// passes.
export function checkMarketsReady(signal?: AbortSignal): Promise<CheckResult> {
  return probe(`/api/boot/categories`, {
    timeoutMs: 5000,
    retries: 1,
    signal,
  });
}

// Warms the AI cache. Slowest probe — Claude/Groq round-trip on a cache miss
// can hit 5–8s. Server-side cached for 30 min after first hit.
export function checkDailyBrief(signal?: AbortSignal): Promise<CheckResult> {
  return probe(`/api/boot/brief`, {
    timeoutMs: 8000,
    retries: 1,
    signal,
  });
}
