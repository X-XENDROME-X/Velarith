import { cn } from "@/lib/utils";
import type { MarketCard as MarketCardData } from "@/lib/api/backend";
import { MarketCard } from "./MarketCard";

interface MarketGridProps {
  markets: MarketCardData[];
  className?: string;
  emptyLabel?: string;
}

export function MarketGrid({ markets, className, emptyLabel }: MarketGridProps) {
  if (markets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="text-sm text-white/60">{emptyLabel ?? "No markets to show."}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {markets.map((m) => (
        <MarketCard key={m.slug} market={m} />
      ))}
    </div>
  );
}

export function MarketGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[200px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}
