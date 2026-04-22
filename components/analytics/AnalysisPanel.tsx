"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { AnalysisFilters, AIAnalysis, TechnicalIndicators, FundamentalMetrics, NewsSentiment, ScoreBreakdown } from "@/lib/types/analytics";
import { cn } from "@/lib/utils";
import AIAnalysisView from "./AIAnalysisView";
import ScoreIndicatorsView from "./ScoreIndicatorsView";
import { BackendWakingHint } from "@/components/ui/BackendWakingHint";
import { RetryError } from "@/components/ui/RetryError";

// Backend URL — env-driven for prod, localhost fallback for dev
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:10000";

interface AnalysisPanelProps {
	symbol: string;
	filters: AnalysisFilters;
}

type TabType = "ai-summary" | "score-indicators";

function toAnalysisMode(timeframe?: string): "long" | "short" {
	const normalized = (timeframe ?? "").trim().toLowerCase();
	return normalized === "short term" || normalized === "short" ? "short" : "long";
}

const AnalysisPanel = ({ symbol, filters }: AnalysisPanelProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("ai-summary");
	const [isLoading, setIsLoading] = useState(false);
	const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
	const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null);
	const [fundamentals, setFundamentals] = useState<FundamentalMetrics | null>(null);
	const [sentiment, setSentiment] = useState<NewsSentiment | null>(null);
	const [score, setScore] = useState<ScoreBreakdown | null>(null);
	const [panelError, setPanelError] = useState<unknown>(null);
	const [reload, setReload] = useState(0);

	// Change start: explicit fetch error state + manual retry trigger
	useEffect(() => {
        const fetchAiSummary = async () => {
            console.log("Fetching AI Summary...");
            setIsLoading(true);
            setAiAnalysis(null); // Clear old data
            setPanelError(null);
            const mode = toAnalysisMode(filters.timeframe);

            const params = new URLSearchParams({
                mode,
                age: filters.age || '30-40',
            });

            try {
                const res = await fetch(`${API_BASE}/analysis/ai/${symbol}?${params.toString()}`);
                if (res.ok) {
                    setAiAnalysis(await res.json());
                } else {
                    setPanelError(new Error(`AI summary request failed (${res.status})`));
                }
            } catch (error) {
                console.error("AI fetch error:", error);
                setPanelError(error);
            }
            setIsLoading(false); // Done loading *this* tab
        };

        // --- NEW: Helper function to fetch Score & Indicators ---
        const fetchScoreAndIndicators = async () => {
            console.log("Fetching Score & Indicators...");
            setIsLoading(true);
            setPanelError(null);
            const mode = toAnalysisMode(filters.timeframe);
            // Clear all other data
            setTechnicals(null);
            setFundamentals(null);
            setSentiment(null);
            setScore(null);

            try {
                const [techRes, fundRes, sentRes, scoreRes] = await Promise.allSettled([
                    fetch(`${API_BASE}/technical/${symbol}`),
                    fetch(`${API_BASE}/fundamental/${symbol}`),
                    fetch(`${API_BASE}/sentiment/${symbol}`),
                    fetch(`${API_BASE}/analysis/score/${symbol}?mode=${mode}`),
                ]);

                // Check each result individually
                if (techRes.status === 'fulfilled' && techRes.value.ok) setTechnicals(await techRes.value.json());
                if (fundRes.status === 'fulfilled' && fundRes.value.ok) setFundamentals(await fundRes.value.json());
                if (sentRes.status === 'fulfilled' && sentRes.value.ok) setSentiment(await sentRes.value.json());
                if (scoreRes.status === 'fulfilled' && scoreRes.value.ok) setScore(await scoreRes.value.json());
                const failed = [techRes, fundRes, sentRes, scoreRes].every((r) => {
                    if (r.status === "rejected") return true;
                    return !r.value.ok;
                });
                if (failed) {
                    setPanelError(new Error("All score/indicator requests failed."));
                }

            } catch (error) {
                console.error("Score/Indicators fetch error:", error);
                setPanelError(error);
            }
            setIsLoading(false); // Done loading *this* tab
        };
        
        if (symbol) {
            if (activeTab === "ai-summary") {
                fetchAiSummary();
            } else if (activeTab === "score-indicators") {
                fetchScoreAndIndicators();
            }
        }
        // This hook now re-runs when the *active tab* changes
    }, [symbol, filters, activeTab, reload]);
	// Change end: explicit fetch error state + manual retry trigger

	return (
		<div className="flex flex-col overflow-hidden rounded-[20px] border border-white/10 bg-slate-900/70 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:rounded-[24px] lg:rounded-[28px]">
			<div className="flex items-center gap-2 border-b border-white/10 p-2 sm:gap-2.5 sm:p-2.5 lg:p-3">
				<button
					type="button"
					onClick={() => setActiveTab("ai-summary")}
					className={cn(
						"rounded-[12px] px-3.5 py-2 text-xs font-medium transition sm:rounded-[14px] sm:px-4 sm:py-2.5 sm:text-sm lg:rounded-[16px] lg:px-5 lg:text-[15px]",
						activeTab === "ai-summary"
							? "bg-white text-slate-950 shadow-sm"
							: "text-white/70 hover:bg-white/10 hover:text-white",
					)}
				>
					AI Summary
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("score-indicators")}
					className={cn(
						"rounded-[12px] px-3.5 py-2 text-xs font-medium transition sm:rounded-[14px] sm:px-4 sm:py-2.5 sm:text-sm lg:rounded-[16px] lg:px-5 lg:text-[15px]",
						activeTab === "score-indicators"
							? "bg-white text-slate-950 shadow-sm"
							: "text-white/70 hover:bg-white/10 hover:text-white",
					)}
				>
					Score & Indicators
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:p-4 lg:p-5 xl:p-6">
				{!!panelError && !isLoading && (
					<div className="mb-4">
						<RetryError
							title={activeTab === "ai-summary" ? "Couldn't load AI Summary." : "Couldn't load Score & Indicators."}
							error={panelError}
							onRetry={() => setReload((n) => n + 1)}
							loading={isLoading}
							compact
						/>
					</div>
				)}
				{isLoading ? (
					<div className="flex h-[350px] items-center justify-center sm:h-[400px]">
						<div className="flex max-w-sm flex-col items-center gap-3">
							<Loader2 className="size-7 animate-spin text-white/60 sm:size-8" />
							<p className="text-xs text-white/60 sm:text-sm">Analyzing {symbol}...</p>
							<BackendWakingHint loading={isLoading} compact className="mt-1" />
						</div>
					</div>
				) : (
					<>
						{activeTab === "ai-summary" && <AIAnalysisView analysis={aiAnalysis} symbol={symbol} />}
						{activeTab === "score-indicators" && (
							<ScoreIndicatorsView
								technicals={technicals}
								fundamentals={fundamentals}
								sentiment={sentiment}
								score={score}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default AnalysisPanel;
