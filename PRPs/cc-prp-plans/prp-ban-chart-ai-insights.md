name: "BAN Charts & AI Insights Implementation PRP"
description: |
  Comprehensive implementation plan for adding BAN (Big Ass Numbers) KPI cards and AI-generated insights
  to the Canvas system, leveraging existing shadcn/ui components and Vercel AI SDK infrastructure.

---

## Goal

Implement two new Canvas artifact types that enhance data visualization dashboards:
1. **BAN Charts**: Large, prominent KPI metric cards displaying single values with trends
2. **AI Insights**: Intelligent analysis cards that generate contextual recommendations from Canvas data

**End State**: Users can create BAN charts via AI ("Show total revenue as a BAN") and generate AI insights ("Analyze these charts and provide recommendations") that appear in the Canvas workspace alongside existing charts.

## Why

- **Business Value**: KPI dashboards need prominent single-metric displays (BANs are industry standard)
- **User Impact**: AI-generated insights transform raw charts into actionable recommendations
- **Integration**: Complements existing 17 chart tools with metric-focused visualizations
- **Problems Solved**:
  - Eliminates need for complex charts when showing single metrics
  - Provides AI-powered analysis without manual interpretation
  - Matches modern dashboard design patterns (Tableau, Power BI, etc.)

## What

### BAN Chart Behavior
- Display single numeric KPI (revenue, users, conversion rate, etc.)
- Large, readable typography (text-6xl font size)
- Optional trend indicators (up/down arrows with percentage)
- Optional comparison vs previous period
- Optional sparkline for at-a-glance trends
- Responsive card layout using shadcn/ui

### AI Insights Behavior
- Analyze all charts/artifacts on current Canvas
- Generate 3-5 actionable insights using AI
- Detect trends, anomalies, correlations
- Provide recommendations with reasoning
- Display in clean Alert or Card component
- Update when Canvas data changes

### Success Criteria
- [x] BAN charts render correctly in Canvas with proper sizing
- [x] AI insights generate relevant recommendations from Canvas data
- [x] Both tools follow existing chart tool patterns (streaming, logging, validation)
- [x] No new dependencies required (use shadcn/ui only)
- [x] Canvas integration seamless (chartType routing works)
- [x] Type-safe with full TypeScript validation
- [x] Tests pass (pnpm check-types, lint, test)

---

## All Needed Context

### Documentation & References

```yaml
# shadcn/ui Components (ALREADY INSTALLED)
- component: src/components/ui/card.tsx
  why: BAN chart display - perfect for KPI cards
  pattern: CardHeader/CardContent/CardTitle structure

- component: src/components/ui/alert.tsx
  why: AI insights display - ideal for callout boxes
  pattern: AlertTitle/AlertDescription with icon support

- component: src/components/ui/badge.tsx
  why: Trend indicators and metadata badges
  pattern: Variant support (default, secondary, destructive)

# Vercel AI SDK Patterns (IN USE)
- url: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
  why: AI insights generation with streamText
  sections: Tool creation, streaming patterns, error handling
  critical: experimental_telemetry for Langfuse tracing

- url: https://ai-sdk.dev/docs/ai-sdk-core/stream-text
  why: Streaming AI responses for insights
  pattern: async function* with yield statements

# Industry Best Practices
- url: https://www.flerlagetwins.com/2021/04/BANDesign.html
  why: 22 BAN design patterns and best practices
  critical: Font hierarchy, color intent, comparison display

- url: https://vizmasters.substack.com/p/big-ass-numbers-bans-why-they-belong
  why: BAN usage guidelines and dos/don'ts
  critical: Keep 5-10 KPIs max, use sans-serif fonts, pair with trends

- url: https://www.gooddata.com/blog/how-to-use-ai-for-data-visualizations-and-dashboards/
  why: AI dashboard insights patterns
  critical: Pattern recognition, automated recommendations, predictive analytics

# Existing Chart Tool Patterns (REFERENCE)
- file: src/lib/ai/tools/artifacts/bar-chart-tool.ts
  why: Complete example of chart tool with validation, streaming, error handling
  pattern: Follow this EXACT structure
  critical: Lines 15-232 show full pattern

- file: src/lib/ai/tools/artifacts/gauge-chart-tool.ts
  why: Simplest chart tool (like BAN - displays single value)
  pattern: Single value display, no complex data processing
  critical: Lines 15-223 - MIRROR THIS for BAN

- file: src/components/tool-invocation/gauge-chart.tsx
  why: Component pattern for simple value display
  pattern: Card wrapper, ChartContainer, data props
  critical: Lines 66-272 show full component structure

- file: src/components/canvas-panel.tsx
  why: Chart routing and Canvas integration
  pattern: chartType switch case (lines 274-320)
  critical: Add BAN and AI Insights cases here

- file: src/lib/ai/tools/index.ts
  why: DefaultToolName enum - MUST add new entries
  pattern: Lines 10-34 show enum structure
  critical: Add CreateBANChart and CreateAIInsights

- file: src/lib/ai/tools/tool-kit.ts
  why: Tool registry - MUST register new tools
  pattern: Lines 48-68 show Artifacts registration
  critical: Add to [AppDefaultToolkit.Artifacts] object

- file: src/lib/validation/chart-data-validator.ts
  why: Data validation patterns with XSS prevention
  pattern: CHART_VALIDATORS object (line 427-446)
  critical: Add ban and insights validators

# Research Document (CREATED)
- docfile: docs/ban-chart-insights-research.md
  why: Comprehensive research findings on BAN charts, AI insights, component availability
  critical: Lines 1-310 contain all research, design patterns, and recommendations
```

