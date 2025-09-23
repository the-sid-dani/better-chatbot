# INITIAL-CHARTS Implementation PRP
## Comprehensive Chart Library Extension for Canvas Workspace

---

## **🎯 FEATURE:**

**Implement 11 additional chart types to complement the existing bar, line, and pie charts, creating a comprehensive data visualization toolkit.** All charts will integrate seamlessly with the Canvas workspace using the same progressive building patterns, design system, and Vercel AI SDK streaming architecture.

**Chart Categories:**
- **Recharts-native (8 charts):** Area, Scatter, Radar, Funnel, Treemap, Sankey, RadialBar, Composed
- **External Libraries (3 charts):** Geographic/DMA, Gauge/Speedometer, Calendar Heatmap

**Success Criteria:** All 11 new chart tools integrate seamlessly with Canvas workspace, maintain design consistency, follow Vercel AI SDK patterns, and provide professional data visualization capabilities matching the quality of existing bar/line/pie chart implementations.

---

## **🛠️ TOOLS:**

### **Phase 1: Recharts-Native Tools (Build on Existing Patterns)**

#### **1. Area Chart Tool (`area-chart-tool.ts`)**
```typescript
// Pattern: Follow src/lib/ai/tools/chart-tool.ts createChartTool structure
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    xAxisLabel: z.string(),
    series: z.array(z.object({
      seriesName: z.string(),
      value: z.number()
    }))
  })),
  areaType: z.enum(["standard", "stacked", "percent"]).optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  description: z.string().optional()
})

// Integration: Uses same shouldCreateArtifact: true pattern
// Canvas Integration: Same responsive sizing pattern as existing charts
```

#### **2. Scatter Chart Tool (`scatter-chart-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    name: z.string().optional(), // Data point identifier
    series: z.array(z.object({
      seriesName: z.string(),
      x: z.number(),
      y: z.number(),
      z: z.number().optional() // For bubble size
    }))
  })),
  showBubbles: z.boolean().optional(),
  // ... standard chart options
})

// Use Cases: Correlation analysis, data point relationships, bubble charts
```

#### **3. Radar Chart Tool (`radar-chart-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    metric: z.string(),
    series: z.array(z.object({
      seriesName: z.string(),
      value: z.number(),
      fullMark: z.number().optional() // Max value for this metric
    }))
  })),
  // ... standard options
})

// Canvas Integration: Square aspect ratio like pie chart (aspectRatio: "square")
```

#### **4. Funnel Chart Tool (`funnel-chart-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    stage: z.string(),
    value: z.number(),
    fill: z.string().optional()
  })),
  unit: z.string().optional()
})

// Use Cases: Sales funnels, conversion rates, process flows
```

#### **5. Treemap Chart Tool (`treemap-chart-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    name: z.string(),
    value: z.number(),
    children: z.array(z.object({
      name: z.string(),
      value: z.number()
    })).optional()
  }))
})

// Use Cases: Hierarchical data, budget breakdowns, file system visualization
```

#### **6. Sankey Chart Tool (`sankey-chart-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  nodes: z.array(z.object({
    id: z.string(),
    name: z.string()
  })),
  links: z.array(z.object({
    source: z.string(), // node id
    target: z.string(), // node id
    value: z.number()
  }))
})

// Use Cases: Flow diagrams, energy flow, user journey flows
// Canvas Integration: Wide aspect ratio for flow visualization
```

#### **7. Radial Bar Tool (`radial-bar-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    name: z.string(),
    value: z.number(),
    maxValue: z.number().optional()
  })),
  innerRadius: z.number().optional().default(30),
  outerRadius: z.number().optional().default(80)
})

// Use Cases: Circular progress indicators, KPI dashboards
```

#### **8. Composed Chart Tool (`composed-chart-tool.ts`)**
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    xAxisLabel: z.string(),
    series: z.array(z.object({
      seriesName: z.string(),
      value: z.number(),
      chartType: z.enum(["bar", "line", "area"])
    }))
  }))
})

// Use Cases: Multiple data types on one chart (revenue + growth rate)
```

