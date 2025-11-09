import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SettingCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: string;
  className?: string;
  onClick?: () => void;
}

export function SettingCard({
  title,
  description,
  icon,
  accent = "from-cyan-500/50 via-blue-500/40 to-purple-500/40",
  className,
  onClick,
}: SettingCardProps) {
  return (
    <div
      className={cn(
  "group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 backdrop-blur",
        "shadow-[0_35px_120px_-40px_rgba(15,118,230,0.35)] transition-transform duration-500",
        "hover:-translate-y-1 hover:shadow-[0_45px_140px_-50px_rgba(56,189,248,0.45)]",
        className
      )}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className={cn("absolute inset-0 bg-gradient-to-br", accent)} />
      </div>

      <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/40 blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-xl">
                {icon}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
              <p className="max-w-sm text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            Beta
          </span>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="relative inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 transition-all duration-300 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          aria-disabled="true"
        >
          <span>Coming soon</span>
          <span className="text-xs text-white/60">Tap to preview</span>
        </button>
      </div>
    </div>
  );
}