### Current Codebase Structure

```bash
src/
├── lib/
│   ├── ai/
│   │   └── tools/
│   │       ├── index.ts                    # DefaultToolName enum HERE
│   │       ├── tool-kit.ts                 # APP_DEFAULT_TOOL_KIT registry HERE
│   │       └── artifacts/
│   │           ├── bar-chart-tool.ts       # REFERENCE PATTERN
│   │           ├── gauge-chart-tool.ts     # SIMPLE VALUE PATTERN
│   │           ├── index.ts                # Exports HERE
│   │           ├── CLAUDE.md               # Tool creation docs
│   │           └── [15 other chart tools]
│   ├── validation/
│   │   └── chart-data-validator.ts         # CHART_VALIDATORS HERE
│   └── utils.ts                            # generateUUID, etc
├── components/
│   ├── ui/
│   │   ├── card.tsx                        # ALREADY INSTALLED
│   │   ├── alert.tsx                       # ALREADY INSTALLED
│   │   └── badge.tsx                       # ALREADY INSTALLED
│   ├── tool-invocation/
│   │   ├── bar-chart.tsx                   # REFERENCE COMPONENT
│   │   ├── gauge-chart.tsx                 # SIMPLE VALUE COMPONENT
│   │   ├── shared-tooltip-intelligence.ts  # Helper utilities
│   │   └── [14 other chart components]
│   └── canvas-panel.tsx                    # Canvas integration HERE
└── [other directories]
```

### Desired Codebase Structure (NEW FILES)

```bash
src/
├── lib/
│   ├── ai/
│   │   └── tools/
│   │       └── artifacts/
│   │           ├── ban-chart-tool.ts       # NEW: BAN chart tool
│   │           └── ai-insights-tool.ts     # NEW: AI insights tool
│   └── validation/
│       └── chart-data-validator.ts         # MODIFY: Add validators
└── components/
    └── tool-invocation/
        ├── ban-chart.tsx                    # NEW: BAN component
        └── ai-insights.tsx                  # NEW: AI insights component
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Vercel AI SDK v5.0.26 Tool Creation Pattern
// Must use exact pattern or tool won't register correctly
import { tool as createTool } from "ai";
export const myTool = createTool({
  name: DefaultToolName.MyTool, // MUST match enum EXACTLY
  // ... rest of config
});

// CRITICAL: Canvas Integration requires shouldCreateArtifact flag
yield {
  status: 'success',
  chartData: data,
  shouldCreateArtifact: true, // WITHOUT THIS, WON'T APPEAR IN CANVAS
  progress: 100
};

// CRITICAL: shadcn/ui uses data-slot attributes for styling
<Card data-slot="card"> // Component adds this automatically
  <CardHeader data-slot="card-header"> // Already in component
    // Your content
  </CardHeader>
</Card>

// CRITICAL: DefaultToolName enum values must use snake_case
CreateBANChart = "create_ban_chart",        // ✅ CORRECT
CreateBanChart = "createBanChart",           // ❌ WRONG (won't match pattern)

// CRITICAL: lucide-react icons for consistency
import { TrendingUp, TrendingDown, Sparkles, Lightbulb } from "lucide-react";
// NOT from @radix-ui/react-icons or other libraries

// CRITICAL: Langfuse tracing via experimental_telemetry
// ALL AI operations MUST enable this for observability
const result = await streamText({
  model: someModel,
  // ... other config
  experimental_telemetry: { // REQUIRED for production
    isEnabled: true,
    functionId: 'ai-insights-generation'
  }
});

// GOTCHA: Chart validators MUST return securityAudit object
const validationResult = {
  success: boolean,
  data?: SanitizedData,
  error?: string,
  securityAudit: {
    safe: boolean,
    issues: string[]
  }
};

// GOTCHA: Canvas panel routes by chartType string
// Must add cases to canvas-panel.tsx switch statement (line 274)
switch (chartType) {
  case "bar":
    return <BarChart {...props} />;
  case "ban": // ADD THIS
    return <BANChart {...props} />;
  case "insights": // ADD THIS
    return <AIInsights {...props} />;
}
```

---

## Implementation Blueprint

### Data Models and Types

```typescript
// src/lib/ai/tools/artifacts/ban-chart-tool.ts
// Input schema for BAN chart creation
interface BANChartInput {
  title: string;                    // "Total Revenue"
  value: number;                    // 1234567.89
  unit?: string;                    // "$", "%", "users"
  prefix?: string;                  // "$" for currency
  suffix?: string;                  // "%" for percentage
  description?: string;             // "Last 30 days"
  comparison?: {
    previousValue: number;          // 1000000
    label: string;                  // "vs last month"
  };
  trend?: "up" | "down" | "neutral";
  trendPercentage?: number;         // 23.4 (calculated if comparison provided)
  showSparkline?: boolean;          // Show tiny trend chart
  sparklineData?: number[];         // [100, 120, 115, 140, 123]
}

// src/lib/ai/tools/artifacts/ai-insights-tool.ts
// Input schema for AI insights generation
interface AIInsightsInput {
  canvasId?: string;                // Optional: specific canvas to analyze
  charts?: Array<{                  // Charts to analyze (from Canvas state)
    id: string;
    type: string;
    title: string;
    data: any;
  }>;
  focusAreas?: string[];            // ["trends", "anomalies", "correlations"]
  maxInsights?: number;             // Default: 5
}

// Output schema for AI insights
interface AIInsight {
  id: string;                       // Unique insight ID
  type: "trend" | "anomaly" | "correlation" | "recommendation" | "warning";
  title: string;                    // "Revenue Spike Detected"
  description: string;              // Detailed insight
  severity?: "low" | "medium" | "high";
  action?: string;                  // Recommended action
  metadata?: {
    chartIds?: string[];            // Related charts
    confidence?: number;            // 0-1 confidence score
  };
}
```

