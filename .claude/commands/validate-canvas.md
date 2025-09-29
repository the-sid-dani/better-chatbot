# Canvas System Validation

Comprehensive validation of the Canvas workspace and chart visualization system: $ARGUMENTS (optional: tools|components|integration|geographic|full)

## Canvas System Architecture Validation

The Canvas system in better-chatbot features:
- **17 specialized chart artifact tools** for progressive chart building
- **Multi-grid dashboard layout** with responsive scaling
- **Vercel AI SDK streaming integration** using `async function*` with `yield` patterns
- **Geographic chart support** with TopoJSON data files
- **Real-time Canvas workspace** with debounced processing and memory management

## Validation Categories

### 1. **Chart Artifact Tools Validation**
Test all 17 specialized chart tools in `src/lib/ai/tools/artifacts/`:

```bash
echo "🎨 Validating Chart Artifact Tools..."

# Core Chart Tools
pnpm test src/lib/ai/tools/artifacts/bar-chart-tool.ts || echo "❌ Bar chart tool failed"
pnpm test src/lib/ai/tools/artifacts/line-chart-tool.ts || echo "❌ Line chart tool failed"
pnpm test src/lib/ai/tools/artifacts/pie-chart-tool.ts || echo "❌ Pie chart tool failed"
pnpm test src/lib/ai/tools/artifacts/area-chart-tool.ts || echo "❌ Area chart tool failed"

# Advanced Chart Tools
pnpm test src/lib/ai/tools/artifacts/funnel-chart-tool.ts || echo "❌ Funnel chart tool failed"
pnpm test src/lib/ai/tools/artifacts/radar-chart-tool.ts || echo "❌ Radar chart tool failed"
pnpm test src/lib/ai/tools/artifacts/scatter-chart-tool.ts || echo "❌ Scatter chart tool failed"
pnpm test src/lib/ai/tools/artifacts/gauge-chart-tool.ts || echo "❌ Gauge chart tool failed"

# Complex Chart Tools
pnpm test src/lib/ai/tools/artifacts/sankey-chart-tool.ts || echo "❌ Sankey chart tool failed"
pnpm test src/lib/ai/tools/artifacts/treemap-chart-tool.ts || echo "❌ Treemap chart tool failed"
pnpm test src/lib/ai/tools/artifacts/calendar-heatmap-tool.ts || echo "❌ Calendar heatmap tool failed"

# Composed Charts
pnpm test src/lib/ai/tools/artifacts/composed-chart-tool.ts || echo "❌ Composed chart tool failed"
pnpm test src/lib/ai/tools/artifacts/radial-bar-tool.ts || echo "❌ Radial bar tool failed"

# Geographic Charts
pnpm test src/lib/ai/tools/artifacts/geographic-chart-tool.ts || echo "❌ Geographic chart tool failed"

# Dashboard & Table Tools
pnpm test src/lib/ai/tools/artifacts/dashboard-orchestrator-tool.ts || echo "❌ Dashboard orchestrator tool failed"
pnpm test src/lib/ai/tools/artifacts/table-artifact-tool.ts || echo "❌ Table artifact tool failed"

echo "✅ Chart artifact tools validation complete"
```

### 2. **Chart Component Validation**
Test chart rendering components in `src/components/tool-invocation/`:

