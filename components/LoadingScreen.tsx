'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export type LoadingStage =
  | 'init'
  | 'connecting'
  | 'markets'
  | 'ai'
  | 'ready'
  | 'error';

interface LoadingScreenProps {
  stage: LoadingStage;
  percent: number;
  statusText: string;
  errorMessage?: string;
  onRetry?: () => void;
  fadingOut?: boolean;
}

export default function LoadingScreen({
  stage,
  percent,
  statusText,
  errorMessage,
  onRetry,
  fadingOut = false,
}: LoadingScreenProps) {
  const isError = stage === 'error';
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={stage !== 'ready'}
      aria-label="Loading Velarith"
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        'bg-[#08101e] text-[#e8eaed] font-sans',
        'transition-opacity duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]',
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100',
      )}
    >
      <div className="velarith-bg-glow velarith-anim-glow-pulse pointer-events-none absolute inset-0" />
      <div className="velarith-bg-grid pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute left-6 top-6 h-6 w-6 border-l border-t border-[#00d4b4]/30" />
      <div className="pointer-events-none absolute right-6 top-6 h-6 w-6 border-r border-t border-[#00d4b4]/30" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-6 w-6 border-b border-l border-[#0099aa]/30" />
      <div className="pointer-events-none absolute bottom-6 right-6 h-6 w-6 border-b border-r border-[#0099aa]/30" />

      <div className="relative flex flex-col items-center">
        <div
          className="velarith-anim-logo-in relative flex items-center justify-center"
          style={{
            width: 'clamp(150px, 24vw, 210px)',
            height: 'clamp(150px, 24vw, 210px)',
          }}
        >
          <div className="velarith-arc-outer velarith-anim-spin absolute inset-0 rounded-full" />
          <div className="velarith-arc-inner velarith-anim-spin-slow absolute inset-[10px] rounded-full" />
          <div className="velarith-glow-disc velarith-anim-glow-pulse-fast absolute h-[58%] w-[58%] rounded-full" />

          <div className="velarith-logo-img velarith-anim-float relative h-[68%] w-[68%]">
            <Image
              src="/images/rm_logo.png"
              alt="Velarith"
              fill
              priority
              sizes="(max-width: 768px) 150px, 210px"
              className="object-contain"
            />
          </div>
        </div>

        <div
          className="velarith-anim-fade-up text-center"
          style={{ marginTop: 'clamp(24px, 4vw, 36px)' }}
        >
          <h1
            className="velarith-wordmark-text font-bold uppercase leading-none"
            style={{
              fontSize: 'clamp(28px, 5.5vw, 44px)',
              letterSpacing: '0.24em',
              paddingLeft: '0.24em',
            }}
          >
            Velarith
          </h1>
        </div>

        <div
          className="velarith-anim-fade-up-late flex flex-col items-center gap-3"
          style={{
            marginTop: 'clamp(36px, 6vw, 52px)',
            width: 'clamp(200px, 32vw, 300px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isError
                  ? 'bg-red-500'
                  : 'velarith-status-dot velarith-anim-dot-pulse',
              )}
            />
            <span
              className={cn(
                'font-normal uppercase',
                isError ? 'text-red-300/80' : 'text-[#e8eaed]/40',
              )}
              style={{
                fontSize: 'clamp(10px, 1.5vw, 12px)',
                letterSpacing: '0.2em',
                paddingLeft: '0.2em',
              }}
            >
              {statusText}
            </span>
          </div>

          <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn(
                'velarith-progress-fill relative h-full rounded-full',
                isError && 'opacity-50',
              )}
              style={{ width: `${clamped}%` }}
            >
              {!isError && (
                <div className="velarith-progress-shimmer velarith-anim-shimmer-x absolute inset-0" />
              )}
            </div>
          </div>

          <div
            className="font-medium tabular-nums"
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: isError ? 'rgba(248,113,113,0.6)' : 'rgba(0,212,180,0.5)',
            }}
          >
            {clamped}%
          </div>

          {isError && (
            <div className="mt-2 flex flex-col items-center gap-3">
              {errorMessage && (
                <p className="max-w-[280px] text-center text-[11px] leading-relaxed text-red-200/70">
                  {errorMessage}
                </p>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(
                    'rounded-full border border-[#00d4b4]/40 bg-[#00d4b4]/5 px-4 py-1.5',
                    'text-[10px] font-medium uppercase tracking-[0.2em] text-[#00d4b4]',
                    'transition hover:bg-[#00d4b4]/10 hover:border-[#00d4b4]/60',
                    'focus:outline-none focus:ring-2 focus:ring-[#00d4b4]/40',
                  )}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