### Implementation Tasks (In Order)

```yaml
# ==========================================
# PHASE 1: BAN CHART IMPLEMENTATION
# ==========================================

Task 1: Add BAN Chart Enum Entry
FILE: src/lib/ai/tools/index.ts
ACTION: MODIFY
LOCATION: DefaultToolName enum (after line 33)
CODE:
  export enum DefaultToolName {
    // ... existing entries ...
    CreateCalendarHeatmap = "create_calendar_heatmap",
    // ADD THESE TWO LINES:
    CreateBANChart = "create_ban_chart",
    CreateAIInsights = "create_ai_insights",
  }
VERIFY: Run `pnpm check-types` - should pass with no errors

---

Task 2: Create BAN Chart Validator
FILE: src/lib/validation/chart-data-validator.ts
ACTION: MODIFY
LOCATION: CHART_VALIDATORS object (after line 445)
PATTERN: Follow gauge validator pattern (line 445)
CODE:
  export const CHART_VALIDATORS = {
    // ... existing validators ...
    gauge: validateGaugeChart,
    // ADD THIS:
    ban: (input: any): ValidationResult<any> => {
      // Validate title
      if (!input.title || typeof input.title !== 'string') {
        return createValidationError('BAN chart must have a title');
      }

      // Validate value
      if (typeof input.value !== 'number' || !isFinite(input.value)) {
        return createValidationError('BAN chart value must be a finite number');
      }

      // Sanitize strings for XSS prevention
      const sanitizedTitle = sanitizeHtml(input.title);
      const sanitizedDescription = input.description ? sanitizeHtml(input.description) : undefined;
      const sanitizedUnit = input.unit ? sanitizeHtml(input.unit) : undefined;

      // Validate comparison if provided
      if (input.comparison) {
        if (typeof input.comparison.previousValue !== 'number') {
          return createValidationError('Comparison previousValue must be a number');
        }
      }

      // Security audit
      const securityIssues: string[] = [];
      if (input.title !== sanitizedTitle) securityIssues.push('Title sanitized');

      return {
        success: true,
        data: {
          title: sanitizedTitle,
          value: input.value,
          unit: sanitizedUnit,
          description: sanitizedDescription,
          comparison: input.comparison,
          trend: input.trend,
        },
        securityAudit: {
          safe: securityIssues.length === 0,
          issues: securityIssues,
        },
      };
    },
  };
VERIFY: Run `pnpm check-types` - no errors

---

Task 3: Create BAN Chart Tool
FILE: src/lib/ai/tools/artifacts/ban-chart-tool.ts
ACTION: CREATE
PATTERN: MIRROR gauge-chart-tool.ts structure (src/lib/ai/tools/artifacts/gauge-chart-tool.ts)
PSEUDOCODE:
  import { tool as createTool } from "ai";
  import { z } from "zod";
  import { generateUUID } from "../../../utils";
  import logger from "../../../logger";
  import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";
  import { DefaultToolName } from "../index";

  export const banChartArtifactTool = createTool({
    name: DefaultToolName.CreateBANChart, // CRITICAL: Must match enum

    description: `Create a BAN (Big Ass Number) chart for displaying prominent KPIs.

    Use this for single metrics like:
    - Total revenue or profit
    - User counts or conversion rates
    - Performance metrics
    - Goal progress percentages

    The chart displays a large number with optional trend indicators.`,

    inputSchema: z.object({
      title: z.string().describe("KPI name (e.g., 'Total Revenue')"),
      value: z.number().describe("The numeric value to display"),
      unit: z.string().optional().describe("Unit symbol (%, $, etc)"),
      prefix: z.string().optional().describe("Prefix before number ($)"),
      suffix: z.string().optional().describe("Suffix after number (%)"),
      description: z.string().optional().describe("Context (e.g., 'Last 30 days')"),
      comparison: z.object({
        previousValue: z.number(),
        label: z.string(),
      }).optional().describe("Comparison with previous period"),
      trend: z.enum(["up", "down", "neutral"]).optional(),
    }),

    execute: async function* ({ title, value, unit, prefix, suffix, description, comparison, trend }) {
      try {
        logger.info(`🔧 [${DefaultToolName.CreateBANChart}] Tool execution started:`, {
          toolName: DefaultToolName.CreateBANChart,
          title,
          value,
        });

        // Stream loading state
        yield {
          status: "loading",
          message: `Preparing BAN chart: ${title}`,
          progress: 0,
        };

        // Validate and sanitize input
        const validationResult = CHART_VALIDATORS.ban({
          title,
          value,
          unit,
          description,
          comparison,
          trend,
        });

        if (!validationResult.success) {
          logger.error(`BAN chart validation failed:`, {
            error: validationResult.error,
          });
          throw new Error(validationResult.error || "Validation failed");
        }

        // Security check
        if (!validationResult.securityAudit.safe) {
          logger.error(`BAN chart security audit failed:`, validationResult.securityAudit.issues);
          throw new Error("Chart data contains potential security issues");
        }

        // Stream processing state
        yield {
          status: "processing",
          message: `Creating BAN chart...`,
          progress: 50,
        };

        // Calculate trend percentage if comparison provided
        let trendPercentage: number | undefined;
        if (comparison && comparison.previousValue !== 0) {
          trendPercentage = ((value - comparison.previousValue) / Math.abs(comparison.previousValue)) * 100;
        }

        // Auto-detect trend if not provided but comparison exists
        const finalTrend = trend || (trendPercentage !== undefined
          ? trendPercentage > 0 ? "up" : trendPercentage < 0 ? "down" : "neutral"
          : undefined
        );

        const validatedData = validationResult.data!;
        const artifactId = generateUUID();

        // Create chart content
        const chartContent = {
          type: "ban-chart",
          title: validatedData.title,
          value: validatedData.value,
          unit: unit,
          prefix: prefix,
          suffix: suffix,
          description: validatedData.description,
          comparison: validatedData.comparison,
          trend: finalTrend,
          trendPercentage: trendPercentage,
          chartType: "ban",
        };

        // Stream success with CRITICAL Canvas flag
        yield {
          status: "success" as const,
          message: `Created BAN chart "${validatedData.title}"`,
          chartId: artifactId,
          title: validatedData.title,
          chartType: "ban",
          canvasName: "Data Visualization",
          chartData: chartContent,
          shouldCreateArtifact: true, // CRITICAL: Required for Canvas
          progress: 100,
        };

        logger.info(`✅ [${DefaultToolName.CreateBANChart}] Tool execution completed successfully:`, {
          toolName: DefaultToolName.CreateBANChart,
          artifactId,
          title: validatedData.title,
        });

        return `Created BAN chart "${validatedData.title}" showing ${value.toLocaleString()}${unit || ""}. The chart is now available in the Canvas workspace.`;

      } catch (error) {
        logger.error(`❌ [${DefaultToolName.CreateBANChart}] Tool execution failed:`, {
          toolName: DefaultToolName.CreateBANChart,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
VERIFY: Run `pnpm check-types` - no errors

---

Task 4: Create BAN Chart Component
FILE: src/components/tool-invocation/ban-chart.tsx
ACTION: CREATE
PATTERN: Use shadcn/ui Card components (src/components/ui/card.tsx)
REFERENCE: gauge-chart.tsx for structure
PSEUDOCODE:
  "use client";

  import * as React from "react";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { TrendingUp, TrendingDown, Minus } from "lucide-react";
  import { cn } from "lib/utils";
  import { JsonViewPopup } from "../json-view-popup";

  export interface BANChartProps {
    title: string;
    value: number;
    unit?: string;
    prefix?: string;
    suffix?: string;
    description?: string;
    comparison?: {
      previousValue: number;
      label: string;
    };
    trend?: "up" | "down" | "neutral";
    trendPercentage?: number;
  }

  export function BANChart(props: BANChartProps) {
    const {
      title,
      value,
      unit,
      prefix,
      suffix,
      description,
      comparison,
      trend,
      trendPercentage,
    } = props;

    // Format large numbers intelligently
    const formattedValue = React.useMemo(() => {
      const absValue = Math.abs(value);
      if (absValue >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(1) + "B";
      } else if (absValue >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + "M";
      } else if (absValue >= 1_000) {
        return (value / 1_000).toFixed(1) + "K";
      }
      return value.toLocaleString();
    }, [value]);

    // Determine trend icon and color
    const getTrendDisplay = () => {
      if (!trend || !trendPercentage) return null;

      const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
      const colorClass = trend === "up"
        ? "text-green-500"
        : trend === "down"
        ? "text-red-500"
        : "text-muted-foreground";

      return (
        <div className={cn("flex items-center gap-2 mt-4", colorClass)}>
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">
            {trendPercentage > 0 ? "+" : ""}{trendPercentage.toFixed(1)}%
          </span>
          {comparison?.label && (
            <span className="text-sm text-muted-foreground">
              {comparison.label}
            </span>
          )}
        </div>
      );
    };

    return (
      <Card className="bg-card h-full flex flex-col">
        <CardHeader className="flex flex-col gap-1 relative pb-3 flex-shrink-0">
          <CardTitle className="flex items-center text-sm text-muted-foreground font-medium">
            {title}
            <div className="absolute right-4 top-0">
              <JsonViewPopup data={props} />
            </div>
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center pb-6">
          {/* Big Ass Number */}
          <div className="text-6xl font-bold tracking-tight">
            {prefix}
            {formattedValue}
            {suffix || unit}
          </div>

          {/* Trend Indicator */}
          {getTrendDisplay()}

          {/* Comparison Detail */}
          {comparison && !trendPercentage && (
            <div className="mt-4 text-sm text-muted-foreground">
              Previous: {comparison.previousValue.toLocaleString()}{unit}
              <span className="ml-2 text-xs">({comparison.label})</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
VERIFY: Component renders without errors

---

Task 5: Register BAN Chart Tool
FILE: src/lib/ai/tools/tool-kit.ts
ACTION: MODIFY
LOCATION: APP_DEFAULT_TOOL_KIT.Artifacts (after line 67)
CODE:
  import { banChartArtifactTool } from "./artifacts/ban-chart-tool";
  // ... other imports ...

  export const APP_DEFAULT_TOOL_KIT = {
    // ... other toolkits ...
    [AppDefaultToolkit.Artifacts]: {
      // ... existing chart tools ...
      [DefaultToolName.CreateCalendarHeatmap]: calendarHeatmapArtifactTool,
      // ADD THIS LINE:
      [DefaultToolName.CreateBANChart]: banChartArtifactTool,
    },
  } as const;
VERIFY: Run `pnpm check-types` - no errors

---

Task 6: Export BAN Chart Tool
FILE: src/lib/ai/tools/artifacts/index.ts
ACTION: MODIFY
LOCATION: After line 27 (pie chart export)
CODE:
  import { banChartArtifactTool } from "./ban-chart-tool";
  // ... other imports ...

  export {
    // ... existing exports ...
    pieChartArtifactTool,
    banChartArtifactTool, // ADD THIS
    // ... rest of exports ...
  };

  export const chartArtifactTools = {
    // ... existing tools ...
    createPieChart: pieChartArtifactTool,
    createBANChart: banChartArtifactTool, // ADD THIS
  } as const;
VERIFY: Run `pnpm check-types` - no errors

---

Task 7: Integrate BAN Chart with Canvas
FILE: src/components/canvas-panel.tsx
ACTION: MODIFY
LOCATION: ChartRenderer function, switch statement (line 274)
CODE:
  import { BANChart } from "./tool-invocation/ban-chart";
  // ... other imports ...

  // Inside ChartRenderer component:
  switch (chartType) {
    // ... existing cases ...
    case "calendar-heatmap":
    case "heatmap":
      return <CalendarHeatmap {...chartProps} />;

    // ADD THIS CASE:
    case "ban":
      return <BANChart {...chartProps} />;

    default:
      console.warn(`Unknown chart type: ${chartType}, falling back to bar chart`);
      return <BarChart {...chartProps} />;
  }
VERIFY: Canvas renders BAN charts correctly

---

# ==========================================
# PHASE 2: AI INSIGHTS IMPLEMENTATION
# ==========================================

Task 8: Create AI Insights Validator
FILE: src/lib/validation/chart-data-validator.ts
ACTION: MODIFY
LOCATION: CHART_VALIDATORS object (after BAN validator)
CODE:
  export const CHART_VALIDATORS = {
    // ... existing validators ...
    ban: validateBANChart,
    // ADD THIS:
    insights: (input: any): ValidationResult<any> => {
      // Validate insights array
      if (!input.insights || !Array.isArray(input.insights)) {
        return createValidationError('AI insights must have an insights array');
      }

      // Validate each insight
      const sanitizedInsights = input.insights.map((insight: any) => {
        if (!insight.title || !insight.description) {
          throw new Error('Each insight must have title and description');
        }

        return {
          id: insight.id || generateUUID(),
          type: insight.type || 'recommendation',
          title: sanitizeHtml(insight.title),
          description: sanitizeHtml(insight.description),
          severity: insight.severity || 'medium',
          action: insight.action ? sanitizeHtml(insight.action) : undefined,
        };
      });

      return {
        success: true,
        data: {
          title: input.title ? sanitizeHtml(input.title) : 'AI Insights',
          insights: sanitizedInsights,
        },
        securityAudit: {
          safe: true,
          issues: [],
        },
      };
    },
  };
VERIFY: Run `pnpm check-types` - no errors

---

Task 9: Create AI Insights Tool
FILE: src/lib/ai/tools/artifacts/ai-insights-tool.ts
ACTION: CREATE
PATTERN: Combine gauge-chart-tool.ts (structure) + streamText for AI generation
PSEUDOCODE:
  import { tool as createTool } from "ai";
  import { z } from "zod";
  import { generateUUID } from "../../../utils";
  import logger from "../../../logger";
  import { CHART_VALIDATORS } from "../../../validation/chart-data-validator";
  import { DefaultToolName } from "../index";
  import { streamText } from "ai";
  import { getDefaultModel } from "../../models";

  export const aiInsightsArtifactTool = createTool({
    name: DefaultToolName.CreateAIInsights,

    description: `Generate AI-powered insights from Canvas charts and data.

    Analyzes charts on the Canvas to:
    - Identify trends and patterns
    - Detect anomalies and outliers
    - Find correlations between metrics
    - Provide actionable recommendations

    Use when user asks to "analyze these charts" or "give me insights".`,

    inputSchema: z.object({
      charts: z.array(z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        data: z.any(),
      })).describe("Charts to analyze from Canvas"),
      focusAreas: z.array(z.string()).optional().describe("Specific areas to focus on"),
      maxInsights: z.number().default(5).describe("Maximum insights to generate"),
    }),

    execute: async function* ({ charts, focusAreas, maxInsights }) {
      try {
        logger.info(`🔧 [${DefaultToolName.CreateAIInsights}] Tool execution started:`, {
          toolName: DefaultToolName.CreateAIInsights,
          chartCount: charts.length,
          focusAreas,
        });

        // Stream loading state
        yield {
          status: "loading",
          message: "Analyzing Canvas charts...",
          progress: 0,
        };

        // Prepare chart summary for AI
        const chartSummary = charts.map(chart => ({
          title: chart.title,
          type: chart.type,
          dataPoints: Array.isArray(chart.data) ? chart.data.length : 'N/A',
          sampleData: JSON.stringify(chart.data).substring(0, 500), // First 500 chars
        }));

        // Stream processing state
        yield {
          status: "processing",
          message: "Generating insights with AI...",
          progress: 30,
        };

        // Generate insights using AI
        const prompt = `You are a data analyst. Analyze these dashboard charts and provide ${maxInsights} actionable insights.

