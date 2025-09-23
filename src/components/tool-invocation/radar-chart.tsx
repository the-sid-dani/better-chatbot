"use client";

import * as React from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
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

// RadarChart component props interface
export interface RadarChartProps {
  // Chart title (required)
  title: string;
  // Chart data array (required)
  data: Array<{
    metric: string; // Metric/dimension name
    series: Array<{
      seriesName: string; // Series name
      value: number; // Value for this metric
      fullMark?: number; // Optional max value for this metric
    }>;
  }>;
  // Chart description (optional)
  description?: string;
}

// Color variable names (chart-1 ~ chart-5)
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function RadarChart(props: RadarChartProps) {
  const { title, data, description } = props;

  const deduplicateData = React.useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const names = acc.map((item) => item.metric);
        const newMetric = generateUniqueKey(item.metric, names);
        return [
          ...acc,
          {
            metric: newMetric,
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
              [] as RadarChartProps["data"][number]["series"],
            ),
          },
        ];
      },
      [] as RadarChartProps["data"],
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

  // Generate chart data for Recharts RadarChart
  const chartData = React.useMemo(() => {
    return deduplicateData.map((metric) => {
      const result: any = {
        metric: metric.metric,
      };

      // Add each series value to the result
      metric.series.forEach(({ seriesName, value, fullMark }) => {
        result[sanitizeCssVariableName(seriesName)] = value;
        // Store fullMark for this metric if provided
        if (fullMark !== undefined) {
          result[`${sanitizeCssVariableName(seriesName)}_fullMark`] = fullMark;
        }
      });

      return result;
    });
  }, [deduplicateData]);

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Radar Chart - {title}
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
            <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
              />
              <PolarRadiusAxis
                tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                tickCount={5}
                domain={[0, 'dataMax']}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              {seriesNames.map((seriesName, _index) => {
                return (
                  <Radar
                    key={seriesName}
                    name={seriesName}
                    dataKey={sanitizeCssVariableName(seriesName)}
                    stroke={`var(--color-${sanitizeCssVariableName(seriesName)})`}
                    fill={`var(--color-${sanitizeCssVariableName(seriesName)})`}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                );
              })}
            </RechartsRadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}