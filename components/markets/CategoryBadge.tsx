import { cn } from "@/lib/utils";
import type { MarketCategory } from "@/lib/api/backend";

const CATEGORY_STYLES: Record<MarketCategory, string> = {
  politics: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  economics: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  crypto: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
  sports: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  tech: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  culture: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  other: "border-white/15 bg-white/5 text-white/70",
};

interface CategoryBadgeProps {
  category: MarketCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize tracking-wide",
        CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other,
        className,
      )}
    >
      {category}
    </span>
  );
}