Charts:
${chartSummary.map((c, i) => `${i + 1}. ${c.title} (${c.type}): ${c.dataPoints} data points`).join('\n')}

Focus areas: ${focusAreas?.join(', ') || 'trends, anomalies, correlations, recommendations'}

Provide insights in this JSON format:
{
  "insights": [
    {
      "type": "trend" | "anomaly" | "correlation" | "recommendation" | "warning",
      "title": "Short insight title",
      "description": "Detailed explanation",
      "severity": "low" | "medium" | "high",
      "action": "Recommended action (optional)"
    }
  ]
}`;

        const model = getDefaultModel();
        const result = await streamText({
          model,
          prompt,
          maxTokens: 1000,
          temperature: 0.7,
        });

        let aiResponse = '';
        for await (const chunk of result.textStream) {
          aiResponse += chunk;

          // Stream progress updates
          yield {
            status: "processing",
            message: "Generating insights...",
            progress: Math.min(30 + (aiResponse.length / 10), 90),
          };
        }

        // Parse AI response
        let insights;
        try {
          const parsed = JSON.parse(aiResponse);
          insights = parsed.insights;
        } catch (e) {
          // Fallback if JSON parsing fails
          insights = [{
            type: 'recommendation',
            title: 'Analysis Complete',
            description: aiResponse,
            severity: 'medium',
          }];
        }

        // Validate insights
        const validationResult = CHART_VALIDATORS.insights({
          title: 'AI-Generated Insights',
          insights,
        });

        if (!validationResult.success) {
          throw new Error(validationResult.error || "Validation failed");
        }

        const validatedData = validationResult.data!;
        const artifactId = generateUUID();

        // Create insights artifact
        const insightsContent = {
          type: "ai-insights",
          title: validatedData.title,
          insights: validatedData.insights,
          chartType: "insights",
          metadata: {
            chartCount: charts.length,
            generatedAt: new Date().toISOString(),
          },
        };

        // Stream success
        yield {
          status: "success" as const,
          message: `Generated ${insights.length} AI insights`,
          chartId: artifactId,
          title: validatedData.title,
          chartType: "insights",
          canvasName: "Data Visualization",
          chartData: insightsContent,
          shouldCreateArtifact: true, // CRITICAL
          progress: 100,
        };

        logger.info(`✅ [${DefaultToolName.CreateAIInsights}] Tool execution completed:`, {
          toolName: DefaultToolName.CreateAIInsights,
          artifactId,
          insightCount: insights.length,
        });

        return `Generated ${insights.length} AI insights from ${charts.length} charts. The insights are now available in the Canvas workspace.`;

      } catch (error) {
        logger.error(`❌ [${DefaultToolName.CreateAIInsights}] Tool execution failed:`, {
          toolName: DefaultToolName.CreateAIInsights,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
VERIFY: Run `pnpm check-types` - no errors

---

Task 10: Create AI Insights Component
FILE: src/components/tool-invocation/ai-insights.tsx
ACTION: CREATE
PATTERN: Use shadcn/ui Alert or Card components
PSEUDOCODE:
  "use client";

  import * as React from "react";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import { Badge } from "@/components/ui/badge";
  import {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    AlertCircle,
    CheckCircle,
  } from "lucide-react";
  import { cn } from "lib/utils";
  import { JsonViewPopup } from "../json-view-popup";

  export interface AIInsight {
    id: string;
    type: "trend" | "anomaly" | "correlation" | "recommendation" | "warning";
    title: string;
    description: string;
    severity?: "low" | "medium" | "high";
    action?: string;
  }

  export interface AIInsightsProps {
    title?: string;
    insights: AIInsight[];
    metadata?: {
      chartCount?: number;
      generatedAt?: string;
    };
  }

  export function AIInsights(props: AIInsightsProps) {
    const { title = "AI-Generated Insights", insights, metadata } = props;

    // Get icon for insight type
    const getInsightIcon = (type: AIInsight['type']) => {
      switch (type) {
        case "trend":
          return <TrendingUp className="h-5 w-5 text-blue-500" />;
        case "anomaly":
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case "correlation":
          return <CheckCircle className="h-5 w-5 text-purple-500" />;
        case "recommendation":
          return <Lightbulb className="h-5 w-5 text-green-500" />;
        case "warning":
          return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
          return <Sparkles className="h-5 w-5 text-primary" />;
      }
    };

    // Get severity badge variant
    const getSeverityVariant = (severity?: string) => {
      switch (severity) {
        case "high":
          return "destructive";
        case "low":
          return "secondary";
        default:
          return "default";
      }
    };

    return (
      <Card className="bg-card h-full flex flex-col">
        <CardHeader className="flex flex-col gap-1 relative pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
            <div className="absolute right-4 top-0">
              <JsonViewPopup data={props} />
            </div>
          </CardTitle>
          {metadata && (
            <CardDescription className="text-xs">
              Based on {metadata.chartCount || 0} charts
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4">
          {insights.map((insight) => (
            <Alert key={insight.id} variant={insight.type === "warning" ? "destructive" : "default"}>
              {getInsightIcon(insight.type)}
              <AlertTitle className="flex items-center gap-2">
                {insight.title}
                {insight.severity && (
                  <Badge variant={getSeverityVariant(insight.severity)} className="text-xs">
                    {insight.severity}
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {insight.description}
                {insight.action && (
                  <div className="mt-2 p-2 bg-muted/30 rounded-md text-xs">
                    <strong>Action:</strong> {insight.action}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}

          {insights.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No insights generated</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
VERIFY: Component renders without errors

---

Task 11: Register AI Insights Tool
FILE: src/lib/ai/tools/tool-kit.ts
ACTION: MODIFY
LOCATION: APP_DEFAULT_TOOL_KIT.Artifacts (after BAN chart)
CODE:
  import { aiInsightsArtifactTool } from "./artifacts/ai-insights-tool";
  // ... other imports ...

  export const APP_DEFAULT_TOOL_KIT = {
    // ... other toolkits ...
    [AppDefaultToolkit.Artifacts]: {
      // ... existing chart tools ...
      [DefaultToolName.CreateBANChart]: banChartArtifactTool,
      // ADD THIS LINE:
      [DefaultToolName.CreateAIInsights]: aiInsightsArtifactTool,
    },
  } as const;
VERIFY: Run `pnpm check-types` - no errors

---

Task 12: Export AI Insights Tool
FILE: src/lib/ai/tools/artifacts/index.ts
ACTION: MODIFY
LOCATION: After BAN chart export
CODE:
  import { aiInsightsArtifactTool } from "./ai-insights-tool";
  // ... other imports ...

  export {
    // ... existing exports ...
    banChartArtifactTool,
    aiInsightsArtifactTool, // ADD THIS
  };

  export const chartArtifactTools = {
    // ... existing tools ...
    createBANChart: banChartArtifactTool,
    createAIInsights: aiInsightsArtifactTool, // ADD THIS
  } as const;
VERIFY: Run `pnpm check-types` - no errors

---

Task 13: Integrate AI Insights with Canvas
FILE: src/components/canvas-panel.tsx
ACTION: MODIFY
LOCATION: ChartRenderer function, switch statement (after BAN case)
CODE:
  import { AIInsights } from "./tool-invocation/ai-insights";
  // ... other imports ...

  // Inside ChartRenderer component:
  switch (chartType) {
    // ... existing cases ...
    case "ban":
      return <BANChart {...chartProps} />;

    // ADD THIS CASE:
    case "insights":
      return <AIInsights {...chartProps} />;

    default:
      console.warn(`Unknown chart type: ${chartType}, falling back to bar chart`);
      return <BarChart {...chartProps} />;
  }
VERIFY: Canvas renders AI insights correctly

---

Task 14: Add Loading Icon Cases
FILE: src/components/canvas-panel.tsx
ACTION: MODIFY
LOCATION: getChartIcon function in LoadingPlaceholder (line 81)
CODE:
  const getChartIcon = () => {
    const chartType = artifact.metadata?.chartType;
    switch (chartType) {
      case "bar":
        return <BarChart3 className="h-5 w-5 text-primary" />;
      // ... existing cases ...

      // ADD THESE TWO CASES:
      case "ban":
        return <Hash className="h-5 w-5 text-primary" />;
      case "insights":
        return <Sparkles className="h-5 w-5 text-primary" />;

      default:
        return <BarChart3 className="h-5 w-5 text-primary" />;
    }
  };

  // Also add to getChartTypeDisplay function (line 143)
  const getChartTypeDisplay = (toolName: string) => {
    // ... existing cases ...
    if (toolName.includes("table")) return "Data Table";

    // ADD THESE TWO LINES:
    if (toolName.includes("ban")) return "BAN Chart";
    if (toolName.includes("insights")) return "AI Insights";

    return "Chart";
  };
VERIFY: Loading states display correctly

---

Task 15: Final Integration Test
ACTION: Manual Testing
STEPS:
  1. Start dev server: `pnpm dev`
  2. Navigate to chat interface
  3. Test BAN chart creation:
     - Ask: "Create a BAN chart showing total revenue of $1,234,567 with a 12% increase vs last month"
     - Verify: Large number displays, trend arrow shows, Canvas opens
  4. Test AI insights:
     - Create 2-3 charts first (bar, line, pie)
     - Ask: "Analyze these charts and give me insights"
     - Verify: Insights generate and display in Canvas
  5. Test Canvas integration:
     - Both artifact types appear in Canvas
     - Grid layout works with mixed chart types
     - No console errors
VERIFY: All features work end-to-end
```

