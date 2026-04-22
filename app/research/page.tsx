"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TickerTape from "@/components/analytics/TickerTape";
import SearchBar from "@/components/analytics/SearchBar";
import FilterControls from "@/components/analytics/FilterControls";
import LiveChart from "@/components/analytics/LiveChart";
import AnalysisPanel from "@/components/analytics/AnalysisPanel";
import { ResearchToolbar } from "@/components/research/ResearchToolbar";
import type { AnalysisFilters } from "@/lib/types/analytics";

function ResearchPageInner() {
	const searchParams = useSearchParams();
	const initialTicker = (searchParams.get("ticker") ?? "AAPL").toUpperCase();

	const [selectedSymbol, setSelectedSymbol] = useState<string>(initialTicker);
	const [filters, setFilters] = useState<AnalysisFilters>({
		timeframe: "Long Term",
		pennyStock: false,
		age: "",
	});
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	// Sync ?ticker= param changes back into state (e.g. when user clicks
	// a related-ticker link from /markets/[slug]).
	useEffect(() => {
		const next = searchParams.get("ticker");
		if (next && next.toUpperCase() !== selectedSymbol) {
			setSelectedSymbol(next.toUpperCase());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const handleAnalyze = async (symbol: string) => {
		setIsAnalyzing(true);
		setSelectedSymbol(symbol);
		setTimeout(() => setIsAnalyzing(false), 500);
	};

	return (
		<>
			<TickerTape />
			<div className="space-y-4 sm:space-y-5 lg:space-y-6">
				<div className="space-y-1">
					<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
						Market research
					</p>
					<h1 className="text-xl font-bold text-white sm:text-2xl">
						Use stock signals to sharpen your market view
					</h1>
					<p className="text-sm text-white/55">
						Technicals, fundamentals, and sentiment presented as supporting evidence for
						prediction market analysis.
					</p>
				</div>

				<SearchBar onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
				<ResearchToolbar symbol={selectedSymbol} />
				<FilterControls filters={filters} onFiltersChange={setFilters} />

				<div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,700px)]">
					<LiveChart symbol={selectedSymbol} />
					<AnalysisPanel symbol={selectedSymbol} filters={filters} />
				</div>
			</div>
		</>
	);
}

export default function ResearchPage() {
	return (
		<Suspense fallback={<div className="h-screen" />}>
			<ResearchPageInner />
		</Suspense>
	);
}
