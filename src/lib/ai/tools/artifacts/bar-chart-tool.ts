import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Enhanced Bar Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual bar chart artifacts that appear in the Canvas workspace.
 * Each chart is a fully functional artifact with the beautiful aesthetics of the existing
 * BarChart component, optimized for Canvas display with proper sizing.
 */
export const barChartArtifactTool = createTool({
  description: `Create a beautiful bar chart artifact that opens in the Canvas workspace.

  This tool creates individual bar charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Use this when the user specifically
  wants to create a bar chart or visualize categorical data with bars.

  Examples of when to use this tool:
  - "Create a bar chart showing quarterly sales"
  - "Make a bar chart of website traffic by source"
  - "Show me a bar chart comparing product categories"
  - "Visualize survey responses as a bar chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the bar chart"),
    data: z
      .array(
        z.object({
          xAxisLabel: z
            .string()
            .describe("Label for this category on the x-axis"),
          series: z
            .array(
              z.object({
                seriesName: z
                  .string()
                  .describe("Name of this data series/bar group"),
                value: z.number().describe("Numeric value for this series"),
              }),
            )
            .describe("Data series for this category"),
        }),
      )
      .describe("Bar chart data with x-axis categories and series values"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
    yAxisLabel: z
      .string()
      .optional()
      .describe("Label for the y-axis (values axis)"),
  }),

  execute: async ({ title, data, description, yAxisLabel }) => {
    try {
      logger.info(`Creating bar chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Bar chart data cannot be empty");
      }

      // Validate data structure
      for (const point of data) {
        if (!point.xAxisLabel || !point.series || point.series.length === 0) {
          throw new Error(
            "Invalid bar chart data structure - each point needs xAxisLabel and series",
          );
        }

        for (const series of point.series) {
          if (!series.seriesName || typeof series.value !== "number") {
            throw new Error(
              "Invalid series data - each series needs seriesName and numeric value",
            );
          }
        }
      }

      // Get unique series names for metadata
      const seriesNames = Array.from(
        new Set(data.flatMap((d) => d.series.map((s) => s.seriesName))),
      );

      // Create the chart artifact content that matches BarChart component props
      const chartContent = {
        type: "bar-chart",
        title,
        data,
        description,
        yAxisLabel,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "bar" as const,
          xAxisLabel: "Categories",
          yAxisLabel,
          description,
          theme: "light",
          animated: true,
          seriesCount: seriesNames.length,
          dataPoints: data.length,
          // Optimize sizing for Canvas cards
          sizing: {
            width: "100%",
            height: "400px",
            containerClass: "bg-card",
            responsive: true,
          },
        },
      };

      // Generate unique artifact ID
      const artifactId = generateUUID();

      // Return simple, serializable result for Vercel AI SDK
      const result = {
        success: true,
        artifactId: artifactId,
        title: title,
        message: `Created bar chart "${title}" with ${data.length} data points`,
        chartType: "bar",
        dataPoints: data.length,
        series: seriesNames.join(", "),
        // Include artifact data as serializable JSON string
        artifactContent: JSON.stringify(chartContent),
        artifactTitle: `Bar Chart: ${title}`,
        artifactKind: "charts"
      };

      // Note: Canvas artifact creation happens in ChatBot component via tool result detection

      logger.info(`Bar chart artifact created successfully: ${artifactId}`);
      return result;
    } catch (error) {
      logger.error("Failed to create bar chart artifact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to create bar chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        chartType: "bar",
      };
    }
  },
});
