import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

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
    chartType: z.enum(["bar", "line", "pie"]).describe("Type of chart to create"),
    data: z.array(
      z.object({
        xAxisLabel: z.string().describe("Label for this data point on the x-axis"),
        series: z.array(
          z.object({
            seriesName: z.string().describe("Name of this data series"),
            value: z.number().describe("Numeric value for this series")
          })
        ).describe("Data series for this point")
      })
    ).describe("Chart data points"),
    xAxisLabel: z.string().optional().describe("Label for the x-axis"),
    yAxisLabel: z.string().optional().describe("Label for the y-axis"),
    description: z.string().optional().describe("Brief description of what the chart shows")
  }),

  execute: async function* ({
    title,
    chartType,
    data,
    xAxisLabel,
    yAxisLabel,
    description
  }) {
    const chartId = generateUUID();

    try {
      logger.info(`Creating chart: ${title} (${chartType})`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Chart data cannot be empty");
      }

      // Stream loading state using correct AI SDK streaming format
      yield {
        status: 'loading' as const,
        message: `Preparing chart: ${title}`,
        title,
        chartType,
        progress: 0
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
        status: 'processing' as const,
        message: `Creating ${chartType} chart visualization...`,
        title,
        chartType,
        progress: 50
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
        animated: true
      };

      // Stream completed chart - this is the final result
      yield {
        status: 'success' as const,
        message: `Created ${chartType} chart "${title}" with ${data.length} data points`,
        chartId,
        title,
        chartType,
        chartData,
        xAxisLabel,
        yAxisLabel,
        description,
        dataPoints: data.length,
        // Flag for Canvas to process this result
        shouldCreateArtifact: true
      };

      // Return simple success message for chat
      return `Created ${chartType} chart "${title}" with ${data.length} data points. The chart is now available in the Canvas workspace.`;

    } catch (error) {
      logger.error("Failed to create chart:", error);

      // Stream error state using correct format
      yield {
        status: 'error' as const,
        message: `Failed to create chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        title,
        chartType,
        error: error instanceof Error ? error.message : "Unknown error"
      };

      throw error;
    }
  }
});

// Export chart tools for integration with the tool system
export const chartTools = {
  create_chart: createChartTool,
};