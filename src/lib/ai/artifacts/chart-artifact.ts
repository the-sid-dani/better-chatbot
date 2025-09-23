import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

// Base chart data schema
const chartDataSchema = z.object({
  xAxisLabel: z.string(),
  series: z.array(
    z.object({
      seriesName: z.string(),
      value: z.number(),
    })
  ),
});

// Chart artifact schema for progressive building
export const chartArtifact = artifact(
  "chart",
  z.object({
    // Processing stage
    stage: z.enum([
      "loading",
      "processing",
      "complete",
      "error"
    ]),

    // Basic chart info
    title: z.string(),
    chartType: z.enum(["bar", "line", "pie"]),
    description: z.string().optional(),

    // Chart data (available at processing stage)
    chartData: z.object({
      data: z.array(chartDataSchema),
      xAxisLabel: z.string().optional(),
      yAxisLabel: z.string().optional(),
      theme: z.string().default("light"),
      animated: z.boolean().default(true),
    }).optional(),

    // Progress information
    progress: z.number().min(0).max(100).default(0),
    currentStep: z.string().optional(),

    // Error handling
    error: z.string().optional(),

    // Toast progress (for ProgressToast component)
    toast: z.object({
      visible: z.boolean().default(false),
      currentStep: z.number().default(0),
      totalSteps: z.number().default(3),
      currentLabel: z.string().optional(),
      stepDescription: z.string().optional(),
      completed: z.boolean().default(false),
      completedMessage: z.string().optional(),
    }).optional(),
  })
);

// Dashboard artifact schema for multiple charts
export const dashboardArtifact = artifact(
  "dashboard",
  z.object({
    // Processing stage
    stage: z.enum([
      "planning",
      "creating_charts",
      "building_layout",
      "complete",
      "error"
    ]),

    // Dashboard info
    title: z.string(),
    description: z.string().optional(),
    canvasType: z.enum([
      "sales",
      "marketing",
      "finance",
      "analytics",
      "operations",
      "custom"
    ]).default("custom"),

    // Charts (available at creating_charts stage)
    charts: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        chartType: z.enum(["bar", "line", "pie"]),
        data: z.array(chartDataSchema),
        xAxisLabel: z.string().optional(),
        yAxisLabel: z.string().optional(),
        description: z.string().optional(),
        size: z.enum(["small", "medium", "large", "full"]).default("medium"),
        stage: z.enum(["loading", "processing", "complete"]).default("loading"),
      })
    ).optional(),

    // Metrics (available at building_layout stage)
    metrics: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        value: z.union([z.string(), z.number()]),
        subtitle: z.string().optional(),
        trend: z.object({
          value: z.string(),
          isPositive: z.boolean().optional(),
          isNeutral: z.boolean().optional(),
        }).optional(),
      })
    ).optional(),

    // Analysis (available at complete stage)
    analysis: z.string().optional(),

    // Layout configuration
    layout: z.object({
      chartLayout: z.enum(["1/1", "2/2", "2/3", "3/3", "4/4"]).default("2/2"),
      metricsLayout: z.enum(["1/1", "2/2", "2/3", "3/3"]).default("2/2"),
    }).default({ chartLayout: "2/2", metricsLayout: "2/2" }),

    // Progress tracking
    progress: z.number().min(0).max(100).default(0),
    currentChart: z.string().optional(),
    totalCharts: z.number().default(0),

    // Error handling
    error: z.string().optional(),

    // Toast progress
    toast: z.object({
      visible: z.boolean().default(false),
      currentStep: z.number().default(0),
      totalSteps: z.number().default(4),
      currentLabel: z.string().optional(),
      stepDescription: z.string().optional(),
      completed: z.boolean().default(false),
      completedMessage: z.string().optional(),
    }).optional(),
  })
);

// Custom canvas artifacts for specific use cases
export const salesDashboardArtifact = artifact(
  "sales-dashboard",
  z.object({
    stage: z.enum(["loading", "revenue_ready", "metrics_ready", "forecast_ready", "complete"]),
    title: z.string().default("Sales Dashboard"),

    // Revenue chart data
    revenue: z.object({
      monthly: z.array(z.object({
        month: z.string(),
        revenue: z.number(),
        target: z.number().optional(),
      })),
      growth: z.number().optional(),
    }).optional(),

    // Key sales metrics
    metrics: z.object({
      totalRevenue: z.number(),
      monthlyGrowth: z.number(),
      averageDealSize: z.number(),
      conversionRate: z.number(),
    }).optional(),

    // Sales forecast
    forecast: z.object({
      next3Months: z.array(z.object({
        month: z.string(),
        projected: z.number(),
        confidence: z.number(),
      })),
    }).optional(),

    toast: z.object({
      visible: z.boolean().default(false),
      currentStep: z.number().default(0),
      totalSteps: z.number().default(4),
      currentLabel: z.string().optional(),
      stepDescription: z.string().optional(),
      completed: z.boolean().default(false),
    }).optional(),
  })
);

// Export all artifact types
export const artifacts = {
  chart: chartArtifact,
  dashboard: dashboardArtifact,
  salesDashboard: salesDashboardArtifact,
};