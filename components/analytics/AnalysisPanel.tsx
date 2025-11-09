"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { AnalysisFilters, AIAnalysis, TechnicalIndicators, FundamentalMetrics, NewsSentiment, ScoreBreakdown } from "@/lib/types/analytics";
import { cn } from "@/lib/utils";
import AIAnalysisView from "./AIAnalysisView";
import ScoreIndicatorsView from "./ScoreIndicatorsView";

interface AnalysisPanelProps {
	symbol: string;
	filters: AnalysisFilters;
}

type TabType = "ai-summary" | "score-indicators";

const AnalysisPanel = ({ symbol, filters }: AnalysisPanelProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("ai-summary");
	const [isLoading, setIsLoading] = useState(false);
	const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
	const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null);
	const [fundamentals, setFundamentals] = useState<FundamentalMetrics | null>(null);
	const [sentiment, setSentiment] = useState<NewsSentiment | null>(null);
	const [score, setScore] = useState<ScoreBreakdown | null>(null);

	useEffect(() => {
		const fetchAnalysis = async () => {
			setIsLoading(true);
			try {
				const [aiRes, techRes, fundRes, sentRes, scoreRes] = await Promise.all([
					fetch(`/api/analyze?symbol=${symbol}&filters=${JSON.stringify(filters)}`),
					fetch(`/api/stocks/technicals?symbol=${symbol}`),
					fetch(`/api/stocks/fundamentals?symbol=${symbol}`),
					fetch(`/api/stocks/sentiment?symbol=${symbol}`),
					fetch(`/api/stocks/score?symbol=${symbol}`),
				]);

				if (aiRes.ok) setAiAnalysis(await aiRes.json());
				if (techRes.ok) setTechnicals(await techRes.json());
				if (fundRes.ok) setFundamentals(await fundRes.json());
				if (sentRes.ok) setSentiment(await sentRes.json());
				if (scoreRes.ok) setScore(await scoreRes.json());
			} catch (error) {
				console.error("Failed to fetch analysis:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAnalysis();
	}, [symbol, filters]);

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
				{isLoading ? (
					<div className="flex h-[350px] items-center justify-center sm:h-[400px]">
						<div className="flex flex-col items-center gap-3">
							<Loader2 className="size-7 animate-spin text-white/60 sm:size-8" />
							<p className="text-xs text-white/60 sm:text-sm">Analyzing {symbol}...</p>
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
