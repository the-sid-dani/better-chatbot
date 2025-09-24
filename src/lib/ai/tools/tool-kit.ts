import { createPieChartTool } from "./visualization/create-pie-chart";
import { createBarChartTool } from "./visualization/create-bar-chart";
import { createLineChartTool } from "./visualization/create-line-chart";
import { createTableTool } from "./visualization/create-table";
import { exaSearchTool, exaContentsTool } from "./web/web-search";
import { AppDefaultToolkit, DefaultToolName } from ".";
import { Tool } from "ai";
import { httpFetchTool } from "./http/fetch";
import { jsExecutionTool } from "./code/js-run-tool";
import { pythonExecutionTool } from "./code/python-run-tool";
// Direct imports to avoid circular dependency in chart-tool.ts aggregation
import { createChartTool, updateChartTool } from "./chart-tool";
import { treemapChartArtifactTool } from "./artifacts/treemap-chart-tool";
import { areaChartArtifactTool } from "./artifacts/area-chart-tool";
import { scatterChartArtifactTool } from "./artifacts/scatter-chart-tool";
import { radarChartArtifactTool } from "./artifacts/radar-chart-tool";
import { funnelChartArtifactTool } from "./artifacts/funnel-chart-tool";
import { sankeyChartArtifactTool } from "./artifacts/sankey-chart-tool";
import { radialBarChartArtifactTool } from "./artifacts/radial-bar-tool";
import { composedChartArtifactTool } from "./artifacts/composed-chart-tool";
import { geographicChartArtifactTool } from "./artifacts/geographic-chart-tool";
import { gaugeChartArtifactTool } from "./artifacts/gauge-chart-tool";
import { calendarHeatmapArtifactTool } from "./artifacts/calendar-heatmap-tool";

export const APP_DEFAULT_TOOL_KIT: Record<
  AppDefaultToolkit,
  Record<string, Tool>
> = {
  [AppDefaultToolkit.Visualization]: {
    [DefaultToolName.CreatePieChart]: createPieChartTool,
    [DefaultToolName.CreateBarChart]: createBarChartTool,
    [DefaultToolName.CreateLineChart]: createLineChartTool,
    [DefaultToolName.CreateTable]: createTableTool,
  },
  [AppDefaultToolkit.WebSearch]: {
    [DefaultToolName.WebSearch]: exaSearchTool,
    [DefaultToolName.WebContent]: exaContentsTool,
  },
  [AppDefaultToolkit.Http]: {
    [DefaultToolName.Http]: httpFetchTool,
  },
  [AppDefaultToolkit.Code]: {
    [DefaultToolName.JavascriptExecution]: jsExecutionTool,
    [DefaultToolName.PythonExecution]: pythonExecutionTool,
  },
  [AppDefaultToolkit.Artifacts]: {
    // Main chart tools - direct imports to avoid circular dependency
    [DefaultToolName.CreateChart]: createChartTool,
    [DefaultToolName.UpdateChart]: updateChartTool,
    // Recharts-native chart tools - all 15 specialized tools restored
    [DefaultToolName.CreateAreaChart]: areaChartArtifactTool,
    [DefaultToolName.CreateScatterChart]: scatterChartArtifactTool,
    [DefaultToolName.CreateRadarChart]: radarChartArtifactTool,
    [DefaultToolName.CreateFunnelChart]: funnelChartArtifactTool,
    [DefaultToolName.CreateTreemapChart]: treemapChartArtifactTool,
    [DefaultToolName.CreateSankeyChart]: sankeyChartArtifactTool,
    [DefaultToolName.CreateRadialBarChart]: radialBarChartArtifactTool,
    [DefaultToolName.CreateComposedChart]: composedChartArtifactTool,
    // External library chart tools
    [DefaultToolName.CreateGeographicChart]: geographicChartArtifactTool,
    [DefaultToolName.CreateGaugeChart]: gaugeChartArtifactTool,
    [DefaultToolName.CreateCalendarHeatmap]: calendarHeatmapArtifactTool,
  },
};
