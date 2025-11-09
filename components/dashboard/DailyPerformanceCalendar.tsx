"use client";

import { useEffect, useMemo, useState } from "react";
import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	parseISO,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { BrokerCalendarEntry } from "@/lib/types/broker-dashboard";
import { cn } from "@/lib/utils";

interface DailyPerformanceCalendarProps {
	entries: BrokerCalendarEntry[];
	accentBorder: string;
}

interface CalendarDay {
	date: Date;
	iso: string;
	isCurrentMonth: boolean;
	isToday: boolean;
	entry?: BrokerCalendarEntry;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const parseCurrencyValue = (value: string) => {
	const numeric = Number(value.replace(/[^0-9.-]/g, ""));
	return Number.isFinite(numeric) ? numeric : 0;
};

const parseCount = (value: string) => {
	const numeric = Number(value.replace(/[^0-9]/g, ""));
	return Number.isFinite(numeric) ? numeric : 0;
};

const getTodayInTimeZone = () => {
	const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
	const now = new Date();

	try {
		const formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});

		const parts = formatter
			.formatToParts(now)
			.reduce<Record<string, string>>((acc, part) => {
				if (part.type !== "literal") {
					acc[part.type] = part.value;
				}
				return acc;
			}, {});

		const year = Number(parts.year);
		const month = Number(parts.month) - 1;
		const day = Number(parts.day);

		if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
			return new Date(year, month, day);
		}
	} catch {
		// no-op: fall back to local timezone if Intl fails
	}

	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 2,
});

const formatSignedCurrency = (value: number) => {
	if (value === 0) {
		return currencyFormatter.format(0);
	}
	const formatted = currencyFormatter.format(Math.abs(value));
	return `${value >= 0 ? "+" : "-"}${formatted}`;
};

