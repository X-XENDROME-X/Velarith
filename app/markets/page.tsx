"use client"; // <-- Convert to a Client Component to use hooks

import { useState, useEffect } from "react"; // <-- Import hooks
import { StatCard } from "@/components/dashboard/StatCard";
import { InteractiveChart } from "@/components/dashboard/InteractiveChart";
import { MarketTable } from "@/components/dashboard/MarketTable";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

// Define a type for our chart data for type safety
interface ChartDataPoint {
  time: string;
  value: number;
  volume?: number;
}

// --- MOCK API FUNCTION ---
// In a real application, this function would make a fetch call to your backend API,
// for example: fetch(`/api/market-trends?range=${timeRange}`)
const fetchChartData = async (timeRange: string): Promise<ChartDataPoint[]> => {
  console.log(`Fetching new data for time range: ${timeRange}`);
  // Simulate a network delay to show loading states
  await new Promise((res) => setTimeout(res, 400));

  // Generate different mock data for each time range to prove it's working
  const baseValue = 41812;
  const generateData = (points: number, scale: number, labelFn: (i: number) => string) =>
    Array.from({ length: points }, (_, i) => ({
      time: labelFn(i),
      value: Math.floor(baseValue + (Math.random() - 0.5) * scale * Math.sqrt(i + 1)),
    }));
  
  switch (timeRange) {
    case '1h': return generateData(12, 60, (i) => `${(11-i) * 5}m`);
    case '8h': return generateData(8, 250, (i) => `${7-i}h ago`);
    case '1d': return generateData(24, 600, (i) => `${23-i}:00`);
    case '1w': return generateData(7, 2000, (i) => `Day ${7-i}`);
    case '1m': return generateData(30, 5000, (i) => `Day ${30-i}`);
    case '6m': return generateData(26, 9000, (i) => `Week ${26-i}`);
    case '1y': return generateData(52, 15000, (i) => `Week ${52-i}`);
    default: return generateData(24, 600, (i) => `${i}:00`);
  }
};


// Sample markets data (remains unchanged)
const marketsData = [
  { id: "1", name: "Will Bitcoin reach $100,000 by end of 2025?", category: "Crypto", yesPrice: 0.68, noPrice: 0.32, volume24h: 2450000, change24h: 3.2, expiryDate: "Dec 31, 2025" },
  { id: "2", name: "Will Democrats win the 2026 midterm elections?", category: "Politics", yesPrice: 0.54, noPrice: 0.46, volume24h: 1890000, change24h: -1.5, expiryDate: "Nov 8, 2026" },
  { id: "3", name: "Will Liverpool win the Premier League this season?", category: "Sports", yesPrice: 0.42, noPrice: 0.58, volume24h: 1250000, change24h: 5.8, expiryDate: "May 20, 2026" },
  { id: "4", name: "Will AI reach AGI before 2030?", category: "Science", yesPrice: 0.31, noPrice: 0.69, volume24h: 980000, change24h: -0.8, expiryDate: "Jan 1, 2030" },
  { id: "5", name: "Will the new Marvel movie gross over $1B?", category: "Entertainment", yesPrice: 0.72, noPrice: 0.28, volume24h: 750000, change24h: 2.1, expiryDate: "Aug 15, 2026" },
];

export default function MarketsPage() {
  // --- STATE MANAGEMENT ADDED HERE ---
  const [timeRange, setTimeRange] = useState('1d');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This hook fetches data whenever the `timeRange` state changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const newData = await fetchChartData(timeRange);
      setChartData(newData);
      setIsLoading(false);
    };

    loadData();
  }, [timeRange]); // The dependency array is crucial!

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Markets</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          AI-powered prediction market analytics at your fingertips
        </p>
      </div>

      {/* Stats Grid (remains unchanged) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Active Markets" value="1,284" change={12.5} changeLabel="from last month" trend="up" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="24h Trading Volume" value="$8.2M" change={4.6} changeLabel="from yesterday" trend="up" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Active Traders" value="42,384" change={-2.1} changeLabel="from last week" trend="down" icon={<Users className="h-5 w-5" />} />
        <StatCard title="Market Volatility" value="Medium" changeLabel="Updated just now" trend="neutral" icon={<Activity className="h-5 w-5" />} />
      </div>

      {/* Market Chart --- PROPS UPDATED HERE --- */}
      <InteractiveChart
        title="Market Trend Overview"
        data={chartData} // Use the state variable for data
        currentValue="$41,812.14"
        change="+$1,859.48"
        changePercent={4.6}
        timeRange={timeRange} // Pass the current timeRange state
        onTimeRangeChange={setTimeRange} // Pass the function to update the state
      />

      {/* Markets Table (remains unchanged) */}
      <MarketTable markets={marketsData} />
    </div>
  );
}