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
import { chartTools } from "./chart-tool";

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
    [DefaultToolName.CreateChart]: chartTools.create_chart,
    [DefaultToolName.UpdateChart]: chartTools.update_chart,
    // Recharts-native chart tools
    [DefaultToolName.CreateAreaChart]: chartTools.create_area_chart,
    [DefaultToolName.CreateScatterChart]: chartTools.create_scatter_chart,
    [DefaultToolName.CreateRadarChart]: chartTools.create_radar_chart,
    [DefaultToolName.CreateFunnelChart]: chartTools.create_funnel_chart,
    [DefaultToolName.CreateTreemapChart]: chartTools.create_treemap_chart,
    [DefaultToolName.CreateSankeyChart]: chartTools.create_sankey_chart,
    [DefaultToolName.CreateRadialBarChart]: chartTools.create_radial_bar_chart,
    [DefaultToolName.CreateComposedChart]: chartTools.create_composed_chart,
    // External library chart tools
    [DefaultToolName.CreateGeographicChart]: chartTools.create_geographic_chart,
    [DefaultToolName.CreateGaugeChart]: chartTools.create_gauge_chart,
    [DefaultToolName.CreateCalendarHeatmap]: chartTools.create_calendar_heatmap,
  },
};
