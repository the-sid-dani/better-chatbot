"use client";

import * as React from "react";
import {
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  ScatterChart as RechartsScatterChart,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { JsonViewPopup } from "../json-view-popup";
import { sanitizeCssVariableName } from "./shared.tool-invocation";
import { generateUniqueKey } from "lib/utils";

// ScatterChart component props interface
export interface ScatterChartProps {
  // Chart title (required)
  title: string;
  // Chart data array (required)
  data: Array<{
    name?: string; // Optional data point group name
    series: Array<{
      seriesName: string; // Series name
      x: number; // X-axis value
      y: number; // Y-axis value
      z?: number; // Optional size value for bubble charts
    }>;
  }>;
  // Chart description (optional)
  description?: string;
  // X-axis label (optional)
  xAxisLabel?: string;
  // Y-axis label (optional)
  yAxisLabel?: string;
  // Show bubbles based on z values (optional)
  showBubbles?: boolean;
}

// Color variable names (chart-1 ~ chart-5)
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ScatterChart(props: ScatterChartProps) {
  const { title, data, description, xAxisLabel, yAxisLabel, showBubbles = false } = props;

  const deduplicateData = React.useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const names = acc.map((item) => item.name || "");
        const newName = item.name ? generateUniqueKey(item.name, names) : undefined;
        return [
          ...acc,
          {
            name: newName,
            series: item.series.reduce(
              (acc, item) => {
                const names = acc.map((item) => item.seriesName);
                const newSeriesName = generateUniqueKey(item.seriesName, names);
                return [
                  ...acc,
                  {
                    ...item,
                    seriesName: newSeriesName,
                  },
                ];
              },
              [] as ScatterChartProps["data"][number]["series"],
            ),
          },
        ];
      },
      [] as ScatterChartProps["data"],
    );
  }, [data]);

  // Get unique series names for configuration
  const seriesNames = Array.from(
    new Set(deduplicateData.flatMap((d) => d.series.map((s) => s.seriesName))),
  );

  // Generate chart configuration dynamically
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    // Configure each series
    seriesNames.forEach((seriesName, index) => {
      // Colors cycle through chart-1 ~ chart-5
      const colorIndex = index % chartColors.length;

      config[sanitizeCssVariableName(seriesName)] = {
        label: seriesName,
        color: chartColors[colorIndex],
      };
    });

    return config;
  }, [seriesNames]);

  // Generate chart data for Recharts ScatterChart
  const chartData = React.useMemo(() => {
    const seriesData: { [key: string]: Array<{ x: number; y: number; z?: number }> } = {};

    deduplicateData.forEach((group) => {
      group.series.forEach((point) => {
        const seriesKey = sanitizeCssVariableName(point.seriesName);
        if (!seriesData[seriesKey]) {
          seriesData[seriesKey] = [];
        }
        seriesData[seriesKey].push({
          x: point.x,
          y: point.y,
          z: showBubbles ? point.z : undefined,
        });
      });
    });

    return seriesData;
  }, [deduplicateData, showBubbles]);

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          {showBubbles ? "Bubble Chart" : "Scatter Chart"} - {title}
          <div className="absolute right-4 top-0">
            <JsonViewPopup
              data={{
                ...props,
                data: deduplicateData,
              }}
            />
          </div>
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name={xAxisLabel || "x"}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                fontSize={12}
                label={
                  xAxisLabel
                    ? {
                        value: xAxisLabel,
                        position: "insideBottom",
                        offset: -10,
                      }
                    : undefined
                }
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yAxisLabel || "y"}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: "insideLeft",
                      }
                    : undefined
                }
              />
              {showBubbles && (
                <ZAxis
                  type="number"
                  dataKey="z"
                  range={[20, 400]}
                  name="size"
                />
              )}
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<ChartTooltipContent />}
              />
              {seriesNames.map((seriesName, index) => {
                const seriesKey = sanitizeCssVariableName(seriesName);
                const color = chartColors[index % chartColors.length];

                return (
                  <Scatter
                    key={seriesName}
                    name={seriesName}
                    data={chartData[seriesKey] || []}
                    fill={`hsl(${color})`}
                    opacity={0.8}
                  />
                );
              })}
            </RechartsScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}