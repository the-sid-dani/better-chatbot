# INITIAL-CHARTS.md

## FEATURE:

**Comprehensive Chart Library Extension for Canvas Workspace**

Implement 11 additional chart types to complement the existing bar, line, and pie charts, creating a comprehensive data visualization toolkit. All charts will integrate seamlessly with the Canvas workspace using the same progressive building patterns, design system, and Vercel AI SDK streaming architecture.

**Chart Categories:**
- **Recharts-native:** Area, Scatter, Radar, Funnel, Treemap, Sankey, RadialBar, Composed
- **External Libraries:** Geographic/DMA, Gauge/Speedometer, Calendar Heatmap

## TOOLS:

### 1. **area-chart-tool.ts** (Recharts AreaChart)
```typescript
// Similar to pie-chart-tool.ts structure
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
```
**Use Cases:** Time-series data, filled line charts, stacked metrics, cumulative values
**Canvas Integration:** Uses same `shouldCreateArtifact: true` pattern

### 2. **scatter-chart-tool.ts** (Recharts ScatterChart)
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
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  showBubbles: z.boolean().optional(),
  description: z.string().optional()
})
```
**Use Cases:** Correlation analysis, data point relationships, bubble charts
**Canvas Integration:** Same responsive sizing pattern as pie-chart-tool.ts

### 3. **radar-chart-tool.ts** (Recharts RadarChart)
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
  description: z.string().optional()
})
```
**Use Cases:** Multi-dimensional comparisons, performance metrics, skill assessments
**Canvas Integration:** Square aspect ratio like pie chart (`aspectRatio: "square"`)

### 4. **funnel-chart-tool.ts** (Recharts FunnelChart)
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    stage: z.string(),
    value: z.number(),
    fill: z.string().optional() // Custom color
  })),
  description: z.string().optional(),
  unit: z.string().optional()
})
```
**Use Cases:** Sales funnels, conversion rates, process flows, user journeys
**Canvas Integration:** Vertical layout optimization

### 5. **treemap-chart-tool.ts** (Recharts TreemapChart)
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
  })),
  description: z.string().optional()
})
```
**Use Cases:** Hierarchical data, file system visualization, budget breakdowns
**Canvas Integration:** Square container for proper proportions

### 6. **sankey-chart-tool.ts** (Recharts SankeyChart)
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
  })),
  description: z.string().optional()
})
```
**Use Cases:** Flow diagrams, energy flow, user journey flows, budget allocation flows
**Canvas Integration:** Wide aspect ratio for flow visualization

### 7. **radial-bar-tool.ts** (Recharts RadialBarChart)
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    name: z.string(),
    value: z.number(),
    maxValue: z.number().optional()
  })),
  description: z.string().optional(),
  innerRadius: z.number().optional().default(30),
  outerRadius: z.number().optional().default(80)
})
```
**Use Cases:** Circular progress indicators, comparative radial data, KPI dashboards
**Canvas Integration:** Square aspect ratio, centered layout

### 8. **composed-chart-tool.ts** (Recharts ComposedChart)
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
  })),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  description: z.string().optional()
})
```
**Use Cases:** Multiple data types on one chart, revenue + growth rate, sales + targets
**Canvas Integration:** Enhanced responsive handling for complex charts

### 9. **geographic-chart-tool.ts** (External: react-simple-maps)
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    regionCode: z.string(), // ISO code, DMA code, state code
    regionName: z.string(),
    value: z.number()
  })),
  geoType: z.enum(["world", "usa-states", "usa-dma", "usa-counties"]),
  colorScale: z.enum(["blues", "reds", "greens", "viridis"]).optional(),
  description: z.string().optional()
})
```
**Use Cases:** DMA analysis, state-level data, country comparisons, regional metrics
**External Dependency:** `react-simple-maps` + GeoJSON boundary files
**Canvas Integration:** Wide aspect ratio for map display

### 10. **gauge-chart-tool.ts** (External: react-gauge-component)
```typescript
inputSchema: z.object({
  title: z.string(),
  value: z.number(),
  minValue: z.number().default(0),
  maxValue: z.number().default(100),
  gaugeType: z.enum(["speedometer", "semi-circle", "radial"]),
  unit: z.string().optional(),
  thresholds: z.array(z.object({
    value: z.number(),
    color: z.string(),
    label: z.string().optional()
  })).optional(),
  description: z.string().optional()
})
```
**Use Cases:** KPIs, performance metrics, temperature gauges, speed indicators
**External Dependency:** `react-gauge-component`
**Canvas Integration:** Square aspect ratio, centered display

