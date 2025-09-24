import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Enhanced Pie Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual pie chart artifacts that appear in the Canvas workspace.
 * Each chart is a fully functional artifact with the beautiful aesthetics of the existing
 * PieChart component, optimized for Canvas display with proper sizing.
 */
export const pieChartArtifactTool = createTool({
  description: `Create a beautiful pie chart artifact that opens in the Canvas workspace.

  This tool creates individual pie charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Use this when the user specifically
  wants to create a pie chart or visualize proportions and percentages.

  Examples of when to use this tool:
  - "Create a pie chart showing market share distribution"
  - "Make a pie chart of budget allocation by department"
  - "Show me a pie chart of survey responses by category"
  - "Visualize website traffic sources as a pie chart"
  - "Display product sales percentages in a pie chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing,
  a center total display, and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the pie chart"),
    data: z
      .array(
        z.object({
          label: z.string().describe("Label for this slice of the pie"),
          value: z.number().describe("Numeric value for this slice"),
        }),
      )
      .describe("Pie chart data with labels and values for each slice"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
    unit: z
      .string()
      .optional()
      .describe("Unit for the values (e.g., 'users', 'dollars', 'percent')"),
  }),

  execute: async ({ title, data, description, unit }) => {
    try {
      logger.info(`Creating pie chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Pie chart data cannot be empty");
      }

      // Validate data structure
      for (const slice of data) {
        if (!slice.label || typeof slice.value !== "number") {
          throw new Error(
            "Invalid pie chart data structure - each slice needs label and numeric value",
          );
        }
        if (slice.value < 0) {
          throw new Error("Pie chart values cannot be negative");
        }
      }

      // Calculate total and validate
      const total = data.reduce((sum, slice) => sum + slice.value, 0);
      if (total === 0) {
        throw new Error("Pie chart total cannot be zero");
      }

      // Get slice labels for metadata
      const sliceLabels = data.map((slice) => slice.label);

      // Create the chart artifact content that matches PieChart component props
      const chartContent = {
        type: "pie-chart",
        title,
        data,
        description,
        unit,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "pie" as const,
          description,
          unit,
          theme: "light",
          animated: true,
          sliceCount: data.length,
          total,
          // Optimize sizing for Canvas cards
          sizing: {
            width: "100%",
            height: "350px", // Slightly smaller for pie charts to maintain aspect ratio
            containerClass: "bg-card flex flex-col",
            responsive: true,
            aspectRatio: "square",
            maxHeight: "300px",
          },
          // Pie-specific styling
          pieStyle: {
            innerRadius: 60,
            strokeWidth: 5,
            showTotal: true,
            showTooltip: true,
            colorScheme: "chart-colors", // Uses the same color scheme as other charts
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
          title: `Pie Chart: ${title}`,
          content: JSON.stringify(chartContent, null, 2),
          metadata: chartContent.metadata,
        },
        message: `Created pie chart "${title}" with ${data.length} slices${unit ? ` measured in ${unit}` : ""}. Total value: ${total.toLocaleString()}${unit ? ` ${unit}` : ""}. The chart is now available in the Canvas workspace with center total display and beautiful styling.`,
        chartType: "pie",
        sliceCount: data.length,
        total,
        slices: sliceLabels,
        unit,
        canvasReady: true,
        componentType: "PieChart",
      };

      // Return in expected response format with content and structuredContent
      logger.info(`Pie chart artifact created successfully: ${artifactId}`);
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
      logger.error("Failed to create pie chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text", text: `Failed to create pie chart: ${errorMessage}` },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create pie chart: ${errorMessage}`,
              chartType: "pie",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
