"use client";

import { Artifact } from "@/components/artifacts/artifact";
import {
  ChartArtifactMetadata as ChartMetadata,
  ChartDataPoint,
  isChartStreamPart,
} from "app-types/artifacts";
import { BarChart } from "@/components/tool-invocation/bar-chart";
import { LineChart } from "@/components/tool-invocation/line-chart";
import { PieChart } from "@/components/tool-invocation/pie-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Separator } from "ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Edit,
  Download,
  RefreshCw,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExtendedChartMetadata extends ChartMetadata {
  info: string;
}

// Chart component selector
function ChartComponent({
  chartType,
  title,
  data,
  description,
  yAxisLabel,
}: {
  chartType: ChartMetadata["chartType"];
  title: string;
  data: ChartDataPoint[];
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}) {
  switch (chartType) {
    case "bar":
      return (
        <BarChart
          title={title}
          data={data}
          description={description}
          yAxisLabel={yAxisLabel}
        />
      );
    case "line":
      return (
        <LineChart
          title={title}
          data={data}
          description={description}
          yAxisLabel={yAxisLabel}
        />
      );
    case "pie":
      // Transform data for pie chart format
      const pieData = data.map((point) => ({
        label: point.xAxisLabel,
        value: point.series[0]?.value || 0,
      }));
      return (
        <PieChart title={title} data={pieData} description={description} />
      );
    default:
      return (
        <BarChart
          title={title}
          data={data}
          description={description}
          yAxisLabel={yAxisLabel}
        />
      );
  }
}