### **Phase 2: External Library Tools**

#### **9. Geographic Chart Tool (`geographic-chart-tool.ts`)**
```typescript
// External Dependency: react-simple-maps
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    regionCode: z.string(), // ISO code, DMA code, state code
    regionName: z.string(),
    value: z.number()
  })),
  geoType: z.enum(["world", "usa-states", "usa-dma", "usa-counties"]),
  colorScale: z.enum(["blues", "reds", "greens", "viridis"]).optional()
})

// Use Cases: DMA analysis, state-level data, regional metrics
// Canvas Integration: Wide aspect ratio for map display
```

#### **10. Gauge Chart Tool (`gauge-chart-tool.ts`)**
```typescript
// External Dependency: react-gauge-component
inputSchema: z.object({
  title: z.string(),
  value: z.number(),
  minValue: z.number().default(0),
  maxValue: z.number().default(100),
  gaugeType: z.enum(["speedometer", "semi-circle", "radial"]),
  thresholds: z.array(z.object({
    value: z.number(),
    color: z.string(),
    label: z.string().optional()
  })).optional()
})

// Use Cases: KPIs, performance metrics, temperature gauges
```

#### **11. Calendar Heatmap Tool (`calendar-heatmap-tool.ts`)**
```typescript
// External Dependency: @uiw/react-heat-map
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    date: z.string(), // YYYY-MM-DD format
    value: z.number()
  })),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  colorScale: z.enum(["github", "blues", "greens", "reds"]).optional()
})

// Use Cases: Activity tracking, daily metrics, contribution patterns
```

---

## **📦 DEPENDENCIES:**

### **✅ Core Dependencies (Already Available):**
- `ai` - Vercel AI SDK for tool creation
- `zod` - Schema validation
- `recharts` - Primary chart library (v3.2.1+)
- `react` - Component framework
- `lib/utils` - UUID generation
- `logger` - Logging system

### **🆕 New External Dependencies:**
```bash
# Geographic charts
npm install react-simple-maps

# Gauge charts
npm install react-gauge-component

# Calendar heatmaps
npm install @uiw/react-heat-map
```

### **🗺️ GeoJSON Data Files (Need Download):**
Store in `public/geo/` directory:
- **USA States:** `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`
- **USA Counties:** `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json`
- **Nielsen DMA:** `https://gist.github.com/simzou/6459889#file-nielsentopo-json`
- **World Countries:** `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`

### **🔧 Integration Points (Existing Architecture):**
- **Canvas System:** `src/components/canvas-panel.tsx` ✅
- **Chart Tools Index:** `src/lib/ai/tools/index.ts` ✅
- **Tool Kit Integration:** `src/lib/ai/tools/tool-kit.ts` ✅
- **Message Parts Rendering:** `src/components/message-parts.tsx` ✅
- **Chart Artifact System:** `src/components/artifacts/chart-artifact.tsx` ✅
- **Design System:** `DASHBOARD_COLORS` array from existing components ✅

---

## **📚 EXAMPLES:**

### **Existing Implementation Patterns (Follow Exactly):**

#### **Chart Tool Pattern (`src/lib/ai/tools/chart-tool.ts`):**
```typescript
// CRITICAL: All new tools must follow this exact pattern
export const createChartTool = createTool({
  description: `Create an interactive chart that streams to the Canvas workspace.`,
  inputSchema: z.object({
    title: z.string(),
    chartType: z.enum([...]),
    canvasName: z.string(),
    data: z.array(...)
  }),

  execute: async function* ({ title, chartType, data, ... }) {
    const chartId = generateUUID();

    // Stream loading state
    yield {
      status: 'loading' as const,
      message: `Preparing chart: ${title}`,
      progress: 0
    };

    // Stream processing state
    yield {
      status: 'processing' as const,
      message: `Creating ${chartType} chart visualization...`,
      progress: 50
    };

    // Stream completed chart - CRITICAL: this triggers Canvas
    yield {
      status: 'success' as const,
      chartId,
      title,
      chartType,
      canvasName,
      chartData,
      shouldCreateArtifact: true  // ← This triggers Canvas integration
    };

    return `Created ${chartType} chart "${title}". Available in Canvas workspace.`;
  }
});
```

