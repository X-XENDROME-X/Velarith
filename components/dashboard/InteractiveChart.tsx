"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useState } from "react";

interface ChartDataPoint {
  time: string;
  value: number;
  volume?: number;
}

interface InteractiveChartProps {
  title: string;
  data: ChartDataPoint[];
  currentValue?: string;
  change?: string;
  changePercent?: number;
}

const timeRanges = [
  { label: "1h", value: "1h" },
  { label: "8h", value: "8h" },
  { label: "1d", value: "1d" },
  { label: "1w", value: "1w" },
  { label: "1m", value: "1m" },
  { label: "6m", value: "6m" },
  { label: "1y", value: "1y" },
];

export function InteractiveChart({
  title,
  data,
  currentValue,
  change,
  changePercent,
}: InteractiveChartProps) {
  const [timeRange, setTimeRange] = useState("1d");

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold truncate">{title}</h3>
            {currentValue && (
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold">{currentValue}</span>
                {change && changePercent !== undefined && (
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      changePercent >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {change} ({changePercent > 0 ? "+" : ""}
                    {changePercent}%)
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Time Range Selector */}
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList className="grid grid-cols-7 w-full sm:w-fit">
              {timeRanges.map((range) => (
                <TabsTrigger
                  key={range.value}
                  value={range.value}
                  className="text-xs px-2 sm:px-3"
                >
                  {range.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Chart */}
        <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                        <p className="text-sm text-muted-foreground">
                          {payload[0].payload.time}
                        </p>
                        <p className="text-lg font-bold">
                          ${payload[0].value}
                        </p>
                        {payload[0].payload.volume && (
                          <p className="text-xs text-muted-foreground">
                            Volume: ${payload[0].payload.volume.toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
