"use client";

import * as React from "react";
import {
  Funnel,
  FunnelChart as RechartsFunnelChart,
  ResponsiveContainer,
  Tooltip,
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
} from "@/components/ui/chart";

import { JsonViewPopup } from "../json-view-popup";
import { generateUniqueKey } from "lib/utils";

// FunnelChart component props interface
export interface FunnelChartProps {
  // Chart title (required)
  title: string;
  // Chart data array (required)
  data: Array<{
    stage: string; // Stage name
    value: number; // Value for this stage
    fill?: string; // Optional custom color
  }>;
  // Chart description (optional)
  description?: string;
  // Unit of measurement (optional)
  unit?: string;
}

// Default color scheme for funnel stages
const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function FunnelChart(props: FunnelChartProps) {
  const { title, data, description, unit } = props;

  const deduplicateData = React.useMemo(() => {
    return data.reduce(
      (acc, item) => {
        const names = acc.map((item) => item.stage);
        const newStage = generateUniqueKey(item.stage, names);
        return [
          ...acc,
          {
            ...item,
            stage: newStage,
          },
        ];
      },
      [] as FunnelChartProps["data"],
    );
  }, [data]);

  // Sort data by value descending for proper funnel display
  const sortedData = React.useMemo(() => {
    return [...deduplicateData].sort((a, b) => b.value - a.value);
  }, [deduplicateData]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    sortedData.forEach((stage, index) => {
      config[stage.stage] = {
        label: stage.stage,
        color: stage.fill || chartColors[index % chartColors.length],
      };
    });

    return config;
  }, [sortedData]);

  // Prepare data for Recharts with proper colors
  const chartData = React.useMemo(() => {
    return sortedData.map((stage, index) => ({
      ...stage,
      fill: stage.fill || `var(--chart-${(index % 5) + 1})`,
    }));
  }, [sortedData]);

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Stage
              </span>
              <span className="font-bold text-muted-foreground">
                {data.payload.stage}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Value
              </span>
              <span className="font-bold" style={{ color: data.payload.fill }}>
                {data.payload.value?.toLocaleString()} {unit || ""}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Funnel Chart - {title}
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
            <RechartsFunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="value"
                data={chartData}
                isAnimationActive
                animationDuration={800}
              />
            </RechartsFunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}