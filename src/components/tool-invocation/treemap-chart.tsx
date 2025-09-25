"use client";

import * as React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

import { JsonViewPopup } from "../json-view-popup";
import { sanitizeCssVariableName } from "./shared.tool-invocation";
import { generateUniqueKey } from "lib/utils";

// TreemapChart component props interface
export interface TreemapChartProps {
  // Chart title (required)
  title: string;
  // Chart data array (required)
  data: Array<{
    name: string; // Item name
    value: number; // Item value
    children?: Array<{
      name: string; // Child name
      value: number; // Child value
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

export function TreemapChart(props: TreemapChartProps) {
  const { title, data, description } = props;

  const deduplicateData = React.useMemo(() => {
    // Handle undefined or empty data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.reduce(
      (acc, item) => {
        const names = acc.map((item) => item.name);
        const newName = generateUniqueKey(item.name, names);
        return [
          ...acc,
          {
            ...item,
            name: newName,
            children: item.children
              ? item.children.reduce(
                  (acc, child) => {
                    const childNames = acc.map((child) => child.name);
                    const newChildName = generateUniqueKey(
                      child.name,
                      childNames,
                    );
                    return [
                      ...acc,
                      {
                        ...child,
                        name: newChildName,
                      },
                    ];
                  },
                  [] as TreemapChartProps["data"][number]["children"],
                )
              : undefined,
          },
        ];
      },
      [] as TreemapChartProps["data"],
    );
  }, [data]);

  // Transform data for Recharts Treemap - proper format for flat data
  const chartData = React.useMemo(() => {
    // For flat data, wrap in a root object with children array (required by Recharts Treemap)
    const hasChildren = deduplicateData.some(
      (item) => item.children && item.children.length > 0,
    );

    if (hasChildren) {
      // Already hierarchical data - add colors to children
      return deduplicateData.map((item, _index) => ({
        name: item.name,
        children: item.children!.map((child, _childIndex) => ({
          name: child.name,
          size: child.value,
          fill: `var(--color-${sanitizeCssVariableName(child.name)})`,
        })),
      }));
    } else {
      // Flat data - wrap all items as children under a root
      return [
        {
          name: "root",
          children: deduplicateData.map((item, _index) => ({
            name: item.name,
            size: item.value,
            fill: `var(--color-${sanitizeCssVariableName(item.name)})`,
          })),
        },
      ];
    }
  }, [deduplicateData]);

  // Generate chart configuration dynamically
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    // Configure each item and their children
    deduplicateData.forEach((item, index) => {
      // Colors cycle through chart-1 ~ chart-5
      const colorIndex = index % chartColors.length;

      // Configure parent item
      config[sanitizeCssVariableName(item.name)] = {
        label: item.name,
        color: chartColors[colorIndex],
      };

      // Configure children if they exist
      if (item.children) {
        item.children.forEach((child, childIndex) => {
          const childColorIndex = (index + childIndex) % chartColors.length;
          config[sanitizeCssVariableName(child.name)] = {
            label: child.name,
            color: chartColors[childColorIndex],
          };
        });
      }
    });

    return config;
  }, [deduplicateData]);

  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card h-full flex flex-col">
        <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
          <CardTitle className="flex items-center text-sm">
            Treemap Chart - {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 pb-0 pt-2 min-h-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No data available</p>
            <p className="text-xs mt-1">
              Provide data to render the treemap chart
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Treemap Chart - {title}
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
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(var(--border))"
              animationBegin={0}
              animationDuration={0}
              content={({ x, y, width, height, name, size }) => {
                // Only render text if the cell is large enough
                if (width < 40 || height < 20) return null;

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={`var(--color-${sanitizeCssVariableName(name || "")})`}
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                    />
                    <text
                      x={x + width / 2}
                      y={y + height / 2 - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      className="text-xs font-bold"
                      style={{
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        fontSize: "12px",
                      }}
                    >
                      {name}
                    </text>
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.9)"
                      className="text-xs"
                      style={{
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        fontSize: "11px",
                      }}
                    >
                      {size?.toLocaleString()}
                    </text>
                  </g>
                );
              }}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (
                    active &&
                    payload &&
                    payload.length &&
                    payload[0]?.payload
                  ) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Name
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.name}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Value
                            </span>
                            <span className="font-bold">
                              {data.size?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
