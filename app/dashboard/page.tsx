import { StatCard } from "@/components/dashboard/StatCard";
import { InteractiveChart } from "@/components/dashboard/InteractiveChart";
import { MarketTable } from "@/components/dashboard/MarketTable";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

// Sample chart data
const chartData = [
  { time: "8:00 AM", value: 42150, volume: 1200000 },
  { time: "9:00 AM", value: 41980, volume: 1350000 },
  { time: "10:00 AM", value: 42300, volume: 1500000 },
  { time: "11:00 AM", value: 42100, volume: 1450000 },
  { time: "12:00 PM", value: 41750, volume: 1680000 },
  { time: "1:00 PM", value: 41900, volume: 1720000 },
  { time: "2:00 PM", value: 41812, volume: 1590000 },
];

// Sample markets data
const marketsData = [
  {
    id: "1",
    name: "Will Bitcoin reach $100,000 by end of 2025?",
    category: "Crypto",
    yesPrice: 0.68,
    noPrice: 0.32,
    volume24h: 2450000,
    change24h: 3.2,
    expiryDate: "Dec 31, 2025",
  },
  {
    id: "2",
    name: "Will Democrats win the 2026 midterm elections?",
    category: "Politics",
    yesPrice: 0.54,
    noPrice: 0.46,
    volume24h: 1890000,
    change24h: -1.5,
    expiryDate: "Nov 8, 2026",
  },
  {
    id: "3",
    name: "Will Liverpool win the Premier League this season?",
    category: "Sports",
    yesPrice: 0.42,
    noPrice: 0.58,
    volume24h: 1250000,
    change24h: 5.8,
    expiryDate: "May 20, 2026",
  },
  {
    id: "4",
    name: "Will AI reach AGI before 2030?",
    category: "Science",
    yesPrice: 0.31,
    noPrice: 0.69,
    volume24h: 980000,
    change24h: -0.8,
    expiryDate: "Jan 1, 2030",
  },
  {
    id: "5",
    name: "Will the new Marvel movie gross over $1B?",
    category: "Entertainment",
    yesPrice: 0.72,
    noPrice: 0.28,
    volume24h: 750000,
    change24h: 2.1,
    expiryDate: "Aug 15, 2026",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          AI-powered prediction market analytics at your fingertips
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Active Markets"
          value="1,284"
          change={12.5}
          changeLabel="from last month"
          trend="up"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="24h Trading Volume"
          value="$8.2M"
          change={4.6}
          changeLabel="from yesterday"
          trend="up"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Active Traders"
          value="42,384"
          change={-2.1}
          changeLabel="from last week"
          trend="down"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Market Volatility"
          value="Medium"
          changeLabel="Updated just now"
          trend="neutral"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      {/* Market Chart */}
      <InteractiveChart
        title="Market Trend Overview"
        data={chartData}
        currentValue="$41,812.14"
        change="+$1,859.48"
        changePercent={4.6}
      />

      {/* Markets Table */}
      <MarketTable markets={marketsData} />
    </div>
  );
}
