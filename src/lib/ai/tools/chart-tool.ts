import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

// Chart artifact tools now imported directly in tool-kit.ts to avoid circular dependency

// Chart creation tool using native AI SDK 5 streaming patterns
export const createChartTool = createTool({
  description: `Create an interactive chart that streams to the Canvas workspace.
  Use this tool when the user wants to visualize data, create charts, or display data insights.

  Examples of when to use this tool:
  - "Create a bar chart showing sales data"
  - "Make a pie chart of browser usage"
  - "Show me a line chart of temperature trends"
  - "Visualize this data as a chart"

  The chart will stream progressively to a Canvas workspace alongside the chat.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the chart artifact"),
    chartType: z
      .enum(["bar", "line", "pie"])
      .describe("Type of chart to create"),
    canvasName: z
      .string()
      .describe(
        "Name for the canvas/dashboard this chart belongs to (e.g., 'Global Market Analytics', 'Sales Performance Dashboard')",
      ),
    data: z
      .array(
        z.object({
          xAxisLabel: z
            .string()
            .describe("Label for this data point on the x-axis"),
          series: z
            .array(
              z.object({
                seriesName: z.string().describe("Name of this data series"),
                value: z.number().describe("Numeric value for this series"),
              }),
            )
            .describe("Data series for this point"),
        }),
      )
      .describe("Chart data points"),
    xAxisLabel: z.string().optional().describe("Label for the x-axis"),
    yAxisLabel: z.string().optional().describe("Label for the y-axis"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async function* ({
    title,
    chartType,
    canvasName,
    data,
    xAxisLabel,
    yAxisLabel,
    description,
  }) {
    const chartId = generateUUID();

    try {
      logger.info(`Creating chart: ${title} (${chartType})`);

      // Clean implementation - no special Canvas events needed

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Chart data cannot be empty");
      }

      // Stream loading state using correct AI SDK streaming format
      yield {
        status: "loading" as const,
        message: `Preparing chart: ${title}`,
        title,
        chartType,
        chartId,
        progress: 0,
      };

      // Validate data structure
      for (const point of data) {
        if (!point.xAxisLabel || !point.series || point.series.length === 0) {
          throw new Error("Invalid chart data structure");
        }
        for (const series of point.series) {
          if (!series.seriesName || typeof series.value !== "number") {
            throw new Error("Invalid series data structure");
          }
        }
      }

      // Stream progress update
      yield {
        status: "processing" as const,
        message: `Creating ${chartType} chart visualization...`,
        title,
        chartType,
        progress: 50,
      };

      // Create chart data structure
      const chartData = {
        title,
        chartType,
        data,
        xAxisLabel,
        yAxisLabel,
        description,
        theme: "light",
        animated: true,
      };

      // Stream completed chart - this is the final result
      yield {
        status: "success" as const,
        message: `Created ${chartType} chart "${title}" with ${data.length} data points`,
        chartId,
        title,
        chartType,
        canvasName,
        chartData,
        xAxisLabel,
        yAxisLabel,
        description,
        dataPoints: data.length,
        // Flag for Canvas to process this result
        shouldCreateArtifact: true,
      };

      // Return simple success message for chat
      return `Created ${chartType} chart "${title}" with ${data.length} data points. The chart is now available in the Canvas workspace.`;
    } catch (error) {
      logger.error("Failed to create chart:", error);

      // Stream error state using correct format
      yield {
        status: "error" as const,
        message: `Failed to create chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        title,
        chartType,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      throw error;
    }
  },
});

// Chart update tool for editing existing charts
export const updateChartTool = createTool({
  description: `Update an existing chart in the Canvas workspace.
  Use this tool when the user wants to modify, edit, or update an existing chart.

  Examples of when to use this tool:
  - "Update the sales chart with new data"
  - "Change the chart type to a pie chart"
  - "Edit the chart title"
  - "Add more data points to the chart"`,

  inputSchema: z.object({
    chartId: z.string().describe("ID of the chart to update"),
    canvasName: z.string().describe("Name of the canvas this chart belongs to"),
    changes: z.string().describe("Description of what changes to make"),
    newTitle: z.string().optional().describe("New chart title (if changing)"),
    newChartType: z
      .enum(["bar", "line", "pie"])
      .optional()
      .describe("New chart type (if changing)"),
    newData: z
      .array(
        z.object({
          xAxisLabel: z
            .string()
            .describe("Label for this data point on the x-axis"),
          series: z
            .array(
              z.object({
                seriesName: z.string().describe("Name of this data series"),
                value: z.number().describe("Numeric value for this series"),
              }),
            )
            .describe("Data series for this point"),
        }),
      )
      .optional()
      .describe("New chart data (if updating data)"),
    newXAxisLabel: z
      .string()
      .optional()
      .describe("New x-axis label (if changing)"),
    newYAxisLabel: z
      .string()
      .optional()
      .describe("New y-axis label (if changing)"),
    newDescription: z
      .string()
      .optional()
      .describe("New chart description (if changing)"),
  }),

  execute: async function* ({
    chartId,
    canvasName,
    changes,
    newTitle,
    newChartType,
    newData,
    newXAxisLabel,
    newYAxisLabel,
    newDescription,
  }) {
    try {
      logger.info(`Updating chart: ${chartId} with changes: ${changes}`);

      // Stream loading state
      yield {
        status: "loading" as const,
        message: `Updating chart...`,
        chartId,
        canvasName,
        progress: 0,
      };

      // Stream processing state
      yield {
        status: "processing" as const,
        message: `Applying changes: ${changes}`,
        chartId,
        canvasName,
        progress: 50,
      };

      // Create updated chart data
      const updatedChartData = {
        title: newTitle,
        chartType: newChartType,
        data: newData,
        xAxisLabel: newXAxisLabel,
        yAxisLabel: newYAxisLabel,
        description: newDescription,
        theme: "light",
        animated: true,
      };

      // Stream completed update
      yield {
        status: "success" as const,
        message: `Updated chart with changes: ${changes}`,
        chartId,
        canvasName,
        title: newTitle,
        chartType: newChartType,
        chartData: updatedChartData,
        changes,
        progress: 100,
        // Flag for Canvas to process this result
        shouldUpdateArtifact: true,
      };

      return `Updated chart with changes: ${changes}. The updated chart is now available in the Canvas workspace.`;
    } catch (error) {
      logger.error("Failed to update chart:", error);

      // Stream error state
      yield {
        status: "error" as const,
        message: `Failed to update chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        chartId,
        canvasName,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      throw error;
    }
  },
});

// Export main chart tools - artifact tools now registered directly in tool-kit.ts
export const chartTools = {
  create_chart: createChartTool,
  update_chart: updateChartTool,
};
