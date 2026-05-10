'use client';

// Drives <LoadingScreen /> from real backend signals (lib/boot-checks.ts) and
// gates {children} until the boot sequence is ready. Mounts once at the root
// layout; only runs on the very first page load of a session (sessionStorage
// flag), so client navigations afterwards skip it. SSR-safe: server always
// renders children directly via the 'pending' phase, then a useEffect on the
// client decides whether to skip straight to 'ready' or run the boot.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import LoadingScreen, { type LoadingStage } from './LoadingScreen';
import {
  checkBackendHealth,
  checkDailyBrief,
  checkMarketsReady,
} from '@/lib/boot-checks';

type Phase = 'pending' | 'booting' | 'fading' | 'ready';

// useLayoutEffect on the client (synchronous, pre-paint), useEffect on the
// server (no-op during SSR). Lets us flip phase from 'pending' to 'ready' on
// returning sessions before the browser paints, eliminating the one-frame
// flash of children-hidden.
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const SESSION_KEY = 'velarith_booted';
const HTML_BOOTING_CLASS = 'velarith-booting';

// Polling schedule for /health, in milliseconds between attempts. Sized so
// the loader keeps trying for roughly 3 minutes of wall time before giving
// up — enough headroom for Render's "first cold start of the day" wake-ups
// (often 90–180s) without forcing the user to hit Retry manually.
//
// Each probe also takes ~4s of fetch time on its own (proxy timeout). So
// total budget ≈ sum(sleeps) + (attempts × ~4s).
const HEALTH_BACKOFF_MS = [
  // Quick recheck for warm backend or already-spinning-up state
  1500, 2000, 3000, 4000, 5000,
  // Cold-start window: Render typically wakes in 30–60s
  6000, 8000, 10000, 10000, 10000,
  // Patient tail: occasional very-cold first-of-day wake-ups
  12000, 12000, 15000, 15000, 15000,
];

// "Fast-fail" detection: when the network layer is permanently blocked
// (browser extension, DNS filter, etc.) every fetch throws in ~1ms instead
// of timing out. Sitting through the full backoff window in that case is
// pointless — bail to error after this many consecutive sub-threshold fails.
const FAST_FAIL_DURATION_MS = 100;
const FAST_FAIL_STREAK = 3;

// Percent eases asymptotically toward STAGE_CEIL.connecting while we wait for
// /health, so the bar always moves but never reaches 60% until health resolves.
const ASYMPTOTIC_TAU_MS = 12000;

// Status copy escalates over the connecting stage so the user always has
// fresh reassurance to read while the backend wakes.
const WAITING_COPY_DELAY_MS = 5000;
const STILL_WAITING_COPY_DELAY_MS = 30000;

// Tail fill: once /health succeeds, the bar smoothly animates to 100% over
// `max(MIN_TAIL_FILL_MS, minDurationMs - elapsed)` ms — no pause-then-jump
// at 95% on warm backends. The minimum keeps the fill animation visible
// even after a slow cold-start (where minDuration is already exceeded).
const MIN_TAIL_FILL_MS = 800;

const FADE_OUT_MS = 700;
const READY_HOLD_MS = 250;

const STAGE_FLOOR: Record<LoadingStage, number> = {
  init: 0,
  connecting: 5,
  markets: 60,
  ai: 80,
  ready: 95,
  error: 0,
};
const STAGE_CEIL: Record<LoadingStage, number> = {
  init: 5,
  connecting: 55,
  markets: 80,
  ai: 95,
  ready: 100,
  error: 0,
};

const STATUS = {
  init: 'Getting things ready',
  preparing: 'Preparing your workspace',
  waiting: 'Just a moment',
  almostThere: 'Almost there',
  markets: 'Loading markets',
  ai: 'Preparing insights',
  ready: 'Ready',
  error: 'Something went wrong',
  connection: 'Connection issue',
  marketsFailed: "Some data didn't load",
  offline: 'You appear to be offline',
} as const;

const GENERIC_ERROR_MESSAGE =
  "We couldn't load Velarith right now. Please try again in a moment.";
const CONNECTION_ERROR_MESSAGE =
  "We can't reach Velarith. Please check your connection or try again later.";
const MARKETS_ERROR_MESSAGE =
  "Some data didn't load. Please try again, or refresh the page if this continues.";
const OFFLINE_ERROR_MESSAGE =
  'Check your internet connection and try again.';

// Diagnostic prefix for any console output. Easy to grep in production logs
// without sending data anywhere.
const LOG_PREFIX = '[velarith-boot]';

interface BootGateProps {
  children: ReactNode;
  // Floor on the time-to-ready transition. If all probes finish faster, we
  // hold the loader for the remainder so the screen never flashes.
  minDurationMs?: number;
}

