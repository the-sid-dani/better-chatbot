"use client";

import { ChartArtifactMetadata } from "app-types/artifacts";
import { Artifact } from "./artifact";
import { ChartArtifactContent } from "./chart-artifact";
import { BarChart3, Download, RefreshCw, Settings } from "lucide-react";

/**
 * Chart Artifact Definition
 *
 * This defines how chart artifacts are rendered and handled in the Canvas workspace.
 * It uses the existing beautiful chart components but optimized for Canvas display.
 */
export const chartArtifactDefinition = new Artifact<
  "charts",
  ChartArtifactMetadata
>({
  kind: "charts",
  description: "Interactive data visualization charts",

  // Render the chart content using our existing chart components
  content: (props) => <ChartArtifactContent {...props} />,

  // Chart-specific toolbar actions
  toolbar: [
    {
      icon: <Download className="w-4 h-4" />,
      description: "Export chart as PNG",
      onClick: (context) => {
        // TODO: Implement chart export functionality
        context.appendMessage({
          role: "user",
          content: `Export the chart "${context.artifact.title}" as PNG`,
        });
      },
    },
    {
      icon: <Settings className="w-4 h-4" />,
      description: "Customize chart",
      onClick: (context) => {
        context.appendMessage({
          role: "user",
          content: `Customize the chart "${context.artifact.title}" - change colors, styling, or format`,
        });
      },
    },
    {
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Update chart data",
      onClick: (context) => {
        context.appendMessage({
          role: "user",
          content: `Update the data for chart "${context.artifact.title}"`,
        });
      },
    },
  ],

  // Additional chart actions
  actions: [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      description: "Convert to different chart type",
      onClick: (context) => {
        const chartContent = JSON.parse(context.artifact.content);
        const currentType = chartContent.type;
        const otherTypes = ["bar-chart", "line-chart", "pie-chart"].filter(
          (t) => t !== currentType,
        );

        context.appendMessage({
          role: "user",
          content: `Convert this ${currentType} to a ${otherTypes[0]} with the same data`,
        });
      },
    },
  ],

  // Initialize chart metadata if needed
  initialize: async (context) => {
    // Set default metadata if not present
    context.setMetadata({
      theme: "light",
      animated: true,
      lastUpdated: new Date().toISOString(),
    });
  },

  // Handle streaming updates for chart data
  onStreamPart: (context) => {
    const { streamPart } = context;

    switch (streamPart.type) {
      case "chart-data-update":
        if (streamPart.data) {
          context.setArtifact((prev) => {
            const chartContent = JSON.parse(prev.content);
            chartContent.data = streamPart.data;
            return {
              ...prev,
              content: JSON.stringify(chartContent, null, 2),
              updatedAt: new Date(),
            };
          });
        }
        break;

      case "metadata-update":
        if (streamPart.metadata) {
          context.setMetadata((prev) => ({
            ...prev,
            ...streamPart.metadata,
          }));
        }
        break;

      case "status-update":
        if (streamPart.status) {
          context.setArtifact((prev) => ({
            ...prev,
            status: streamPart.status!,
            updatedAt: new Date(),
          }));
        }
        break;
    }
  },
});