#### **Chart Component Pattern (`src/components/tool-invocation/bar-chart.tsx`):**
```typescript
// Pattern to follow for all new chart components
export function BarChart(props: BarChartProps) {
  const { title, data, description, yAxisLabel } = props;

  // Data deduplication
  const deduplicateData = React.useMemo(() => { /* ... */ }, [data]);

  // Dynamic chart configuration with DASHBOARD_COLORS
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    seriesNames.forEach((seriesName, index) => {
      const colorIndex = index % chartColors.length;
      config[sanitizeCssVariableName(seriesName)] = {
        label: seriesName,
        color: chartColors[colorIndex],
      };
    });
    return config;
  }, [seriesNames]);

  return (
    <Card className="bg-card h-full flex flex-col">
      <CardHeader>
        <CardTitle>Bar Chart - {title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData}>
              {/* Chart components */}
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

#### **Canvas Dashboard Component Pattern (`src/components/canvas/charts/dashboard-charts.tsx`):**
```typescript
// CRITICAL: Color consistency with DASHBOARD_COLORS
export const DASHBOARD_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

// Pattern for Dashboard versions of charts
export function DashboardBarChart({ data, title, className }: DashboardChartProps) {
  const chartData = (data as ChartDataPoint[]).map(item => {
    const result: any = { name: item.xAxisLabel };
    item.series.forEach(series => {
      result[series.seriesName] = series.value;
    });
    return result;
  });

  const seriesNames = data.length > 0 ? (data[0] as ChartDataPoint).series.map(s => s.seriesName) : [];

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* Recharts component with DASHBOARD_COLORS */}
    </ResponsiveContainer>
  );
}
```

### **File Structure Implementation:**
```
src/lib/ai/tools/
├── chart-tool.ts                    ✅ (existing - enhanced)
├── artifacts/
│   ├── bar-chart-tool.ts            ✅ (existing)
│   ├── line-chart-tool.ts           ✅ (existing)
│   ├── pie-chart-tool.ts            ✅ (existing)
│   ├── area-chart-tool.ts           🆕 (new - Recharts)
│   ├── scatter-chart-tool.ts        🆕 (new - Recharts)
│   ├── radar-chart-tool.ts          🆕 (new - Recharts)
│   ├── funnel-chart-tool.ts         🆕 (new - Recharts)
│   ├── treemap-chart-tool.ts        🆕 (new - Recharts)
│   ├── sankey-chart-tool.ts         🆕 (new - Recharts)
│   ├── radial-bar-tool.ts           🆕 (new - Recharts)
│   ├── composed-chart-tool.ts       🆕 (new - Recharts)
│   ├── geographic-chart-tool.ts     🆕 (new - External)
│   ├── gauge-chart-tool.ts          🆕 (new - External)
│   └── calendar-heatmap-tool.ts     🆕 (new - External)

src/components/tool-invocation/
├── area-chart.tsx                   🆕 (new)
├── scatter-chart.tsx                🆕 (new)
├── radar-chart.tsx                  🆕 (new)
├── funnel-chart.tsx                 🆕 (new)
├── treemap-chart.tsx                🆕 (new)
├── sankey-chart.tsx                 🆕 (new)
├── radial-bar-chart.tsx             🆕 (new)
├── composed-chart.tsx               🆕 (new)
├── geographic-chart.tsx             🆕 (new)
├── gauge-chart.tsx                  🆕 (new)
└── calendar-heatmap.tsx             🆕 (new)

