"use client";

import { cn } from "@/lib/utils";
import { getProgressStatus } from "@/lib/goals/client";
import { Label, Pie, PieChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Target, GitBranch } from "lucide-react";

interface GoalProgressProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function GoalProgress({
  progress,
  size = "md",
  showLabel = true,
  className,
}: GoalProgressProps) {
  const status = getProgressStatus(progress);

  const statusColors = {
    "on-track": "bg-emerald-500",
    "at-risk": "bg-amber-500",
    behind: "bg-red-500",
    completed: "bg-emerald-500",
  };

  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex-1 rounded-full bg-muted overflow-hidden",
          heights[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            statusColors[status]
          )}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn("text-sm font-medium tabular-nums", {
            "text-emerald-600 dark:text-emerald-400":
              status === "on-track" || status === "completed",
            "text-amber-600 dark:text-amber-400": status === "at-risk",
            "text-red-600 dark:text-red-400": status === "behind",
          })}
        >
          {progress}%
        </span>
      )}
    </div>
  );
}

interface GoalProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function GoalProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  label,
  className,
}: GoalProgressRingProps) {
  const status = getProgressStatus(progress);
  const remaining = Math.max(0, 100 - progress);

  // Use explicit color values that work with recharts
  const statusColors: Record<string, string> = {
    "on-track": "#10b981", // emerald-500
    "at-risk": "#f59e0b", // amber-500
    behind: "#ef4444", // red-500
    completed: "#10b981", // emerald-500
  };

  const progressColor = statusColors[status];

  const chartData = [
    { name: "progress", value: progress, fill: progressColor },
    { name: "remaining", value: remaining, fill: "var(--color-remaining)" },
  ];

  const chartConfig = {
    progress: {
      label: "Progress",
      color: progressColor,
    },
    remaining: {
      label: "Remaining",
      color: "hsl(var(--muted))",
    },
  } satisfies ChartConfig;

  // Calculate inner radius based on size and strokeWidth
  const innerRadius = size / 2 - strokeWidth - 2;
  const outerRadius = size / 2 - 2;

  // Adjust font size based on size
  const fontSize =
    size <= 40 ? "text-[10px]" : size <= 56 ? "text-xs" : "text-sm";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div style={{ width: size, height: size }}>
        <ChartContainer
          config={chartConfig}
          className="aspect-square [&_.recharts-pie-sector]:outline-none"
          style={{ width: size, height: size }}
        >
          <PieChart width={size} height={size}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className={cn(
                            "fill-foreground font-semibold",
                            fontSize
                          )}
                        >
                          {progress}%
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground text-center">
          {label}
        </span>
      )}
    </div>
  );
}

interface EmptyProgressRingProps {
  size?: number;
  strokeWidth?: number;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

function EmptyProgressRing({
  size = 48,
  strokeWidth = 4,
  label,
  icon,
  className,
}: EmptyProgressRingProps) {
  const innerRadius = size / 2 - strokeWidth - 2;
  const outerRadius = size / 2 - 2;

  const chartData = [{ name: "empty", value: 100, fill: "var(--color-empty)" }];

  const chartConfig = {
    empty: {
      label: "No data",
      color: "hsl(var(--muted))",
    },
  } satisfies ChartConfig;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div style={{ width: size, height: size }}>
        <ChartContainer
          config={chartConfig}
          className="aspect-square [&_.recharts-pie-sector]:outline-none"
          style={{ width: size, height: size }}
        >
          <PieChart width={size} height={size}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              strokeWidth={0}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <foreignObject
                        x={(viewBox.cx || 0) - 10}
                        y={(viewBox.cy || 0) - 10}
                        width={20}
                        height={20}
                      >
                        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                          {icon}
                        </div>
                      </foreignObject>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

interface GoalDualProgressProps {
  keyResultsProgress: number;
  keyResultsCount: number;
  workProgress?: number;
  workItemsCount?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Displays two donut charts side by side:
 * 1. Key Results achievement progress
 * 2. Planned work progress (from initiatives)
 *
 * Shows empty states when there are no KRs or work items.
 */
export function GoalDualProgress({
  keyResultsProgress,
  keyResultsCount,
  workProgress = 0,
  workItemsCount = 0,
  size = 56,
  strokeWidth = 5,
  className,
}: GoalDualProgressProps) {
  const hasKeyResults = keyResultsCount > 0;
  const hasWork = workItemsCount > 0;

  return (
    <div className={cn("flex items-start gap-4", className)}>
      {/* Key Results Progress */}
      {hasKeyResults ? (
        <GoalProgressRing
          progress={keyResultsProgress}
          size={size}
          strokeWidth={strokeWidth}
          label={`${keyResultsCount} KR${keyResultsCount !== 1 ? "s" : ""}`}
        />
      ) : (
        <EmptyProgressRing
          size={size}
          strokeWidth={strokeWidth}
          label="No KRs"
          icon={<Target className="h-4 w-4" />}
        />
      )}

      {/* Work Progress */}
      {hasWork ? (
        <GoalProgressRing
          progress={workProgress}
          size={size}
          strokeWidth={strokeWidth}
          label={`${workItemsCount} project${workItemsCount !== 1 ? "s" : ""}`}
        />
      ) : (
        <EmptyProgressRing
          size={size}
          strokeWidth={strokeWidth}
          label="No projects"
          icon={<GitBranch className="h-4 w-4" />}
        />
      )}
    </div>
  );
}