---

## Integration Points

```yaml
DATABASE:
  - No schema changes required
  - Uses existing artifact storage patterns

CONFIGURATION:
  - No new environment variables needed
  - Uses existing Vercel AI SDK configuration
  - Langfuse tracing automatically enabled via experimental_telemetry

ROUTES:
  - No new API routes required
  - Uses existing /api/chat route with tool calls

CANVAS:
  - Integrates via canvas-panel.tsx chartType routing
  - Uses existing CanvasArtifact interface
  - Follows standard artifact lifecycle (loading → completed)

VERCEL AI SDK:
  - Uses createTool from "ai" package
  - Follows async function* streaming pattern
  - Returns shouldCreateArtifact: true flag

LANGFUSE OBSERVABILITY:
  - AI insights generation automatically traced
  - Tool execution logged via logger.info/error
  - No additional configuration needed
```

---

## Validation Loop

### Level 1: Syntax & Type Checking
```bash
# Run FIRST - these must pass before proceeding
pnpm check-types           # TypeScript validation (CRITICAL)
pnpm lint                  # Biome linting + auto-fix

# Expected: Zero errors
# If errors: Read error message, understand root cause, fix code, re-run
```

### Level 2: Unit Tests
```typescript
// CREATE tests following existing pattern (gauge-chart.test.tsx)

// src/components/tool-invocation/ban-chart.test.tsx
describe('BANChart Component', () => {
  it('should render value with proper formatting', () => {
    const { getByText } = render(
      <BANChart title="Revenue" value={1234567} unit="$" />
    );
    expect(getByText(/1\.2M/)).toBeInTheDocument();
  });

  it('should display trend indicator when provided', () => {
    const { container } = render(
      <BANChart
        title="Users"
        value={1000}
        trend="up"
        trendPercentage={12.5}
      />
    );
    expect(container.querySelector('.text-green-500')).toBeInTheDocument();
  });
});

// src/lib/ai/tools/artifacts/ban-chart-tool.test.ts
describe('BAN Chart Tool', () => {
  it('should create valid chart data', async () => {
    const result = await banChartArtifactTool.execute({
      title: "Test",
      value: 100,
    });
    expect(result).toContain('BAN chart');
  });

  it('should validate input correctly', () => {
    const validation = CHART_VALIDATORS.ban({
      title: "Test",
      value: "invalid", // Should fail
    });
    expect(validation.success).toBe(false);
  });
});
```

