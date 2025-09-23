import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Treemap Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual treemap chart artifacts that appear in the Canvas workspace.
 * Treemap charts are ideal for displaying hierarchical data, budget breakdowns, and file system
 * visualization with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const treemapChartArtifactTool = createTool({
  description: `Create a beautiful treemap chart artifact that opens in the Canvas workspace.

  This tool creates individual treemap charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Treemap charts are perfect for showing
  hierarchical data, budget breakdowns, and file system visualization.

  Examples of when to use this tool:
  - "Create a treemap chart showing budget allocation by department"
  - "Make a treemap chart of disk usage by file type"
  - "Show me a treemap chart of market share by company"
  - "Visualize project time allocation as a treemap chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the treemap chart"),
    data: z
      .array(
        z.object({
          name: z
            .string()
            .describe("Name of the top-level category or item"),
          value: z
            .number()
            .describe("Value for this item (used for sizing if no children)"),
          children: z
            .array(
              z.object({
                name: z
                  .string()
                  .describe("Name of the child item"),
                value: z
                  .number()
                  .describe("Value for this child item (determines size)"),
              }),
            )
            .optional()
            .describe("Optional children for hierarchical data"),
        }),
      )
      .describe("Treemap chart data with hierarchical structure"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async ({ title, data, description }) => {
    try {
      logger.info(`Creating treemap chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Treemap chart data cannot be empty");
      }

      // Validate data structure and convert negative values
      for (const item of data) {
        if (!item.name || typeof item.value !== "number") {
          throw new Error(
            "Invalid treemap chart data structure - each item needs name and numeric value",
          );
        }

        // Handle negative values appropriately - convert to absolute values
        if (item.value < 0) {
          item.value = Math.abs(item.value);
          logger.warn(`Converted negative value to absolute for treemap: ${item.name}`);
        }

        if (item.children) {
          for (const child of item.children) {
            if (!child.name || typeof child.value !== "number") {
              throw new Error(
                "Invalid child data - each child needs name and numeric value",
              );
            }

            // Handle negative values in children
            if (child.value < 0) {
              child.value = Math.abs(child.value);
              logger.warn(`Converted negative child value to absolute for treemap: ${child.name}`);
            }
          }
        }
      }

      // Calculate total items for metadata
      const totalItems = data.reduce(
        (total, item) => total + (item.children ? item.children.length : 1),
        0
      );

      // Create the chart artifact content that matches TreemapChart component props
      const chartContent = {
        type: "treemap-chart",
        title,
        data,
        description,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "treemap" as const,
          description,
          theme: "light",
          animated: true,
          topLevelItems: data.length,
          totalItems,
          aspectRatio: "square", // Treemap charts need square aspect ratio for proper proportions
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
        message: `Created treemap chart "${title}" with ${data.length} top-level items`,
        chartType: "treemap",
        topLevelItems: data.length,
        totalItems,
        // Include artifact data as serializable JSON string
        artifactContent: JSON.stringify(chartContent),
        artifactTitle: `Treemap Chart: ${title}`,
        artifactKind: "charts"
      };

      // Note: Canvas artifact creation happens in ChatBot component via tool result detection

      logger.info(`Treemap chart artifact created successfully: ${artifactId}`);
      return result;
    } catch (error) {
      logger.error("Failed to create treemap chart artifact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to create treemap chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        chartType: "treemap",
      };
    }
  },
});