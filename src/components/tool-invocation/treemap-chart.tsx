"use client";

import * as React from "react";
import {
  Treemap,
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

// Color scheme for treemap cells
const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function TreemapChart(props: TreemapChartProps) {
  const { title, data, description } = props;

  const deduplicateData = React.useMemo(() => {
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
                    const newChildName = generateUniqueKey(child.name, childNames);
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

  // Transform data for Recharts Treemap
  const chartData = React.useMemo(() => {
    return deduplicateData.map((item, index) => {
      // If item has children, flatten them with color assignments
      if (item.children && item.children.length > 0) {
        return {
          name: item.name,
          children: item.children.map((child, childIndex) => ({
            name: child.name,
            value: child.value,
            fill: chartColors[(index * 3 + childIndex) % chartColors.length],
          })),
        };
      } else {
        // Single item
        return {
          name: item.name,
          value: item.value,
          fill: chartColors[index % chartColors.length],
        };
      }
    });
  }, [deduplicateData]);

  // Generate chart configuration
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    deduplicateData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
    });

    return config;
  }, [deduplicateData]);

  // Custom content renderer for treemap cells
  const CustomContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, value, colors } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: colors,
            stroke: "hsl(var(--border))",
            strokeWidth: depth === 1 ? 2 : 1,
            strokeOpacity: 0.5,
          }}
        />
        {/* Show text only if cell is large enough */}
        {width > 60 && height > 20 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize={width > 100 && height > 40 ? 12 : 10}
            fontWeight={depth === 1 ? "bold" : "normal"}
          >
            <tspan x={x + width / 2} dy="0">
              {name}
            </tspan>
            {height > 40 && (
              <tspan x={x + width / 2} dy="14" fontSize="9" fill="hsl(var(--muted-foreground))">
                {value?.toLocaleString()}
              </tspan>
            )}
          </text>
        )}
      </g>
    );
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Item
              </span>
              <span className="font-bold text-muted-foreground">
                {data.payload.name}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Value
              </span>
              <span className="font-bold" style={{ color: data.payload.fill }}>
                {data.payload.value?.toLocaleString()}
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
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="value"
              aspectRatio={1} // Square aspect ratio for proper proportions
              stroke="hsl(var(--border))"
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}