```bash
# Run tests and iterate until passing
pnpm test                  # Vitest unit tests

# If failing:
# 1. Read error output carefully
# 2. Understand what assertion failed and why
# 3. Fix the code (NOT the test)
# 4. Re-run
# NEVER mock just to make tests pass - fix the real issue
```

### Level 3: Integration Tests
```bash
# Start the development server (MUST be on port 3000)
pnpm dev

# Wait for server to be ready, then test in browser:
# 1. Navigate to http://localhost:3000
# 2. Open chat interface
# 3. Test BAN chart:
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Create a BAN chart showing revenue of $1,234,567"
    }]
  }'

# Expected: BAN chart appears in Canvas with correct formatting

# 4. Test AI insights:
# - Create 2-3 charts first
# - Ask: "Analyze these charts and provide insights"
# - Verify insights generate and display

# If errors:
# - Check browser console for errors
# - Check server logs (terminal running pnpm dev)
# - Verify tool is registered correctly (check /api/chat/tools)
```

### Level 4: Canvas Integration Test
```bash
# Manual testing checklist:
1. Create BAN chart → Verify Canvas opens automatically
2. Create multiple BANs → Verify grid layout works
3. Mix BAN + other charts → Verify all render correctly
4. Close/reopen Canvas → Verify state persists
5. Test AI insights → Verify analyzes existing charts
6. Check loading states → Verify spinners show during generation
7. Test error handling → Try invalid inputs, verify graceful failures

# Observability check:
curl -f http://localhost:3000/api/health/langfuse

# Expected: {"status": "healthy"}
```

