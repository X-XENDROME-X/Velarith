import DailyPerformanceCalendar from "@/components/dashboard/DailyPerformanceCalendar";
import { BrokerDashboardData } from "@/lib/types/broker-dashboard";
import { cn } from "@/lib/utils";

interface BrokerDashboardViewProps {
  data: BrokerDashboardData;
  accentGradient: string;
  accentBorder: string;
}

const PROGRESS_WIDTH_CLASSES = [
  "w-[0%]",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-[100%]",
] as const;

const getProgressWidthClass = (value: number) => {
  const safeValue = Math.min(100, Math.max(0, value));
  const index = Math.round(safeValue / 5);
  return PROGRESS_WIDTH_CLASSES[index];
};

const BrokerDashboardView = ({ data, accentGradient, accentBorder }: BrokerDashboardViewProps) => {
  const { stats, tradeStatistics, tradePerformance, winRateStatistics, calendar } = data;

  const summaryCards = [
    {
      key: "monthlyVolume",
      label: "Monthly Volume",
      value: stats.monthlyVolume.value,
      meta: [
        `Daily Avg: ${stats.monthlyVolume.dailyAvg ?? "—"}`,
        `Trade Avg: ${stats.monthlyVolume.tradeAvg ?? "—"}`,
      ],
    },
    {
      key: "monthlyNetPnl",
      label: "Monthly Net P&L",
      value: stats.monthlyNetPnl.value,
      meta: [
        `Total Profit: ${stats.monthlyNetPnl.totalProfit ?? "—"}`,
        `Total Loss: ${stats.monthlyNetPnl.totalLoss ?? "—"}`,
      ],
    },
    {
      key: "monthlyFees",
      label: "Monthly Fees",
      value: stats.monthlyFees.value,
      meta: [`Trade Avg: ${stats.monthlyFees.tradeAvg ?? "—"}`],
    },
    {
      key: "profitFactor",
      label: "Profit Factor",
      value: stats.profitFactor.value,
      meta: [
        `Total Profit: ${stats.profitFactor.totalProfit ?? "—"}`,
        `Total Loss: ${stats.profitFactor.totalLoss ?? "—"}`,
      ],
    },
    {
      key: "daysTraded",
      label: "Days Traded",
      value: stats.daysTraded.value,
      meta: [
        `Days Won: ${stats.daysTraded.daysWon ?? "—"}`,
        `Days Lost: ${stats.daysTraded.daysLost ?? "—"}`,
      ],
    },
  ];

  const winRateEntries = [
    { label: "By Trades", value: winRateStatistics.byTrades },
    { label: "By Days", value: winRateStatistics.byDays },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <section aria-label="Monthly performance summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/40 p-5 shadow-[0_30px_100px_-60px_rgba(56,189,248,0.5)] backdrop-blur transition duration-300 hover:border-white/20 hover:bg-slate-900/55 sm:p-6"
          >
            <div className={cn("pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100", "bg-gradient-to-br", accentGradient)} />
            <div className="relative space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{card.label}</p>
              <p className="text-2xl font-semibold text-white sm:text-3xl">{card.value}</p>
              <ul className="space-y-1 text-xs text-white/70">
                {card.meta.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <article className="flex h-full flex-col rounded-[28px] border border-white/10 bg-slate-900/40 p-6 shadow-inner sm:p-7 lg:col-span-2">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-white">Trade Statistics</h3>
            <span className={cn("self-start rounded-full border px-3 py-1 text-xs font-medium text-white/80 sm:self-auto", accentBorder)}>
              {tradeStatistics.totalTrades} trades
            </span>
          </header>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-white/80 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
            {[
              { label: "Winning", value: tradeStatistics.winning },
              { label: "Losing", value: tradeStatistics.losing },
              { label: "Break Even", value: tradeStatistics.breakEven },
              { label: "Long Trades", value: tradeStatistics.longTrades },
              { label: "Short Trades", value: tradeStatistics.shortTrades },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center md:px-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-white lg:text-xl">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 text-xs text-white/60 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-[0.3em]">Win Ratio</p>
              <p className="mt-1 text-base font-semibold text-white">
                {tradeStatistics.winning} / {tradeStatistics.totalTrades}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-[0.3em]">Short / Long Mix</p>
              <p className="mt-1 text-base font-semibold text-white">
                {tradeStatistics.shortTrades} short • {tradeStatistics.longTrades} long
              </p>
            </div>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-[28px] border border-white/10 bg-slate-900/40 p-6 shadow-inner sm:p-7 lg:col-span-1">
          <h3 className="text-lg font-semibold text-white">Trade Performance</h3>
          <dl className="mt-5 flex flex-col gap-4">
            {[
              { label: "Average Win", value: tradePerformance.averageWin },
              { label: "Largest Win", value: tradePerformance.largestWin },
              { label: "Average Loss", value: tradePerformance.averageLoss },
              { label: "Largest Loss", value: tradePerformance.largestLoss },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.3em] text-white/50">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="flex h-full flex-col rounded-[28px] border border-white/10 bg-slate-900/40 p-6 shadow-inner sm:p-7 lg:col-span-1">
          <h3 className="text-lg font-semibold text-white">Win Rate Statistics</h3>
          <div className="mt-5 flex flex-col justify-between gap-6">
            {winRateEntries.map((entry) => {
              const widthClass = getProgressWidthClass(entry.value);
              return (
                <div key={entry.label}>
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>{entry.label}</span>
                    <span className="font-semibold">{entry.value.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={cn("h-full rounded-full bg-gradient-to-r", accentGradient, widthClass)} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

  <DailyPerformanceCalendar entries={calendar} accentBorder={accentBorder} />
    </div>
  );
};

export default BrokerDashboardView;
