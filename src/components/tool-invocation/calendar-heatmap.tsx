"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

import { JsonViewPopup } from "../json-view-popup";
import { generateUniqueKey } from "lib/utils";

// Dynamic import for @uiw/react-heat-map to avoid SSR issues
const HeatMap = dynamic(() => import("@uiw/react-heat-map"), { ssr: false });

// CalendarHeatmap component props interface
export interface CalendarHeatmapProps {
  // Chart title (required)
  title: string;
  // Chart data array (required)
  data: Array<{
    date: string; // Date in YYYY-MM-DD format
    value: number; // Numeric value
  }>;
  // Start date (optional)
  startDate?: string;
  // End date (optional)
  endDate?: string;
  // Color scale (optional)
  colorScale?: "github" | "blues" | "greens" | "reds";
  // Chart description (optional)
  description?: string;
}

// Color scales for calendar heatmap using design system
const colorScales = {
  github: [
    "hsl(var(--muted))",
    "hsl(var(--chart-5))", // Very light blue (GitHub style)
    "hsl(var(--chart-4))", // Light blue
    "hsl(var(--chart-3))", // Medium blue
    "hsl(var(--chart-2))", // Blue
    "hsl(var(--chart-1))", // Dark blue
  ],
  blues: [
    "hsl(var(--muted))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-1))",
  ],
  greens: [
    "hsl(var(--muted))",
    "hsl(120, 91%, 90%)",
    "hsl(120, 91%, 70%)",
    "hsl(120, 91%, 50%)",
    "hsl(120, 91%, 30%)",
  ],
  reds: [
    "hsl(var(--muted))",
    "hsl(0, 91%, 90%)",
    "hsl(0, 91%, 70%)",
    "hsl(0, 91%, 50%)",
    "hsl(0, 91%, 30%)",
  ],
};

export function CalendarHeatmap(props: CalendarHeatmapProps) {
  const {
    title,
    data,
    startDate,
    endDate,
    colorScale = "github",
    description,
  } = props;

  const deduplicateData = React.useMemo(() => {
    // For calendar heatmaps, we need to deduplicate by date
    const dateMap = new Map<string, number>();

    data.forEach((item) => {
      if (dateMap.has(item.date)) {
        // If duplicate date, sum the values
        dateMap.set(item.date, dateMap.get(item.date)! + item.value);
      } else {
        dateMap.set(item.date, item.value);
      }
    });

    return Array.from(dateMap.entries()).map(([date, value]) => ({
      date,
      value,
    }));
  }, [data]);

  // Transform data for @uiw/react-heat-map format
  const heatmapData = React.useMemo(() => {
    return deduplicateData.map((item) => ({
      date: item.date,
      count: item.value,
    }));
  }, [deduplicateData]);

  // Calculate value range for color scaling
  const valueRange = React.useMemo(() => {
    const values = deduplicateData.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [deduplicateData]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    config.calendar = {
      label: title,
      color: colorScales[colorScale][2], // Middle color from scale
    };

    return config;
  }, [title, colorScale]);

  // Custom tooltip component
  const _CustomTooltip = React.useCallback(({ date, count }: any) => {
    if (!date) return null;

    const dateStr = new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Date
            </span>
            <span className="font-bold text-muted-foreground">{dateStr}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Value
            </span>
            <span className="font-bold text-foreground">
              {count?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Calendar Heatmap - {title}
          <div className="absolute right-4 top-0">
            <JsonViewPopup
              data={{
                ...props,
                data: deduplicateData,
              }}
            />
          </div>
        </CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <div className="w-full h-full flex items-center justify-center p-2">
            <div className="w-full max-w-4xl">
              <HeatMap
                value={heatmapData}
                startDate={startDate ? new Date(startDate) : undefined}
                endDate={endDate ? new Date(endDate) : undefined}
                width="100%"
                style={{ color: "hsl(var(--muted-foreground))" }}
                legendCellSize={12}
                rectSize={12}
                rectRender={(props: any, data: any) => {
                  const { key, ...restProps } = props;
                  if (!data.count) {
                    return (
                      <rect
                        key={key}
                        {...restProps}
                        fill="hsl(var(--muted))"
                        stroke="hsl(var(--border))"
                        strokeWidth={0.5}
                      />
                    );
                  }

                  // Calculate color intensity based on value
                  const intensity = Math.min(data.count / valueRange.max, 1);
                  const colorIndex = Math.floor(
                    intensity * (colorScales[colorScale].length - 1),
                  );
                  const color =
                    colorScales[colorScale][Math.max(1, colorIndex + 1)];

                  return (
                    <rect
                      key={key}
                      {...restProps}
                      fill={color}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                    />
                  );
                }}
              />
            </div>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
