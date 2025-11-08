"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface Market {
  id: string;
  name: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  change24h: number;
  expiryDate: string;
}

interface MarketTableProps {
  markets: Market[];
}

export function MarketTable({ markets }: MarketTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Market;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedMarkets = [...markets].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: keyof Market) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Politics: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Sports: "bg-green-500/10 text-green-500 border-green-500/20",
      Crypto: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      Entertainment: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      Science: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      Other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[category] || colors.Other;
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Live Markets</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Category</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("yesPrice")}
              >
                <div className="flex items-center gap-1">
                  Yes/No Odds
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("volume24h")}
              >
                <div className="flex items-center gap-1">
                  24h Volume
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("change24h")}
              >
                <div className="flex items-center gap-1">
                  24h Change
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMarkets.map((market) => (
              <TableRow key={market.id} className="hover:bg-muted/50">
                <TableCell className="font-medium max-w-xs">
                  <div className="truncate">{market.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoryColor(market.category)}>
                    {market.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <span className="text-success font-medium">
                      {(market.yesPrice * 100).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-danger font-medium">
                      {(market.noPrice * 100).toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono">
                  ${market.volume24h.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div
                    className={`flex items-center gap-1 ${
                      market.change24h >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {market.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {market.change24h > 0 ? "+" : ""}
                      {market.change24h.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {market.expiryDate}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