src/components/canvas/charts/dashboard-charts.tsx  ✅ (enhance existing)
```

---

## **📖 DOCUMENTATION:**

### **Primary Technical Resources:**

#### **Recharts Official Documentation:**
- **Main API:** https://recharts.org/en-US/api
- **AreaChart:** https://recharts.org/en-US/api/AreaChart
- **ScatterChart:** https://recharts.org/en-US/api/ScatterChart
- **RadarChart:** https://recharts.org/en-US/api/RadarChart
- **FunnelChart:** https://recharts.org/en-US/api/FunnelChart
- **Treemap:** https://recharts.org/en-US/api/Treemap
- **SankeyChart:** https://recharts.org/en-US/api/SankeyChart
- **RadialBarChart:** https://recharts.org/en-US/api/RadialBarChart
- **ComposedChart:** https://recharts.org/en-US/api/ComposedChart

#### **External Library Documentation:**
- **React Simple Maps:** https://www.react-simple-maps.io/
  - Getting Started: https://www.react-simple-maps.io/docs/getting-started/
  - Choropleth Examples: https://www.react-simple-maps.io/examples/world-choropleth-mapchart/
- **React Gauge Component:** https://github.com/antoniolago/react-gauge-component
  - API Documentation: https://antoniolago.github.io/react-gauge-component/
- **UIW React Heat Map:** https://github.com/uiwjs/react-heat-map
  - Usage Examples: https://uiwjs.github.io/react-heat-map/

#### **GeoJSON Resources:**
- **US Atlas:** https://github.com/topojson/us-atlas
- **World Atlas:** https://github.com/topojson/world-atlas
- **Nielsen DMA:** https://gist.github.com/simzou/6459889

#### **Vercel AI SDK References:**
- **Tool Creation:** https://ai-sdk.dev/docs/foundations/tools
- **Streaming Components:** https://ai-sdk.dev/docs/ai-sdk-rsc/streaming-react-components

---

## **⚠️ OTHER CONSIDERATIONS:**

### **🚨 Critical Implementation Guidelines:**

#### **1. Code Pattern Consistency (NEVER DEVIATE)**
- **ALWAYS** follow exact patterns from `src/lib/ai/tools/chart-tool.ts`
- **ALWAYS** use `async function*` streaming patterns with proper `yield` statements
- **ALWAYS** use `shouldCreateArtifact: true` to trigger Canvas integration
- **ALWAYS** use same error handling patterns as existing chart tools
- **ALWAYS** follow same naming conventions for consistency

#### **2. Design System Compliance (MANDATORY)**
- **ALWAYS** use existing `DASHBOARD_COLORS` array - never hardcode colors
- **ALWAYS** follow same card structure: `<Card><CardHeader><CardContent>`
- **ALWAYS** use `ResponsiveContainer` for chart responsiveness
- **ALWAYS** maintain consistent typography and spacing patterns
- **ALWAYS** use same HSL variables: `hsl(var(--card))`, `hsl(var(--border))`

#### **3. Canvas Integration Requirements (CRITICAL)**
- **Charts must scale properly** when Canvas panel is resized
- **Different aspect ratios** for different chart types:
  - Maps: `aspectRatio: "wide"` (16:9)
  - Gauges: `aspectRatio: "square"` (1:1)
  - Calendars: `aspectRatio: "wide"` (3:1)
  - Default: `aspectRatio: "standard"` (4:3)
- **Text must remain readable** at all Canvas sizes
- **Interactive elements** must maintain clickable areas

#### **4. Bundle Size Management (PERFORMANCE)**
- **Use dynamic imports** for external chart tools:
  ```typescript
  const GeographicChart = dynamic(() => import('./geographic-chart-component'), { ssr: false });
  ```
- **Store GeoJSON files** in `public/geo/` directory, fetch at runtime
- **Total external libraries** add ~150KB - acceptable for feature richness

#### **5. Data Validation & Error Handling (ROBUSTNESS)**
- **Geographic charts:** Handle missing region codes gracefully
- **Gauge charts:** Clamp values to min/max bounds
- **Calendar charts:** Validate date formats strictly (YYYY-MM-DD)
- **Treemap charts:** Handle negative values appropriately
- **Sankey charts:** Detect circular flow references
- **All charts:** Validate data structure before processing

#### **6. Accessibility Requirements (COMPLIANCE)**
- **All charts need proper ARIA labels** for screen readers
- **Color scales must pass WCAG contrast ratios**
- **Tooltips need keyboard navigation support**
- **Provide screen reader support** for data tables

### **🔄 Implementation Strategy:**

#### **Phase 1: Recharts-Native Tools (Weeks 1-2)**
1. Implement Area, Scatter, Radar, Funnel tools
2. Implement Treemap, Sankey, RadialBar, Composed tools
3. Test Canvas integration and responsive behavior
4. Validate design consistency with existing charts

#### **Phase 2: External Library Tools (Week 3)**
1. Install and configure external dependencies
2. Download and setup GeoJSON files
3. Implement Geographic, Gauge, Calendar Heatmap tools
4. Test bundle size impact and lazy loading

#### **Phase 3: Integration & Testing (Week 4)**
1. Update tool registration in `index.ts` and `tool-kit.ts`
2. Add chart artifact definitions
3. Test all charts in Canvas workspace
4. Performance optimization and accessibility audit

#### **Phase 4: Documentation & Polish (Week 5)**
1. Update chart selection UI components
2. Create comprehensive test suites
3. Update user documentation
4. Final QA and deployment preparation

### **🚫 Critical Gotchas to Avoid:**
- **DO NOT** hardcode chart dimensions - use responsive patterns
- **DO NOT** break existing Canvas grid layout logic
- **DO NOT** ignore the existing color scheme - maintain consistency
- **DO NOT** add dependencies without bundle size analysis
- **DO NOT** modify existing chart tool patterns - follow established conventions
- **NEVER** use fake IDs or hardcoded values to trick functionality
- **ALWAYS** test Canvas integration before considering a tool complete
- **ALWAYS** validate external GeoJSON data before production use
- **REMEMBER** all chart tools must support streaming with `async function*` patterns

### **✅ Validation Gates (Executable Commands):**

```bash
# Lint and Type Check
pnpm lint && pnpm check-types

