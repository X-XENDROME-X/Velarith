"use client";

import { ChevronDown } from "lucide-react";
import type { AnalysisFilters } from "@/lib/types/analytics";

interface FilterControlsProps {
	filters: AnalysisFilters;
	onFiltersChange: (filters: AnalysisFilters) => void;
}

const TIMEFRAME_OPTIONS = ["Long Term", "Short Term"];

const FilterControls = ({ filters, onFiltersChange }: FilterControlsProps) => {
	const handleTimeframeChange = (timeframe: string) => {
		onFiltersChange({ ...filters, timeframe });
	};

	// const handleAgeChange = (age: string) => {
	// 	onFiltersChange({ ...filters, age });
	// };

	return (
		<div className="flex flex-wrap items-center gap-3 sm:gap-4">
			<div className="relative w-full sm:w-auto">
				<select
					value={filters.timeframe}
					onChange={(e) => handleTimeframeChange(e.target.value)}
					aria-label="Select timeframe"
					className="min-h-[44px] w-full appearance-none rounded-[16px] border border-white/10 bg-white/5 py-2.5 pl-4 pr-10 text-base text-white backdrop-blur-sm transition focus:border-white/30 focus:bg-white/10 focus:outline-none sm:w-[180px] sm:rounded-[20px] sm:py-3"
				>
					{TIMEFRAME_OPTIONS.map((option) => (
						<option key={option} value={option} className="bg-slate-900 text-white">
							{option}
						</option>
					))}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
					<ChevronDown className="size-4 text-white/60" />
				</div>
			</div>

			{/* <input
				type="text"
				value={filters.age}
				onChange={(e) => handleAgeChange(e.target.value)}
				placeholder="Age"
				className="w-[100px] rounded-[16px] border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm transition focus:border-white/30 focus:bg-white/10 focus:outline-none sm:w-[140px] sm:rounded-[20px] sm:py-3 sm:text-base"
			/> */}

		</div>
	);
};

export default FilterControls;
