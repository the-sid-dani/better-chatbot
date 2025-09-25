"use client";

import { useState, useEffect } from "react";
import { ChartDataPoint } from "app-types/artifacts";
import {
  BaseCanvas,
  CanvasGrid,
  CanvasHeader,
  CanvasChart,
  CanvasSection,
} from "./base";
import type { GridItem, GridLayout } from "./base";
import { BarChart } from "../tool-invocation/bar-chart";
import { LineChart } from "../tool-invocation/line-chart";
import { PieChart } from "../tool-invocation/pie-chart";

interface DashboardChart {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  data: Array<{
    xAxisLabel: string;
    series: Array<{
      seriesName: string;
      value: number;
    }>;
  }>;
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  size?: "small" | "medium" | "large" | "full";
}

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

interface DashboardCanvasProps {
  title: string;
  description?: string;
  charts: DashboardChart[];
  metrics?: DashboardMetric[];
  analysis?: string;
  isLoading?: boolean;
  layout?: {
    metricsLayout?: GridLayout;
    chartsLayout?: "grid" | "stacked" | "mixed";
  };
  onExport?: (format: "pdf" | "png" | "json") => void;
  onRefresh?: () => void;
}

// Chart renderer with size-aware styling
function DashboardChartRenderer({ chart }: { chart: DashboardChart }) {
  const getHeightForSize = (size: DashboardChart["size"]) => {
    switch (size) {
      case "small":
        return "200px";
      case "medium":
        return "280px";
      case "large":
        return "360px";
      case "full":
        return "400px";
      default:
        return "280px";
    }
  };

  const renderChart = () => {
    switch (chart.type) {
      case "bar":
        return (
          <div className="h-full w-full">
            <BarChart
              title={chart.title}
              data={
                Array.isArray(chart.data)
                  ? (chart.data as ChartDataPoint[])
                  : []
              }
              description={chart.description}
              yAxisLabel={chart.yAxisLabel}
            />
          </div>
        );
      case "line":
        return (
          <div className="h-full w-full">
            <LineChart
              title={chart.title}
              data={
                Array.isArray(chart.data)
                  ? (chart.data as ChartDataPoint[])
                  : []
              }
              description={chart.description}
              yAxisLabel={chart.yAxisLabel}
            />
          </div>
        );
      case "pie":
        // TYPE GUARD: Type-safe data transformation for pie charts
        const pieData: Array<{ label: string; value: number }> = (() => {
          // Type guard function for pie chart data format
          function isPieChartData(
            data: any[],
          ): data is Array<{ label: string; value: number }> {
            return data.every(
              (item) =>
                typeof item === "object" &&
                item !== null &&
                "label" in item &&
                "value" in item &&
                typeof item.label === "string" &&
                typeof item.value === "number",
            );
          }

          // Check if data is already in pie chart format
          if (Array.isArray(chart.data) && chart.data.length > 0) {
            if (isPieChartData(chart.data)) {
              return chart.data;
            }
          }

          // TRANSFORM: Convert ChartDataPoint to pie format with runtime verification
          if (Array.isArray(chart.data)) {
            return (chart.data as ChartDataPoint[]).map((point) => ({
              label: point.xAxisLabel,
              value: point.series[0]?.value || 0,
            }));
          }

          // Fallback for empty or invalid data
          return [];
        })();
        return (
          <div className="h-full w-full">
            <PieChart
              title={chart.title}
              data={pieData}
              description={chart.description}
            />
          </div>
        );
      default:
        return (
          <div className="h-full w-full">
            <BarChart
              title={chart.title}
              data={
                Array.isArray(chart.data)
                  ? (chart.data as ChartDataPoint[])
                  : []
              }
              description={chart.description}
              yAxisLabel={chart.yAxisLabel}
            />
          </div>
        );
    }
  };

  return (
    <CanvasChart
      title={chart.title}
      description={chart.description}
      height={getHeightForSize(chart.size)}
      badge={
        chart.type
          ? {
              text: chart.type.toUpperCase(),
              variant: "secondary",
            }
          : undefined
      }
      metadata={{
        chartType: chart.type,
        dataPoints: chart.data.length,
        lastUpdated: "just now",
      }}
    >
      {renderChart()}
    </CanvasChart>
  );
}

