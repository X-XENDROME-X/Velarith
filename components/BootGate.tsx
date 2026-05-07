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

const SESSION_KEY = 'velarith_booted';
const HTML_BOOTING_CLASS = 'velarith-booting';

// Cap the health probe at ~60s of total wall time before surfacing an error.
// Tuned for Render free-tier cold-starts which usually finish in 30–45s.
const HEALTH_BACKOFF_MS = [2000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 10000, 10000];

// Percent eases asymptotically toward STAGE_CEIL.connecting while we wait for
// /health, so the bar always moves but never reaches 60% until health resolves.
const ASYMPTOTIC_TAU_MS = 12000;
const WAITING_COPY_DELAY_MS = 5000;

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
  markets: 'Loading markets',
  ai: 'Preparing insights',
  ready: 'Ready',
  error: 'Something went wrong',
} as const;

const ERROR_MESSAGE =
  "We couldn't load Velarith right now. Please try again in a moment.";

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
  const [phase, setPhase] = useState<Phase>('pending');
  const [stage, setStage] = useState<LoadingStage>('init');
  const [percent, setPercent] = useState(0);
  const [statusText, setStatusText] = useState<string>(STATUS.init);
  const [retryToken, setRetryToken] = useState(0);

  const runIdRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const handleRetry = useCallback(() => {
    setStage('init');
    setPercent(0);
    setStatusText(STATUS.init);
    setRetryToken((t) => t + 1);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already booted this session: hand off to children immediately.
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setPhase('ready');
      return;
    }

    document.documentElement.classList.add(HTML_BOOTING_CLASS);
    setPhase('booting');

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
        if (elapsed > WAITING_COPY_DELAY_MS) {
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
      for (let i = 0; i < HEALTH_BACKOFF_MS.length; i++) {
        const result = await checkBackendHealth();
        if (!isAlive()) return;
        if (result.ok) {
          healthy = true;
          break;
        }
        await sleep(HEALTH_BACKOFF_MS[i]);
        if (!isAlive()) return;
      }
      stopRAF();

      if (!healthy) {
        setStage('error');
        setStatusText(STATUS.error);
        return;
      }

      // --- markets: confirm the data pipeline is end-to-end ready ---
      setStage('markets');
      setPercent(STAGE_FLOOR.markets);
      setStatusText(STATUS.markets);
      const marketsResult = await checkMarketsReady();
      if (!isAlive()) return;
      if (!marketsResult.ok) {
        setStage('error');
        setStatusText(STATUS.error);
        return;
      }
      setPercent(STAGE_CEIL.markets);

      // --- ai: warm the daily brief cache. Best-effort — a slow brief
      //         shouldn't block the dashboard from rendering. ---
      setStage('ai');
      setPercent(STAGE_FLOOR.ai);
      setStatusText(STATUS.ai);
      await checkDailyBrief();
      if (!isAlive()) return;
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
          errorMessage={stage === 'error' ? ERROR_MESSAGE : undefined}
          onRetry={stage === 'error' ? handleRetry : undefined}
          fadingOut={phase === 'fading'}
        />
      )}
      <div
        aria-hidden={childrenHidden ? true : undefined}
        className={childrenHidden ? 'invisible' : undefined}
      >
        {children}
      </div>
    </>
  );
}
