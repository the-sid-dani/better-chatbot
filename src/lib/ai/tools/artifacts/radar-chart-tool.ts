import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Radar Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual radar chart artifacts that appear in the Canvas workspace.
 * Radar charts are ideal for displaying multi-dimensional comparisons, performance metrics,
 * and skill assessments with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const radarChartArtifactTool = createTool({
  description: `Create a beautiful radar chart artifact that opens in the Canvas workspace.

  This tool creates individual radar charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Radar charts are perfect for showing
  multi-dimensional comparisons, performance metrics, and skill assessments.

  Examples of when to use this tool:
  - "Create a radar chart showing team skills in different technologies"
  - "Make a radar chart of product features comparison"
  - "Show me a radar chart of performance metrics across categories"
  - "Visualize survey results across multiple dimensions as a radar chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the radar chart"),
    data: z
      .array(
        z.object({
          metric: z
            .string()
            .describe("Name of the metric/dimension on the radar chart"),
          series: z
            .array(
              z.object({
                seriesName: z.string().describe("Name of this data series"),
                value: z
                  .number()
                  .describe("Value for this metric in this series"),
                fullMark: z
                  .number()
                  .optional()
                  .describe(
                    "Maximum value for this metric (default: auto-calculated)",
                  ),
              }),
            )
            .describe("Data series for this metric"),
        }),
      )
      .describe("Radar chart data with metrics and series values"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async ({ title, data, description }) => {
    try {
      logger.info(`Creating radar chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Radar chart data cannot be empty");
      }

      // Validate data structure
      for (const metric of data) {
        if (!metric.metric || !metric.series || metric.series.length === 0) {
          throw new Error(
            "Invalid radar chart data structure - each metric needs name and series",
          );
        }

        for (const series of metric.series) {
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

      // Create the chart artifact content that matches RadarChart component props
      const chartContent = {
        type: "radar-chart",
        title,
        data,
        description,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "radar" as const,
          description,
          theme: "light",
          animated: true,
          seriesCount: seriesNames.length,
          metrics: data.map((d) => d.metric),
          aspectRatio: "square", // Radar charts need square aspect ratio
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

      // Create the structured result data
      const resultData = {
        success: true,
        artifactId,
        artifact: {
          kind: "charts" as const,
          title: `Radar Chart: ${title}`,
          content: JSON.stringify(chartContent, null, 2),
          metadata: chartContent.metadata,
        },
        message: `Created radar chart "${title}" with ${data.length} metrics across ${seriesNames.length} dimensions. The chart is now available in the Canvas workspace with beautiful styling.`,
        chartType: "radar",
        metrics: data.length,
        series: seriesNames,
        // Additional metadata for Canvas integration
        canvasReady: true,
        componentType: "RadarChart",
      };

      // Return in expected response format with content and structuredContent
      logger.info(`Radar chart artifact created successfully: ${artifactId}`);
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
      logger.error("Failed to create radar chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create radar chart: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create radar chart: ${errorMessage}`,
              chartType: "radar",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
