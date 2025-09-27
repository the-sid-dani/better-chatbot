export enum AppDefaultToolkit {
  WebSearch = "webSearch",
  Http = "http",
  Code = "code",
  Artifacts = "artifacts",
}

export enum DefaultToolName {
  CreateTable = "createTable",
  WebSearch = "webSearch",
  WebContent = "webContent",
  Http = "http",
  JavascriptExecution = "mini-javascript-execution",
  PythonExecution = "python-execution",
  CreateChart = "create_chart",
  UpdateChart = "update_chart",
  // Core chart tools
  CreateBarChart = "create_bar_chart",
  CreateLineChart = "create_line_chart",
  CreatePieChart = "create_pie_chart",
  // Recharts-native chart tools
  CreateAreaChart = "create_area_chart",
  CreateScatterChart = "create_scatter_chart",
  CreateRadarChart = "create_radar_chart",
  CreateFunnelChart = "create_funnel_chart",
  CreateTreemapChart = "create_treemap_chart",
  CreateSankeyChart = "create_sankey_chart",
  CreateRadialBarChart = "create_radial_bar_chart",
  CreateComposedChart = "create_composed_chart",
  // External library chart tools
  CreateGeographicChart = "create_geographic_chart",
  CreateGaugeChart = "create_gauge_chart",
  CreateCalendarHeatmap = "create_calendar_heatmap",
}

export const SequentialThinkingToolName = "sequential-thinking";
