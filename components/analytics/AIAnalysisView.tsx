"use client";

import { useState } from "react";
import { Lightbulb, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import type { AIAnalysis } from "@/lib/types/analytics";
import { cn } from "@/lib/utils";

interface AIAnalysisViewProps {
	analysis: AIAnalysis | null;
	symbol: string;
}

type SubTab = "recommendation" | "strengths" | "weaknesses" | "fundamentals";

const AIAnalysisView = ({ analysis, symbol }: AIAnalysisViewProps) => {
	const [activeSubTab, setActiveSubTab] = useState<SubTab>("recommendation");

	if (!analysis) {
		return (
			<div className="flex h-[400px] items-center justify-center">
				<p className="text-sm text-white/60">No analysis data available for {symbol}</p>
			</div>
		);
	}

	const recommendationColor =
		analysis.recommendation === "BUY"
			? "text-emerald-400"
			: analysis.recommendation === "SELL"
				? "text-rose-400"
				: "text-amber-400";

	return (
		<div className="space-y-3.5 sm:space-y-4 lg:space-y-5">
			<div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:gap-3">
				<button
					type="button"
					onClick={() => setActiveSubTab("recommendation")}
					className={cn(
						"flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11px] font-medium transition sm:rounded-[12px] sm:px-3 sm:py-2 sm:text-xs lg:rounded-[14px] lg:px-4 lg:text-sm",
						activeSubTab === "recommendation"
							? "border-white/30 bg-white/10 text-white shadow-sm"
							: "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
					)}
				>
					<Lightbulb className="size-3 sm:size-3.5 lg:size-4" />
					<span>Recommendation</span>
				</button>
				<button
					type="button"
					onClick={() => setActiveSubTab("strengths")}
					className={cn(
						"flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11px] font-medium transition sm:rounded-[12px] sm:px-3 sm:py-2 sm:text-xs lg:rounded-[14px] lg:px-4 lg:text-sm",
						activeSubTab === "strengths"
							? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-sm"
							: "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
					)}
				>
					<TrendingUp className="size-3 sm:size-3.5 lg:size-4" />
					Strengths
				</button>
				<button
					type="button"
					onClick={() => setActiveSubTab("weaknesses")}
					className={cn(
						"flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11px] font-medium transition sm:rounded-[12px] sm:px-3 sm:py-2 sm:text-xs lg:rounded-[14px] lg:px-4 lg:text-sm",
						activeSubTab === "weaknesses"
							? "border-rose-500/30 bg-rose-500/10 text-rose-200 shadow-sm"
							: "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
					)}
				>
					<TrendingDown className="size-3 sm:size-3.5 lg:size-4" />
					Weaknesses
				</button>
				<button
					type="button"
					onClick={() => setActiveSubTab("fundamentals")}
					className={cn(
						"flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11px] font-medium transition sm:rounded-[12px] sm:px-3 sm:py-2 sm:text-xs lg:rounded-[14px] lg:px-4 lg:text-sm",
						activeSubTab === "fundamentals"
							? "border-white/30 bg-white/10 text-white shadow-sm"
							: "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
					)}
				>
					<BarChart3 className="size-3 sm:size-3.5 lg:size-4" />
					<span>Fundamentals</span>
				</button>
			</div>

			<div className="space-y-3.5 sm:space-y-4 lg:space-y-5">
				{activeSubTab === "recommendation" && (
					<div className="space-y-3.5 sm:space-y-4 lg:space-y-5">
						<div>
							<h4 className={cn("text-xl font-bold sm:text-2xl lg:text-3xl xl:text-4xl", recommendationColor)}>
								{analysis.recommendation}
							</h4>
							<p className="mt-2.5 text-xs leading-relaxed text-white/80 sm:mt-3 sm:text-sm lg:mt-4 lg:text-base">
								{analysis.summary}
							</p>
						</div>

						<div className="space-y-2.5 rounded-[16px] border border-white/10 bg-white/5 p-3.5 sm:space-y-3 sm:rounded-[18px] sm:p-4 lg:rounded-[20px] lg:p-5">
							<h5 className="text-[10px] font-semibold uppercase tracking-wider text-white/60 sm:text-xs lg:text-sm">
								Technical Analysis
							</h5>
							<p className="text-xs leading-relaxed text-white/80 sm:text-sm lg:text-base">
								{analysis.technicalAnalysis}
							</p>
						</div>
					</div>
				)}

				{activeSubTab === "strengths" && (
					<ul className="space-y-2.5 sm:space-y-3 lg:space-y-4">
						{analysis.strengths.map((strength, index) => (
							<li
								key={index}
								className="flex gap-2.5 rounded-[14px] border border-emerald-500/20 bg-emerald-500/5 p-3.5 sm:gap-3 sm:rounded-[16px] sm:p-4 lg:rounded-[18px] lg:p-5"
							>
								<TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-400 sm:size-5" />
								<p className="text-xs leading-relaxed text-white/80 sm:text-sm lg:text-base">{strength}</p>
							</li>
						))}
					</ul>
				)}

				{activeSubTab === "weaknesses" && (
					<ul className="space-y-2.5 sm:space-y-3 lg:space-y-4">
						{analysis.weaknesses.map((weakness, index) => (
							<li
								key={index}
								className="flex gap-2.5 rounded-[14px] border border-rose-500/20 bg-rose-500/5 p-3.5 sm:gap-3 sm:rounded-[16px] sm:p-4 lg:rounded-[18px] lg:p-5"
							>
								<TrendingDown className="mt-0.5 size-4 shrink-0 text-rose-400 sm:size-5" />
								<p className="text-xs leading-relaxed text-white/80 sm:text-sm lg:text-base">{weakness}</p>
							</li>
						))}
					</ul>
				)}

				{activeSubTab === "fundamentals" && (
					<div className="space-y-2.5 rounded-[16px] border border-white/10 bg-white/5 p-3.5 sm:space-y-3 sm:rounded-[18px] sm:p-4 lg:rounded-[20px] lg:p-5">
						<h5 className="text-[10px] font-semibold uppercase tracking-wider text-white/60 sm:text-xs lg:text-sm">
							Fundamental Analysis
						</h5>
						<p className="text-xs leading-relaxed text-white/80 sm:text-sm lg:text-base">
							{analysis.fundamentalAnalysis}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default AIAnalysisView;
