# BAN Chart & AI Insights Component Research

**Date**: 2025-09-30
**Purpose**: Research available components for BAN (Big Ass Numbers) charts and AI-generated insights text boxes

---

## 🎯 Summary

**GOOD NEWS**: You already have everything needed! No new dependencies required.

### ✅ What's Already Available

1. **shadcn/ui components** (already installed):
   - [Card](src/components/ui/card.tsx) - Perfect for KPI cards
   - [Alert](src/components/ui/alert.tsx) - Ideal for insights/callout boxes
   - [Badge](src/components/ui/badge.tsx) - For trend indicators

2. **Recharts** (already in use):
   - Not needed for BAN charts (they're just styled numbers)
   - Can add optional sparklines for trends

3. **Vercel AI SDK** (v5.0.26 installed):
   - AI Elements available but not needed for static insights
   - Can stream insights via existing `streamText` infrastructure

---

## 📊 BAN Chart Implementation

### What is a BAN Chart?

**BAN** = "Big Ass Numbers" (also "Big Aggregate Numbers")
- Single large metric displayed prominently
- Shows key KPIs: revenue, users, conversion rate, etc.
- Often includes trend indicators and comparisons

### Recommended Approach

**Use existing shadcn/ui Card component** - No external libraries needed!

```typescript
// Example BAN Card Structure
<Card>
  <CardHeader>
    <CardTitle>Total Revenue</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-6xl font-bold">$1.24M</div>
    <div className="flex items-center gap-2 mt-4">
      <TrendingUp className="text-green-500" />
      <span className="text-green-500">+12.5%</span>
      <span className="text-muted-foreground">vs last month</span>
    </div>
  </CardContent>
</Card>
```

### Why Not Recharts/Tremor?

- **Recharts**: Designed for data visualization charts (bar, line, pie) - overkill for single numbers
- **Tremor**: External dependency (~200KB) when you already have shadcn/ui
- **shadcn/ui**: Already installed, lightweight, matches your design system

---

## 💡 AI Insights Text Box Implementation

### What is an AI Insights Box?

- Displays AI-generated analysis/recommendations
- Callout-style component highlighting key findings
- Can include icons, formatting, and actions

### Option 1: Alert Component (Recommended for Static Insights)

**Already available**: [src/components/ui/alert.tsx](src/components/ui/alert.tsx)

```typescript
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

<Alert>
  <Lightbulb className="h-4 w-4" />
  <AlertTitle>AI Insight</AlertTitle>
  <AlertDescription>
    Your sales increased 23% this week, primarily driven by the
    new product launch. Consider increasing inventory for SKU-123.
  </AlertDescription>
</Alert>
```

**Variants Available**:
- `default` - Standard info style
- `destructive` - Warning/error style

### Option 2: Card Component (For Rich Insights)

Use when insights need more structure:

```typescript
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" />
      AI-Generated Insights
    </CardTitle>
    <CardDescription>Based on canvas data</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex gap-3">
      <TrendingUp className="h-5 w-5 text-green-500" />
      <p className="text-sm">Revenue trending 15% above forecast</p>
    </div>
    <div className="flex gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-500" />
      <p className="text-sm">Inventory low for top 3 products</p>
    </div>
  </CardContent>
</Card>
```

### Option 3: Vercel AI SDK Elements (For Real-time Streaming)

**Available but not necessary** for basic insights. Use if you want:
- Streaming insights character-by-character
- Interactive chat-like insights
- Real-time data analysis

From AI SDK Elements documentation, available components:
- **Message** - Chat message display
- **Reasoning** - Show AI reasoning process
- **Sources** - Display source citations
- **Context** - Show contextual information

**When to use**: Complex interactive insights that benefit from streaming UI

---

## 🏗️ Implementation Plan

### Phase 1: BAN Chart Tool

**Files to create**:

1. **Tool Definition**: `src/lib/ai/tools/artifacts/ban-chart-tool.ts`
   - Follow existing pattern (see [bar-chart-tool.ts](src/lib/ai/tools/artifacts/bar-chart-tool.ts))
   - Input schema: title, value, unit, comparison, trend, description
   - Return `shouldCreateArtifact: true` for Canvas

2. **Component**: `src/components/tool-invocation/ban-chart.tsx`
   - Use shadcn/ui Card components
   - Display large number with formatting
   - Optional trend indicator (up/down arrows)
   - Optional comparison (vs previous period)

3. **Integration**:
   - Add to [DefaultToolName enum](src/lib/ai/tools/index.ts)
   - Export from [artifacts/index.ts](src/lib/ai/tools/artifacts/index.ts)
   - Add case in [canvas-panel.tsx](src/components/canvas-panel.tsx) for `chartType: 'ban'`

### Phase 2: AI Insights Tool

**Files to create**:

1. **Tool Definition**: `src/lib/ai/tools/artifacts/insights-tool.ts`
   - Input: canvas data/charts to analyze
   - Use `streamText` to generate insights
   - Return formatted insights object

2. **Component**: `src/components/tool-invocation/ai-insights.tsx`
   - Use Alert or Card component
   - Display insights with icons
   - Support multiple insight items
   - Optional: Add expand/collapse for long content

3. **Smart Features**:
   - Analyze all charts on current Canvas
   - Detect trends, anomalies, correlations
   - Generate actionable recommendations
   - Update when Canvas data changes

---

## 📦 Component Comparison

| Component | Use Case | Already Installed? | Size | Recommendation |
|-----------|----------|-------------------|------|----------------|
| **shadcn/ui Card** | BAN charts, rich insights | ✅ Yes | Minimal | **Use this** |
| **shadcn/ui Alert** | Simple insights/callouts | ✅ Yes | Minimal | **Use this** |
| **Tremor KPI Cards** | Pre-built KPI cards | ❌ No | ~200KB | Skip - not needed |
| **AI SDK Elements** | Interactive streaming insights | ✅ Yes | Already loaded | Use for advanced cases |
| **Recharts** | Chart visualizations | ✅ Yes | Already loaded | Not for BAN/insights |

---

## 🎨 Design Examples

### BAN Chart Variants

1. **Simple Metric**
   ```
   ┌─────────────────┐
   │ Total Users     │
   │                 │
   │   15,234        │
   │                 │
   └─────────────────┘
   ```

2. **With Trend**
   ```
   ┌─────────────────┐
   │ Revenue         │
   │                 │
   │   $1.24M        │
   │   ↑ +12.5%      │
   └─────────────────┘
   ```

3. **With Comparison**
   ```
   ┌─────────────────┐
   │ Conversion Rate │
   │                 │
   │   23.4%         │
   │   ↑ +3.2%       │
   │   vs last month │
   └─────────────────┘
   ```

4. **With Sparkline** (optional)
   ```
   ┌─────────────────┐
   │ Active Users    │
   │   ╱╲ ╱╲         │
   │   12,456        │
   │   ↑ +8.3%       │
   └─────────────────┘
   ```

### AI Insights Variants

1. **Alert Style (Simple)**
   ```
   ┌─────────────────────────────────┐
   │ 💡 AI Insight                   │
   │ Revenue increased 23% this week │
   │ driven by new product launch.   │
   └─────────────────────────────────┘
   ```

2. **Card Style (Rich)**
   ```
   ┌─────────────────────────────────┐
   │ ✨ AI-Generated Insights        │
   │ Based on 4 charts               │
   │                                 │
   │ ↗ Revenue 15% above forecast   │
   │ ⚠ Low inventory for top SKUs   │
   │ 📊 Peak sales on Wednesdays     │
   └─────────────────────────────────┘
   ```

---

## 🚀 Next Steps

1. **Confirm approach** with team/user
2. **Implement BAN chart** (2-3 hours)
   - Tool definition
   - React component
   - Canvas integration
   - Tests

3. **Implement AI Insights** (3-4 hours)
   - Tool with AI analysis logic
   - React component
   - Canvas data aggregation
   - Insight generation prompts

4. **Enhancement options**:
   - Sparklines in BAN charts (using Recharts AreaChart)
   - Real-time insight updates
   - Export insights to markdown
   - Insight history/versioning

---

## 📚 References

- **shadcn/ui Alert**: https://ui.shadcn.com/docs/components/alert
- **shadcn/ui Card**: https://ui.shadcn.com/docs/components/card
- **AI SDK Elements**: https://ai-sdk.dev/elements/components
- **Tremor KPI Cards**: https://blocks.tremor.so/blocks/kpi-cards (reference only)
- **Existing gauge chart**: [src/components/tool-invocation/gauge-chart.tsx](src/components/tool-invocation/gauge-chart.tsx)

---

## ✅ Conclusion

**You don't need any new dependencies!**

- **BAN Charts**: Use shadcn/ui Card (already installed)
- **AI Insights**: Use shadcn/ui Alert or Card (already installed)
- **Optional**: Leverage AI SDK Elements for advanced streaming insights

Everything needed is already in your codebase. Just need to create the tool definitions and components following existing patterns.