---

## Final Validation Checklist

- [ ] All TypeScript checks pass: `pnpm check-types`
- [ ] No linting errors: `pnpm lint`
- [ ] All unit tests pass: `pnpm test`
- [ ] BAN chart creates successfully via AI
- [ ] AI insights generate from Canvas charts
- [ ] Both tools appear in DefaultToolName enum
- [ ] Both tools registered in APP_DEFAULT_TOOL_KIT
- [ ] Canvas routes both chartTypes correctly
- [ ] Validators added to CHART_VALIDATORS
- [ ] Components use shadcn/ui (no new dependencies)
- [ ] Loading states display correctly
- [ ] Error cases handled gracefully
- [ ] Logs are informative (logger.info/error)
- [ ] No console errors in browser
- [ ] Langfuse observability working
- [ ] Production build succeeds: `pnpm build:local`

---

## Anti-Patterns to Avoid

- ❌ **Don't** create new dependencies - use shadcn/ui and existing tools
- ❌ **Don't** skip validation - always use CHART_VALIDATORS
- ❌ **Don't** ignore tool name mismatches - MUST match DefaultToolName enum exactly
- ❌ **Don't** forget shouldCreateArtifact flag - Canvas won't show artifacts without it
- ❌ **Don't** use emojis in code (per CLAUDE.md instructions)
- ❌ **Don't** hardcode values - use props and configuration
- ❌ **Don't** skip streaming states - yield loading/processing/success
- ❌ **Don't** forget Langfuse tracing - use experimental_telemetry
- ❌ **Don't** skip error logging - always logger.error with context
- ❌ **Don't** use different icon libraries - stick to lucide-react

