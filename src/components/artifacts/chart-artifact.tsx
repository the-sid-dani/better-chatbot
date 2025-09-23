"use client";

import { ArtifactContentProps, BaseArtifact } from "app-types/artifacts";
import { BarChart } from "../tool-invocation/bar-chart";
import { LineChart } from "../tool-invocation/line-chart";
import { PieChart } from "../tool-invocation/pie-chart";
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
  artifact,
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