export function DashboardCanvas({
  title,
  description,
  charts,
  metrics = [],
  analysis,
  isLoading = false,
  layout = {
    metricsLayout: "2/2",
    chartsLayout: "grid",
  },
  onExport,
  onRefresh,
}: DashboardCanvasProps) {
  const [currentStage, setCurrentStage] = useState<
    "loading" | "metrics_ready" | "charts_ready" | "complete"
  >("loading");

  // Simulate progressive loading
  useEffect(() => {
    if (isLoading) {
      setCurrentStage("loading");
      return;
    }

    // Progressive reveal for better UX
    const timer1 = setTimeout(() => setCurrentStage("metrics_ready"), 300);
    const timer2 = setTimeout(() => setCurrentStage("charts_ready"), 800);
    const timer3 = setTimeout(() => setCurrentStage("complete"), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoading]);

  // Convert metrics to grid items
  const metricItems: GridItem[] = metrics.map((metric) => ({
    id: metric.id,
    title: metric.title,
    value: metric.value,
    subtitle: metric.subtitle,
    trend: metric.trend,
    badge: metric.badge,
  }));

  // Organize charts by size for layout
  const smallCharts = charts.filter((c) => c.size === "small");
  const mediumCharts = charts.filter((c) => c.size === "medium" || !c.size);
  const largeCharts = charts.filter(
    (c) => c.size === "large" || c.size === "full",
  );

  return (
    <BaseCanvas className="p-4">
      <div className="space-y-8 h-full overflow-y-auto">
        {/* Dashboard Header */}
        <CanvasHeader
          title={title}
          description={description}
          isLoading={isLoading || currentStage === "loading"}
          badge={{
            text: `${charts.length} chart${charts.length !== 1 ? "s" : ""}`,
            variant: "secondary",
          }}
          metadata={{
            charts: charts.length,
            dataPoints: charts.reduce(
              (sum, chart) => sum + chart.data.length,
              0,
            ),
            updated: "now",
          }}
          onExport={onExport}
          onRefresh={onRefresh}
        />

        {/* Key Metrics Grid */}
        {metrics.length > 0 && (
          <CanvasGrid
            title="Key Metrics"
            items={metricItems}
            layout={layout.metricsLayout}
            isLoading={isLoading || currentStage === "loading"}
          />
        )}

        {/* Charts Section */}
        {charts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visualizations</h3>

            {/* Large/Full charts - full width */}
            {largeCharts.map((chart) => (
              <DashboardChartRenderer key={chart.id} chart={chart} />
            ))}

            {/* Medium charts - 2 column grid with proper spacing */}
            {mediumCharts.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {mediumCharts.map((chart) => (
                  <div key={chart.id} className="min-h-[300px]">
                    <DashboardChartRenderer chart={chart} />
                  </div>
                ))}
              </div>
            )}

            {/* Small charts - 3 column grid with proper spacing */}
            {smallCharts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {smallCharts.map((chart) => (
                  <div key={chart.id} className="min-h-[240px]">
                    <DashboardChartRenderer chart={chart} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analysis Section */}
        {analysis && (
          <CanvasSection
            title="Analysis"
            isLoading={isLoading || currentStage !== "complete"}
          >
            <p className="leading-relaxed">{analysis}</p>
          </CanvasSection>
        )}

        {/* Summary Section */}
        <CanvasSection
          title="Summary"
          variant="outlined"
          isLoading={isLoading || currentStage !== "complete"}
        >
          <div className="space-y-2">
            <p>
              Dashboard contains {charts.length} chart
              {charts.length !== 1 ? "s" : ""}
              {metrics.length > 0 &&
                ` and ${metrics.length} key metric${metrics.length !== 1 ? "s" : ""}`}
              .
            </p>
            {charts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Chart types:{" "}
                {[...new Set(charts.map((c) => c.type))].join(", ")}
              </p>
            )}
          </div>
        </CanvasSection>
      </div>
    </BaseCanvas>
  );
}
