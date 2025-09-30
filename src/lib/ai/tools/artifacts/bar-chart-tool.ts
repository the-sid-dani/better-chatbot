import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";
import { DefaultToolName } from "../index";

/**
 * Enhanced Bar Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual bar chart artifacts that appear in the Canvas workspace.
 * Each chart is a fully functional artifact with the beautiful aesthetics of the existing
 * BarChart component, optimized for Canvas display with proper sizing.
 */
export const barChartArtifactTool = createTool({
  // Explicit tool name for debugging and registry validation
  name: DefaultToolName.CreateBarChart,
  description: `Create a beautiful bar chart artifact that opens in the Canvas workspace.

  This tool creates individual bar charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Use this when the user specifically
  wants to create a bar chart or visualize categorical data with bars.

  Examples of when to use this tool:
  - "Create a bar chart showing quarterly sales"
  - "Make a bar chart of website traffic by source"
  - "Show me a bar chart comparing product categories"
  - "Visualize survey responses as a bar chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the bar chart"),
    data: z
      .array(
        z.object({
          xAxisLabel: z
            .string()
            .describe("Label for this category on the x-axis"),
          series: z
            .array(
              z.object({
                seriesName: z
                  .string()
                  .describe("Name of this data series/bar group"),
                value: z.number().describe("Numeric value for this series"),
              }),
            )
            .describe("Data series for this category"),
        }),
      )
      .describe("Bar chart data with x-axis categories and series values"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
    yAxisLabel: z
      .string()
      .optional()
      .describe("Label for the y-axis (values axis)"),
  }),

  execute: async function* ({ title, data, description, yAxisLabel }) {
    try {
      logger.info(
        `🔧 [${DefaultToolName.CreateBarChart}] Tool execution started:`,
        {
          toolName: DefaultToolName.CreateBarChart,
          title,
          dataPointsCount: data?.length || 0,
          hasDescription: !!description,
          hasYAxisLabel: !!yAxisLabel,
        },
      );
      logger.info(`Creating bar chart artifact: ${title}`);

      // Stream loading state
      yield {
        status: "loading",
        message: `Preparing bar chart: ${title}`,
        progress: 0,
      };

      // Comprehensive security validation with XSS prevention
      const validationResult = CHART_VALIDATORS.bar({
        title,
        data,
        description,
        yAxisLabel,
      });

      if (!validationResult.success) {
        logger.error(`Bar chart validation failed:`, {
          error: validationResult.error,
          details: validationResult.validationDetails,
          inputData: {
            title,
            dataLength: data?.length,
            description,
            yAxisLabel,
          },
        });
        throw new Error(
          validationResult.error || "Chart data validation failed",
        );
      }

      // Security audit check
      if (!validationResult.securityAudit.safe) {
        logger.error(
          `Bar chart security audit failed:`,
          validationResult.securityAudit.issues,
        );
        throw new Error("Chart data contains potential security issues");
      }

      // Stream processing state
      yield {
        status: "processing",
        message: `Creating bar chart...`,
        progress: 50,
      };

      // Add a small delay to make loading visible for testing
      await new Promise((resolve) => setTimeout(resolve, 500));

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

      // Create the chart artifact content that matches BarChart component props
      const chartContent = {
        type: "bar-chart",
        title: sanitizedTitle,
        data: sanitizedChartData,
        description: sanitizedDescription,
        yAxisLabel: sanitizedYAxisLabel,
        chartType: "bar", // Top-level chartType for canvas-panel.tsx routing
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "bar" as const,
          xAxisLabel: "Categories",
          yAxisLabel: sanitizedYAxisLabel,
          description: sanitizedDescription,
          theme: "light",
          animated: true,
          seriesCount: seriesNames.length,
          dataPoints: sanitizedChartData.length,
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
        message: `Created bar chart "${sanitizedTitle}" with ${sanitizedChartData.length} data points and ${seriesNames.length} series`,
        chartId: artifactId,
        title: sanitizedTitle,
        chartType: "bar",
        canvasName: "Data Visualization",
        chartData: chartContent,
        dataPoints: sanitizedChartData.length,
        shouldCreateArtifact: true, // Flag for Canvas processing
        progress: 100,
      };

      // Return simple success message for chat
      logger.info(
        `✅ [${DefaultToolName.CreateBarChart}] Tool execution completed successfully:`,
        {
          toolName: DefaultToolName.CreateBarChart,
          artifactId,
          title: sanitizedTitle,
          chartType: "bar",
          dataPoints: sanitizedChartData.length,
        },
      );

      return `Created bar chart "${sanitizedTitle}" with ${sanitizedChartData.length} data points and ${seriesNames.length} series. The chart is now available in the Canvas workspace.`;
    } catch (error) {
      logger.error(
        `❌ [${DefaultToolName.CreateBarChart}] Tool execution failed:`,
        {
          toolName: DefaultToolName.CreateBarChart,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      logger.error("Failed to create bar chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text", text: `Failed to create bar chart: ${errorMessage}` },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create bar chart: ${errorMessage}`,
              chartType: "bar",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