### 11. **calendar-heatmap-tool.ts** (External: @uiw/react-heat-map)
```typescript
inputSchema: z.object({
  title: z.string(),
  data: z.array(z.object({
    date: z.string(), // YYYY-MM-DD format
    value: z.number()
  })),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  colorScale: z.enum(["github", "blues", "greens", "reds"]).optional(),
  description: z.string().optional()
})
```
**Use Cases:** Activity tracking, daily metrics, contribution patterns, seasonal analysis
**External Dependency:** `@uiw/react-heat-map`
**Canvas Integration:** Wide aspect ratio for calendar layout

## DEPENDENCIES:

### **Core Dependencies (Already Available):**
- ✅ `ai` - Vercel AI SDK for tool creation
- ✅ `zod` - Schema validation
- ✅ `recharts` - Primary chart library (v3.2.1+)
- ✅ `react` - Component framework
- ✅ `lib/utils` - UUID generation
- ✅ `logger` - Logging system

### **New External Dependencies (Need Installation):**
```bash
# Geographic charts
npm install react-simple-maps

# Gauge charts
npm install react-gauge-component

# Calendar heatmaps
npm install @uiw/react-heat-map
```

### **GeoJSON Data Files (Need Download):**
- **USA States:** `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`
- **USA Counties:** `https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json`
- **Nielsen DMA Boundaries:** `https://gist.github.com/simzou/6459889#file-nielsentopo-json`
- **World Countries:** `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`

### **Integration Points:**
- ✅ **Canvas System:** `src/components/canvas-panel.tsx`
- ✅ **Chart Tools Index:** `src/lib/ai/tools/index.ts`
- ✅ **Tool Kit Integration:** `src/lib/ai/tools/tool-kit.ts`
- ✅ **Message Parts Rendering:** `src/components/message-parts.tsx`
- ✅ **Design System Colors:** `DASHBOARD_COLORS` array in existing chart components

### **Styling Dependencies:**
- ✅ **HSL Variables:** `hsl(var(--card))`, `hsl(var(--border))`, `hsl(var(--muted-foreground))`
- ✅ **Responsive Container:** `ResponsiveContainer` pattern from Recharts
- ✅ **Color Palette:** Existing `DASHBOARD_COLORS` array
- ✅ **Canvas Card Styling:** `bg-card` class and container patterns

## EXAMPLES:

### **File Structure Examples:**
```
src/lib/ai/tools/artifacts/
├── bar-chart-tool.ts          ✅ (existing)
├── line-chart-tool.ts         ✅ (existing)
├── pie-chart-tool.ts          ✅ (existing)
├── area-chart-tool.ts         🆕 (new)
├── scatter-chart-tool.ts      🆕 (new)
├── radar-chart-tool.ts        🆕 (new)
├── funnel-chart-tool.ts       🆕 (new)
├── treemap-chart-tool.ts      🆕 (new)
├── sankey-chart-tool.ts       🆕 (new)
├── radial-bar-tool.ts         🆕 (new)
├── composed-chart-tool.ts     🆕 (new)
├── geographic-chart-tool.ts   🆕 (new - external library)
├── gauge-chart-tool.ts        🆕 (new - external library)
└── calendar-heatmap-tool.ts   🆕 (new - external library)
```

### **Usage Examples in Chat:**
```
User: "Create a radar chart showing our team's skills in React, Python, Design, and Marketing"
AI: Uses radar-chart-tool.ts → Creates multi-dimensional skills assessment

User: "Show me a geographic map of sales by US state"
AI: Uses geographic-chart-tool.ts → Creates choropleth map with state boundaries

User: "Create a gauge showing our current server performance at 87%"
AI: Uses gauge-chart-tool.ts → Creates speedometer-style gauge

User: "Make a funnel chart of our conversion rates from leads to customers"
AI: Uses funnel-chart-tool.ts → Creates conversion funnel visualization
```

### **Canvas Integration Example:**
```typescript
// All tools follow this pattern from pie-chart-tool.ts:
yield {
  status: 'success',
  chartData: { title, data, chartType },
  shouldCreateArtifact: true  // ← This triggers Canvas integration
};
```

## DOCUMENTATION:

### **Primary Technical Documentation:**
- **Recharts Official:** https://recharts.org/en-US/api
  - AreaChart: https://recharts.org/en-US/api/AreaChart
  - ScatterChart: https://recharts.org/en-US/api/ScatterChart
  - RadarChart: https://recharts.org/en-US/api/RadarChart
  - FunnelChart: https://recharts.org/en-US/api/FunnelChart
  - Treemap: https://recharts.org/en-US/api/Treemap
  - SankeyChart: https://recharts.org/en-US/api/SankeyChart

### **External Library Documentation:**
- **React Simple Maps:** https://www.react-simple-maps.io/
  - Getting Started: https://www.react-simple-maps.io/docs/getting-started/
  - Choropleth Examples: https://www.react-simple-maps.io/examples/world-choropleth-mapchart/