---

## Success Metrics

After implementation, these should be true:

1. **Functionality**: Both tools create Canvas artifacts successfully
2. **Type Safety**: Zero TypeScript errors across entire codebase
3. **Code Quality**: Passes all linting and formatting checks
4. **Testing**: Unit tests achieve >80% coverage for new code
5. **Integration**: Canvas displays both artifact types correctly
6. **Observability**: Langfuse traces all tool executions
7. **Performance**: No performance degradation (charts load in <2s)
8. **User Experience**: AI generates insights in <10s
9. **Error Handling**: Graceful failures with informative messages
10. **Documentation**: Code is self-documenting with clear patterns

---

## PRP Confidence Score: 9/10

**Rationale for High Confidence:**
- ✅ Existing patterns are clear and well-established (17 chart tools to reference)
- ✅ No new dependencies required (shadcn/ui already installed)
- ✅ Validation patterns are mature (CHART_VALIDATORS)
- ✅ Canvas integration is straightforward (simple switch case addition)
- ✅ Comprehensive research completed (docs/ban-chart-insights-research.md)
- ✅ TypeScript will catch most errors at compile time
- ⚠️ AI insights generation adds complexity (might need prompt tuning)

**Risk Areas:**
- AI insights prompt engineering (may need iteration for quality)
- Canvas state access for chart analysis (need to ensure proper data passing)

**Mitigation:**
- Start with simple AI prompts and refine based on output quality
- Use existing Canvas hook patterns for state access
- Test with various chart combinations to ensure robustness

---

**IMPLEMENTATION READY**: This PRP provides all context needed for one-pass implementation success.
