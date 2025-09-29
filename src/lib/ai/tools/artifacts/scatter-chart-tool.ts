import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { DefaultToolName } from "../index";

/**
 * Scatter Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual scatter chart artifacts that appear in the Canvas workspace.
 * Scatter charts are ideal for displaying correlation analysis, data point relationships,
 * and bubble charts with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const scatterChartArtifactTool = createTool({
  // Explicit tool name for debugging and registry validation
  name: DefaultToolName.CreateScatterChart,
  description: `Create a beautiful scatter chart artifact that opens in the Canvas workspace.

  This tool creates individual scatter charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Scatter charts are perfect for showing
  correlation analysis, data point relationships, and bubble charts.

  Examples of when to use this tool:
  - "Create a scatter plot showing price vs performance correlation"
  - "Make a bubble chart of company size vs revenue"
  - "Show me a scatter chart of customer satisfaction vs retention rate"
  - "Visualize website traffic vs conversion rate as a scatter plot"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the scatter chart"),
    data: z
      .array(
        z.object({
          name: z
            .string()
            .optional()
            .describe("Name/identifier for this data point group (optional)"),
          series: z
            .array(
              z.object({
                seriesName: z.string().describe("Name of this data series"),
                x: z.number().describe("X-axis value for this data point"),
                y: z.number().describe("Y-axis value for this data point"),
                z: z
                  .number()
                  .optional()
                  .describe("Optional size value for bubble charts"),
              }),
            )
            .describe("Data series for this data point group"),
        }),
      )
      .describe(
        "Scatter chart data with x, y coordinates and optional bubble sizes",
      ),
    showBubbles: z
      .boolean()
      .optional()
      .describe(
        "Whether to show bubbles with sizes based on z values (default: false)",
      ),
    xAxisLabel: z.string().optional().describe("Label for the x-axis"),
    yAxisLabel: z.string().optional().describe("Label for the y-axis"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async function* ({
    title,
    data,
    showBubbles = false,
    xAxisLabel,
    yAxisLabel,
    description,
  }) {
    try {
      logger.info(`Creating scatter chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Scatter chart data cannot be empty");
      }

      // Validate data structure
      for (const point of data) {
        if (!point.series || point.series.length === 0) {
          throw new Error(
            "Invalid scatter chart data structure - each point needs series array",
          );
        }

        for (const series of point.series) {
          if (
            !series.seriesName ||
            typeof series.x !== "number" ||
            typeof series.y !== "number"
          ) {
            throw new Error(
              "Invalid series data - each series needs seriesName, numeric x, and numeric y",
            );
          }

          if (
            showBubbles &&
            series.z !== undefined &&
            typeof series.z !== "number"
          ) {
            throw new Error(
              "Invalid bubble data - z value must be numeric for bubble charts",
            );
          }
        }
      }

      // Get unique series names for metadata
      const seriesNames = Array.from(
        new Set(data.flatMap((d) => d.series.map((s) => s.seriesName))),
      );

      // Create the chart artifact content that matches ScatterChart component props
      const chartContent = {
        type: "scatter-chart",
        title,
        data,
        showBubbles,
        xAxisLabel,
        yAxisLabel,
        description,
        chartType: "scatter", // Top-level chartType for canvas-panel.tsx routing
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "scatter" as const,
          showBubbles,
          xAxisLabel,
          yAxisLabel,
          description,
          theme: "light",
          animated: true,
          seriesCount: seriesNames.length,
          dataPoints: data.reduce(
            (total, group) => total + group.series.length,
            0,
          ),
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

      // Stream success state with direct chartData format (matches create_chart pattern)
      yield {
        status: "success" as const,
        message: `Created scatter chart "${title}"`,
        chartId: artifactId,
        title,
        chartType: "scatter",
        canvasName: "Data Visualization",
        chartData: chartContent,
        shouldCreateArtifact: true, // Flag for Canvas processing
        progress: 100,
      };

      // Return simple success message for chat
      logger.info(`Scatter chart artifact created successfully: ${artifactId}`);
      return `Created scatter chart "${title}". The chart is now available in the Canvas workspace.`;
    } catch (error) {
      logger.error("Failed to create scatter chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create scatter chart: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create scatter chart: ${errorMessage}`,
              chartType: "scatter",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
