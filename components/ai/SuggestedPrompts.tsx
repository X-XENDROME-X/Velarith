import {
  TrendingUp,
  DollarSign,
  Target,
  Lightbulb,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

const suggestions = [
  {
    icon: TrendingUp,
    title: "Market Analysis",
    prompt: "Analyze the current trends in the crypto prediction markets",
    color: "from-cyan-500 via-cyan-400 to-teal-500",
    hoverBorder: "hover:border-cyan-400/80",
    focusRing: "focus-visible:ring-cyan-400/50",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]",
  },
  {
    icon: DollarSign,
    title: "Volume Insights",
    prompt: "What markets have the highest trading volume today?",
    color: "from-green-500 via-emerald-500 to-teal-400",
    hoverBorder: "hover:border-emerald-400/80",
    focusRing: "focus-visible:ring-emerald-400/50",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]",
  },
  {
    icon: Target,
    title: "Best Opportunities",
    prompt: "Which prediction markets offer the best opportunities right now?",
    color: "from-indigo-500 via-purple-500 to-violet-500",
    hoverBorder: "hover:border-purple-400/80",
    focusRing: "focus-visible:ring-purple-400/50",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]",
  },
  {
    icon: BarChart3,
    title: "Price Predictions",
    prompt: "Predict the probability changes for top markets in the next 24 hours",
    color: "from-orange-500 via-amber-500 to-rose-500",
    hoverBorder: "hover:border-amber-400/80",
    focusRing: "focus-visible:ring-amber-400/50",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.25)]",
  },
  {
    icon: Lightbulb,
    title: "Strategy Tips",
    prompt: "Give me strategies for trading in volatile prediction markets",
    color: "from-yellow-500 via-amber-400 to-orange-500",
    hoverBorder: "hover:border-yellow-400/80",
    focusRing: "focus-visible:ring-yellow-400/50",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]",
  },
  {
    icon: AlertTriangle,
    title: "Risk Assessment",
    prompt: "What are the risks I should be aware of in current markets?",
    color: "from-rose-500 via-pink-500 to-purple-500",
    hoverBorder: "hover:border-rose-400/80",
    focusRing: "focus-visible:ring-rose-400/50",
    hoverShadow: "hover:shadow-[0_0_30px_rgba(244,114,182,0.3)]",
  },
];

export function SuggestedPrompts({ onPromptSelect, className }: SuggestedPromptsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-1">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground/90 uppercase tracking-[0.2em]">
            Suggested prompts
          </h3>
          <p className="text-sm text-muted-foreground/70">
            Tap a card to auto-fill the assistant with curated market insights
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              type="button"
              key={suggestion.title}
              onClick={() => onPromptSelect(suggestion.prompt)}
              className={cn(
                "group relative h-full rounded-2xl border border-white/5 bg-card/70",
                "p-4 sm:p-5 text-left transition-all duration-300",
                "hover:-translate-y-1 focus-visible:outline-none",
                suggestion.hoverBorder,
                suggestion.focusRing,
                suggestion.hoverShadow,
                "focus-visible:ring-2"
              )}
            >
              <div className="relative z-10 flex h-full flex-col gap-3">
                {/* Icon and Pill */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-11 w-11 rounded-xl p-[1px]",
                      "bg-gradient-to-br",
                      suggestion.color,
                      "shadow-lg shadow-black/30"
                    )}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-[0.9rem] bg-background/90">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-base font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                  {suggestion.title}
                </h4>

                {/* Prompt Preview */}
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  {suggestion.prompt}
                </p>

                <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-cyan-400/90">
                  Use prompt
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}
