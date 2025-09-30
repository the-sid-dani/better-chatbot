# Phase 3: Testing & Validation Checklist

**Date:** 2025-09-30
**Project:** Remove create_chart/update_chart Redundant Tools
**Status:** Phase 2 Complete - Tool Removal ✅

---

## Testing Overview

**Goal:** Verify all 15 specialized chart tools work correctly after removing create_chart/update_chart

**Method:** Interactive testing via chat interface on localhost:3000

**Expected Results:**
- All 15 chart types render correctly in Canvas
- Progressive building (loading → processing → success) works
- No "Open Canvas" button missing issues
- No stuck loading states
- Error handling works properly

---

## Task 10: Individual Chart Tool Testing

### Core Charts (3)

**1. Bar Chart** (`create_bar_chart`)
- [ ] Test with single series data
- [ ] Test with multiple series data
- [ ] Verify Canvas opens and renders correctly
- [ ] Check loading states work
- **Test prompt:** "Create a bar chart showing quarterly sales: Q1=100, Q2=150, Q3=200, Q4=175"

**2. Line Chart** (`create_line_chart`)
- [ ] Test with time series data
- [ ] Test with multiple lines
- [ ] Verify smooth animations
- **Test prompt:** "Create a line chart showing monthly revenue trends over 6 months"

**3. Pie Chart** (`create_pie_chart`)
- [ ] Test with percentage data
- [ ] Verify labels and values display correctly
- [ ] Check color distribution
- **Test prompt:** "Create a pie chart showing market share: Company A=35%, B=25%, C=20%, D=20%"

---

### Advanced Charts (8)

**4. Area Chart** (`create_area_chart`)
- [ ] Test with stacked data
- [ ] Verify fill gradients
- **Test prompt:** "Create an area chart showing website traffic sources over time"

**5. Scatter Chart** (`create_scatter_chart`)
- [ ] Test with x/y coordinate data
- [ ] Verify point clustering visible
- **Test prompt:** "Create a scatter plot showing height vs weight: (170,65), (180,75), (160,55), (175,70)"

**6. Radar Chart** (`create_radar_chart`)
- [ ] Test with multi-dimensional data
- [ ] Verify polygon rendering
- **Test prompt:** "Create a radar chart comparing product features: Speed=8, Quality=9, Price=6, Design=7, Support=8"

**7. Funnel Chart** (`create_funnel_chart`)
- [ ] Test with conversion stages
- [ ] Verify descending order
- **Test prompt:** "Create a funnel chart showing sales stages: Leads=1000, Qualified=500, Demo=200, Closed=50"

**8. Treemap Chart** (`create_treemap_chart`)
- [ ] Test with flat data (no children)
- [ ] Test with hierarchical data (with children)
- [ ] Verify text sizing based on cell size
- **Test prompt:** "Create a treemap showing storage usage: Documents=500GB, Photos=300GB, Videos=800GB, Apps=150GB"

**9. Sankey Chart** (`create_sankey_chart`)
- [ ] Test with flow data (nodes and links)
- [ ] Verify flow directions correct
- **Test prompt:** "Create a sankey diagram showing energy flow: Coal→Electricity→Homes=50, Solar→Electricity→Homes=30"

**10. Radial Bar Chart** (`create_radial_bar_chart`)
- [ ] Test with percentage/metric data
- [ ] Verify circular rendering
- **Test prompt:** "Create a radial bar chart showing KPI completion: Sales=85%, Marketing=92%, Support=78%"

**11. Composed Chart** (`create_composed_chart`)
- [ ] Test with mixed chart types (bars + lines)
- [ ] Verify multiple axes if needed
- **Test prompt:** "Create a composed chart showing revenue (bars) and profit margin (line) over 6 months"

---

### Specialized Charts (3)

**12. Geographic Chart** (`create_geographic_chart`)
- [ ] Test with country-level data
- [ ] Test with US state data
- [ ] Verify TopoJSON loading
- [ ] Check map rendering and colors
- **Test prompt:** "Create a geographic chart showing population by country: USA=330M, China=1400M, India=1380M, Brazil=212M"

**13. Gauge Chart** (`create_gauge_chart`)
- [ ] Test with percentage value
- [ ] Verify needle positioning
- [ ] Check color zones (red/yellow/green)
- **Test prompt:** "Create a gauge chart showing server CPU usage at 73%"

**14. Calendar Heatmap** (`create_calendar_heatmap`)
- [ ] Test with date-based data
- [ ] Verify calendar grid layout
- [ ] Check color intensity scaling
- **Test prompt:** "Create a calendar heatmap showing daily commits in January: varied activity across dates"

---

### Data Display (1)

