"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchCategories, type MarketCategory, type CategoryCount } from "@/lib/api/backend";

const CANONICAL: MarketCategory[] = [
  "politics",
  "economics",
  "crypto",
  "sports",
  "tech",
  "culture",
];

interface CategoryChipsProps {
  selected: MarketCategory | null;
  onSelect: (c: MarketCategory | null) => void;
  className?: string;
}

export function CategoryChips({ selected, onSelect, className }: CategoryChipsProps) {
  const [counts, setCounts] = useState<Record<MarketCategory, number>>({
    politics: 0,
    economics: 0,
    crypto: 0,
    sports: 0,
    tech: 0,
    culture: 0,
    other: 0,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCategories({ signal: ctrl.signal })
      .then((r) => {
        const next = { ...counts };
        for (const row of r.categories as CategoryCount[]) {
          next[row.category] = row.count;
        }
        setCounts(next);
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div
      className={cn(
        "scroll-snap-x -mx-3 flex gap-1.5 px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0",
        className,
      )}
    >
      <Chip
        label="All"
        count={total || null}
        active={selected === null}
        onClick={() => onSelect(null)}
      />
      {CANONICAL.map((c) => (
        <Chip
          key={c}
          label={c}
          count={counts[c] || null}
          active={selected === c}
          onClick={() => onSelect(c)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium capitalize transition active:scale-95",
        active
          ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]"
          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
      )}
    >
      {label}
      {count !== null && (
        <span className={cn("text-[10px]", active ? "text-cyan-300/80" : "text-white/30")}>
          {count}
        </span>
      )}
    </button>
  );
}
