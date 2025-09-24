import { smoothStream, streamText } from "ai";
import { customModelProvider } from "@/lib/ai/models";
import { createDocumentHandler } from "../../src/lib/artifacts/server";
import { ChartDataPoint, ChartArtifactMetadata } from "app-types/artifacts";
import logger from "logger";

// Chart generation prompts
const CHART_CREATION_SYSTEM_PROMPT = `You are a data visualization expert that creates beautiful, meaningful charts from user requests.

IMPORTANT RULES:
1. Always respond with valid JSON that can be parsed
2. Generate realistic, meaningful data that serves the user's request
3. Create data that tells a story or provides insights
4. Use appropriate chart types for the data (bar for comparisons, line for trends, pie for parts of a whole)
5. Ensure data is properly formatted for the specified chart type
6. Include descriptive labels and meaningful axis titles

DATA FORMAT:
For bar and line charts, structure data as:
{
  "chartType": "bar" | "line" | "pie",
  "title": "Chart Title",
  "description": "Brief description of what the chart shows",
  "xAxisLabel": "X-axis label",
  "yAxisLabel": "Y-axis label",
  "data": [
    {
      "xAxisLabel": "Category 1",
      "series": [
        {"seriesName": "Series 1", "value": 100},
        {"seriesName": "Series 2", "value": 150}
      ]
    }
  ]
}

For pie charts, use single series:
{
  "chartType": "pie",
  "title": "Chart Title",
  "description": "Brief description",
  "data": [
    {
      "xAxisLabel": "Slice 1",
      "series": [{"seriesName": "Value", "value": 30}]
    },
    {
      "xAxisLabel": "Slice 2",
      "series": [{"seriesName": "Value", "value": 70}]
    }
  ]
}

Generate data that is:
- Realistic and meaningful
- Properly scaled (avoid tiny decimals or huge numbers unless appropriate)
- Diverse enough to create interesting visualizations
- Contextually relevant to the user's request`;

const CHART_UPDATE_SYSTEM_PROMPT = `You are updating an existing chart based on user feedback.

EXISTING CHART CONTEXT:
{{CURRENT_CHART_DATA}}

USER REQUEST: Update this chart based on the following request.

RULES:
1. Maintain the same data structure format
2. Keep the chart type unless explicitly asked to change it
3. Preserve meaningful aspects of the existing data unless modification is requested
4. Follow the same JSON format rules as chart creation
5. Only modify what the user specifically asks for

Respond with the complete updated chart data in the same JSON format.`;

// Chart data validation and processing
function validateChartData(data: any): ChartDataPoint[] {
  if (!Array.isArray(data)) {
    throw new Error("Chart data must be an array");
  }

  return data.map((item, index) => {
    if (!item.xAxisLabel || typeof item.xAxisLabel !== "string") {
      throw new Error(`Invalid xAxisLabel at index ${index}`);
    }

    if (!Array.isArray(item.series)) {
      throw new Error(`Invalid series data at index ${index}`);
    }

    const validatedSeries = item.series.map(
      (seriesItem: any, seriesIndex: number) => {
        if (
          !seriesItem.seriesName ||
          typeof seriesItem.seriesName !== "string"
        ) {
          throw new Error(
            `Invalid seriesName at data index ${index}, series index ${seriesIndex}`,
          );
        }

        if (typeof seriesItem.value !== "number" || isNaN(seriesItem.value)) {
          throw new Error(
            `Invalid value at data index ${index}, series index ${seriesIndex}`,
          );
        }

        return {
          seriesName: seriesItem.seriesName,
          value: seriesItem.value,
        };
      },
    );

    return {
      xAxisLabel: item.xAxisLabel,
      series: validatedSeries,
    };
  });
}

