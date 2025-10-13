"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendPercentage?: number;
  trendLabel?: string;
  comparisonValues?: Array<{
    label: string;
    value: number;
    change?: number;
  }>;
  chart?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  description,
  trend = "neutral",
  trendPercentage,
  trendLabel,
  comparisonValues,
  chart,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main value */}
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {unit && (
              <div className="text-sm text-muted-foreground">{unit}</div>
            )}
          </div>

          {/* Trend indicator */}
          {trendPercentage !== undefined && (
            <div
              className={cn("flex items-center gap-1 text-sm", getTrendColor())}
            >
              {getTrendIcon()}
              <span className="font-medium">
                {trendPercentage > 0 ? "+" : ""}
                {trendPercentage.toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          )}

          {/* Comparison values */}
          {comparisonValues && comparisonValues.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {comparisonValues.map((comp, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {comp.label}: {comp.value.toLocaleString()}
                  {comp.change !== undefined && (
                    <span
                      className={cn(
                        "ml-1",
                        comp.change > 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      ({comp.change > 0 ? "+" : ""}
                      {comp.change.toFixed(1)}%)
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {/* Chart */}
          {chart && <div className="pt-4">{chart}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
