"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { StockQuote } from "@/lib/types/analytics";
import { cn } from "@/lib/utils";

const TICKER_SYMBOLS = ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "NFLX"];

const TickerTape = () => {
	const [quotes, setQuotes] = useState<StockQuote[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchQuotes = async () => {
			try {
				const response = await fetch(`/api/stocks/quotes?symbols=${TICKER_SYMBOLS.join(",")}`);
				if (response.ok) {
					const data = await response.json();
					setQuotes(data);
				}
			} catch (error) {
				console.error("Failed to fetch quotes:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchQuotes();
		const interval = setInterval(fetchQuotes, 15000); // Update every 15 seconds

		return () => clearInterval(interval);
	}, []);

	if (isLoading || quotes.length === 0) {
		return (
			<div className="fixed left-0 right-0 top-16 z-30 border-b border-white/10 bg-[#0B1120]/98 backdrop-blur-xl lg:left-20 lg:top-0">
				<div className="flex items-center gap-4 overflow-hidden px-2 py-2 xs:gap-5 xs:px-3 xs:py-2.5 sm:gap-6 sm:px-4 sm:py-3 lg:gap-8 lg:px-6">
					{TICKER_SYMBOLS.map((symbol) => (
						<div key={symbol} className="flex shrink-0 items-center gap-1 xs:gap-1.5 sm:gap-2">
							<div className="size-3.5 animate-pulse rounded-full bg-white/10 xs:size-4 sm:size-5" />
							<span className="text-[10px] font-semibold text-white/40 xs:text-[11px] sm:text-xs md:text-sm">{symbol}</span>
							<span className="text-[9px] text-white/20 xs:text-[10px] sm:text-xs">Loading...</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="fixed left-0 right-0 top-16 z-30 border-b border-white/10 bg-[#0B1120]/98 backdrop-blur-xl lg:left-20 lg:top-0">
			<div className="relative overflow-hidden">
				<div className="flex animate-ticker items-center gap-4 py-2 xs:gap-5 xs:py-2.5 sm:gap-6 sm:py-3 lg:gap-8">
					{[...quotes, ...quotes].map((quote, index) => (
						<div key={`${quote.symbol}-${index}`} className="flex shrink-0 items-center gap-1 px-2 xs:gap-1.5 xs:px-3 sm:gap-2 sm:px-4 lg:px-6">
							{quote.logo && (
								<div className="relative size-3.5 shrink-0 overflow-hidden rounded-full xs:size-4 sm:size-5">
									<Image src={quote.logo} alt={quote.symbol} fill className="object-cover" />
								</div>
							)}
							<span className="text-[10px] font-semibold text-white xs:text-[11px] sm:text-xs md:text-sm">{quote.symbol}</span>
							<span className="text-[10px] font-medium text-white/90 xs:text-[11px] sm:text-xs md:text-sm">
								{quote.price.toFixed(2)}
								<sup className="ml-0.5 text-[8px] text-white/60 xs:text-[9px] sm:text-[10px]">D</sup>
							</span>
							<span
								className={cn(
									"text-[9px] font-medium xs:text-[10px] sm:text-xs",
									quote.change >= 0 ? "text-emerald-400" : "text-rose-400",
								)}
							>
								{quote.change >= 0 ? "+" : ""}
								{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}
								{quote.changePercent.toFixed(2)}%)
							</span>
						</div>
					))}
				</div>
			</div>

			<style jsx>{`
				@keyframes ticker {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-50%);
					}
				}

				.animate-ticker {
					animation: ticker 40s linear infinite;
				}

				.animate-ticker:hover {
					animation-play-state: paused;
				}
			`}</style>
		</div>
	);
};

export default TickerTape;
