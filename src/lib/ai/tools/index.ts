export enum AppDefaultToolkit {
  WebSearch = "webSearch",
  Http = "http",
  Code = "code",
  Artifacts = "artifacts",
}

// Type constraint for compile-time validation
export type AppDefaultToolkitType = keyof typeof AppDefaultToolkit;

export enum DefaultToolName {
  CreateTable = "createTable",
  WebSearch = "webSearch",
  WebContent = "webContent",
  Http = "http",
  JavascriptExecution = "mini-javascript-execution",
  PythonExecution = "python-execution",
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

// Type constraints for compile-time validation
export type DefaultToolNameType =
  (typeof DefaultToolName)[keyof typeof DefaultToolName];

// Type guard for validating tool names at runtime
export const isValidDefaultToolName = (
  name: string,
): name is DefaultToolNameType => {
  return Object.values(DefaultToolName).includes(name as DefaultToolNameType);
};

// Type-safe tool registry constraint
export type ToolRegistryEntry<T extends DefaultToolNameType> = {
  readonly [K in T]: any; // Tool implementation
};

// Helper type for ensuring all enum values are implemented
export type CompleteToolRegistry = {
  readonly [K in DefaultToolNameType]: any;
};

export const SequentialThinkingToolName = "sequential-thinking";
