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
import { generateUniqueKey, generateUUID } from "lib/utils";

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

// Color variable names (chart-1 ~ chart-5) - consistent with other charts
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Actual color values for react-gauge-component (which can't resolve CSS variables)
const chartColorValues = [
  "hsl(221.2 83.2% 53.3%)", // --chart-1 (blue)
  "hsl(212 95% 68%)",        // --chart-2 (lighter blue)
  "hsl(216 92% 60%)",        // --chart-3 (medium blue)
  "hsl(210 98% 78%)",        // --chart-4 (light blue)
  "hsl(212 97% 87%)",        // --chart-5 (very light blue)
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
  const _gaugeConfig = React.useMemo(() => {
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
        colorArray: thresholds ? thresholds.map(t => t.color) : chartColorValues,
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

    if (thresholds) {
      thresholds.forEach((threshold, index) => {
        config[`threshold-${index}`] = {
          label: threshold.label || `Threshold ${threshold.value}`,
          color: threshold.color,
        };
      });
    } else {
      // Create config entries for default chart colors so they get resolved by ChartContainer
      chartColors.forEach((color, index) => {
        config[`chart-${index + 1}`] = {
          label: `Chart Color ${index + 1}`,
          color: color,
        };
      });
    }

    return config;
  }, [thresholds]);

  // Get resolved colors for the gauge component
  // react-gauge-component can't resolve CSS variables, so we use actual values
  const resolvedColors = React.useMemo(() => {
    if (thresholds) {
      return thresholds.map(t => t.color);
    }

    // Use actual color values from design system for react-gauge-component
    return chartColorValues;
  }, [thresholds]);

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
                colors={resolvedColors}
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