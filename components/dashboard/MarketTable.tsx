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
      <div className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Live Markets</h3>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {sortedMarkets.map((market) => (
            <div
              key={market.id}
              className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              {/* Market Name & Category */}
              <div className="space-y-2">
                <p className="font-medium text-sm leading-tight">{market.name}</p>
                <Badge variant="outline" className={getCategoryColor(market.category)}>
                  {market.category}
                </Badge>
              </div>

              {/* Market Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Yes/No Odds</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {(market.yesPrice * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="bg-danger/10 text-danger border-danger/20">
                      {(market.noPrice * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-muted-foreground text-xs mb-1">24h Volume</p>
                  <p className="font-mono font-medium">${(market.volume24h / 1000000).toFixed(2)}M</p>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs mb-1">24h Change</p>
                  <div
                    className={`flex items-center gap-1 ${
                      market.change24h >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {market.change24h >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span className="font-medium text-sm">
                      {market.change24h > 0 ? "+" : ""}
                      {market.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs mb-1">Expiry</p>
                  <p className="text-sm">{market.expiryDate}</p>
                </div>
              </div>

              {/* Action Button */}
              <Button variant="outline" size="sm" className="w-full">
                View Market
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
