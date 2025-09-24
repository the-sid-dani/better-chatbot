"use client";

import { ArtifactContentProps, BaseArtifact } from "app-types/artifacts";
import { BarChart } from "../tool-invocation/bar-chart";
import { LineChart } from "../tool-invocation/line-chart";
import { PieChart } from "../tool-invocation/pie-chart";
// Import all new chart components
import { AreaChart } from "../tool-invocation/area-chart";
import { ScatterChart } from "../tool-invocation/scatter-chart";
import { RadarChart } from "../tool-invocation/radar-chart";
import { FunnelChart } from "../tool-invocation/funnel-chart";
import { TreemapChart } from "../tool-invocation/treemap-chart";
import { SankeyChart } from "../tool-invocation/sankey-chart";
import { RadialBarChart } from "../tool-invocation/radial-bar-chart";
import { ComposedChart } from "../tool-invocation/composed-chart";
import { GeographicChart } from "../tool-invocation/geographic-chart";
import { GaugeChart } from "../tool-invocation/gauge-chart";
import { CalendarHeatmap } from "../tool-invocation/calendar-heatmap";
import { Card, CardContent } from "ui/card";
import { Alert, AlertDescription } from "ui/alert";
import { AlertTriangle } from "lucide-react";

/**
 * Chart Artifact Content Renderer
 *
 * This component renders chart artifacts in the Canvas workspace.
 * It uses the existing beautiful chart components (BarChart, LineChart, PieChart)
 * but optimized for Canvas display with proper sizing and container handling.
 */
export function ChartArtifactContent({
  artifact: _artifact, // Available for future metadata access and artifact-specific logic
  content,
  status,
}: ArtifactContentProps<BaseArtifact>) {
  // Handle loading state
  if (status === "streaming") {
    return (
      <Card className="w-full h-[400px] bg-card">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="animate-pulse text-muted-foreground">
              Generating chart...
            </div>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (status === "error") {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to render chart artifact. Please try regenerating.
        </AlertDescription>
      </Alert>
    );
  }

  try {
    // Parse the chart content
    const chartData = JSON.parse(content);

    // Validate chart data structure
    if (!chartData.type || !chartData.title || !chartData.data) {
      throw new Error("Invalid chart data structure");
    }

    // Render based on chart type
    switch (chartData.type) {
      case "bar-chart":
        return (
          <div className="w-full h-full">
            <BarChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              yAxisLabel={chartData.yAxisLabel}
            />
          </div>
        );

      case "line-chart":
        return (
          <div className="w-full h-full">
            <LineChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              yAxisLabel={chartData.yAxisLabel}
            />
          </div>
        );

      case "pie-chart":
        return (
          <div className="w-full h-full">
            <PieChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              unit={chartData.unit}
            />
          </div>
        );

      // New Recharts-native chart types
      case "area-chart":
        return (
          <div className="w-full h-full">
            <AreaChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              xAxisLabel={chartData.xAxisLabel}
              yAxisLabel={chartData.yAxisLabel}
              areaType={chartData.areaType}
            />
          </div>
        );

      case "scatter-chart":
        return (
          <div className="w-full h-full">
            <ScatterChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              xAxisLabel={chartData.xAxisLabel}
              yAxisLabel={chartData.yAxisLabel}
              showBubbles={chartData.showBubbles}
            />
          </div>
        );

      case "radar-chart":
        return (
          <div className="w-full h-full">
            <RadarChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
            />
          </div>
        );

      case "funnel-chart":
        return (
          <div className="w-full h-full">
            <FunnelChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              unit={chartData.unit}
            />
          </div>
        );

      case "treemap-chart":
        return (
          <div className="w-full h-full">
            <TreemapChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
            />
          </div>
        );

      case "sankey-chart":
        return (
          <div className="w-full h-full">
            <SankeyChart
              title={chartData.title}
              nodes={chartData.nodes}
              links={chartData.links}
              description={chartData.description}
            />
          </div>
        );

      case "radial-bar-chart":
        return (
          <div className="w-full h-full">
            <RadialBarChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              innerRadius={chartData.innerRadius}
              outerRadius={chartData.outerRadius}
            />
          </div>
        );

      case "composed-chart":
        return (
          <div className="w-full h-full">
            <ComposedChart
              title={chartData.title}
              data={chartData.data}
              description={chartData.description}
              xAxisLabel={chartData.xAxisLabel}
              yAxisLabel={chartData.yAxisLabel}
            />
          </div>
        );

      // External library chart types
      case "geographic-chart":
        return (
          <div className="w-full h-full">
            <GeographicChart
              title={chartData.title}
              data={chartData.data}
              geoType={chartData.geoType}
              colorScale={chartData.colorScale}
              description={chartData.description}
            />
          </div>
        );

      case "gauge-chart":
        return (
          <div className="w-full h-full">
            <GaugeChart
              title={chartData.title}
              value={chartData.value}
              minValue={chartData.minValue}
              maxValue={chartData.maxValue}
              gaugeType={chartData.gaugeType}
              unit={chartData.unit}
              thresholds={chartData.thresholds}
              description={chartData.description}
            />
          </div>
        );

      case "calendar-heatmap":
        return (
          <div className="w-full h-full">
            <CalendarHeatmap
              title={chartData.title}
              data={chartData.data}
              startDate={chartData.startDate}
              endDate={chartData.endDate}
              colorScale={chartData.colorScale}
              description={chartData.description}
            />
          </div>
        );

      default:
        return (
          <Alert variant="destructive" className="w-full">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unsupported chart type: {chartData.type}
            </AlertDescription>
          </Alert>
        );
    }
  } catch (error) {
    console.error("Error rendering chart artifact:", error);
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to parse chart data.{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }
}
