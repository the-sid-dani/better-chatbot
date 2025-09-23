import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

/**
 * Gauge Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual gauge chart artifacts that appear in the Canvas workspace.
 * Gauge charts are ideal for displaying KPIs, performance metrics, temperature gauges,
 * and speed indicators with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const gaugeChartArtifactTool = createTool({
  description: `Create a beautiful gauge chart artifact that opens in the Canvas workspace.

  This tool creates individual gauge charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Gauge charts are perfect for showing
  KPIs, performance metrics, temperature gauges, and speed indicators.

  Examples of when to use this tool:
  - "Create a gauge chart showing server performance at 87%"
  - "Make a speedometer gauge for website loading speed"
  - "Show me a gauge chart of customer satisfaction score"
  - "Visualize project completion progress as a gauge chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the gauge chart"),
    value: z
      .number()
      .describe("Current value to display on the gauge"),
    minValue: z
      .number()
      .default(0)
      .describe("Minimum value of the gauge scale (default: 0)"),
    maxValue: z
      .number()
      .default(100)
      .describe("Maximum value of the gauge scale (default: 100)"),
    gaugeType: z
      .enum(["speedometer", "semi-circle", "radial"])
      .describe("Type of gauge display: speedometer (full circle), semi-circle, or radial"),
    unit: z
      .string()
      .optional()
      .describe("Unit of measurement (e.g., '%', 'ms', 'MB/s')"),
    thresholds: z
      .array(
        z.object({
          value: z
            .number()
            .describe("Threshold value"),
          color: z
            .string()
            .describe("Color for this threshold (hex format, e.g., #FF0000)"),
          label: z
            .string()
            .optional()
            .describe("Optional label for this threshold"),
        }),
      )
      .optional()
      .describe("Optional thresholds for color zones on the gauge"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the gauge shows"),
  }),

  execute: async ({ title, value, minValue = 0, maxValue = 100, gaugeType, unit, thresholds, description }) => {
    try {
      logger.info(`Creating gauge chart artifact: ${title}`);

      // Validate gauge data
      if (typeof value !== "number") {
        throw new Error("Gauge value must be a number");
      }

      if (minValue >= maxValue) {
        throw new Error("minValue must be less than maxValue");
      }

      // Clamp value to min/max bounds as per PRP requirements
      const clampedValue = Math.max(minValue, Math.min(maxValue, value));
      if (clampedValue !== value) {
        logger.warn(`Clamped gauge value from ${value} to ${clampedValue} (range: ${minValue}-${maxValue})`);
      }

      // Validate thresholds if provided
      if (thresholds) {
        for (const threshold of thresholds) {
          if (typeof threshold.value !== "number") {
            throw new Error("Threshold values must be numeric");
          }

          if (threshold.value < minValue || threshold.value > maxValue) {
            throw new Error(
              `Threshold value ${threshold.value} is outside gauge range (${minValue}-${maxValue})`,
            );
          }

          if (!threshold.color.match(/^#[0-9A-Fa-f]{6}$/)) {
            throw new Error(
              `Invalid threshold color "${threshold.color}" - must be hex format (e.g., #FF0000)`,
            );
          }
        }

        // Sort thresholds by value
        thresholds.sort((a, b) => a.value - b.value);
      }

      // Create the chart artifact content that matches GaugeChart component props
      const chartContent = {
        type: "gauge-chart",
        title,
        value: clampedValue,
        minValue,
        maxValue,
        gaugeType,
        unit,
        thresholds,
        description,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "gauge" as const,
          gaugeType,
          unit,
          description,
          theme: "light",
          animated: true,
          percentage: Math.round(((clampedValue - minValue) / (maxValue - minValue)) * 100),
          aspectRatio: "square", // Gauges need square aspect ratio
          thresholdCount: thresholds?.length || 0,
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
        message: `Created gauge chart "${title}" showing ${clampedValue}${unit || ""} (${chartContent.metadata.percentage}%)`,
        chartType: "gauge",
        gaugeType,
        value: clampedValue,
        minValue,
        maxValue,
        unit: unit || "",
        percentage: chartContent.metadata.percentage,
        // Include artifact data as serializable JSON string
        artifactContent: JSON.stringify(chartContent),
        artifactTitle: `Gauge Chart: ${title}`,
        artifactKind: "charts"
      };

      // Note: Canvas artifact creation happens in ChatBot component via tool result detection

      logger.info(`Gauge chart artifact created successfully: ${artifactId}`);
      return result;
    } catch (error) {
      logger.error("Failed to create gauge chart artifact:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: `Failed to create gauge chart: ${error instanceof Error ? error.message : "Unknown error"}`,
        chartType: "gauge",
      };
    }
  },
});