**15. Table** (`createTable`)
- [ ] Test with structured tabular data
- [ ] Verify column headers and rows
- [ ] Check sorting/filtering if available
- **Test prompt:** "Create a table showing employee data: Name, Department, Salary for 5 employees"

---

## Task 11: Canvas Integration Testing

**Objectives:**
- [ ] Verify all chart types open in Canvas workspace
- [ ] Check "Open Canvas" button appears for all charts
- [ ] Verify charts display correctly in Canvas cards
- [ ] Test responsive sizing (100% height/width)
- [ ] Verify multiple charts can coexist in Canvas

**Test Cases:**
1. Create 3 different chart types in sequence - verify all appear in Canvas
2. Check Canvas grid layout adapts (1x1 → 2x2)
3. Verify chart interactions work (tooltips, hover states)

---

## Task 12: Dashboard Creation Testing

**Objectives:**
- [ ] Test multi-chart dashboard creation
- [ ] Verify all charts use same canvasName
- [ ] Check progressive building of multiple charts
- [ ] Verify no charts get stuck in loading

**Test Prompt:**
"Create a sales dashboard with 3 charts: bar chart for quarterly revenue, pie chart for product mix, and line chart for monthly trends"

**Success Criteria:**
- All 3 charts render successfully
- All charts grouped under same Canvas
- No loading state issues
- Proper grid layout

---

## Task 13: Error Handling & Validation

**Objectives:**
- [ ] Test invalid data handling
- [ ] Test missing required fields
- [ ] Verify validation error messages
- [ ] Check XSS prevention

**Test Cases:**

1. **Invalid data structure:**
   - Prompt: "Create a bar chart" (no data provided)
   - Expected: Clear error message

2. **Malformed data:**
   - Test with negative values where inappropriate
   - Test with extremely large numbers
   - Test with special characters in labels

3. **Edge cases:**
   - Empty data arrays
   - Single data point
   - Very long label names
   - Unicode characters

---

## Task 14: Data Edge Cases

**Test Scenarios:**

1. **Large datasets:**
   - [ ] 100+ data points in bar chart
   - [ ] 50+ categories in treemap
   - [ ] Performance remains acceptable

2. **Small datasets:**
   - [ ] Single data point charts
   - [ ] Two data points only

3. **Special data:**
   - [ ] Zero values
   - [ ] Negative values
   - [ ] Decimal values
   - [ ] Very large numbers (millions/billions)

4. **Unicode and special characters:**
   - [ ] Labels with emojis
   - [ ] Non-English characters (Chinese, Arabic, etc.)
   - [ ] Special symbols

---

## Task 15: Performance Validation

**Metrics to Check:**

1. **Tool Registry:**
   - [x] Validation logs show 15 chart tools ✅
   - [x] No missing tools errors ✅
   - [x] Total tools reduced from 24 to 22 ✅

2. **Chart Creation Speed:**
   - [ ] Bar chart: < 2 seconds
   - [ ] Pie chart: < 2 seconds
   - [ ] Geographic chart: < 5 seconds (TopoJSON load)
   - [ ] Dashboard (3 charts): < 10 seconds

3. **Canvas Performance:**
   - [ ] Smooth rendering of 5+ charts
   - [ ] No memory leaks after creating/closing charts
   - [ ] Responsive interactions (tooltips, hover)

4. **Server Logs:**
   - [ ] No validation errors
   - [ ] No tool execution failures
   - [ ] Clean compilation (no TypeScript errors)

---

## Validation Gates for Phase 3 Completion

**Must Pass:**
- [ ] All 15 specialized chart tools tested and working
- [ ] Canvas integration verified for all chart types
- [ ] Dashboard creation works without stuck loading states
- [ ] Error handling graceful with clear messages
- [ ] Edge cases handled properly
- [ ] Performance acceptable (no significant slowdowns)

**Optional Nice-to-Have:**
- [ ] Automated test suite for chart tools
- [ ] Visual regression tests
- [ ] Load testing with many concurrent charts

---

## Known Issues from Phase 1 (Fixed)

✅ Pie chart data transformation bug - FIXED
✅ Treemap children mapping error - FIXED
✅ Bar chart validation logging - ENHANCED
✅ Radial bar chart format - FIXED
✅ Calendar heatmap format - FIXED
✅ Dashboard orchestrator format - FIXED

---

## Testing Status

**Phase 3 Progress:** 0/6 tasks complete

**Current Task:** Task 10 - Individual chart tool testing
**Next Steps:** Begin interactive testing with localhost:3000 chat interface

---

## Notes

- Dev server running on localhost:3000
- Tool registry validation passing: 15/15 chart tools registered
- All Phase 2 removals successful
- No compilation errors
- Ready for comprehensive testing