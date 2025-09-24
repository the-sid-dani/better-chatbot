import { Artifact } from "./artifact";
import { DashboardArtifactContent } from "./dashboard-artifact";
import {
  BarChart3,
  Download,
  RefreshCw,
  Copy,
  Share2,
  FileText,
  TrendingUp,
} from "lucide-react";
import { DashboardArtifactMetadata } from "../../types/artifacts";

// Dashboard artifact definition
export const dashboardArtifactDefinition = new Artifact<
  "dashboard",
  DashboardArtifactMetadata
>({
  kind: "dashboard",
  description:
    "Create comprehensive dashboards with multiple charts, metrics, and analysis",
  content: DashboardArtifactContent,

  // Enhanced toolbar actions for dashboard management
  toolbar: [
    {
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Refresh dashboard data",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content:
            "Please refresh the dashboard data with the latest information.",
        });
      },
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      description: "Add more charts",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content:
            "Add more charts to this dashboard with additional data analysis.",
        });
      },
    },
    {
      icon: <FileText className="w-4 h-4" />,
      description: "Generate report",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content:
            "Generate a detailed report based on this dashboard's data and insights.",
        });
      },
    },
    {
      icon: <Download className="w-4 h-4" />,
      description: "Export dashboard",
      onClick: ({ artifact }) => {
        try {
          const dashboardData = JSON.parse(artifact.content);
          const exportData = {
            title: dashboardData.title,
            description: dashboardData.description,
            charts: dashboardData.charts,
            metrics: dashboardData.metrics,
            analysis: dashboardData.analysis,
            metadata: dashboardData.metadata,
            exportedAt: new Date().toISOString(),
          };

          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
          });

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${dashboardData.title.toLowerCase().replace(/\s+/g, "-")}-dashboard.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Export failed:", error);
        }
      },
    },
    {
      icon: <Copy className="w-4 h-4" />,
      description: "Copy dashboard link",
      onClick: ({ artifact }) => {
        try {
          // Create shareable link with dashboard ID
          const shareUrl = `${window.location.origin}/dashboard/${artifact.id}`;
          navigator.clipboard.writeText(shareUrl);

          // Show feedback (you could integrate with a toast system here)
          console.log("Dashboard link copied to clipboard");
        } catch (error) {
          console.error("Copy failed:", error);
        }
      },
    },
    {
      icon: <Share2 className="w-4 h-4" />,
      description: "Share dashboard",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content:
            "How can I share this dashboard with my team and set up collaborative access?",
        });
      },
    },
  ],

  // Context menu actions for dashboard-specific operations
  actions: [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      description: "Analyze trends in this dashboard",
      onClick: ({ artifact, appendMessage }) => {
        try {
          const dashboardData = JSON.parse(artifact.content);
          appendMessage({
            role: "user",
            content: `Analyze the trends and patterns in the "${dashboardData.title}" dashboard. Identify key insights, correlations, and recommendations based on the data shown in the ${dashboardData.charts.length} charts and ${dashboardData.metrics.length} metrics.`,
          });
        } catch (_error) {
          appendMessage({
            role: "user",
            content: "Analyze the trends and patterns in this dashboard data.",
          });
        }
      },
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      description: "Create similar dashboard",
      onClick: ({ artifact, appendMessage }) => {
        try {
          const dashboardData = JSON.parse(artifact.content);
          const chartTypes = dashboardData.metadata.chartTypes.join(", ");
          appendMessage({
            role: "user",
            content: `Create a similar dashboard with ${chartTypes} charts. Use a comparable structure but with different sample data for demonstration.`,
          });
        } catch (_error) {
          appendMessage({
            role: "user",
            content:
              "Create a similar dashboard with comparable structure and different sample data.",
          });
        }
      },
    },
    {
      icon: <FileText className="w-4 h-4" />,
      description: "Convert to presentation",
      onClick: ({ artifact, appendMessage }) => {
        try {
          const dashboardData = JSON.parse(artifact.content);
          appendMessage({
            role: "user",
            content: `Convert the "${dashboardData.title}" dashboard into a presentation format. Create slides that showcase the key insights, metrics, and charts in a narrative structure suitable for stakeholders.`,
          });
        } catch (_error) {
          appendMessage({
            role: "user",
            content:
              "Convert this dashboard into a presentation format with key insights and narrative structure.",
          });
        }
      },
    },
  ],
});

export default dashboardArtifactDefinition;