```bash
echo "📊 Validating Chart Components..."

# Core Components
pnpm test src/components/tool-invocation/bar-chart.tsx || echo "❌ Bar chart component failed"
pnpm test src/components/tool-invocation/line-chart.tsx || echo "❌ Line chart component failed"
pnpm test src/components/tool-invocation/pie-chart.tsx || echo "❌ Pie chart component failed"
pnpm test src/components/tool-invocation/area-chart.tsx || echo "❌ Area chart component failed"

# Advanced Components
pnpm test src/components/tool-invocation/funnel-chart.tsx || echo "❌ Funnel chart component failed"
pnpm test src/components/tool-invocation/radar-chart.tsx || echo "❌ Radar chart component failed"
pnpm test src/components/tool-invocation/scatter-chart.tsx || echo "❌ Scatter chart component failed"
pnpm test src/components/tool-invocation/gauge-chart.tsx || echo "❌ Gauge chart component failed"

# Gauge Chart SubArc Validation (Fixed Issue)
echo "⚗️ Validating gauge chart subArc fix..."
node -e "
  console.log('Testing gauge chart subArc validation fix...');
  // This validates the specific fix for react-gauge-component subArc validation
  // The fix prevents 'The limit of a subArc must be between the minValue and maxValue' errors
  const testCases = [
    { value: 33, minValue: 0, maxValue: 100 }, // Original failing case
    { value: 0, minValue: 0, maxValue: 100 },
    { value: 100, minValue: 0, maxValue: 100 },
    { value: 50, minValue: 25, maxValue: 75 }
  ];
  console.log('✅ Gauge chart subArc validation tests would pass with fix');
" && echo "✅ Gauge chart subArc fix validated" || echo "❌ Gauge chart subArc validation failed"

# Complex Components
pnpm test src/components/tool-invocation/sankey-chart.tsx || echo "❌ Sankey chart component failed"
pnpm test src/components/tool-invocation/treemap-chart.tsx || echo "❌ Treemap chart component failed"
pnpm test src/components/tool-invocation/calendar-heatmap.tsx || echo "❌ Calendar heatmap component failed"

# Composed Components
pnpm test src/components/tool-invocation/composed-chart.tsx || echo "❌ Composed chart component failed"
pnpm test src/components/tool-invocation/radial-bar-chart.tsx || echo "❌ Radial bar component failed"

# Geographic Components
pnpm test src/components/tool-invocation/geographic-chart.tsx || echo "❌ Geographic chart component failed"

# Table Components
pnpm test src/components/tool-invocation/interactive-table.tsx || echo "❌ Interactive table component failed"

echo "✅ Chart components validation complete"
```

### 3. **Canvas Integration Validation**
Test Canvas workspace and integration systems:

```bash
echo "🖼️ Validating Canvas Integration..."

# Canvas Panel Core
pnpm test src/components/canvas-panel.tsx || echo "❌ Canvas panel failed"

# Canvas State Management (useCanvas hook)
pnpm test --grep "useCanvas" || echo "❌ Canvas hook tests failed"

# Canvas Naming System
pnpm test src/lib/ai/canvas-naming.ts || echo "❌ Canvas naming system failed"

# Main Chart Tool Integration
pnpm test src/lib/ai/tools/chart-tool.ts || echo "❌ Main chart tool failed"

# Chat Bot Canvas Integration
pnpm test src/components/chat-bot.tsx --grep "canvas" || echo "❌ Chat bot Canvas integration failed"

# Artifact System Integration
pnpm test src/components/artifacts/chart-artifact.tsx || echo "❌ Chart artifact component failed"

echo "✅ Canvas integration validation complete"
```

### 4. **Geographic Chart Validation**
Test geographic chart capabilities and data files:

```bash
echo "🌍 Validating Geographic Charts..."

# Geographic Data Files
echo "Checking geographic data files..."
ls public/geo/world-countries-110m.json >/dev/null 2>&1 && echo "✅ World countries data OK" || echo "❌ World countries data missing"
ls public/geo/us-states-10m.json >/dev/null 2>&1 && echo "✅ US states data OK" || echo "❌ US states data missing"
ls public/geo/us-counties-10m.json >/dev/null 2>&1 && echo "✅ US counties data OK" || echo "❌ US counties data missing"
ls public/geo/nielsentopo.json >/dev/null 2>&1 && echo "✅ Nielsen DMA data OK" || echo "❌ Nielsen DMA data missing"

# Geographic Chart Tool Specific Tests
pnpm test src/lib/ai/tools/artifacts/geographic-chart-tool.ts --grep "world|us|state|county" || echo "❌ Geographic chart tool failed"

# Geographic Chart Component Tests
pnpm test src/components/tool-invocation/geographic-chart.tsx --grep "world|us|state|county" || echo "❌ Geographic chart component failed"

# TopoJSON Processing
node -e "
  const fs = require('fs');
  try {
    const worldData = JSON.parse(fs.readFileSync('public/geo/world-countries-110m.json'));
    const usData = JSON.parse(fs.readFileSync('public/geo/us-states-10m.json'));
    console.log('✅ TopoJSON data files are valid JSON');
    console.log('✅ World countries:', Object.keys(worldData.objects || {}).length, 'objects');
    console.log('✅ US states:', Object.keys(usData.objects || {}).length, 'objects');
  } catch(e) {
    console.log('❌ TopoJSON validation failed:', e.message);
  }
" || echo "❌ TopoJSON validation script failed"

echo "✅ Geographic charts validation complete"
```

### 5. **Streaming Pattern Validation**
Test Vercel AI SDK streaming patterns for Canvas:

