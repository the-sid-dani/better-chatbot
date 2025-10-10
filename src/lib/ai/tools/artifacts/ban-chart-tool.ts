import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { DefaultToolName } from "../index";
import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";

/**
 * BAN (Big Ass Number) Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual BAN chart artifacts that appear in the Canvas workspace.
 * BAN charts are ideal for displaying prominent KPI metrics with large typography,
 * optional trend indicators, and comparison values.
 */
export const banChartArtifactTool = createTool({
  name: DefaultToolName.CreateBANChart,
  description: `Create a beautiful BAN (Big Ass Number) chart artifact that opens in the Canvas workspace.

  This tool creates individual BAN charts optimized for displaying prominent KPI metrics with:
  - Large, readable typography for the main metric
  - Optional trend indicators (up/down arrows with percentage)
  - Optional comparison values (e.g., "vs last month")
  - Clean, minimalist design using shadcn/ui Card components

  Examples of when to use this tool:
  - "Show total revenue of $1.2M with a 15% increase"
  - "Display 45,230 active users trending up 8%"
  - "Create a BAN chart for conversion rate at 3.2%"
  - "Show customer satisfaction score of 4.8/5 compared to 4.5 last quarter"

  The chart will open in the Canvas workspace alongside the chat.`,

  inputSchema: z.object({
    title: z
      .string()
      .describe(
        "Title for the BAN chart (e.g., 'Total Revenue', 'Active Users')",
      ),
    value: z
      .union([z.number(), z.string()])
      .describe("Main metric value to display prominently"),
    unit: z
      .string()
      .optional()
      .describe("Unit of measurement (e.g., '%', '$', 'users', '/5')"),
    trend: z
      .object({
        value: z
          .number()
          .describe(
            "Trend percentage (positive or negative, e.g., 15 for +15%)",
          ),
        direction: z
          .enum(["up", "down", "neutral"])
          .describe("Trend direction indicator"),
        label: z
          .string()
          .optional()
          .describe("Trend context label (e.g., 'vs last month')"),
      })
      .optional()
      .describe("Optional trend indicator with percentage and direction"),
    comparison: z
      .object({
        value: z
          .union([z.number(), z.string()])
          .describe("Comparison value to display"),
        label: z
          .string()
          .describe(
            "Comparison label (e.g., 'vs last month', 'previous quarter')",
          ),
      })
      .optional()
      .describe("Optional comparison value with label"),
    description: z
      .string()
      .optional()
      .describe("Brief description or additional context"),
  }),

  execute: async function* ({
    title,
    value,
    unit,
    trend,
    comparison,
    description,
  }) {
    try {
      logger.info(
        `🔧 [${DefaultToolName.CreateBANChart}] Tool execution started`,
      );

      yield {
        status: "loading" as const,
        message: "Preparing BAN chart...",
        progress: 0,
      };

      // Validation using CHART_VALIDATORS
      const validationResult = CHART_VALIDATORS.ban({
        title,
        value,
        unit,
        trend,
        comparison,
        description,
      });

      if (!validationResult.success) {
        throw new Error(
          `Validation failed: ${validationResult.error || "Invalid chart data"}`,
        );
      }

      yield {
        status: "processing" as const,
        message: "Creating BAN chart artifact...",
        progress: 50,
      };

      // Create the chart artifact content that matches BANChart component props
      const chartContent = {
        type: "ban-chart",
        title,
        value,
        unit,
        trend,
        comparison,
        description,
        chartType: "ban", // Top-level chartType for canvas-panel.tsx routing
        metadata: {
          chartType: "ban" as const,
          hasUnit: !!unit,
          hasTrend: !!trend,
          hasComparison: !!comparison,
          theme: "light",
          // Optimize sizing for Canvas cards - compact for single-metric display
          sizing: {
            width: "100%",
            height: "auto",
            minHeight: "180px",
            maxHeight: "280px",
            containerClass: "bg-card",
            responsive: true,
          },
        },
      };

      // Generate unique artifact ID
      const artifactId = generateUUID();

      // Stream success state with shouldCreateArtifact flag (CRITICAL for Canvas)
      yield {
        status: "success" as const,
        message: `Created BAN chart "${title}"`,
        chartId: artifactId,
        title,
        chartType: "ban",
        canvasName: "Data Visualization",
        chartData: chartContent,
        shouldCreateArtifact: true, // REQUIRED FLAG for Canvas integration
        progress: 100,
      };

      logger.info(
        `✅ [${DefaultToolName.CreateBANChart}] BAN chart artifact created: ${artifactId}`,
      );
      return `Created BAN chart "${title}". The chart is now available in the Canvas workspace.`;
    } catch (error) {
      logger.error(
        `❌ [${DefaultToolName.CreateBANChart}] Failed to create BAN chart:`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create BAN chart: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create BAN chart: ${errorMessage}`,
              chartType: "ban",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