// Chart editing panel
function ChartEditPanel({
  data,
  metadata,
  onDataChange,
  onMetadataChange,
}: {
  data: ChartDataPoint[];
  metadata: ChartMetadata;
  onDataChange: (data: ChartDataPoint[]) => void;
  onMetadataChange: (metadata: Partial<ChartMetadata>) => void;
}) {
  const [editingData, setEditingData] = useState(JSON.stringify(data, null, 2));

  const handleDataSave = () => {
    try {
      const newData = JSON.parse(editingData);
      onDataChange(newData);
      toast.success("Chart data updated");
    } catch (_error) {
      toast.error("Invalid JSON format");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Edit Chart Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart type selector */}
        <div>
          <label className="text-sm font-medium">Chart Type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center space-x-2">
                  {metadata.chartType === "bar" && (
                    <BarChart3 className="w-4 h-4" />
                  )}
                  {metadata.chartType === "line" && (
                    <LineChartIcon className="w-4 h-4" />
                  )}
                  {metadata.chartType === "pie" && (
                    <PieChartIcon className="w-4 h-4" />
                  )}
                  <span className="capitalize">{metadata.chartType}</span>
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onMetadataChange({ chartType: "bar" })}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMetadataChange({ chartType: "line" })}
              >
                <LineChartIcon className="w-4 h-4 mr-2" />
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMetadataChange({ chartType: "pie" })}
              >
                <PieChartIcon className="w-4 h-4 mr-2" />
                Pie Chart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Axis labels */}
        {metadata.chartType !== "pie" && (
          <>
            <div>
              <label className="text-sm font-medium">X-Axis Label</label>
              <input
                type="text"
                value={metadata.xAxisLabel || ""}
                onChange={(e) =>
                  onMetadataChange({ xAxisLabel: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                placeholder="Enter X-axis label"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Y-Axis Label</label>
              <input
                type="text"
                value={metadata.yAxisLabel || ""}
                onChange={(e) =>
                  onMetadataChange({ yAxisLabel: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                placeholder="Enter Y-axis label"
              />
            </div>
          </>
        )}

        {/* Description */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={metadata.description || ""}
            onChange={(e) => onMetadataChange({ description: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            placeholder="Enter chart description"
            rows={2}
          />
        </div>

        <Separator />

        {/* Data editor */}
        <div>
          <label className="text-sm font-medium">Chart Data (JSON)</label>
          <textarea
            value={editingData}
            onChange={(e) => setEditingData(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono"
            rows={10}
            placeholder="Enter chart data as JSON"
          />
          <Button onClick={handleDataSave} className="w-full mt-2" size="sm">
            Update Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Charts artifact definition
export const chartsArtifact = new Artifact<"charts", ExtendedChartMetadata>({
  kind: "charts",
  description:
    "Interactive charts and data visualizations with real-time streaming updates",

  // Initialize the chart artifact
  initialize: async ({ documentId, setMetadata }) => {
    setMetadata({
      info: `Chart artifact ${documentId} initialized.`,
    });
  },

  // Handle streamed parts from the server
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === "metadata-update" && streamPart.metadata) {
      setMetadata((metadata: ExtendedChartMetadata) => ({
        ...metadata,
        ...streamPart.metadata,
      }));
    }

    if (streamPart.type === "content-update" && streamPart.content) {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + streamPart.content,
        status: "streaming",
      }));
    }

    if (isChartStreamPart(streamPart) && streamPart.data) {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        data: streamPart.data!,
        status: "complete",
      }));

      if (streamPart.metadata) {
        setMetadata((metadata: ExtendedChartMetadata) => ({
          ...metadata,
          ...streamPart.metadata,
        }));
      }
    }

    if (streamPart.type === "status-update") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: streamPart.status || draftArtifact.status,
      }));
    }
  },

  // Render the chart content
  content: ({
    mode,
    content,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
    artifact,
  }) => {
    const [activeTab, setActiveTab] = useState("chart");

    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading chart...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Parse chart data from content
    let chartData: ChartDataPoint[] = [];
    let chartMetadata: ChartMetadata = {
      chartType: "bar",
      description: "Chart visualization",
      animated: true,
      theme: "light",
    };

    try {
      if (content) {
        const parsed = JSON.parse(content);
        chartData = parsed.data || [];
        chartMetadata = {
          chartType: parsed.chartType || "bar",
          xAxisLabel: parsed.xAxisLabel,
          yAxisLabel: parsed.yAxisLabel,
          description: parsed.description,
          theme: parsed.theme || "light",
          animated: parsed.animated !== false,
          ...metadata,
        };
      }
    } catch (error) {
      console.error("Failed to parse chart content:", error);
    }

    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      return (
        <div className="h-full p-4">
          <h3 className="text-lg font-semibold mb-4">Chart Changes</h3>
          <div className="grid grid-cols-2 gap-4 h-full">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Previous Version</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">{oldContent}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Version</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">{newContent}</pre>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const handleDataChange = (newData: ChartDataPoint[]) => {
      const updatedContent = JSON.stringify(
        {
          ...JSON.parse(content || "{}"),
          data: newData,
        },
        null,
        2,
      );
      onSaveContent(updatedContent);
    };

    const handleMetadataChange = (updates: Partial<ChartMetadata>) => {
      const updatedContent = JSON.stringify(
        {
          ...JSON.parse(content || "{}"),
          ...updates,
        },
        null,
        2,
      );
      onSaveContent(updatedContent);
    };

    return (
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4 py-2">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chart" className="flex-1 overflow-hidden m-0">
            <div className="h-full p-4">
              {chartData.length > 0 ? (
                <ChartComponent
                  chartType={chartMetadata.chartType}
                  title={artifact?.title || "Chart"}
                  data={chartData}
                  description={chartMetadata.description}
                  xAxisLabel={chartMetadata.xAxisLabel}
                  yAxisLabel={chartMetadata.yAxisLabel}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent>
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        No Chart Data
                      </h3>
                      <p className="text-muted-foreground">
                        Ask AI to generate chart data or edit manually
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="edit" className="flex-1 overflow-auto m-0">
            <div className="p-4">
              <ChartEditPanel
                data={chartData}
                metadata={chartMetadata}
                onDataChange={handleDataChange}
                onMetadataChange={handleMetadataChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="data" className="flex-1 overflow-auto m-0">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Raw Chart Data</CardTitle>
                  <CardDescription>
                    View and copy the underlying chart data structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(chartData, null, 2)}
                  </pre>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(chartData, null, 2),
                      );
                      toast.success("Chart data copied to clipboard");
                    }}
                    className="w-full mt-4"
                    variant="outline"
                    size="sm"
                  >
                    Copy Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  },

  // Actions for the artifact
  actions: [
    {
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Regenerate chart with AI",
      onClick: ({ appendMessage, artifact }) => {
        appendMessage({
          role: "user",
          content: `Regenerate the chart "${artifact.title}" with new data and insights.`,
        });
      },
    },
    {
      icon: <Edit className="w-4 h-4" />,
      description: "Modify chart with AI",
      onClick: ({ appendMessage, artifact }) => {
        appendMessage({
          role: "user",
          content: `Modify the chart "${artifact.title}". What changes would you like me to make?`,
        });
      },
    },
  ],

  // Toolbar actions
  toolbar: [
    {
      icon: <Download className="w-4 h-4" />,
      description: "Export chart data",
      onClick: ({ artifact }) => {
        try {
          const parsed = JSON.parse(artifact.content);
          const dataStr = JSON.stringify(parsed.data, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${artifact.title.replace(/\s+/g, "_")}_data.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Chart data exported");
        } catch (_error) {
          toast.error("Failed to export chart data");
        }
      },
    },
    {
      icon: <Settings className="w-4 h-4" />,
      description: "Chart settings",
      onClick: ({ appendMessage, artifact }) => {
        appendMessage({
          role: "user",
          content: `Adjust the settings and styling of the chart "${artifact.title}".`,
        });
      },
    },
  ],
});
