"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import type { StockSearchResult } from "@/lib/types/analytics";
import { cn } from "@/lib/utils";

interface SearchBarProps {
	onAnalyze: (symbol: string) => void;
	isAnalyzing: boolean;
}

const SearchBar = ({ onAnalyze, isAnalyzing }: SearchBarProps) => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<StockSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [inputError, setInputError] = useState<string | null>(null);
	const searchRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
				setShowResults(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setShowResults(false);
			return;
		}

		const searchStocks = async () => {
			setIsSearching(true);
			try {
				const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
				if (response.ok) {
					const data = await response.json();
					setResults(data);
					setShowResults(true);
				}
			} catch (error) {
				console.error("Search failed:", error);
			} finally {
				setIsSearching(false);
			}
		};

		const debounce = setTimeout(searchStocks, 300);
		return () => clearTimeout(debounce);
	}, [query]);

	const handleSelectStock = (symbol: string) => {
		setQuery(symbol);
		setShowResults(false);
		setInputError(null);
		onAnalyze(symbol);
	};

	// Change start: resolve user input to a valid ticker before analysis
	const handleAnalyzeClick = () => {
		const trimmed = query.trim();
		if (!trimmed) return;
		const tickerPattern = /^[A-Za-z][A-Za-z0-9.\-]{0,9}$/;

		const symbolMatch = results.find((r) => r.symbol.toUpperCase() === trimmed.toUpperCase());
		const nameMatch = results.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());

		const resolved =
			symbolMatch?.symbol ??
			nameMatch?.symbol ??
			(tickerPattern.test(trimmed) ? trimmed.toUpperCase() : null);

		if (!resolved) {
			setInputError("Pick a valid ticker from suggestions (e.g. AAPL).");
			setShowResults(true);
			return;
		}

		setInputError(null);
		onAnalyze(resolved);
		setShowResults(false);
	};
	// Change end: resolve user input to a valid ticker before analysis

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && query.trim()) {
			handleAnalyzeClick();
		}
	};

	return (
		<div ref={searchRef} className="relative">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="relative flex-1">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4 lg:pl-5">
						<Search className="size-4 text-cyan-200/70 sm:size-[18px] lg:size-5" />
					</div>
					<input
						type="text"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							if (inputError) setInputError(null);
						}}
						onKeyDown={handleKeyDown}
						placeholder="Enter ticker or company name..."
						className="w-full rounded-[18px] border border-white/12 bg-white/[0.035] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition focus:border-cyan-400/45 focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] focus:outline-none sm:rounded-[20px] sm:py-3 sm:pl-11 sm:pr-4 sm:text-[15px] lg:rounded-[24px] lg:py-4 lg:pl-12 lg:pr-5 lg:text-base"
					/>
					{isSearching && (
						<div className="absolute inset-y-0 right-3.5 flex items-center sm:right-4">
							<div className="size-4 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-200/80" />
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={handleAnalyzeClick}
					disabled={!query.trim() || isAnalyzing}
					className={cn(
						"rounded-[16px] bg-gradient-to-r from-cyan-400 to-teal-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_24px_-12px_rgba(45,212,191,0.6)] transition sm:rounded-[18px] sm:px-7 sm:py-3 sm:text-[15px] lg:rounded-[20px] lg:px-8 lg:py-4 lg:text-base",
						query.trim() && !isAnalyzing
							? "hover:from-cyan-300 hover:to-teal-300 hover:shadow-[0_16px_28px_-12px_rgba(45,212,191,0.75)] active:scale-[0.98]"
							: "cursor-not-allowed opacity-50 shadow-none",
					)}
				>
					{isAnalyzing ? "Analyzing..." : "Analyze"}
				</button>
			</div>
			{inputError && (
				<p className="mt-2 text-xs text-rose-300/90">{inputError}</p>
			)}

			{showResults && results.length > 0 && (
				<div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[18px] border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-md sm:rounded-[20px] lg:rounded-[24px]">
					<div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
						{results.map((result) => (
							<button
								key={result.symbol}
								type="button"
								onClick={() => handleSelectStock(result.symbol)}
								className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition hover:bg-white/10 sm:px-4 sm:py-3 lg:px-5 lg:py-3.5"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-white sm:text-[15px] lg:text-base">{result.symbol}</p>
									<p className="truncate text-xs text-white/60 sm:text-sm">{result.name}</p>
								</div>
								<span className="ml-3 shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70 sm:px-2.5 sm:py-1 sm:text-xs">
									{result.exchange}
								</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default SearchBar;