export default function BootGate({
  children,
  minDurationMs = 1500,
}: BootGateProps) {
  // Initial value is always 'pending' so SSR markup matches first hydration
  // render. The iso layout effect below upgrades it to 'ready' synchronously
  // before the browser paints whenever the session has already booted.
  const [phase, setPhase] = useState<Phase>('pending');
  const [stage, setStage] = useState<LoadingStage>('init');
  const [percent, setPercent] = useState(0);
  // Override for the progress bar's CSS transition duration. Default (undefined)
  // falls back to the 600ms value set in globals.css. We bump this to the
  // remaining minDuration window during the tail fill so the bar smoothly
  // animates to 100% with no visible pause.
  const [fillTransitionMs, setFillTransitionMs] = useState<number | undefined>(
    undefined,
  );
  const [statusText, setStatusText] = useState<string>(STATUS.init);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const runIdRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const handleRetry = useCallback(() => {
    setStage('init');
    setPercent(0);
    setStatusText(STATUS.init);
    setErrorMessage(null);
    setFillTransitionMs(undefined);
    setRetryToken((t) => t + 1);
  }, []);

  // Pre-paint check: if this session has already booted, flip to 'ready' so
  // children become visible in the same commit as hydration. Avoids the
  // one-frame flash where the user sees an empty dark navy bg before content.
  useIsoLayoutEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setPhase('ready');
    }
  }, []);

  // Auto-retry the moment connectivity returns. Only fires while the loader
  // is showing an error — fresh boots and successful sessions are unaffected.
  useEffect(() => {
    if (stage !== 'error') return;
    const onOnline = () => {
      console.warn(`${LOG_PREFIX} connection restored, retrying boot`);
      handleRetry();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [stage, handleRetry]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already booted this session: hand off to children immediately.
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setPhase('ready');
      return;
    }

    document.documentElement.classList.add(HTML_BOOTING_CLASS);
    setPhase('booting');

    // If the user is starting offline there's no point burning the health
    // backoff window — surface a tailored message right away.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStage('error');
      setStatusText(STATUS.offline);
      setErrorMessage(OFFLINE_ERROR_MESSAGE);
      return;
    }

    const myRunId = ++runIdRef.current;
    const isAlive = () => runIdRef.current === myRunId;
    const startedAt = performance.now();

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const stopRAF = () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    // Asymptotic ease toward STAGE_CEIL.connecting. The bar always crawls
    // forward during a Render cold-start without ever lying about completion.
    const startConnectingEase = () => {
      const easeStart = performance.now();
      const tick = () => {
        if (!isAlive()) return;
        const elapsed = performance.now() - easeStart;
        const eased =
          STAGE_FLOOR.connecting +
          (STAGE_CEIL.connecting - STAGE_FLOOR.connecting) *
            (1 - Math.exp(-elapsed / ASYMPTOTIC_TAU_MS));
        setPercent(eased);
        if (elapsed > STILL_WAITING_COPY_DELAY_MS) {
          setStatusText(STATUS.almostThere);
        } else if (elapsed > WAITING_COPY_DELAY_MS) {
          setStatusText(STATUS.waiting);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    };

    void (async () => {
      // --- init: brief mount delay so the entrance animations land ---
      setStage('init');
      setPercent(STAGE_FLOOR.init);
      setStatusText(STATUS.init);
      await sleep(150);
      if (!isAlive()) return;
      setPercent(STAGE_CEIL.init);

      // --- connecting: poll /health with backoff while easing the bar ---
      setStage('connecting');
      setPercent(STAGE_FLOOR.connecting);
      setStatusText(STATUS.preparing);
      startConnectingEase();

      let healthy = false;
      let blocked = false;
      let fastFailStreak = 0;
      for (let i = 0; i < HEALTH_BACKOFF_MS.length; i++) {
        const result = await checkBackendHealth();
        if (!isAlive()) return;
        if (result.ok) {
          healthy = true;
          break;
        }

        console.warn(
          `${LOG_PREFIX} health attempt ${i} failed: ${result.reason}` +
            (result.status ? ` (status ${result.status})` : '') +
            ` in ${result.durationMs.toFixed(0)}ms`,
        );

        // Detect a permanently-blocked network: every fetch resolves in <100ms
        // with a network error (browser extension, DNS filter, CORP, etc.).
        // No point burning the rest of the backoff window — bail to error.
        if (
          result.reason === 'network' &&
          result.durationMs < FAST_FAIL_DURATION_MS
        ) {
          fastFailStreak++;
          if (fastFailStreak >= FAST_FAIL_STREAK) {
            console.warn(
              `${LOG_PREFIX} fast-fail streak reached (${fastFailStreak}); ` +
                `escalating to connection error without burning the backoff window`,
            );
            blocked = true;
            break;
          }
        } else {
          fastFailStreak = 0;
        }

        // Skip the sleep on the final attempt — there's no next probe to
        // wait for, so the wall-clock budget shouldn't include it.
        if (i < HEALTH_BACKOFF_MS.length - 1) {
          await sleep(HEALTH_BACKOFF_MS[i]);
          if (!isAlive()) return;
        }
      }
      stopRAF();

      if (!healthy) {
        setStage('error');
        if (blocked) {
          setStatusText(STATUS.connection);
          setErrorMessage(CONNECTION_ERROR_MESSAGE);
        } else {
          setStatusText(STATUS.error);
          setErrorMessage(GENERIC_ERROR_MESSAGE);
        }
        return;
      }

      // --- tail fill: smoothly animate to 100% over the remaining
      //     minDuration window. Markets and brief probes run in PARALLEL
      //     during the fill so a cold backend doesn't double the wait. The
      //     bar's transition duration is computed from the time budget —
      //     no jump, no pause at 95%. ---
      const tailStart = performance.now();
      const elapsedAtTail = tailStart - startedAt;
      const fillDuration = Math.max(
        MIN_TAIL_FILL_MS,
        minDurationMs - elapsedAtTail,
      );

      setStage('markets');
      setStatusText(STATUS.markets);
      setFillTransitionMs(fillDuration);
      setPercent(100);

      // Fire both probes immediately. Markets is required (failure → error);
      // brief is best-effort (failure logs but boot proceeds).
      const marketsP = checkMarketsReady();
      const briefP = checkDailyBrief();

      const marketsResult = await marketsP;
      if (!isAlive()) return;
      if (!marketsResult.ok) {
        console.warn(
          `${LOG_PREFIX} markets check failed: ${marketsResult.reason}` +
            (marketsResult.status ? ` (status ${marketsResult.status})` : '') +
            ` in ${marketsResult.durationMs.toFixed(0)}ms`,
        );
        setStage('error');
        setStatusText(STATUS.marketsFailed);
        setErrorMessage(MARKETS_ERROR_MESSAGE);
        return;
      }

      // Markets done — surface the next status while brief is still in flight.
      setStage('ai');
      setStatusText(STATUS.ai);

      const briefResult = await briefP;
      if (!isAlive()) return;
      if (!briefResult.ok) {
        console.warn(
          `${LOG_PREFIX} daily-brief check failed (non-blocking): ${briefResult.reason}` +
            (briefResult.status ? ` (status ${briefResult.status})` : '') +
            ` in ${briefResult.durationMs.toFixed(0)}ms`,
        );
      }

      // Wait for the bar to actually reach 100%. If probes finished faster
      // than the fill, the remaining time gets absorbed here. If probes were
      // slower than the fill, this resolves immediately.
      const fillEndsAt = tailStart + fillDuration;
      const remainingFill = fillEndsAt - performance.now();
      if (remainingFill > 0) {
        await sleep(remainingFill);
        if (!isAlive()) return;
      }

      // Bar at 100%, all probes done. Brief hold then fade.
      setStage('ready');
      setStatusText(STATUS.ready);
      await sleep(READY_HOLD_MS);
      if (!isAlive()) return;

      sessionStorage.setItem(SESSION_KEY, '1');
      setPhase('fading');
      await sleep(FADE_OUT_MS);
      if (!isAlive()) return;
      document.documentElement.classList.remove(HTML_BOOTING_CLASS);
      setPhase('ready');
    })();

    return () => {
      // Bump runId to invalidate any in-flight async work; stale closures
      // will see runIdRef.current !== myRunId and exit. The lint rule warns
      // about reading .current in cleanup (it usually points to a DOM node);
      // here it's a counter, not a node ref, so the warning is a false alarm.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runIdRef.current++;
      stopRAF();
    };
  }, [retryToken, minDurationMs]);

  const showLoader = phase === 'booting' || phase === 'fading';
  const childrenHidden = phase === 'pending' || showLoader;

  return (
    <>
      {showLoader && (
        <LoadingScreen
          stage={stage}
          percent={percent}
          statusText={statusText}
          errorMessage={stage === 'error' ? errorMessage ?? undefined : undefined}
          onRetry={stage === 'error' ? handleRetry : undefined}
          fadingOut={phase === 'fading'}
          fillTransitionMs={fillTransitionMs}
        />
      )}
      <div
        {...(childrenHidden && { 'aria-hidden': 'true' })}
        className={childrenHidden ? 'invisible' : undefined}
        suppressHydrationWarning
      >
        {children}
      </div>
    </>
  );
}
