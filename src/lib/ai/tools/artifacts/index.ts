/**
 * Enhanced Visualization Tools - Canvas Artifacts
 *
 * This module exports individual chart tools that create Canvas artifacts.
 * Each tool creates beautiful, properly-sized chart artifacts that appear
 * in the Canvas workspace alongside the chat.
 *
 * These tools replace the stub visualization tools and provide full
 * Canvas integration with the same aesthetics as existing chart components.
 */

import { barChartArtifactTool } from "./bar-chart-tool";
import { lineChartArtifactTool } from "./line-chart-tool";
import { pieChartArtifactTool } from "./pie-chart-tool";

export { barChartArtifactTool, lineChartArtifactTool, pieChartArtifactTool };

// Tool collection for easy integration
export const chartArtifactTools = {
  createBarChart: barChartArtifactTool,
  createLineChart: lineChartArtifactTool,
  createPieChart: pieChartArtifactTool,
} as const;

// Tool names for referencing in configurations
export const ChartArtifactToolNames = {
  CreateBarChart: "create_bar_chart_artifact",
  CreateLineChart: "create_line_chart_artifact",
  CreatePieChart: "create_pie_chart_artifact",
} as const;
