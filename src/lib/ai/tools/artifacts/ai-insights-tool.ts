import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { DefaultToolName } from "../index";
import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";
import { streamText } from "ai";
import { customModelProvider } from "../../models";

/**
 * AI Insights Tool - Creates Canvas Artifacts with AI-Generated Insights
 *
 * This tool creates individual AI insights artifacts that appear in the Canvas workspace.
 * AI insights analyze Canvas data and provide contextual recommendations, observations,
 * and actionable insights using AI generation.
 */
export const aiInsightsArtifactTool = createTool({
  name: DefaultToolName.CreateAIInsights,
  description: `Create an AI-powered insights artifact that opens in the Canvas workspace.

  This tool creates individual AI insights cards that analyze Canvas data and provide:
  - Contextual analysis of charts and data visualizations
  - Actionable recommendations based on patterns
  - Key observations and trends
  - Data-driven insights using AI generation

  Examples of when to use this tool:
  - "Analyze the revenue chart and provide insights"
  - "Generate insights about user engagement trends"
  - "What insights can you provide about the conversion data?"
  - "Create an AI insights card analyzing the dashboard metrics"

  The insights will open in the Canvas workspace alongside the chat.`,

  inputSchema: z.object({
    title: z
      .string()
      .describe(
        "Title for the insights card (e.g., 'Revenue Analysis', 'User Trends')",
      ),
    prompt: z
      .string()
      .describe("Analysis prompt or question to generate insights about"),
    canvasData: z
      .any()
      .optional()
      .describe("Optional Canvas chart data to analyze (JSON format)"),
    severity: z
      .enum(["info", "warning", "success", "error"])
      .default("info")
      .describe("Insight severity level for visual styling"),
    description: z
      .string()
      .optional()
      .describe("Brief description or context for the insights"),
  }),

  execute: async function* ({
    title,
    prompt,
    canvasData,
    severity = "info",
    description,
  }) {
    try {
      logger.info(
        `🔧 [${DefaultToolName.CreateAIInsights}] Tool execution started`,
      );

      yield {
        status: "loading" as const,
        message: "Preparing AI insights...",
        progress: 0,
      };

      // Generate AI insights using Claude-4-Sonnet
      let generatedInsights = "";

      yield {
        status: "processing" as const,
        message: "Generating AI insights...",
        progress: 30,
      };

      // Build context for AI
      const insightsContext = canvasData
        ? `Analyze the following data and provide insights:\n\nData: ${JSON.stringify(canvasData, null, 2)}\n\nQuestion: ${prompt}`
        : prompt;

      // Stream AI generation using Claude-4-Sonnet
      try {
        const model = customModelProvider.getModel("claude-4-sonnet");
        const { textStream } = await streamText({
          model,
          prompt: `You are a data analyst providing concise, actionable insights. ${insightsContext}

Provide 3-5 bullet points of key insights. Be specific and data-driven. Format as markdown list.`,
          maxTokens: 500,
        });

        for await (const chunk of textStream) {
          generatedInsights += chunk;
        }

        logger.info(
          `✅ [${DefaultToolName.CreateAIInsights}] AI insights generated successfully`,
        );
      } catch (error) {
        logger.error(
          `⚠️ [${DefaultToolName.CreateAIInsights}] AI generation failed, using prompt as fallback:`,
          error,
        );
        // Fallback to using the prompt if AI generation fails
        generatedInsights = prompt;
      }

      yield {
        status: "processing" as const,
        message: "Validating insights...",
        progress: 70,
      };

      // Validation using CHART_VALIDATORS
      const validationResult = CHART_VALIDATORS.insights({
        title,
        prompt,
        canvasData,
        insights: generatedInsights,
        severity,
        description,
      });

      if (!validationResult.success) {
        throw new Error(
          `Validation failed: ${validationResult.error || "Invalid insights data"}`,
        );
      }

      // Create the insights artifact content that matches AIInsights component props
      const insightsContent = {
        type: "ai-insights",
        title,
        prompt,
        canvasData,
        insights: generatedInsights,
        severity,
        description,
        chartType: "insights", // Top-level chartType for canvas-panel.tsx routing
        metadata: {
          chartType: "insights" as const,
          hasCanvasData: !!canvasData,
          generatedAt: new Date().toISOString(),
          theme: "light",
          // Optimize sizing for Canvas cards
          sizing: {
            width: "100%",
            height: "auto",
            minHeight: "250px",
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
        message: `Created AI insights "${title}"`,
        chartId: artifactId,
        title,
        chartType: "insights",
        canvasName: "Data Visualization",
        chartData: insightsContent,
        shouldCreateArtifact: true, // REQUIRED FLAG for Canvas integration
        progress: 100,
      };

      logger.info(
        `✅ [${DefaultToolName.CreateAIInsights}] AI insights artifact created: ${artifactId}`,
      );
      return `Created AI insights "${title}". The insights are now available in the Canvas workspace.`;
    } catch (error) {
      logger.error(
        `❌ [${DefaultToolName.CreateAIInsights}] Failed to create AI insights:`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create AI insights: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create AI insights: ${errorMessage}`,
              chartType: "insights",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
