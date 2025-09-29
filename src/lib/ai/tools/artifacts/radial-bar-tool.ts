import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { DefaultToolName } from "../index";

/**
 * Radial Bar Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual radial bar chart artifacts that appear in the Canvas workspace.
 * Radial bar charts are ideal for displaying circular progress indicators, comparative radial data,
 * and KPI dashboards with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const radialBarChartArtifactTool = createTool({
  // Explicit tool name for debugging and registry validation
  name: DefaultToolName.CreateRadialBarChart,
  description: `Create a beautiful radial bar chart artifact that opens in the Canvas workspace.

  This tool creates individual radial bar charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Radial bar charts are perfect for showing
  circular progress indicators, comparative radial data, and KPI dashboards.

  Examples of when to use this tool:
  - "Create a radial bar chart showing progress towards quarterly goals"
  - "Make a radial bar chart of performance metrics across teams"
  - "Show me a radial bar chart of completion rates by project"
  - "Visualize KPI performance as a radial bar chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the radial bar chart"),
    data: z
      .array(
        z.object({
          name: z.string().describe("Name of the metric or category"),
          value: z.number().describe("Current value for this metric"),
          maxValue: z
            .number()
            .optional()
            .describe(
              "Maximum possible value for this metric (defaults to highest value in dataset)",
            ),
        }),
      )
      .describe("Radial bar chart data with metrics and values"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
    innerRadius: z
      .number()
      .optional()
      .default(30)
      .describe("Inner radius of the radial bars (default: 30)"),
    outerRadius: z
      .number()
      .optional()
      .default(80)
      .describe("Outer radius of the radial bars (default: 80)"),
  }),

  execute: async ({
    title,
    data,
    description,
    innerRadius = 30,
    outerRadius = 80,
  }) => {
    try {
      logger.info(`Creating radial bar chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Radial bar chart data cannot be empty");
      }

      // Validate data structure
      for (const item of data) {
        if (!item.name || typeof item.value !== "number") {
          throw new Error(
            "Invalid radial bar chart data structure - each item needs name and numeric value",
          );
        }

        if (item.maxValue !== undefined && typeof item.maxValue !== "number") {
          throw new Error("Invalid maxValue - must be numeric if provided");
        }

        if (item.value < 0) {
          throw new Error("Radial bar chart values must be non-negative");
        }

        if (item.maxValue !== undefined && item.value > item.maxValue) {
          throw new Error(
            `Value ${item.value} exceeds maxValue ${item.maxValue} for ${item.name}`,
          );
        }
      }

      // Validate radius parameters
      if (innerRadius < 0 || outerRadius < 0) {
        throw new Error("Radius values must be non-negative");
      }

      if (innerRadius >= outerRadius) {
        throw new Error("Inner radius must be smaller than outer radius");
      }

      // Calculate default maxValue if not provided for each item
      const processedData = data.map((item) => ({
        ...item,
        maxValue: item.maxValue || Math.max(...data.map((d) => d.value)) * 1.2,
      }));

      // Create the chart artifact content that matches RadialBarChart component props
      const chartContent = {
        type: "radial-bar-chart",
        title,
        data: processedData,
        description,
        innerRadius,
        outerRadius,
        chartType: "radial-bar", // Top-level chartType for canvas-panel.tsx routing
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "radial-bar" as const,
          description,
          innerRadius,
          outerRadius,
          theme: "light",
          animated: true,
          items: processedData.length,
          aspectRatio: "square", // Radial charts need square aspect ratio
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

      // Return success with artifact creation data (matches existing pattern)
      const result = {
        success: true,
        artifactId,
        artifact: {
          kind: "charts" as const,
          title: `Radial Bar Chart: ${title}`,
          content: JSON.stringify(chartContent, null, 2),
          metadata: chartContent.metadata,
        },
        message: `Created radial bar chart "${title}" with ${data.length} metrics in circular format. The chart is now available in the Canvas workspace with beautiful styling.`,
        chartType: "radial-bar",
        items: data.length,
        innerRadius,
        outerRadius,
        // Additional metadata for Canvas integration
        canvasReady: true,
        componentType: "RadialBarChart",
      };

      // Note: Canvas artifact creation happens in ChatBot component via tool result detection

      logger.info(
        `Radial bar chart artifact created successfully: ${artifactId}`,
      );
      return result;
    } catch (error) {
      logger.error("Failed to create radial bar chart artifact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to create radial bar chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        chartType: "radial-bar",
      };
    }
  },
});
