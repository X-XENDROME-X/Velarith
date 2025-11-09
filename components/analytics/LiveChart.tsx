"use client";

import { useEffect, useRef } from "react";

interface LiveChartProps {
	symbol: string;
}

declare global {
	interface Window {
		TradingView?: any;
	}
}

const LiveChart = ({ symbol }: LiveChartProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetRef = useRef<any>(null);

	useEffect(() => {
		const loadTradingViewScript = () => {
			if (document.getElementById("tradingview-widget-script")) {
				initializeWidget();
				return;
			}

			const script = document.createElement("script");
			script.id = "tradingview-widget-script";
			script.src = "https://s3.tradingview.com/tv.js";
			script.async = true;
			script.onload = () => initializeWidget();
			document.body.appendChild(script);
		};

		const initializeWidget = () => {
			if (!window.TradingView || !containerRef.current) return;

			// Clear previous widget
			if (widgetRef.current) {
				containerRef.current.innerHTML = "";
			}

			widgetRef.current = new window.TradingView.widget({
				container_id: containerRef.current.id,
				symbol: symbol,
				interval: "D",
				timezone: "Etc/UTC",
				theme: "dark",
				style: "1",
				locale: "en",
				toolbar_bg: "rgba(15, 23, 42, 0.5)",
				enable_publishing: false,
				hide_top_toolbar: false,
				hide_legend: false,
				save_image: false,
				backgroundColor: "rgba(15, 23, 42, 0.3)",
				gridColor: "rgba(255, 255, 255, 0.06)",
				studies: [
					"MASimple@tv-basicstudies",
					"RSI@tv-basicstudies",
				],
				width: "100%",
				height: "100%",
				allow_symbol_change: true,
				details: true,
				hotlist: true,
				calendar: false,
			});
		};

		loadTradingViewScript();

		return () => {
			if (widgetRef.current && containerRef.current) {
				containerRef.current.innerHTML = "";
				widgetRef.current = null;
			}
		};
	}, [symbol]);

	return (
		<div className="relative overflow-hidden rounded-[16px] border border-white/10 bg-slate-900/70 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:rounded-[20px] md:rounded-[24px] lg:rounded-[28px]">
			<div className="border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-3.5">
				<h3 className="text-sm font-semibold text-white sm:text-[15px] lg:text-base">Live Chart</h3>
			</div>

			<div className="relative h-[320px] min-h-[280px] xs:h-[360px] sm:h-[420px] md:h-[480px] lg:h-[550px] xl:h-[600px]">
				<div
					ref={containerRef}
					id={`tradingview-chart-${symbol}`}
					className="h-full w-full"
				/>
			</div>
		</div>
	);
};

export default LiveChart;
