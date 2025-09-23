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
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";

import { JsonViewPopup } from "../json-view-popup";
import { generateUniqueKey } from "lib/utils";

// Dynamic import for react-gauge-component to avoid SSR issues
const GaugeComponent = dynamic(
  () => import("react-gauge-component"),
  { ssr: false }
);

// GaugeChart component props interface
export interface GaugeChartProps {
  // Chart title (required)
  title: string;
  // Current value (required)
  value: number;
  // Minimum value (optional)
  minValue?: number;
  // Maximum value (optional)
  maxValue?: number;
  // Gauge type (required)
  gaugeType: "speedometer" | "semi-circle" | "radial";
  // Unit of measurement (optional)
  unit?: string;
  // Thresholds for color zones (optional)
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  // Chart description (optional)
  description?: string;
}

// Default color scheme aligned with design system
const defaultColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function GaugeChart(props: GaugeChartProps) {
  const { title, value, minValue = 0, maxValue = 100, gaugeType, unit, thresholds, description } = props;

  const deduplicatedProps = React.useMemo(() => {
    // For gauge charts, we mainly need to ensure value is properly clamped
    const clampedValue = Math.max(minValue, Math.min(maxValue, value));

    return {
      ...props,
      value: clampedValue,
      minValue,
      maxValue,
    };
  }, [props, minValue, maxValue, value]);

  // Calculate percentage for display
  const percentage = React.useMemo(() => {
    return Math.round(((deduplicatedProps.value - minValue) / (maxValue - minValue)) * 100);
  }, [deduplicatedProps.value, minValue, maxValue]);

  // Generate gauge configuration
  const gaugeConfig = React.useMemo(() => {
    const config: any = {
      type: gaugeType === "speedometer" ? "semicircle" : gaugeType,
      labels: {
        valueLabel: {
          style: { fill: "hsl(var(--foreground))", fontSize: "2rem", fontWeight: "bold" }
        },
        tickLabels: {
          style: { fill: "hsl(var(--muted-foreground))", fontSize: "0.8rem" }
        }
      },
      arc: {
        colorArray: thresholds ? thresholds.map(t => t.color) : [
          defaultColors[0],
          defaultColors[1],
          defaultColors[2],
          defaultColors[3],
          defaultColors[4],
        ],
        width: 0.3,
        padding: 0.02,
      },
      pointer: {
        elastic: true,
        animationSpeed: 800,
        color: "hsl(var(--foreground))",
      },
      value: deduplicatedProps.value,
      minValue,
      maxValue,
    };

    // Add subArcs if thresholds are provided
    if (thresholds && thresholds.length > 0) {
      config.arc.subArcs = thresholds.map((threshold, index) => {
        const nextThreshold = thresholds[index + 1];
        return {
          limit: nextThreshold ? nextThreshold.value : maxValue,
          color: threshold.color,
          showTick: true,
        };
      });
    }

    return config;
  }, [deduplicatedProps, gaugeType, thresholds, minValue, maxValue]);

  // Generate chart configuration for consistency
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};

    config.gauge = {
      label: title,
      color: "hsl(var(--chart-1))",
    };

    if (thresholds) {
      thresholds.forEach((threshold, index) => {
        config[`threshold-${index}`] = {
          label: threshold.label || `Threshold ${threshold.value}`,
          color: threshold.color,
        };
      });
    }

    return config;
  }, [title, thresholds]);

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader className="flex flex-col gap-1 relative pb-1 flex-shrink-0">
        <CardTitle className="flex items-center text-sm">
          Gauge Chart - {title}
          <div className="absolute right-4 top-0">
            <JsonViewPopup
              data={{
                ...props,
                data: deduplicatedProps,
              }}
            />
          </div>
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-full max-w-md max-h-md">
              <GaugeComponent
                id={`gauge-${generateUUID()}`}
                nrOfLevels={thresholds?.length || 5}
                percent={percentage / 100}
                formatTextValue={(value: number) => `${Math.round(value)}${unit || ""}`}
                needleColor="hsl(var(--foreground))"
                needleBaseColor="hsl(var(--muted-foreground))"
                colors={thresholds ? thresholds.map(t => t.color) : [
                  "#FF5F6D",
                  "#FFC371",
                  "#4ECDC4",
                  "#45B7D1",
                  "#96CEB4"
                ]}
                textColor="hsl(var(--foreground))"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}