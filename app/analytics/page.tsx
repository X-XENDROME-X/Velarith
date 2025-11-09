"use client";

import { useState } from "react";
import TickerTape from "@/components/analytics/TickerTape";
import SearchBar from "@/components/analytics/SearchBar";
import FilterControls from "@/components/analytics/FilterControls";
import LiveChart from "@/components/analytics/LiveChart";
import AnalysisPanel from "@/components/analytics/AnalysisPanel";
import type { AnalysisFilters } from "@/lib/types/analytics";

const AnalyticsPage = () => {
	const [selectedSymbol, setSelectedSymbol] = useState<string>("AAPL");
	const [filters, setFilters] = useState<AnalysisFilters>({
		timeframe: "Long Term",
		pennyStock: false,
		age: "",
		riskProfile: "",
	});
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	const handleAnalyze = async (symbol: string) => {
		setIsAnalyzing(true);
		setSelectedSymbol(symbol);
		// Analysis will be triggered in AnalysisPanel
		setTimeout(() => setIsAnalyzing(false), 500);
	};

	return (
		<>
			<TickerTape />
			<div className="space-y-4 sm:space-y-5 lg:space-y-6">
				<SearchBar onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
				<FilterControls filters={filters} onFiltersChange={setFilters} />

				<div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,700px)]">
					<LiveChart symbol={selectedSymbol} />
					<AnalysisPanel symbol={selectedSymbol} filters={filters} />
				</div>
			</div>
		</>
	);
};

export default AnalyticsPage;