const DailyPerformanceCalendar = ({ entries, accentBorder }: DailyPerformanceCalendarProps) => {
		const today = useMemo(() => getTodayInTimeZone(), []);

		const sortedEntries = useMemo(() => {
		return [...entries]
			.filter((entry) => !!entry.date)
			.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
	}, [entries]);

		const initialMonth = useMemo(() => {
			if (sortedEntries.length > 0) {
				const hasCurrentMonthData = sortedEntries.some((entry) => isSameMonth(parseISO(entry.date), today));
				if (hasCurrentMonthData) {
					return startOfMonth(today);
				}
			return startOfMonth(parseISO(sortedEntries[sortedEntries.length - 1].date));
		}
			return startOfMonth(today);
		}, [sortedEntries, today]);

	const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	useEffect(() => {
		setCurrentMonth(initialMonth);
	}, [initialMonth]);

	const entryMap = useMemo(() => {
		const map = new Map<string, BrokerCalendarEntry>();
		sortedEntries.forEach((entry) => {
			const key = format(parseISO(entry.date), "yyyy-MM-dd");
			map.set(key, entry);
		});
		return map;
	}, [sortedEntries]);

	const monthEntries = useMemo(() => {
		return sortedEntries.filter((entry) => {
			const entryDate = parseISO(entry.date);
			return entryDate.getFullYear() === currentMonth.getFullYear() && entryDate.getMonth() === currentMonth.getMonth();
		});
	}, [sortedEntries, currentMonth]);

		useEffect(() => {
			if (isSameMonth(today, currentMonth)) {
				setSelectedDate(today);
				return;
			}

			if (monthEntries.length > 0) {
			const latestEntry = monthEntries[monthEntries.length - 1];
			setSelectedDate(parseISO(latestEntry.date));
		} else {
			setSelectedDate(startOfMonth(currentMonth));
		}
		}, [currentMonth, monthEntries, today]);

	const calendarDays: CalendarDay[] = useMemo(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);

		const interval = eachDayOfInterval({
			start: startOfWeek(monthStart, { weekStartsOn: 0 }),
			end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
		});

			return interval.map((date) => {
			const iso = format(date, "yyyy-MM-dd");
			return {
				date,
				iso,
				isCurrentMonth: isSameMonth(date, currentMonth),
					isToday: isSameDay(date, today),
				entry: entryMap.get(iso),
			};
			});
		}, [currentMonth, entryMap, today]);

	const selectedEntry = useMemo(() => {
		if (!selectedDate) return null;
		const iso = format(selectedDate, "yyyy-MM-dd");
		return entryMap.get(iso) ?? null;
	}, [selectedDate, entryMap]);

	const monthProfitDays = monthEntries.filter((entry) => entry.status === "profit").length;
	const monthLossDays = monthEntries.filter((entry) => entry.status === "loss").length;
	const monthNetPnl = monthEntries.reduce((acc, entry) => acc + parseCurrencyValue(entry.dailyPnl), 0);
	const monthTrades = monthEntries.reduce((acc, entry) => acc + parseCount(entry.trades), 0);

	const handlePreviousMonth = () => {
		setCurrentMonth((prev) => addMonths(prev, -1));
	};

	const handleNextMonth = () => {
		setCurrentMonth((prev) => addMonths(prev, 1));
	};

	return (
		<section className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 lg:rounded-[32px]">
			<header className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-[10px] uppercase tracking-[0.35em] text-white/60 sm:text-xs">{format(currentMonth, "MMMM yyyy")}</p>
					<h3 className="mt-1 text-base font-semibold text-white sm:text-lg md:text-xl">Daily Performance Calendar</h3>
				</div>
				<div className="flex items-center gap-2 sm:gap-3">
					<button
						type="button"
						onClick={handlePreviousMonth}
						className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-white/30 hover:bg-white/10 sm:size-9"
						aria-label="Previous month"
					>
						<ChevronLeft className="size-3.5 sm:size-4" aria-hidden="true" />
					</button>
					<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 sm:px-4 sm:text-sm">
						{format(currentMonth, "MMMM yyyy")}
					</div>
					<button
						type="button"
						onClick={handleNextMonth}
						className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-white/30 hover:bg-white/10 sm:size-9"
						aria-label="Next month"
					>
						<ChevronRight className="size-3.5 sm:size-4" aria-hidden="true" />
					</button>
				</div>
			</header>

			<div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60 sm:flex sm:flex-wrap sm:items-center sm:tracking-[0.2em] sm:text-xs">
				<span className={cn("rounded-full border px-2.5 py-1 text-center sm:px-3", accentBorder)}>Profit: {monthProfitDays}</span>
				<span className="rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-center sm:px-3">Loss: {monthLossDays}</span>
				<span className="rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-center sm:px-3">P&L: {formatSignedCurrency(monthNetPnl)}</span>
				<span className="rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-center sm:px-3">Trades: {monthTrades}</span>
			</div>

			<div className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-6">
				<article className="relative overflow-hidden rounded-[20px] border border-white/10 bg-slate-900/70 p-4 shadow-[0_30px_100px_-80px_rgba(56,189,248,0.35)] sm:rounded-[24px] sm:p-5 lg:rounded-[28px] lg:p-6">
					<div className="relative flex h-full flex-col justify-between gap-5 sm:gap-6">
						{selectedDate && (
							<div>
								<p className="text-[10px] uppercase tracking-[0.35em] text-white/60 sm:text-xs">{format(selectedDate, "EEEE")}</p>
								<h4 className="mt-1.5 text-xl font-semibold text-white sm:mt-2 sm:text-2xl lg:text-3xl">{format(selectedDate, "MMMM d, yyyy")}</h4>
							</div>
						)}

						{selectedEntry ? (
							<div className="space-y-4 sm:space-y-5">
								<div className="flex flex-wrap items-center gap-2 sm:gap-3">
									<span
										className={cn(
											"rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] sm:px-3 sm:text-xs",
											selectedEntry.status === "profit"
												? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
												: "border-rose-500/40 bg-rose-500/15 text-rose-200",
										)}
									>
										{selectedEntry.status === "profit" ? "Profit" : "Loss"}
									</span>
									<span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 sm:px-3 sm:text-xs">
										{selectedEntry.week}
									</span>
								</div>

								<div className="rounded-xl border border-white/10 bg-white/5 p-3.5 sm:rounded-2xl sm:p-4 lg:p-5">
									<p className="text-xs text-white/60 sm:text-sm">Daily P&amp;L</p>
									<p className={cn("mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl lg:text-[2.15rem]", selectedEntry.status === "profit" ? "text-emerald-200" : "text-rose-200")}>{selectedEntry.dailyPnl}</p>
								</div>

								<dl className="grid gap-2.5 text-sm text-white/80 sm:grid-cols-2 sm:gap-3">
									{[{ label: "Trades", value: selectedEntry.trades }, { label: "Win / Loss", value: selectedEntry.twDl }, { label: "Volume", value: selectedEntry.volume }, { label: "Fees", value: selectedEntry.fees }].map((item) => (
										<div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3 sm:rounded-2xl sm:p-3.5">
											<dt className="text-[10px] uppercase tracking-[0.25em] text-white/50 sm:text-[11px]">{item.label}</dt>
											<dd className="mt-1 text-sm font-medium text-white sm:text-base">{item.value}</dd>
										</div>
									))}
								</dl>
							</div>
						) : (
							<div className="flex h-full flex-col justify-center gap-3 text-sm text-white/70 sm:gap-4">
								<p>No recorded trades for this date.</p>
								<p className="text-xs uppercase tracking-[0.3em] text-white/40">Select a highlighted day to view trade metrics.</p>
							</div>
						)}
					</div>
				</article>

				<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
					<div className="min-w-[580px] sm:min-w-0">
						<div className="grid grid-cols-7 gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50 sm:gap-2 sm:text-[11px]">
							{WEEKDAY_LABELS.map((label) => (
								<span key={label} className="text-center">
									{label}
								</span>
							))}
						</div>

						<div className="mt-2.5 grid grid-cols-7 gap-1.5 sm:mt-3 sm:gap-2">
							{calendarDays.map((day) => {
							const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
							const statusClass = day.entry
								? day.entry.status === "profit"
									? "border-emerald-500/40 bg-emerald-500/10"
									: "border-rose-500/40 bg-rose-500/10"
								: "border-white/10 bg-white/5";

							return (
								<button
									key={day.iso}
									type="button"
									onClick={() => setSelectedDate(day.date)}
									className={cn(
										"group relative flex min-h-[110px] flex-col justify-between rounded-xl border p-2 text-left text-white transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 active:scale-[0.98] sm:min-h-[120px] sm:rounded-2xl sm:p-2.5 md:min-h-[135px] md:p-3 lg:hover:border-white/30 lg:hover:bg-white/10 xl:min-h-[150px]",
										statusClass,
										!day.isCurrentMonth && "border-dashed border-white/10 bg-white/0 text-white/30",
										day.isToday && "border-white/40",
										isSelected && "ring-2 ring-white ring-offset-0",
									)}
									aria-label={`View performance for ${format(day.date, "MMMM d, yyyy")}`}
								>
									<div className="flex items-start justify-between gap-1 text-[11px] text-white/70">
										<span className="font-semibold text-white">{format(day.date, "d")}</span>
										<div className="flex shrink-0 items-center gap-1">
											{!day.isCurrentMonth && <span className="text-[9px] uppercase tracking-[0.25em]">{format(day.date, "MMM")}</span>}
											{day.isToday && (
												<span className="rounded-full border border-white/30 bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/90 sm:px-2 sm:text-[9px]">
													Today
												</span>
											)}
										</div>
									</div>

									{day.entry ? (
										<div className="mt-2 flex flex-1 flex-col justify-end gap-1.5 sm:gap-2">
											<p className="truncate text-sm font-semibold text-white sm:text-base md:text-lg">{day.entry.dailyPnl}</p>
											<div className="space-y-0.5 text-[9px] leading-tight text-white/60 sm:text-[10px]">
												<div className="flex items-center justify-between gap-1">
													<span className="shrink-0">Trades</span>
													<span className="truncate text-right font-medium text-white">{day.entry.trades}</span>
												</div>
												<div className="flex items-center justify-between gap-1">
													<span className="shrink-0">W/L</span>
													<span className="truncate text-right font-medium text-white">{day.entry.twDl}</span>
												</div>
												<div className="flex items-center justify-between gap-1">
													<span className="shrink-0">Vol</span>
													<span className="truncate text-right font-medium text-white" title={day.entry.volume}>
														{day.entry.volume}
													</span>
												</div>
												<div className="flex items-center justify-between gap-1">
													<span className="shrink-0">Fees</span>
													<span className="truncate text-right font-medium text-white">{day.entry.fees}</span>
												</div>
											</div>
										</div>
									) : (
										<div className="mt-4 flex flex-1 items-center justify-center text-[10px] uppercase tracking-[0.25em] text-white/30">
											—
										</div>
									)}
								</button>
							);
						})}
					</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default DailyPerformanceCalendar;

