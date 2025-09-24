import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Enhanced Line Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual line chart artifacts that appear in the Canvas workspace.
 * Each chart is a fully functional artifact with the beautiful aesthetics of the existing
 * LineChart component, optimized for Canvas display with proper sizing.
 */
export const lineChartArtifactTool = createTool({
  description: `Create a beautiful line chart artifact that opens in the Canvas workspace.

  This tool creates individual line charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Use this when the user specifically
  wants to create a line chart or visualize trends and time-series data.

  Examples of when to use this tool:
  - "Create a line chart showing revenue trends over time"
  - "Make a line chart of temperature changes throughout the day"
  - "Show me a line chart of user growth month over month"
  - "Visualize stock price movements as a line chart"
  - "Plot website traffic trends over the past quarter"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing,
  smooth curves, and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the line chart"),
    data: z
      .array(
        z.object({
          xAxisLabel: z
            .string()
            .describe("Label for this point on the x-axis (often time/date)"),
          series: z
            .array(
              z.object({
                seriesName: z
                  .string()
                  .describe("Name of this data series/line"),
                value: z
                  .number()
                  .describe("Numeric value for this series at this point"),
              }),
            )
            .describe("Data series for this point"),
        }),
      )
      .describe("Line chart data with x-axis points and series values"),
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
      logger.info(`Creating line chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Line chart data cannot be empty");
      }

      // Validate data structure
      for (const point of data) {
        if (!point.xAxisLabel || !point.series || point.series.length === 0) {
          throw new Error(
            "Invalid line chart data structure - each point needs xAxisLabel and series",
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

      // Create the chart artifact content that matches LineChart component props
      const chartContent = {
        type: "line-chart",
        title,
        data,
        description,
        yAxisLabel,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "line" as const,
          xAxisLabel: "Time/Categories",
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
          // Line-specific styling
          lineStyle: {
            strokeWidth: 2,
            curve: "monotone",
            showDots: false,
            showLegend: true,
            showGrid: true,
          },
        },
      };

      // Generate unique artifact ID
      const artifactId = generateUUID();

      // Create the structured result data
      const resultData = {
        success: true,
        artifactId,
        artifact: {
          kind: "charts" as const,
          title: `Line Chart: ${title}`,
          content: JSON.stringify(chartContent, null, 2),
          metadata: chartContent.metadata,
        },
        message: `Created line chart "${title}" with ${data.length} data points and ${seriesNames.length} trend lines. The chart is now available in the Canvas workspace with smooth curves and beautiful styling.`,
        chartType: "line",
        dataPoints: data.length,
        series: seriesNames,
        canvasReady: true,
        componentType: "LineChart",
      };

      // Return in expected response format with content and structuredContent
      logger.info(`Line chart artifact created successfully: ${artifactId}`);
      return {
        content: [
          { type: "text", text: resultData.message },
          {
            type: "text",
            text: `Chart Created in Canvas\n\nType: ${resultData.chartType}\n\nChart created successfully. Use the "Open Canvas" button above to view the interactive visualization.`,
          },
        ],
        structuredContent: {
          result: [resultData],
        },
        isError: false,
      };
    } catch (error) {
      logger.error("Failed to create line chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create line chart: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create line chart: ${errorMessage}`,
              chartType: "line",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
