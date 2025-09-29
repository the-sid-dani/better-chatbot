import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { DefaultToolName } from "../index";

/**
 * Sankey Chart Tool - Creates Canvas Artifacts
 *
 * This tool creates individual sankey chart artifacts that appear in the Canvas workspace.
 * Sankey charts are ideal for displaying flow diagrams, energy flow, user journey flows,
 * and budget allocation flows with the beautiful aesthetics of the existing chart components,
 * optimized for Canvas display with proper sizing.
 */
export const sankeyChartArtifactTool = createTool({
  // Explicit tool name for debugging and registry validation
  name: DefaultToolName.CreateSankeyChart,
  description: `Create a beautiful sankey chart artifact that opens in the Canvas workspace.

  This tool creates individual sankey charts with the same beautiful aesthetics as the existing
  chart components, but optimized for Canvas display. Sankey charts are perfect for showing
  flow diagrams, energy flow, user journey flows, and budget allocation flows.

  Examples of when to use this tool:
  - "Create a sankey chart showing user flow from signup to conversion"
  - "Make a sankey chart of energy consumption by source and usage"
  - "Show me a sankey chart of budget allocation across departments"
  - "Visualize data pipeline flow as a sankey chart"

  The chart will open in the Canvas workspace alongside the chat, with proper sizing
  and the same beautiful design as existing components.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the sankey chart"),
    nodes: z
      .array(
        z.object({
          id: z.string().describe("Unique identifier for this node"),
          name: z.string().describe("Display name for this node"),
        }),
      )
      .describe("Array of nodes in the sankey diagram"),
    links: z
      .array(
        z.object({
          source: z.string().describe("ID of the source node"),
          target: z.string().describe("ID of the target node"),
          value: z.number().describe("Flow value from source to target"),
        }),
      )
      .describe("Array of links/flows between nodes"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the chart shows"),
  }),

  execute: async function* ({ title, nodes, links, description }) {
    try {
      logger.info(`Creating sankey chart artifact: ${title}`);

      // Validate chart data
      if (!nodes || nodes.length === 0) {
        throw new Error("Sankey chart must have at least one node");
      }

      if (!links || links.length === 0) {
        throw new Error("Sankey chart must have at least one link");
      }

      // Validate nodes structure
      const nodeIds = new Set<string>();
      for (const node of nodes) {
        if (!node.id || !node.name) {
          throw new Error("Invalid node data - each node needs id and name");
        }

        if (nodeIds.has(node.id)) {
          throw new Error(`Duplicate node ID found: ${node.id}`);
        }
        nodeIds.add(node.id);
      }

      // Validate links structure and detect circular references
      for (const link of links) {
        if (!link.source || !link.target || typeof link.value !== "number") {
          throw new Error(
            "Invalid link data - each link needs source, target, and numeric value",
          );
        }

        if (!nodeIds.has(link.source)) {
          throw new Error(
            `Link references unknown source node: ${link.source}`,
          );
        }

        if (!nodeIds.has(link.target)) {
          throw new Error(
            `Link references unknown target node: ${link.target}`,
          );
        }

        if (link.source === link.target) {
          throw new Error(`Self-referencing link detected: ${link.source}`);
        }

        if (link.value <= 0) {
          throw new Error(
            `Link value must be positive: ${link.source} -> ${link.target}`,
          );
        }
      }

      // Simple circular reference detection
      const hasPath = (
        start: string,
        end: string,
        visited = new Set<string>(),
      ): boolean => {
        if (visited.has(start)) return false;
        if (start === end) return true;

        visited.add(start);
        for (const link of links) {
          if (
            link.source === start &&
            hasPath(link.target, end, new Set(visited))
          ) {
            return true;
          }
        }
        return false;
      };

      for (const link of links) {
        if (hasPath(link.target, link.source)) {
          logger.warn(
            `Potential circular reference detected: ${link.source} <-> ${link.target}`,
          );
        }
      }

      // Create the chart artifact content that matches SankeyChart component props
      const chartContent = {
        type: "sankey-chart",
        title,
        nodes,
        links,
        description,
        chartType: "sankey", // Top-level chartType for canvas-panel.tsx routing
        // Add metadata for Canvas rendering
        metadata: {
          chartType: "sankey" as const,
          description,
          theme: "light",
          animated: true,
          nodeCount: nodes.length,
          linkCount: links.length,
          totalFlow: links.reduce((sum, link) => sum + link.value, 0),
          aspectRatio: "wide", // Sankey charts need wide aspect ratio for flow visualization
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
        message: `Created sankey chart "${title}"`,
        chartId: artifactId,
        title,
        chartType: "sankey",
        canvasName: "Data Visualization",
        chartData: chartContent,
        shouldCreateArtifact: true, // Flag for Canvas processing
        progress: 100,
      };

      // Return simple success message for chat
      logger.info(`Sankey chart artifact created successfully: ${artifactId}`);
      return `Created sankey chart "${title}". The chart is now available in the Canvas workspace.`;
    } catch (error) {
      logger.error("Failed to create sankey chart artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to create sankey chart: ${errorMessage}`,
          },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create sankey chart: ${errorMessage}`,
              chartType: "sankey",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
