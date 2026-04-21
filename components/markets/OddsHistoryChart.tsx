"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { fetchMarketHistory, type HistoryInterval } from "@/lib/api/backend";

const INTERVALS: { key: HistoryInterval; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "all", label: "All" },
];

interface OddsHistoryChartProps {
  slug: string;
}

interface ChartPoint {
  t: number;
  yes: number;
  label: string;
}

export function OddsHistoryChart({ slug }: OddsHistoryChartProps) {
  const [interval, setInterval] = useState<HistoryInterval>("1w");
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchMarketHistory(slug, { interval, signal: ctrl.signal })
      .then((r) =>
        setPoints(
          r.points.map((p) => ({
            t: p.t,
            yes: Math.round(p.yes * 1000) / 10, // 0–100 with one decimal
            label: formatTick(p.t, interval),
          })),
        ),
      )
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Failed to load history");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [slug, interval]);

  const stats = useMemo(() => {
    if (points.length === 0) return null;
    const first = points[0].yes;
    const last = points[points.length - 1].yes;
    return { first, last, delta: last - first };
  }, [points]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            YES odds history
          </p>
          {stats && (
            <p className="mt-1 text-xs text-white/50">
              {stats.first.toFixed(1)}% → {stats.last.toFixed(1)}%{" "}
              <span
                className={
                  stats.delta >= 0 ? "text-emerald-300" : "text-rose-300"
                }
              >
                ({stats.delta >= 0 ? "+" : ""}
                {stats.delta.toFixed(1)} pp)
              </span>
            </p>
          )}
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {INTERVALS.map((i) => (
            <button
              key={i.key}
              type="button"
              onClick={() => setInterval(i.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition",
                interval === i.key
                  ? "bg-white text-slate-950"
                  : "text-white/60 hover:text-white",
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[260px]">
        {loading ? (
          <div className="size-full animate-pulse rounded-2xl bg-white/5" />
        ) : error ? (
          <div className="grid size-full place-items-center text-xs text-rose-300/80">
            {error}
          </div>
        ) : points.length === 0 ? (
          <div className="grid size-full place-items-center text-xs text-white/40">
            No history available for this market.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="yesLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "YES"]}
              />
              <Line
                type="monotone"
                dataKey="yes"
                stroke="url(#yesLine)"
                strokeWidth={2.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatTick(unixSec: number, interval: HistoryInterval): string {
  const d = new Date(unixSec * 1000);
  if (interval === "1h" || interval === "6h" || interval === "1d") {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (interval === "1w") {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