function validateChartMetadata(metadata: any): ChartArtifactMetadata {
  const validChartTypes = ["bar", "line", "pie"];

  if (!metadata.chartType || !validChartTypes.includes(metadata.chartType)) {
    throw new Error(
      `Invalid chart type. Must be one of: ${validChartTypes.join(", ")}`,
    );
  }

  return {
    chartType: metadata.chartType,
    xAxisLabel: metadata.xAxisLabel || undefined,
    yAxisLabel: metadata.yAxisLabel || undefined,
    description: metadata.description || undefined,
    theme: metadata.theme || "light",
    colors: metadata.colors || undefined,
    animated: metadata.animated !== false, // Default to true
  };
}

// Chart content processing
function processChartResponse(response: string): {
  metadata: ChartArtifactMetadata;
  data: ChartDataPoint[];
} {
  try {
    const parsed = JSON.parse(response);

    const metadata = validateChartMetadata({
      chartType: parsed.chartType,
      xAxisLabel: parsed.xAxisLabel,
      yAxisLabel: parsed.yAxisLabel,
      description: parsed.description,
      theme: parsed.theme,
      colors: parsed.colors,
      animated: parsed.animated,
    });

    const data = validateChartData(parsed.data);

    return { metadata, data };
  } catch (error) {
    logger.error("Failed to process chart response:", error, response);
    throw new Error(
      `Invalid chart data format: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Charts document handler
export const chartsDocumentHandler = createDocumentHandler<"charts">({
  kind: "charts",

  // Called when a new chart is created
  onCreateDocument: async ({ title, dataStream, userId }) => {
    logger.info(`Creating chart artifact: ${title} for user: ${userId}`);

    let chartContent = "";

    try {
      // Get the default model for chart generation
      const model = customModelProvider.getModel({
        provider: "openai",
        model: "gpt-4o-mini",
      });

      // Stream chart generation
      const { fullStream } = streamText({
        model,
        system: CHART_CREATION_SYSTEM_PROMPT,
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: `Create a chart with the title "${title}". Generate meaningful, realistic data that fits this title and would be useful for visualization.`,
        experimental_telemetry: {
          isEnabled: true,
        },
      });

      // Stream the content back to the client
      for await (const delta of fullStream) {
        if (delta.type === "text-delta") {
          chartContent += delta.text;

          // Stream progressive content updates
          dataStream.write({
            type: "data-content-update",
            content: delta.text,
          });
        }
      }

      // Process and validate the generated chart
      const { metadata: chartMetadata, data: chartData } =
        processChartResponse(chartContent);

      // Stream the final chart data
      dataStream.write({
        type: "data-chart-data-update",
        data: chartData,
        metadata: chartMetadata,
      });

      // Return the structured chart content
      return JSON.stringify(
        {
          title,
          ...chartMetadata,
          data: chartData,
        },
        null,
        2,
      );
    } catch (error) {
      logger.error("Failed to create chart:", error);

      // Stream error information
      dataStream.write({
        type: "data-status-update",
        status: "error",
      });

      // Return a fallback chart
      const fallbackChart = {
        title,
        chartType: "bar" as const,
        description: "Sample chart data",
        xAxisLabel: "Categories",
        yAxisLabel: "Values",
        data: [
          {
            xAxisLabel: "Sample 1",
            series: [{ seriesName: "Value", value: 10 }],
          },
          {
            xAxisLabel: "Sample 2",
            series: [{ seriesName: "Value", value: 20 }],
          },
        ],
      };

      return JSON.stringify(fallbackChart, null, 2);
    }
  },

  // Called when updating an existing chart
  onUpdateDocument: async ({ document, description, dataStream, userId }) => {
    logger.info(`Updating chart artifact: ${document.id} for user: ${userId}`);

    let updatedContent = "";

    try {
      // Parse existing chart data
      const existingChart = JSON.parse(document.content || "{}");

      // Get the default model for chart updates
      const model = customModelProvider.getModel({
        provider: "openai",
        model: "gpt-4o-mini",
      });

      // Create system prompt with existing chart context
      const systemPrompt = CHART_UPDATE_SYSTEM_PROMPT.replace(
        "{{CURRENT_CHART_DATA}}",
        JSON.stringify(existingChart, null, 2),
      );

      // Stream chart update
      const { fullStream } = streamText({
        model,
        system: systemPrompt,
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt: description,
        experimental_telemetry: {
          isEnabled: true,
        },
      });

      // Stream the content back to the client
      for await (const delta of fullStream) {
        if (delta.type === "text-delta") {
          updatedContent += delta.text;

          // Stream progressive content updates
          dataStream.write({
            type: "data-content-update",
            content: delta.text,
          });
        }
      }

      // Process and validate the updated chart
      const { metadata: chartMetadata, data: chartData } =
        processChartResponse(updatedContent);

      // Stream the updated chart data
      dataStream.write({
        type: "data-chart-data-update",
        data: chartData,
        metadata: chartMetadata,
      });

      // Return the updated structured chart content
      return JSON.stringify(
        {
          title: document.title,
          ...chartMetadata,
          data: chartData,
        },
        null,
        2,
      );
    } catch (error) {
      logger.error("Failed to update chart:", error);

      // Stream error information
      dataStream.write({
        type: "data-status-update",
        status: "error",
      });

      // Return original content on error
      return document.content || "";
    }
  },
});

// Helper functions for chart generation
export function generateSampleChartData(
  chartType: ChartArtifactMetadata["chartType"],
  title: string,
): { metadata: ChartArtifactMetadata; data: ChartDataPoint[] } {
  const baseMetadata: ChartArtifactMetadata = {
    chartType,
    description: `Sample ${chartType} chart: ${title}`,
    theme: "light",
    animated: true,
  };

  switch (chartType) {
    case "bar":
      return {
        metadata: {
          ...baseMetadata,
          xAxisLabel: "Categories",
          yAxisLabel: "Values",
        },
        data: [
          {
            xAxisLabel: "Q1",
            series: [
              { seriesName: "Sales", value: 1200 },
              { seriesName: "Profit", value: 400 },
            ],
          },
          {
            xAxisLabel: "Q2",
            series: [
              { seriesName: "Sales", value: 1400 },
              { seriesName: "Profit", value: 500 },
            ],
          },
          {
            xAxisLabel: "Q3",
            series: [
              { seriesName: "Sales", value: 1100 },
              { seriesName: "Profit", value: 300 },
            ],
          },
          {
            xAxisLabel: "Q4",
            series: [
              { seriesName: "Sales", value: 1600 },
              { seriesName: "Profit", value: 600 },
            ],
          },
        ],
      };

    case "line":
      return {
        metadata: {
          ...baseMetadata,
          xAxisLabel: "Time",
          yAxisLabel: "Value",
        },
        data: [
          {
            xAxisLabel: "Jan",
            series: [
              { seriesName: "Trend A", value: 65 },
              { seriesName: "Trend B", value: 45 },
            ],
          },
          {
            xAxisLabel: "Feb",
            series: [
              { seriesName: "Trend A", value: 78 },
              { seriesName: "Trend B", value: 52 },
            ],
          },
          {
            xAxisLabel: "Mar",
            series: [
              { seriesName: "Trend A", value: 72 },
              { seriesName: "Trend B", value: 48 },
            ],
          },
          {
            xAxisLabel: "Apr",
            series: [
              { seriesName: "Trend A", value: 85 },
              { seriesName: "Trend B", value: 61 },
            ],
          },
        ],
      };

    case "pie":
      return {
        metadata: baseMetadata,
        data: [
          {
            xAxisLabel: "Desktop",
            series: [{ seriesName: "Usage", value: 45 }],
          },
          {
            xAxisLabel: "Mobile",
            series: [{ seriesName: "Usage", value: 35 }],
          },
          {
            xAxisLabel: "Tablet",
            series: [{ seriesName: "Usage", value: 20 }],
          },
        ],
      };

    default:
      throw new Error(`Unsupported chart type: ${chartType}`);
  }
}
