import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "../../../utils";
import logger from "../../../logger";
import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";
import { DefaultToolName } from "../index";

/**
 * Enhanced Table Tool - Creates Canvas Artifacts
 *
 * This tool creates individual table artifacts that appear in the Canvas workspace.
 * Each table is a fully functional artifact with advanced features like sorting,
 * filtering, search, pagination, and Excel export capabilities.
 */
export const tableArtifactTool = createTool({
  // Explicit tool name for debugging and registry validation
  name: DefaultToolName.CreateTable,
  description: `Create an interactive table artifact that opens in the Canvas workspace.

  This tool creates individual tables with advanced functionality including sorting,
  filtering, search, pagination, and export capabilities. The table will appear
  in the Canvas workspace alongside the chat, with proper sizing and responsive design.

  Examples of when to use this tool:
  - "Create a table showing sales data by quarter"
  - "Make a table of user analytics with search and filtering"
  - "Show me a table of inventory items with sorting"
  - "Display survey results in a searchable table"
  - "Create a data table for export to Excel"

  The table will open in the Canvas workspace with full interactivity including
  search, sort, filter, pagination, column visibility controls, and Excel export.`,

  inputSchema: z.object({
    title: z.string().describe("Title for the table"),
    description: z
      .string()
      .optional()
      .describe("Brief description of what the table shows"),
    columns: z
      .array(
        z.object({
          key: z
            .string()
            .describe("Column key that matches the data object keys"),
          label: z.string().describe("Display label for the column header"),
          type: z
            .enum(["string", "number", "date", "boolean"])
            .optional()
            .default("string")
            .describe("Data type for proper sorting and formatting"),
        }),
      )
      .describe("Column configuration array"),
    data: z
      .array(
        z
          .object({})
          .catchall(z.any())
          .describe(
            "Array of row objects. Each object should have keys matching the column keys.",
          ),
      )
      .describe(
        "Array of row objects. Each object should have keys matching the column keys.",
      ),
  }),

  execute: async ({ title, description, columns, data }) => {
    try {
      logger.info(`Creating table artifact: ${title}`);

      // Validate table data
      if (!data || data.length === 0) {
        throw new Error("Table data cannot be empty");
      }

      if (!columns || columns.length === 0) {
        throw new Error("Table columns cannot be empty");
      }

      // Validate column structure
      for (const column of columns) {
        if (!column.key || !column.label) {
          throw new Error(
            "Invalid column configuration - each column needs key and label",
          );
        }
      }

      // Validate data structure - check if all columns exist in data
      const columnKeys = columns.map((col) => col.key);
      const missingKeys = columnKeys.filter((key) =>
        data.every((row) => !(key in row)),
      );

      if (missingKeys.length > 0) {
        logger.warn(
          `Some column keys not found in data: ${missingKeys.join(", ")}`,
        );
      }

      // Create the table artifact content that matches InteractiveTable component props
      const tableContent = {
        type: "table",
        title,
        description,
        columns,
        data,
        // Add metadata for Canvas rendering
        metadata: {
          componentType: "table" as const,
          description,
          theme: "light",
          columnCount: columns.length,
          rowCount: data.length,
          // Optimize sizing for Canvas cards
          sizing: {
            width: "100%",
            height: "600px", // Tables need more height for functionality
            containerClass: "bg-card",
            responsive: true,
          },
          // Table-specific features
          features: {
            searchable: true,
            sortable: true,
            filterable: true,
            exportable: true,
            paginated: true,
            pageSize: 20,
            columnVisibility: true,
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
          kind: "tables" as const,
          title: `Table: ${title}`,
          content: JSON.stringify(tableContent, null, 2),
          metadata: tableContent.metadata,
        },
        message: `Created interactive table "${title}" with ${columns.length} columns and ${data.length} rows. The table includes search, sort, filter, pagination, and export capabilities. It is now available in the Canvas workspace.`,
        componentType: "table",
        columnCount: columns.length,
        rowCount: data.length,
        features: ["search", "sort", "filter", "pagination", "export"],
        canvasReady: true,
        tableType: "InteractiveTable",
      };

      // Return in expected response format with content and structuredContent
      logger.info(`Table artifact created successfully: ${artifactId}`);
      return {
        content: [
          { type: "text", text: resultData.message },
          {
            type: "text",
            text: `Table Created in Canvas\n\nColumns: ${resultData.columnCount}\nRows: ${resultData.rowCount}\n\nTable created successfully with advanced features. Use the "Open Canvas" button above to view the interactive table.`,
          },
        ],
        structuredContent: {
          result: [resultData],
        },
        isError: false,
      };
    } catch (error) {
      logger.error("Failed to create table artifact:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          { type: "text", text: `Failed to create table: ${errorMessage}` },
        ],
        structuredContent: {
          result: [
            {
              success: false,
              error: errorMessage,
              message: `Failed to create table: ${errorMessage}`,
              componentType: "table",
            },
          ],
        },
        isError: true,
      };
    }
  },
});
