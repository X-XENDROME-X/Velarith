"use client";

import type { TechnicalIndicators, FundamentalMetrics, NewsSentiment, ScoreBreakdown } from "@/lib/types/analytics";
import { AlertTriangle } from "lucide-react"; // Using an icon for the error state

interface ScoreIndicatorsViewProps {
	technicals: TechnicalIndicators | null;
	fundamentals: FundamentalMetrics | null;
	sentiment: NewsSentiment | null;
	score: ScoreBreakdown | null;
}

// A small helper to show a consistent "Data unavailable" message
const DataUnavailable = () => (
    <div className="flex h-[150px] items-center justify-center rounded-[16px] border border-white/10 bg-white/5">
        <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="size-5 text-rose-500/70" />
            <p className="text-xs text-white/40">Data unavailable</p>
        </div>
    </div>
);


const ScoreIndicatorsView = ({ technicals, fundamentals, sentiment, score }: ScoreIndicatorsViewProps) => {
	// The component no longer needs a single check at the top.
	// We will check each data object individually before rendering its section.

	return (
		<div className="space-y-4 sm:space-y-5 lg:space-y-6">
			{/* --- Main Grid for Technicals & Fundamentals --- */}
			<div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:gap-5">
				
                {/* --- Technicals Section --- */}
				<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
					<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">Technicals</h4>
					
                    {/* THIS IS THE FIX: We check if 'technicals' exists before trying to render its content. */}
					{technicals ? (
						<div className="space-y-2 sm:space-y-2.5">
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">RSI:</span>
								<span className="text-sm font-semibold text-white">{technicals.rsi?.toFixed(1) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">MACD:</span>
								<span className="truncate text-sm font-semibold text-white">{technicals.macd?.toFixed(2) ?? 'N/A'} | Signal: {technicals.macdSignal?.toFixed(2) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">SMA 50:</span>
								<span className="truncate text-sm font-semibold text-white">{technicals.sma50?.toFixed(2) ?? 'N/A'} | 200: {technicals.sma200?.toFixed(2) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">Trend Zone:</span>
								<span className="text-sm font-semibold text-emerald-400">{technicals.trendZone ?? 'N/A'}</span>
							</div>
                            {/* ... You can add the other technical indicators here following the same pattern ... */}
						</div>
					) : (
						<DataUnavailable />
					)}
				</div>

				{/* --- Fundamentals Section --- */}
				<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
					<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">Fundamentals</h4>

					{/* FIX: Check if 'fundamentals' exists */}
					{fundamentals ? (
						<div className="space-y-2 sm:space-y-2.5">
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">P/B Ratio:</span>
								<span className="text-sm font-semibold text-white">{fundamentals.pbRatio?.toFixed(2) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">Trailing P/E:</span>
								<span className="text-sm font-semibold text-white">{fundamentals.trailingPE?.toFixed(2) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">Forward P/E:</span>
								<span className="text-sm font-semibold text-white">{fundamentals.forwardPE?.toFixed(2) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">Earnings Growth:</span>
								<span className="text-sm font-semibold text-white">{fundamentals.earningsGrowth?.toFixed(3) ?? 'N/A'}</span>
							</div>
							<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:p-3">
								<span className="text-xs font-medium text-white/60">Revenue Growth:</span>
								<span className="text-sm font-semibold text-white">{fundamentals.revenueGrowth?.toFixed(3) ?? 'N/A'}</span>
							</div>
						</div>
					) : (
						<DataUnavailable />
					)}
				</div>
			</div>

			{/* --- News Sentiment Section --- */}
			<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
				<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">News Sentiment</h4>
				
                {/* FIX: Check if 'sentiment' exists */}
				{sentiment ? (
					<div className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:gap-4">
						<div className="flex items-center gap-1.5 rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
							<div className="size-2 rounded-full bg-emerald-500" />
							<span className="text-sm font-medium text-white">Positive: {sentiment.positive}</span>
						</div>
						<div className="flex items-center gap-1.5 rounded-[12px] border border-amber-500/20 bg-amber-500/10 px-3 py-2">
							<div className="size-2 rounded-full bg-amber-500" />
							<span className="text-sm font-medium text-white">Neutral: {sentiment.neutral}</span>
						</div>
						<div className="flex items-center gap-1.5 rounded-[12px] border border-rose-500/20 bg-rose-500/10 px-3 py-2">
							<div className="size-2 rounded-full bg-rose-500" />
							<span className="text-sm font-medium text-white">Negative: {sentiment.negative}</span>
						</div>
					</div>
				) : (
					<DataUnavailable />
				)}
			</div>

			{/* --- Score Breakdown Section --- */}
			<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
				<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">Score Breakdown</h4>

				{/* FIX: Check if 'score' exists */}
				{score ? (
					<ul className="space-y-1.5 text-sm text-white/80">
						<li className="flex items-center justify-between">
							<span>• Fundamentals:</span>
							<span className="font-semibold">{score.fundamentals?.toFixed(2) ?? 'N/A'}</span>
						</li>
						<li className="flex items-center justify-between">
							<span>• Technical:</span>
							<span className="font-semibold">{score.technical?.toFixed(2) ?? 'N/A'}</span>
						</li>
						<li className="flex items-center justify-between">
							<span>• News:</span>
							<span className="font-semibold">{score.news?.toFixed(2) ?? 'N/A'}</span>
						</li>
						<li className="flex items-center justify-between">
							<span>• Insider:</span>
							<span className="font-semibold">{score.insider?.toFixed(1) ?? 'N/A'}</span>
						</li>
						<li className="flex items-center justify-between border-t border-white/10 pt-1.5 text-lg font-semibold text-white sm:pt-2">
							<span>• Final Score:</span>
							<span className="text-emerald-400">{score.finalScore?.toFixed(2) ?? 'N/A'}</span>
						</li>
					</ul>
				) : (
					<DataUnavailable />
				)}
			</div>
		</div>
	);
};

export default ScoreIndicatorsView;