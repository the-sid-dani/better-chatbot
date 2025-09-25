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
import { tableArtifactTool } from "./table-artifact-tool";
import { areaChartArtifactTool } from "./area-chart-tool";
import { calendarHeatmapArtifactTool } from "./calendar-heatmap-tool";
import { composedChartArtifactTool } from "./composed-chart-tool";
import { dashboardOrchestratorTool } from "./dashboard-orchestrator-tool";
import { funnelChartArtifactTool } from "./funnel-chart-tool";
import { gaugeChartArtifactTool } from "./gauge-chart-tool";
import { geographicChartArtifactTool } from "./geographic-chart-tool";
import { radarChartArtifactTool } from "./radar-chart-tool";
import { radialBarChartArtifactTool } from "./radial-bar-tool";
import { sankeyChartArtifactTool } from "./sankey-chart-tool";
import { scatterChartArtifactTool } from "./scatter-chart-tool";
import { treemapChartArtifactTool } from "./treemap-chart-tool";

export {
  barChartArtifactTool,
  lineChartArtifactTool,
  pieChartArtifactTool,
  tableArtifactTool,
  areaChartArtifactTool,
  calendarHeatmapArtifactTool,
  composedChartArtifactTool,
  dashboardOrchestratorTool,
  funnelChartArtifactTool,
  gaugeChartArtifactTool,
  geographicChartArtifactTool,
  radarChartArtifactTool,
  radialBarChartArtifactTool,
  sankeyChartArtifactTool,
  scatterChartArtifactTool,
  treemapChartArtifactTool,
};

// Tool collection for easy integration
export const chartArtifactTools = {
  createBarChart: barChartArtifactTool,
  createLineChart: lineChartArtifactTool,
  createPieChart: pieChartArtifactTool,
  createTable: tableArtifactTool,
  createAreaChart: areaChartArtifactTool,
  createCalendarHeatmap: calendarHeatmapArtifactTool,
  createComposedChart: composedChartArtifactTool,
  createDashboard: dashboardOrchestratorTool,
  createFunnelChart: funnelChartArtifactTool,
  createGaugeChart: gaugeChartArtifactTool,
  createGeographicChart: geographicChartArtifactTool,
  createRadarChart: radarChartArtifactTool,
  createRadialBarChart: radialBarChartArtifactTool,
  createSankeyChart: sankeyChartArtifactTool,
  createScatterChart: scatterChartArtifactTool,
  createTreemapChart: treemapChartArtifactTool,
} as const;

// Tool names for referencing in configurations
export const ChartArtifactToolNames = {
  CreateBarChart: "create_bar_chart_artifact",
  CreateLineChart: "create_line_chart_artifact",
  CreatePieChart: "create_pie_chart_artifact",
  CreateTable: "create_table_artifact",
  CreateAreaChart: "create_area_chart_artifact",
  CreateCalendarHeatmap: "create_calendar_heatmap_artifact",
  CreateComposedChart: "create_composed_chart_artifact",
  CreateDashboard: "create_dashboard_artifact",
  CreateFunnelChart: "create_funnel_chart_artifact",
  CreateGaugeChart: "create_gauge_chart_artifact",
  CreateGeographicChart: "create_geographic_chart_artifact",
  CreateRadarChart: "create_radar_chart_artifact",
  CreateRadialBarChart: "create_radial_bar_chart_artifact",
  CreateSankeyChart: "create_sankey_chart_artifact",
  CreateScatterChart: "create_scatter_chart_artifact",
  CreateTreemapChart: "create_treemap_chart_artifact",
} as const;
