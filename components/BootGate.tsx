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

// Cap the health probe at ~60s of total wall time before surfacing an error.
// Tuned for Render free-tier cold-starts which usually finish in 30–45s.
const HEALTH_BACKOFF_MS = [2000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 10000, 10000];

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
  minDurationMs = 1200,
}: BootGateProps) {
  // Initial value is always 'pending' so SSR markup matches first hydration
  // render. The iso layout effect below upgrades it to 'ready' synchronously
  // before the browser paints whenever the session has already booted.
  const [phase, setPhase] = useState<Phase>('pending');
  const [stage, setStage] = useState<LoadingStage>('init');
  const [percent, setPercent] = useState(0);
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

        await sleep(HEALTH_BACKOFF_MS[i]);
        if (!isAlive()) return;
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

      // --- markets: confirm the data pipeline is end-to-end ready ---
      setStage('markets');
      setPercent(STAGE_FLOOR.markets);
      setStatusText(STATUS.markets);
      const marketsResult = await checkMarketsReady();
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
      setPercent(STAGE_CEIL.markets);

      // --- ai: warm the daily brief cache. Best-effort — a slow brief
      //         shouldn't block the dashboard from rendering. ---
      setStage('ai');
      setPercent(STAGE_FLOOR.ai);
      setStatusText(STATUS.ai);
      const aiResult = await checkDailyBrief();
      if (!isAlive()) return;
      if (!aiResult.ok) {
        console.warn(
          `${LOG_PREFIX} daily-brief check failed (non-blocking): ${aiResult.reason}` +
            (aiResult.status ? ` (status ${aiResult.status})` : '') +
            ` in ${aiResult.durationMs.toFixed(0)}ms`,
        );
      }
      setPercent(STAGE_CEIL.ai);

      // --- ready: respect the minDuration floor before fading out ---
      setStage('ready');
      setStatusText(STATUS.ready);
      setPercent(STAGE_FLOOR.ready);

      const elapsed = performance.now() - startedAt;
      if (elapsed < minDurationMs) {
        await sleep(minDurationMs - elapsed);
        if (!isAlive()) return;
      }
      setPercent(100);
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
        />
      )}
      <div
        aria-hidden={childrenHidden ? 'true' : undefined}
        className={childrenHidden ? 'invisible' : undefined}
        suppressHydrationWarning
      >
        {children}
      </div>
    </>
  );
}
