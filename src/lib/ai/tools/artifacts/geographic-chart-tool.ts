import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Geographic Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual geographic chart artifacts that appear in the Canvas workspace.
 * Geographic charts are ideal for displaying DMA analysis, state-level data, and regional metrics
 * using react-simple-maps with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const geographicChartArtifactTool = createTool({
  description: `Create a beautiful geographic chart artifact that opens in the Canvas workspace.

  This tool creates individual geographic charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Geographic charts are perfect for showing
  DMA analysis, state-level data, regional metrics, and country comparisons.

  Examples of when to use this tool:
  - "Create a geographic chart showing sales by US state"
  - "Make a world map showing revenue by country"
  - "Show me a geographic chart of customer distribution by DMA"
  - "Visualize regional performance as a geographic chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the geographic chart"),
    data: z
      .array(
        z.object({
          regionCode: z
            .string()
            .describe("Region identifier (ISO country code, US state code, DMA code, etc.)"),
          regionName: z
            .string()
            .describe("Human-readable name of the region"),
          value: z
            .number()
            .describe("Numeric value for this region"),
        }),
      )
      .describe("Geographic chart data with region codes and values"),
    geoType: z
      .enum(["world", "usa-states", "usa-dma", "usa-counties"])
      .describe("Type of geographic map to display"),
    colorScale: z
      .enum(["blues", "reds", "greens", "viridis"])
      .optional()
      .describe("Color scale for the choropleth map (default: blues)"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async ({ title, data, geoType, colorScale = "blues", description }) => {
    try {
      logger.info(`Creating geographic chart artifact: ${title}`);

      // Validate chart data
      if (!data || data.length === 0) {
        throw new Error("Geographic chart data cannot be empty");
      }

      // Validate data structure
      for (const region of data) {
        if (!region.regionCode || !region.regionName || typeof region.value !== "number") {
          throw new Error(
            "Invalid geographic chart data structure - each region needs regionCode, regionName, and numeric value",
          );
        }
      }

      // Validate geography type and provide guidance
      const validGeoTypes = ["world", "usa-states", "usa-dma", "usa-counties"];
      if (!validGeoTypes.includes(geoType)) {
        throw new Error(
          `Invalid geoType "${geoType}" - must be one of: ${validGeoTypes.join(", ")}`,
        );
      }

      // Handle missing region codes gracefully by warning but not failing
      const missingCodes = data.filter(region => !region.regionCode.trim());
      if (missingCodes.length > 0) {
        logger.warn(`Geographic chart has ${missingCodes.length} regions with missing codes`);
      }

      // Get data range for color scaling
      const values = data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);

      // Create the chart artifact content that matches GeographicChart component props
      const chartContent = {
        type: "geographic-chart",
        title,
        data,
        geoType,
        colorScale,
        description,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "geographic" as const,
          geoType,
          colorScale,
          description,
          theme: "light",
          animated: false, // Maps typically don't need animations
          regionCount: data.length,
          dataRange: { min: minValue, max: maxValue },
          aspectRatio: "wide", // Maps need wide aspect ratio for map display
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
        message: `Created geographic chart "${title}" showing ${data.length} regions`,
        chartType: "geographic",
        geoType,
        regionCount: data.length,
        colorScale,
        // Include artifact data as serializable JSON string
        artifactContent: JSON.stringify(chartContent),
        artifactTitle: `Geographic Chart: ${title}`,
        artifactKind: "charts"
      };

      // Note: Canvas artifact creation happens in ChatBot component via tool result detection

      logger.info(`Geographic chart artifact created successfully: ${artifactId}`);
      return result;
    } catch (error) {
      logger.error("Failed to create geographic chart artifact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to create geographic chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        chartType: "geographic",
      };
    }
  },
});