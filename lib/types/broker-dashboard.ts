export interface BrokerDashboardMetric {
  value: string;
  dailyAvg?: string;
  tradeAvg?: string;
  totalProfit?: string;
  totalLoss?: string;
  daysWon?: string;
  daysLost?: string;
}

export interface BrokerTradeStatistics {
  totalTrades: number;
  winning: number;
  losing: number;
  breakEven: number;
  longTrades: number;
  shortTrades: number;
}

export interface BrokerTradePerformance {
  averageWin: string;
  largestWin: string;
  averageLoss: string;
  largestLoss: string;
}

export interface BrokerWinRateStatistics {
  byTrades: number;
  byDays: number;
}

export interface BrokerCalendarEntry {
  date: string;
  day: number;
  week: string;
  dailyPnl: string;
  status: "profit" | "loss";
  trades: string;
  twDl: string;
  volume: string;
  fees: string;
}

export interface BrokerDashboardData {
  accountName: string;
  stats: {
    monthlyVolume: BrokerDashboardMetric;
    monthlyNetPnl: BrokerDashboardMetric;
    monthlyFees: BrokerDashboardMetric;
    profitFactor: BrokerDashboardMetric;
    daysTraded: BrokerDashboardMetric;
  };
  tradeStatistics: BrokerTradeStatistics;
  tradePerformance: BrokerTradePerformance;
  winRateStatistics: BrokerWinRateStatistics;
  calendar: BrokerCalendarEntry[];
}

type BrokerKey = "robinhood" | "fidelity" | "etrade";

export type { BrokerKey };
