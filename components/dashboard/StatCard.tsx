import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === "up") return "text-success";
    if (trend === "down") return "text-danger";
    return "text-muted-foreground";
  };

  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUp className="h-4 w-4" />;
    if (trend === "down") return <ArrowDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{value}</p>
          {(change !== undefined || changeLabel) && (
            <div className={cn("flex items-center gap-1 text-xs sm:text-sm flex-wrap", getTrendColor())}>
              {trend && getTrendIcon()}
              {change !== undefined && (
                <span className="font-medium whitespace-nowrap">
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              )}
              {changeLabel && (
                <span className="text-muted-foreground truncate">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2.5 sm:p-3 text-primary flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