- **React Gauge Component:** https://github.com/antoniolago/react-gauge-component
  - API Documentation: https://antoniolago.github.io/react-gauge-component/
- **UIW React Heat Map:** https://github.com/uiwjs/react-heat-map
  - Usage Examples: https://uiwjs.github.io/react-heat-map/

### **GeoJSON Resources:**
- **US Atlas (Topojson):** https://github.com/topojson/us-atlas
- **World Atlas:** https://github.com/topojson/world-atlas
- **Nielsen DMA Boundaries:** https://gist.github.com/simzou/6459889
- **US Census Boundaries:** https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html

### **Design System References:**
- **Tailwind Colors:** https://tailwindcss.com/docs/customizing-colors
- **Radix UI Primitives:** https://www.radix-ui.com/ (for tooltip/legend styling)
- **HSL CSS Variables:** Current implementation in `src/components/ui/` components

### **Vercel AI SDK References:**
- **Tool Creation:** https://ai-sdk.dev/docs/foundations/tools
- **Streaming Components:** https://ai-sdk.dev/docs/ai-sdk-rsc/streaming-react-components
- **Canvas Integration Patterns:** Existing implementation in `src/components/chat-bot.tsx`

## OTHER CONSIDERATIONS:

### **🚨 Critical Implementation Details:**

1. **Bundle Size Management:**
   - External libraries add ~150KB total
   - Use dynamic imports for external chart tools:
   ```typescript
   const GeographicChart = dynamic(() => import('./geographic-chart-component'), { ssr: false });
   ```

2. **GeoJSON File Handling:**
   - Store GeoJSON files in `public/geo/` directory
   - Fetch at runtime to avoid bundle bloat:
   ```typescript
   const geoData = await fetch('/geo/us-states-10m.json').then(r => r.json());
   ```

3. **Color Consistency:**
   - ALL chart tools must use the existing `DASHBOARD_COLORS` array
   - Geographic charts need color scale mapping to dashboard colors
   - Gauge charts should use threshold colors from dashboard palette

4. **Canvas Sizing Optimization:**
   - Different chart types need different aspect ratios:
     - Maps: `aspectRatio: "wide"` (16:9)
     - Gauges: `aspectRatio: "square"` (1:1)
     - Calendars: `aspectRatio: "wide"` (3:1)
     - Default: `aspectRatio: "standard"` (4:3)

5. **Error Handling Patterns:**
   - Follow exact pattern from `pie-chart-tool.ts`
   - Validate data structure before processing
   - Return proper error objects with `success: false`
   - Log all errors for debugging

6. **Performance Considerations:**
   - Large geographic datasets need virtualization
   - Calendar heatmaps with >365 days need pagination
   - Treemap with >100 nodes needs depth limiting
   - All external libraries should be lazy-loaded

7. **Accessibility Requirements:**
   - All charts need proper ARIA labels
   - Color scales must pass WCAG contrast ratios
   - Tooltips need keyboard navigation
   - Screen reader support for data tables

8. **Canvas Responsive Behavior:**
   - Charts must scale properly when Canvas panel is resized
   - Text should remain readable at all sizes
   - Interactive elements must maintain clickable areas
   - Legend positioning should adapt to container size

9. **Data Validation Edge Cases:**
   - Geographic: Handle missing region codes gracefully
   - Gauge: Clamp values to min/max bounds
   - Calendar: Validate date formats strictly
   - Treemap: Handle negative values appropriately
   - Sankey: Detect circular flow references

10. **Integration with Existing Architecture:**
    - Follow exact naming conventions from existing tools
    - Use same import patterns for consistency
    - Maintain same tool registration in `index.ts`
    - Preserve existing Canvas artifact detection logic
    - Keep consistent logging and error reporting

### **🔄 Migration Strategy:**
1. **Phase 1:** Implement Recharts-native tools (8 charts)
2. **Phase 2:** Add external library tools (3 charts)
3. **Phase 3:** Optimize performance and add advanced features
4. **Phase 4:** Create chart template combinations and presets

### **⚠️ Gotchas to Avoid:**
- **DO NOT** hardcode chart dimensions - use responsive patterns
- **DO NOT** break existing Canvas grid layout logic
- **DO NOT** ignore the existing color scheme - maintain consistency
- **DO NOT** add new dependencies without bundle size analysis
- **DO NOT** modify existing chart tool patterns - follow established conventions
- **ALWAYS** test Canvas integration before considering a tool complete
- **ALWAYS** validate external GeoJSON data before using in production
- **REMEMBER** that all chart tools must support streaming with `async function*` patterns

---

**Success Criteria:** All 11 new chart tools integrate seamlessly with Canvas workspace, maintain design consistency, follow Vercel AI SDK patterns, and provide professional data visualization capabilities matching the quality of existing bar/line/pie chart implementations.