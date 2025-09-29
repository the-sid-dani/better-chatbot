import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";
import { DefaultToolName } from "../index";

/**
 * Area Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual area chart artifacts that appear in the Canvas workspace.
 * Area charts are ideal for displaying time-series data, filled line charts, stacked metrics,
 * and cumulative values with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const areaChartArtifactTool = createTool({
  // Explicit tool name for debugging and registry validation
  name: DefaultToolName.CreateAreaChart,
  description: `Create a beautiful area chart artifact that opens in the Canvas workspace.

  This tool creates individual area charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Area charts are perfect for showing
  time-series data, filled line charts, stacked metrics, and cumulative values.

  Examples of when to use this tool:
  - "Create an area chart showing revenue trends over time"
  - "Make a stacked area chart of website traffic sources"
  - "Show me an area chart of cumulative sales data"
  - "Visualize temperature trends as an area chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the area chart"),
    data: z
      .array(
        z.object({
          xAxisLabel: z
            .string()
            .describe("Label for this data point on the x-axis"),
          series: z
            .array(
              z.object({
                seriesName: z
                  .string()
                  .describe("Name of this data series/area"),
                value: z.number().describe("Numeric value for this series"),
              }),
            )
            .describe("Data series for this data point"),
        }),
      )
      .describe("Area chart data with x-axis points and series values"),
    areaType: z
      .enum(["standard", "stacked", "percent"])
      .optional()
      .describe("Type of area chart: standard (default), stacked, or percent"),
    xAxisLabel: z.string().optional().describe("Label for the x-axis"),
    yAxisLabel: z
      .string()
      .optional()
      .describe("Label for the y-axis (values axis)"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async ({
    title,
    data,
    areaType = "standard",
    xAxisLabel,
    yAxisLabel,
    description,
  }) => {
    try {
      logger.info(`Creating area chart artifact: ${title}`);

      // Comprehensive security validation with XSS prevention
      const validationResult = CHART_VALIDATORS.area({
        title,
        data,
        description,
        yAxisLabel,
      });

      if (!validationResult.success) {
        logger.error(`Area chart validation failed: ${validationResult.error}`);
        throw new Error(
          validationResult.error || "Chart data validation failed",
        );
      }

      // Security audit check
      if (!validationResult.securityAudit.safe) {
        logger.error(
          `Area chart security audit failed:`,
          validationResult.securityAudit.issues,
        );
        throw new Error("Chart data contains potential security issues");
      }

      // Use sanitized and validated data
      const validatedData = validationResult.data!;
      const {
        title: sanitizedTitle,
        data: sanitizedChartData,
        description: sanitizedDescription,
        yAxisLabel: sanitizedYAxisLabel,
      } = validatedData;

      // Get unique series names for metadata (using sanitized data)
      const seriesNames = Array.from(
        new Set(
          sanitizedChartData.flatMap((d) => d.series.map((s) => s.seriesName)),
        ),
      );

      // Create the chart artifact content that matches AreaChart component props
      const chartContent = {
        type: "area-chart",
        title: sanitizedTitle,
        data: sanitizedChartData,
        areaType,
        xAxisLabel,
        yAxisLabel: sanitizedYAxisLabel,
        description: sanitizedDescription,
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "area" as const,
          areaType,
          xAxisLabel,
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

      // Create the structured result data
      const resultData = {
        success: true,
        artifactId,
        artifact: {
          kind: "charts" as const,
          title: `Area Chart: ${title}`,
          content: JSON.stringify(chartContent, null, 2),
          metadata: chartContent.metadata,
        },
        message: `Created area chart "${title}" with ${data.length} data points and ${seriesNames.length} trend areas. The chart is now available in the Canvas workspace with smooth curves and beautiful styling.`,
        chartType: "area",
        dataPoints: data.length,
        series: seriesNames,
        canvasReady: true,
        componentType: "AreaChart",
      };

      // Return in expected response format with content and structuredContent
      logger.info(`Area chart artifact created successfully: ${artifactId}`);
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
      logger.error("Failed to create area chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create area chart: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create area chart: ${errorMessage}`,
              chartType: "area",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