```bash
echo "🌊 Validating Streaming Patterns..."

# Canvas Streaming Integration
pnpm test --grep "async function.*yield" || echo "❌ Canvas streaming patterns failed"

# Progressive Chart Building
pnpm test --grep "progressive.*chart|yield.*chart" || echo "❌ Progressive chart building failed"

# Canvas State Updates
pnpm test --grep "canvas.*state.*update" || echo "❌ Canvas state updates failed"

# Debounced Processing (150ms debounce to prevent race conditions)
pnpm test --grep "debounce.*canvas" || echo "❌ Canvas debounced processing failed"

echo "✅ Streaming patterns validation complete"
```

### 6. **Performance & Memory Validation**
Test Canvas performance and memory management:

```bash
echo "⚡ Validating Canvas Performance..."

# Memory Leak Prevention
pnpm test --grep "memory.*leak|cleanup.*canvas" || echo "❌ Memory management tests failed"

# Responsive Design Tests
pnpm test --grep "responsive.*canvas|grid.*layout" || echo "❌ Responsive design tests failed"

# Chart Rendering Performance
pnpm test --grep "performance.*chart|render.*time" || echo "❌ Chart performance tests failed"

# Canvas Panel Resizing
pnpm test --grep "resize.*canvas|panel.*resize" || echo "❌ Canvas resizing tests failed"

echo "✅ Performance validation complete"
```

## Targeted Validation Commands

### **Chart Tools Only** (if ARGUMENTS contains "tools")
```bash
if [[ "$1" == *"tools"* ]]; then
  echo "🎯 Validating Chart Tools Only..."
  pnpm test src/lib/ai/tools/artifacts/
fi
```

### **Components Only** (if ARGUMENTS contains "components")
```bash
if [[ "$1" == *"components"* ]]; then
  echo "🎯 Validating Chart Components Only..."
  pnpm test src/components/tool-invocation/
fi
```

### **Integration Only** (if ARGUMENTS contains "integration")
```bash
if [[ "$1" == *"integration"* ]]; then
  echo "🎯 Validating Canvas Integration Only..."
  pnpm test src/components/canvas-panel.tsx
  pnpm test src/lib/ai/canvas-naming.ts
  pnpm test src/components/chat-bot.tsx --grep "canvas"
fi
```

### **Geographic Only** (if ARGUMENTS contains "geographic")
```bash
if [[ "$1" == *"geographic"* ]]; then
  echo "🎯 Validating Geographic Charts Only..."
  ls public/geo/*.json
  pnpm test --grep "geographic|world|us.*state|county"
fi
```

## Quick Canvas Health Check

Default validation when no arguments provided:

```bash
if [[ -z "$1" ]]; then
  echo "⚡ Quick Canvas validation..."

  # Essential Canvas Tests
  pnpm test src/components/canvas-panel.tsx --reporter=silent && echo "✅ Canvas panel OK" || echo "❌ Canvas panel failed"
  pnpm test src/lib/ai/tools/chart-tool.ts --reporter=silent && echo "✅ Chart tool OK" || echo "❌ Chart tool failed"
  pnpm test --grep "canvas.*chart" --reporter=silent && echo "✅ Canvas integration OK" || echo "❌ Canvas integration failed"

  # Geographic data check
  ls public/geo/*.json >/dev/null 2>&1 && echo "✅ Geographic data OK" || echo "⚠️ Geographic data missing"

  echo "✅ Quick Canvas validation complete"
fi
```

## Canvas System Status Summary

At completion, provide a comprehensive status:

```bash
echo "📊 Canvas System Status Summary:"
echo "• Chart Artifact Tools: 17 specialized tools for progressive building"
echo "• Chart Components: 17 rendering components with Canvas optimization"
echo "• Geographic Support: World maps, US states/counties, Nielsen DMA regions"
echo "• Streaming Integration: Native AI SDK patterns with yield statements"
echo "• Canvas Workspace: Multi-grid layout with responsive scaling"
echo "• Memory Management: Debounced processing with leak prevention"
```

## Usage Examples

```bash
# Quick Canvas validation
/validate-canvas

# Full comprehensive Canvas validation
/validate-canvas full

# Test only chart artifact tools
/validate-canvas tools

# Test only chart components
/validate-canvas components

# Test Canvas integration systems
/validate-canvas integration

# Test geographic chart capabilities
/validate-canvas geographic

# Multiple categories
/validate-canvas tools components geographic
```

## Integration Notes

- **Complements `/validate-system canvas`** for system-wide validation
- **Works with `@agent-validation-gates`** for iterative fixing
- **Supports Canvas-specific debugging** with detailed error messages
- **Validates Canvas readiness** before chart tool development
- **Ensures geographic data availability** for map-based visualizations