# Unit Tests
pnpm test

# Build Test
pnpm build:local

# E2E Tests (Chart Creation & Canvas Integration)
pnpm test:e2e

# Bundle Size Analysis
npx bundle-analyzer

# Accessibility Audit
npx @axe-core/cli http://localhost:3000
```

---

## **🎯 Implementation Tasks (In Order):**

1. **Setup Dependencies & GeoJSON Files**
   - Install `react-simple-maps`, `react-gauge-component`, `@uiw/react-heat-map`
   - Download GeoJSON files to `public/geo/`
   - Test imports and basic functionality

2. **Phase 1: Recharts Tools (8 charts)**
   - `area-chart-tool.ts` + `area-chart.tsx`
   - `scatter-chart-tool.ts` + `scatter-chart.tsx`
   - `radar-chart-tool.ts` + `radar-chart.tsx`
   - `funnel-chart-tool.ts` + `funnel-chart.tsx`
   - `treemap-chart-tool.ts` + `treemap-chart.tsx`
   - `sankey-chart-tool.ts` + `sankey-chart.tsx`
   - `radial-bar-tool.ts` + `radial-bar-chart.tsx`
   - `composed-chart-tool.ts` + `composed-chart.tsx`

3. **Phase 2: External Library Tools (3 charts)**
   - `geographic-chart-tool.ts` + `geographic-chart.tsx`
   - `gauge-chart-tool.ts` + `gauge-chart.tsx`
   - `calendar-heatmap-tool.ts` + `calendar-heatmap.tsx`

4. **Integration Updates**
   - Update `src/lib/ai/tools/index.ts` with new tools
   - Update `src/lib/ai/tools/tool-kit.ts` with new tool registrations
   - Enhance `src/components/canvas/charts/dashboard-charts.tsx`
   - Update `src/components/artifacts/chart-artifact.tsx` for new chart types

5. **Testing & Validation**
   - Test each chart tool individually
   - Test Canvas integration and responsive behavior
   - Test streaming and progress indication
   - Validate design consistency and accessibility
   - Performance testing and bundle size verification

---

**PRP Confidence Score: 9/10** - Comprehensive context provided with existing patterns, clear implementation path, executable validation gates, and thorough error handling documentation. Success probability for one-pass implementation is very high given the excellent existing foundation and detailed guidance.