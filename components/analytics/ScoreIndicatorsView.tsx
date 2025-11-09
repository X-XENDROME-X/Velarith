"use client";

import type { TechnicalIndicators, FundamentalMetrics, NewsSentiment, ScoreBreakdown } from "@/lib/types/analytics";
import { cn } from "@/lib/utils";

interface ScoreIndicatorsViewProps {
	technicals: TechnicalIndicators | null;
	fundamentals: FundamentalMetrics | null;
	sentiment: NewsSentiment | null;
	score: ScoreBreakdown | null;
}

const ScoreIndicatorsView = ({ technicals, fundamentals, sentiment, score }: ScoreIndicatorsViewProps) => {
	if (!technicals || !fundamentals || !sentiment || !score) {
		return (
			<div className="flex h-[350px] items-center justify-center sm:h-[400px]">
				<p className="text-xs text-white/60 sm:text-sm">Loading indicators...</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-5 lg:space-y-6">
			<div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 lg:gap-5">
				<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
					<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">Technicals</h4>

					<div className="space-y-2 sm:space-y-2.5">
						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">RSI:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{technicals.rsi.toFixed(1)}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">MACD:</span>
							<span className="truncate text-xs font-semibold text-white sm:text-sm lg:text-base" title={`${technicals.macd.toFixed(2)} | Signal: ${technicals.macdSignal.toFixed(2)}`}>
								{technicals.macd.toFixed(2)} | Signal: {technicals.macdSignal.toFixed(2)}
							</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">SMA 50:</span>
							<span className="truncate text-xs font-semibold text-white sm:text-sm lg:text-base" title={`${technicals.sma50.toFixed(2)} | SMA 200: ${technicals.sma200.toFixed(2)}`}>
								{technicals.sma50.toFixed(2)} | 200: {technicals.sma200.toFixed(2)}
							</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Trend Zone:</span>
							<span className="text-xs font-semibold text-emerald-400 sm:text-sm lg:text-base">{technicals.trendZone}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Crossover:</span>
							<span className="truncate text-xs font-semibold text-white sm:text-sm lg:text-base">{technicals.crossover}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Squeeze Zone:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{technicals.squeezeZone}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Last Candle:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{technicals.lastCandle}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Volume Spike:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{technicals.volumeSpike}</span>
						</div>
					</div>
				</div>

				<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
					<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">Fundamentals</h4>

					<div className="space-y-2 sm:space-y-2.5">
						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">P/B Ratio:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{fundamentals.pbRatio.toFixed(2)}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Trailing P/E:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{fundamentals.trailingPE.toFixed(2)}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Forward P/E:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{fundamentals.forwardPE.toFixed(2)}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Market Cap:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{fundamentals.marketCap}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Earnings Growth:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{fundamentals.earningsGrowth.toFixed(3)}</span>
						</div>

						<div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 p-2.5 sm:rounded-[14px] sm:p-3 lg:rounded-[16px] lg:p-3.5">
							<span className="text-[11px] font-medium text-white/60 sm:text-xs lg:text-sm">Revenue Growth:</span>
							<span className="text-xs font-semibold text-white sm:text-sm lg:text-base">{fundamentals.revenueGrowth.toFixed(3)}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
				<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">News Sentiment</h4>

				<div className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:gap-4">
					<div className="flex items-center gap-1.5 rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 sm:gap-2 sm:rounded-[14px] sm:px-4 sm:py-2.5 lg:rounded-[16px] lg:px-5 lg:py-3">
						<div className="size-2 rounded-full bg-emerald-500 sm:size-2.5" />
						<span className="text-xs font-medium text-white sm:text-sm lg:text-base">
							Positive: {sentiment.positive}
						</span>
					</div>
					<div className="flex items-center gap-1.5 rounded-[12px] border border-amber-500/20 bg-amber-500/10 px-3 py-2 sm:gap-2 sm:rounded-[14px] sm:px-4 sm:py-2.5 lg:rounded-[16px] lg:px-5 lg:py-3">
						<div className="size-2 rounded-full bg-amber-500 sm:size-2.5" />
						<span className="text-xs font-medium text-white sm:text-sm lg:text-base">
							Neutral: {sentiment.neutral}
						</span>
					</div>
					<div className="flex items-center gap-1.5 rounded-[12px] border border-rose-500/20 bg-rose-500/10 px-3 py-2 sm:gap-2 sm:rounded-[14px] sm:px-4 sm:py-2.5 lg:rounded-[16px] lg:px-5 lg:py-3">
						<div className="size-2 rounded-full bg-rose-500 sm:size-2.5" />
						<span className="text-xs font-medium text-white sm:text-sm lg:text-base">
							Negative: {sentiment.negative}
						</span>
					</div>
				</div>
			</div>

			<div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
				<h4 className="text-sm font-semibold text-white sm:text-[15px] lg:text-lg">Score Breakdown</h4>

				<ul className="space-y-1.5 text-xs text-white/80 sm:space-y-2 sm:text-sm lg:text-base">
					<li className="flex items-center justify-between">
						<span>• Fundamentals:</span>
						<span className="font-semibold">{score.fundamentals.toFixed(4)}</span>
					</li>
					<li className="flex items-center justify-between">
						<span>• Technical:</span>
						<span className="font-semibold">{score.technical.toFixed(4)}</span>
					</li>
					<li className="flex items-center justify-between">
						<span>• News:</span>
						<span className="font-semibold">{score.news.toFixed(4)}</span>
					</li>
					<li className="flex items-center justify-between">
						<span>• Insider:</span>
						<span className="font-semibold">{score.insider.toFixed(1)}</span>
					</li>
					<li className="flex items-center justify-between border-t border-white/10 pt-1.5 text-sm font-semibold text-white sm:pt-2 sm:text-[15px] lg:text-lg">
						<span>• Final Score:</span>
						<span className="text-emerald-400">{score.finalScore.toFixed(4)}</span>
					</li>
				</ul>
			</div>
		</div>
	);
};

export default ScoreIndicatorsView;
