# Tool Registry Snapshot - Before create_chart/update_chart Removal

**Date:** 2025-09-30
**Purpose:** Rollback reference for chart tool removal project
**Project:** Remove create_chart/update_chart redundant tools

---

## Current Tool Registry State

### Total Registered Tools: 22

**Breakdown by Toolkit:**
- WebSearch: 2 tools
- Http: 1 tool
- Code: 2 tools
- **Artifacts: 17 tools** (includes 2 to be removed)

---

## Artifacts Toolkit - Full Tool List

### Tools to be REMOVED (2):
1. `create_chart` - Generic catch-all chart tool
2. `update_chart` - Generic chart update tool

### Tools to be RETAINED (15):
**Core Charts (3):**
3. `create_bar_chart` - Bar chart tool
4. `create_line_chart` - Line chart tool
5. `create_pie_chart` - Pie chart tool

**Data Display (1):**
6. `createTable` - Table display tool

**Recharts-native Charts (8):**
7. `create_area_chart` - Area chart tool
8. `create_scatter_chart` - Scatter plot tool
9. `create_radar_chart` - Radar/spider chart tool
10. `create_funnel_chart` - Funnel chart tool
11. `create_treemap_chart` - Treemap visualization
12. `create_sankey_chart` - Sankey flow diagram
13. `create_radial_bar_chart` - Radial bar chart (circular progress)
14. `create_composed_chart` - Multi-type composed chart

**External Library Charts (3):**
15. `create_geographic_chart` - Geographic/map visualization (with TopoJSON)
16. `create_gauge_chart` - Gauge/speedometer chart
17. `create_calendar_heatmap` - Calendar heatmap (GitHub-style)

---

## Tool Registry Code Snapshot

### From `src/lib/ai/tools/tool-kit.ts` (lines 49-73):

```typescript
[AppDefaultToolkit.Artifacts]: {
  // Main chart tools - direct imports to avoid circular dependency
  [DefaultToolName.CreateChart]: createChartTool,              // ← TO BE REMOVED
  [DefaultToolName.UpdateChart]: updateChartTool,              // ← TO BE REMOVED

  // Core chart tools - fixed streaming artifacts
  [DefaultToolName.CreateBarChart]: barChartArtifactTool,
  [DefaultToolName.CreateLineChart]: lineChartArtifactTool,
  [DefaultToolName.CreatePieChart]: pieChartArtifactTool,

  // Table tool - moved from visualization toolkit
  [DefaultToolName.CreateTable]: tableArtifactTool,

  // Recharts-native chart tools - all 15 specialized tools restored
  [DefaultToolName.CreateAreaChart]: areaChartArtifactTool,
  [DefaultToolName.CreateScatterChart]: scatterChartArtifactTool,
  [DefaultToolName.CreateRadarChart]: radarChartArtifactTool,
  [DefaultToolName.CreateFunnelChart]: funnelChartArtifactTool,
  [DefaultToolName.CreateTreemapChart]: treemapChartArtifactTool,
  [DefaultToolName.CreateSankeyChart]: sankeyChartArtifactTool,
  [DefaultToolName.CreateRadialBarChart]: radialBarChartArtifactTool,
  [DefaultToolName.CreateComposedChart]: composedChartArtifactTool,

  // External library chart tools
  [DefaultToolName.CreateGeographicChart]: geographicChartArtifactTool,
  [DefaultToolName.CreateGaugeChart]: gaugeChartArtifactTool,
  [DefaultToolName.CreateCalendarHeatmap]: calendarHeatmapArtifactTool,
}
```

### From `src/lib/ai/tools/index.ts` (lines 18-36):

```typescript
export enum DefaultToolName {
  // Non-chart tools (6)
  CreateTable = "createTable",
  WebSearch = "webSearch",
  WebContent = "webContent",
  Http = "http",
  JavascriptExecution = "mini-javascript-execution",
  PythonExecution = "python-execution",

  // Chart tools to REMOVE (2)
  CreateChart = "create_chart",                                // ← TO BE REMOVED
  UpdateChart = "update_chart",                                // ← TO BE REMOVED

  // Core chart tools (3)
  CreateBarChart = "create_bar_chart",
  CreateLineChart = "create_line_chart",
  CreatePieChart = "create_pie_chart",

  // Recharts-native chart tools (8)
  CreateAreaChart = "create_area_chart",
  CreateScatterChart = "create_scatter_chart",
  CreateRadarChart = "create_radar_chart",
  CreateFunnelChart = "create_funnel_chart",
  CreateTreemapChart = "create_treemap_chart",
  CreateSankeyChart = "create_sankey_chart",
  CreateRadialBarChart = "create_radial_bar_chart",
  CreateComposedChart = "create_composed_chart",

  // External library chart tools (3)
  CreateGeographicChart = "create_geographic_chart",
  CreateGaugeChart = "create_gauge_chart",
  CreateCalendarHeatmap = "create_calendar_heatmap",
}
```

---

## Agent Configuration Impact

**Current State:**
- All agents with "Artifacts" toolkit access can use all 17 tools
- Tool count displayed in agent UI: **17 chart tools**

**After Removal:**
- Agents will have access to 15 specialized tools
- Tool count will display: **15 chart tools**
- **No functionality loss** - specialized tools cover all use cases

---

## Canvas Integration Status

**All 16 chart types verified in canvas-panel.tsx switch statement:**
- bar, line, pie, area, scatter, radar, funnel, treemap
- sankey, radial-bar (+ alias: radialbar)
- composed, geographic (+ alias: geo)
- gauge, calendar-heatmap (+ alias: heatmap)
- table (handled separately via artifact.type === "table")
- **Default fallback:** Falls back to BarChart with console.warn

---

## Files Involved in Removal

**Primary Files:**
1. `src/lib/ai/tools/chart-tool.ts` - File to DELETE
2. `src/lib/ai/tools/tool-kit.ts` - Remove lines 51-52 (imports + registry)
3. `src/lib/ai/tools/index.ts` - Remove lines 18-19 (enum entries)

**Secondary Files (prompts/docs):**
4. `src/lib/ai/prompts.ts` - Update line 178 tool selection guidance
5. `scripts/update-chart-tools.js` - Remove create_chart reference
6. `docs/charts-artifacts.md` - Update documentation
7. `PRPs/*.md` - Update project documentation

---

## Rollback Instructions

If removal causes issues, restore with:

1. Restore enum entries in `src/lib/ai/tools/index.ts`:
   ```typescript
   CreateChart = "create_chart",
   UpdateChart = "update_chart",
   ```

2. Restore registry entries in `src/lib/ai/tools/tool-kit.ts`:
   ```typescript
   [DefaultToolName.CreateChart]: createChartTool,
   [DefaultToolName.UpdateChart]: updateChartTool,
   ```

3. Restore file `src/lib/ai/tools/chart-tool.ts` from git history:
   ```bash
   git checkout HEAD -- src/lib/ai/tools/chart-tool.ts
   ```

4. Run type check and rebuild:
   ```bash
   pnpm check-types && pnpm build:local
   ```

---

## Validation Gates Before Proceeding

✅ All 16 specialized chart tools have consistent output format
✅ Canvas can render all chart types (verified in switch statement)
✅ 3 representative charts tested locally (bar, pie, treemap)
✅ Tool registry snapshot created (this document)

**Phase 1 Complete - Ready for Phase 2 (Tool Removal)**