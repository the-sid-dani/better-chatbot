"use client";

import { useState, useEffect } from "react";
import { ArtifactContentProps, BaseArtifact } from "app-types/artifacts";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import { Alert, AlertDescription } from "ui/alert";
import { Separator } from "ui/separator";
import { Progress } from "ui/progress";
import { AlertTriangle, BarChart3, LineChart, PieChart, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "lib/utils";

// Import existing chart components
import { BarChart } from "../tool-invocation/bar-chart";
import { LineChart as LineChartComponent } from "../tool-invocation/line-chart";
import { PieChart as PieChartComponent } from "../tool-invocation/pie-chart";

interface DashboardChart {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  data: Array<{
    xAxisLabel: string;
    series: Array<{
      seriesName: string;
      value: number;
    }>;
  }>;
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  size?: "small" | "medium" | "large" | "full";
}

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

interface DashboardOrchestrationStage {
  stage: string;
  status: "pending" | "in_progress" | "complete" | "error";
  description: string;
  metrics?: number;
  chartsPlanned?: number;
  chartsCreated?: number;
  chartTypes?: string[];
  layout?: string;
  metricsLayout?: string;
  error?: string;
}

interface DashboardData {
  title: string;
  description?: string;
  charts: DashboardChart[];
  metrics: DashboardMetric[];
  analysis?: string;
  layout: {
    metricsLayout: string;
    chartsLayout: string;
  };
  metadata: {
    chartCount: number;
    metricCount: number;
    chartTypes: string[];
    totalDataPoints: number;
    created: string;
    orchestrationStages?: string[];
  };
}

// Progress toast component for streaming feedback
function ProgressToast({
  stage,
  progress,
  isVisible
}: {
  stage: DashboardOrchestrationStage;
  progress: number;
  isVisible: boolean;
}) {
  const getStageIcon = (stageType: string, status: string) => {
    if (status === "error") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (status === "complete") return <CheckCircle2 className="w-4 h-4 text-green-500" />;

    switch (stageType) {
      case "planning": return <Clock className="w-4 h-4 text-blue-500" />;
      case "chart_creation": return <BarChart3 className="w-4 h-4 text-purple-500" />;
      case "layout_building": return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="border shadow-lg bg-background/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                {getStageIcon(stage.stage, stage.status)}
                <div className="flex-1">
                  <div className="font-medium text-sm capitalize">
                    {stage.stage.replace("_", " ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stage.description}
                  </div>
                </div>
              </div>

              {stage.status === "in_progress" && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {progress}% complete
                  </div>
                </div>
              )}

              {stage.status === "error" && (
                <div className="text-xs text-destructive mt-2">
                  {stage.error}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Metric card component
function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </h4>
              {metric.badge && (
                <Badge variant={metric.badge.variant || "secondary"} className="text-xs">
                  {metric.badge.text}
                </Badge>
              )}
            </div>

            <div className="text-2xl font-bold">
              {metric.value}
            </div>

            {metric.subtitle && (
              <div className="text-sm text-muted-foreground">
                {metric.subtitle}
              </div>
            )}

            {metric.trend && (
              <div className={cn(
                "text-sm font-medium",
                metric.trend.isPositive ? "text-green-600" :
                metric.trend.isNeutral ? "text-muted-foreground" : "text-red-600"
              )}>
                {metric.trend.value}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Chart wrapper component with progressive loading
function ChartWrapper({
  chart,
  isVisible
}: {
  chart: DashboardChart;
  isVisible: boolean;
}) {
  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar": return <BarChart3 className="w-4 h-4" />;
      case "line": return <LineChart className="w-4 h-4" />;
      case "pie": return <PieChart className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getHeightForSize = (size: DashboardChart["size"]) => {
    switch (size) {
      case "small": return "h-[200px]";
      case "medium": return "h-[300px]";
      case "large": return "h-[400px]";
      case "full": return "h-[500px]";
      default: return "h-[300px]";
    }
  };

  const renderChart = () => {
    if (!isVisible) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="animate-pulse text-muted-foreground">
              Creating {chart.type} chart...
            </div>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      );
    }

    switch (chart.type) {
      case "bar":
        return (
          <BarChart
            title={chart.title}
            data={chart.data}
            description={chart.description}
            yAxisLabel={chart.yAxisLabel}
          />
        );
      case "line":
        return (
          <LineChartComponent
            title={chart.title}
            data={chart.data}
            description={chart.description}
            yAxisLabel={chart.yAxisLabel}
          />
        );
      case "pie":
        // Transform data for pie chart
        const pieData = chart.data.map(point => ({
          label: point.xAxisLabel,
          value: point.series[0]?.value || 0
        }));
        return (
          <PieChartComponent
            title={chart.title}
            data={pieData}
            description={chart.description}
          />
        );
      default:
        return (
          <BarChart
            title={chart.title}
            data={chart.data}
            description={chart.description}
            yAxisLabel={chart.yAxisLabel}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", getHeightForSize(chart.size))}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{chart.title}</CardTitle>
            <div className="flex items-center gap-2">
              {getChartIcon(chart.type)}
              <Badge variant="outline" className="text-xs">
                {chart.type.toUpperCase()}
              </Badge>
            </div>
          </div>
          {chart.description && (
            <p className="text-sm text-muted-foreground">{chart.description}</p>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 h-[calc(100%-theme(spacing.16))]">
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main dashboard artifact component
export function DashboardArtifactContent({
  artifact,
  content,
  status,
}: ArtifactContentProps<BaseArtifact>) {
  const [currentStage, setCurrentStage] = useState<"loading" | "metrics" | "charts" | "complete">("loading");
  const [visibleCharts, setVisibleCharts] = useState<Set<string>>(new Set());
  const [progressToastVisible, setProgressToastVisible] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Parse dashboard data safely
  let dashboardData: DashboardData | null = null;
  try {
    dashboardData = JSON.parse(content);
  } catch (_error) {
    // Will handle error in render
  }

  // Progressive loading simulation - moved to top level
  useEffect(() => {
    if (status === "complete" && dashboardData) {
      setProgressToastVisible(true);

      // Stage 1: Show metrics
      const timer1 = setTimeout(() => {
        setCurrentStage("metrics");
        setCurrentProgress(33);
      }, 300);

      // Stage 2: Progressive chart loading
      const timer2 = setTimeout(() => {
        setCurrentStage("charts");
        setCurrentProgress(66);

        // Load charts progressively
        dashboardData.charts.forEach((chart, index) => {
          setTimeout(() => {
            setVisibleCharts(prev => new Set([...prev, chart.id]));
            if (index === dashboardData.charts.length - 1) {
              setTimeout(() => {
                setCurrentStage("complete");
                setCurrentProgress(100);
                setTimeout(() => setProgressToastVisible(false), 2000);
              }, 500);
            }
          }, index * 800);
        });
      }, 1000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [status, content]); // Changed dependency to content instead of dashboardData.charts

  // Handle loading state
  if (status === "streaming") {
    return (
      <Card className="w-full h-[400px] bg-card">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-pulse text-muted-foreground">
              Orchestrating dashboard creation...
            </div>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <Progress value={25} className="w-48" />
            <div className="text-xs text-muted-foreground">
              Planning dashboard structure
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (status === "error") {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to render dashboard artifact. Please try regenerating.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle parsing errors
  if (!dashboardData) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to parse dashboard data. Please try regenerating.
        </AlertDescription>
      </Alert>
    );
  }

  // Create mock orchestration stage for progress toast
  const mockStage: DashboardOrchestrationStage = {
      stage: currentStage === "loading" ? "planning" :
             currentStage === "metrics" ? "planning" :
             currentStage === "charts" ? "chart_creation" : "complete",
      status: currentStage === "complete" ? "complete" : "in_progress",
      description: currentStage === "loading" ? "Planning dashboard structure..." :
                   currentStage === "metrics" ? "Setting up key metrics..." :
                   currentStage === "charts" ? "Creating charts progressively..." :
                   "Dashboard creation complete!"
    };

  // Grid layout for metrics
  const getMetricsGridClass = (layout: string) => {
    switch (layout) {
      case "1/1": return "grid-cols-1";
      case "2/2": return "grid-cols-1 sm:grid-cols-2";
      case "2/3": return "grid-cols-2 lg:grid-cols-3";
      case "3/3": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "4/4": return "grid-cols-2 lg:grid-cols-4";
      default: return "grid-cols-1 sm:grid-cols-2";
    }
  };

  // Group charts by size
  const smallCharts = dashboardData.charts.filter(c => c.size === "small");
  const mediumCharts = dashboardData.charts.filter(c => c.size === "medium" || !c.size);
  const largeCharts = dashboardData.charts.filter(c => c.size === "large" || c.size === "full");

  return (
      <div className="w-full space-y-6 p-4">
        {/* Progress Toast */}
        <ProgressToast
          stage={mockStage}
          progress={currentProgress}
          isVisible={progressToastVisible}
        />

        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{dashboardData.title}</h1>
            <Badge variant="secondary" className="text-sm">
              {dashboardData.charts.length} chart{dashboardData.charts.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {dashboardData.description && (
            <p className="text-muted-foreground">{dashboardData.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{dashboardData.metadata.totalDataPoints} data points</span>
            <span>•</span>
            <span>{dashboardData.metadata.chartTypes.join(", ")} charts</span>
            <span>•</span>
            <span>Created {new Date(dashboardData.metadata.created).toLocaleTimeString()}</span>
          </div>
        </motion.div>

        <Separator />

        {/* Key Metrics Grid */}
        {dashboardData.metrics.length > 0 && currentStage !== "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">Key Metrics</h2>
            <div className={cn("grid gap-4", getMetricsGridClass(dashboardData.layout.metricsLayout))}>
              {dashboardData.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        {dashboardData.charts.length > 0 && currentStage !== "loading" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Visualizations</h2>

            {/* Large/Full charts - full width */}
            {largeCharts.map(chart => (
              <ChartWrapper
                key={chart.id}
                chart={chart}
                isVisible={visibleCharts.has(chart.id)}
              />
            ))}

            {/* Medium charts - 2 column grid */}
            {mediumCharts.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {mediumCharts.map(chart => (
                  <ChartWrapper
                    key={chart.id}
                    chart={chart}
                    isVisible={visibleCharts.has(chart.id)}
                  />
                ))}
              </div>
            )}

            {/* Small charts - 3 column grid */}
            {smallCharts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {smallCharts.map(chart => (
                  <ChartWrapper
                    key={chart.id}
                    chart={chart}
                    isVisible={visibleCharts.has(chart.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analysis Section */}
        {dashboardData.analysis && currentStage === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <Separator />
            <h2 className="text-lg font-semibold">Analysis</h2>
            <Card>
              <CardContent className="p-4">
                <p className="leading-relaxed">{dashboardData.analysis}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Summary Section */}
        {currentStage === "complete" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <Separator />
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Dashboard Complete</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Successfully created {dashboardData.charts.length} chart{dashboardData.charts.length !== 1 ? 's' : ''}
                    {dashboardData.metrics.length > 0 && ` and ${dashboardData.metrics.length} key metric${dashboardData.metrics.length !== 1 ? 's' : ''}`}
                    with {dashboardData.metadata.totalDataPoints} total data points.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Chart types: {dashboardData.metadata.chartTypes.join(", ")} •
                    Layout: {dashboardData.layout.chartsLayout} •
                    Metrics: {dashboardData.layout.metricsLayout}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    );
}