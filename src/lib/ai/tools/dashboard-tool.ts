import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

// Dashboard chart schema
const dashboardChartSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["bar", "line", "pie"]),
  title: z.string(),
  data: z.array(
    z.object({
      xAxisLabel: z.string(),
      series: z.array(
        z.object({
          seriesName: z.string(),
          value: z.number()
        })
      )
    })
  ),
  description: z.string().optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  size: z.enum(["small", "medium", "large", "full"]).default("medium")
});

// Dashboard metric schema
const dashboardMetricSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  value: z.union([z.string(), z.number()]),
  subtitle: z.string().optional(),
  trend: z.object({
    value: z.string(),
    isPositive: z.boolean().optional(),
    isNeutral: z.boolean().optional()
  }).optional(),
  badge: z.object({
    text: z.string(),
    variant: z.enum(["default", "secondary", "destructive", "outline"]).optional()
  }).optional()
});

// Dashboard creation tool
export const createDashboardTool = createTool({
  description: `Create a comprehensive dashboard artifact with multiple charts, metrics, and analysis.

  Use this tool when users want to:
  - Create multiple related charts in one view
  - Build analytical dashboards with metrics and charts
  - Display comprehensive data analysis
  - Create business intelligence dashboards

  Examples:
  - "Create a sales dashboard with revenue charts and KPIs"
  - "Build a marketing dashboard showing multiple metrics"
  - "Make a financial dashboard with charts and key metrics"`,

  inputSchema: z.object({
    title: z.string().describe("Dashboard title"),
    description: z.string().optional().describe("Dashboard description"),
    charts: z.array(dashboardChartSchema).describe("Array of charts to include"),
    metrics: z.array(dashboardMetricSchema).optional().describe("Key metrics to display"),
    analysis: z.string().optional().describe("Written analysis of the data"),
    layout: z.object({
      metricsLayout: z.enum(["1/1", "2/2", "2/3", "3/3", "4/4"]).default("2/2"),
      chartsLayout: z.enum(["grid", "stacked", "mixed"]).default("grid")
    }).optional().describe("Layout configuration")
  }),

  execute: async function* ({
    title,
    description,
    charts,
    metrics = [],
    analysis,
    layout = { metricsLayout: "2/2", chartsLayout: "grid" }
  }) {
    const dashboardId = generateUUID();

    try {
      logger.info(`Creating dashboard: ${title} with ${charts.length} charts`);

      // Stream loading state
      yield {
        status: 'loading' as const,
        message: `Creating dashboard: ${title}`,
        dashboardName: title,
        totalCharts: charts.length,
        progress: 0
      };

      // Validate charts data
      if (!charts || charts.length === 0) {
        throw new Error("Dashboard must contain at least one chart");
      }

      // Add IDs to charts and metrics if not provided
      const chartsWithIds = charts.map(chart => ({
        ...chart,
        id: chart.id || generateUUID()
      }));

      const metricsWithIds = metrics.map(metric => ({
        ...metric,
        id: metric.id || generateUUID()
      }));

      // Stream progress update
      yield {
        status: 'processing' as const,
        message: `Building dashboard layout with ${charts.length} charts...`,
        dashboardName: title,
        progress: 50
      };

      // Create dashboard artifact content
      const dashboardContent = {
        title,
        description,
        charts: chartsWithIds,
        metrics: metricsWithIds,
        analysis,
        layout,
        metadata: {
          chartCount: charts.length,
          metricCount: metrics.length,
          chartTypes: [...new Set(charts.map(c => c.type))],
          totalDataPoints: charts.reduce((sum, chart) => sum + chart.data.length, 0),
          created: new Date().toISOString()
        }
      };

      // Stream completed dashboard - this is the final result
      yield {
        status: 'success' as const,
        message: `Created dashboard "${title}" with ${charts.length} charts`,
        dashboardId,
        dashboardName: title,
        description,
        charts: chartsWithIds,
        metrics: metricsWithIds,
        totalCharts: charts.length,
        progress: 100,
        // Flag for Canvas to process this result
        shouldCreateArtifact: true,
        // Flag to show dashboard button
        isDashboard: true
      };

      // Return simple success message for chat
      return `Created dashboard "${title}" with ${charts.length} charts. The dashboard is now available in the Canvas workspace.`;

    } catch (error) {
      logger.error("Failed to create dashboard:", error);

      // Stream error state
      yield {
        status: 'error' as const,
        message: `Failed to create dashboard: ${error instanceof Error ? error.message : "Unknown error"}`,
        dashboardName: title,
        error: error instanceof Error ? error.message : "Unknown error"
      };

      throw error;
    }
  }
});

// Dashboard update tool
export const updateDashboardTool = createTool({
  description: `Update an existing dashboard artifact by adding/modifying charts, metrics, or analysis.`,

  inputSchema: z.object({
    artifactId: z.string().describe("ID of the dashboard to update"),
    changes: z.string().describe("Description of changes to make"),
    addCharts: z.array(dashboardChartSchema).optional().describe("New charts to add"),
    addMetrics: z.array(dashboardMetricSchema).optional().describe("New metrics to add"),
    updateAnalysis: z.string().optional().describe("Updated analysis text"),
    updateTitle: z.string().optional().describe("New dashboard title"),
    updateDescription: z.string().optional().describe("New dashboard description")
  }),

  execute: async ({
    artifactId,
    changes,
    addCharts = [],
    addMetrics = [],
    updateAnalysis,
    updateTitle,
    updateDescription
  }) => {
    try {
      logger.info(`Updating dashboard artifact: ${artifactId}`);

      const updates: any = {};
      if (addCharts.length > 0) updates.newCharts = addCharts.length;
      if (addMetrics.length > 0) updates.newMetrics = addMetrics.length;
      if (updateAnalysis) updates.analysisUpdated = true;
      if (updateTitle) updates.titleUpdated = true;
      if (updateDescription) updates.descriptionUpdated = true;

      return {
        success: true,
        artifactId,
        updates,
        message: `Updated dashboard with the following changes: ${changes}`,
        changesApplied: Object.keys(updates),
      };

    } catch (error) {
      logger.error("Failed to update dashboard artifact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to update dashboard: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
});

// Export dashboard tools
export const dashboardTools = {
  create_dashboard: createDashboardTool,
  update_dashboard: updateDashboardTool,
};