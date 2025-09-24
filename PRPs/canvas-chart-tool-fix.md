# Canvas Chart Tool Availability Fix

## 🎯 Objective

Fix the issue where the main `create_chart` tool shows as "unavailable" to AI agents while specialized chart tools (e.g., `create_treemap_chart`) work correctly, preventing Canvas chart creation in agent conversations.

## 📋 Problem Statement

### Current Issue
- **Main chart tool broken**: `create_chart` tool returns "Model tried to call unavailable tool 'create_chart'"
- **Specialized tools work**: Individual artifact tools like `create_treemap_chart` function correctly
- **Canvas integration affected**: AI agents cannot create basic charts (bar, line, pie) through the main tool
- **User experience degraded**: Chart creation requests fail, forcing users to use specific chart type commands

### Impact Analysis
- **High Priority**: Core Canvas functionality broken for agent interactions
- **User Frustration**: Chart creation appears unreliable
- **Feature Inconsistency**: Some chart tools work, others don't
- **Agent Effectiveness**: Reduces AI agent capabilities significantly

## 🔍 Root Cause Analysis

### Research Findings

#### ✅ What's Working (Confirmed via investigation)
1. **Tool Architecture**: All 15 specialized chart tools properly defined in `src/lib/ai/tools/artifacts/`
2. **Tool Registration**: `chartTools` object correctly exports all tools including `create_chart: createChartTool`
3. **Toolkit Configuration**: `AppDefaultToolkit.Artifacts` enabled in default store (`src/app/store/index.ts:68`)
4. **Import Patterns**: Consistent logger imports using `import logger from "logger"` with proper tsconfig path mapping
5. **Specialized Tools**: Individual tools like `treemap_chart` load and execute successfully

#### ❌ What's Broken (Root Cause Analysis)
1. **Main Tool Loading**: `createChartTool` fails to load despite proper export structure
2. **Tool Availability**: Agent receives "unavailable tool" error specifically for `create_chart`
3. **Inconsistent Behavior**: Dual architecture creates confusion between main and specialized tools

### Technical Investigation Results

```typescript
// Tool registration is correct in src/lib/ai/tools/chart-tool.ts:
export const chartTools = {
  create_chart: createChartTool,              // ❌ Not loading
  update_chart: updateChartTool,              // ❌ Status unknown
  // Specialized tools (all working):
  create_treemap_chart: treemapChartArtifactTool,  // ✅ Working
  create_area_chart: areaChartArtifactTool,        // ✅ Working
  // ... 13 more specialized tools
};
```

### Suspected Root Causes
1. **Runtime Error in createChartTool**: Tool definition may have execution errors
2. **Import Resolution Issues**: Potential circular dependencies or module resolution problems
3. **Tool Loading Pipeline**: `loadAppDefaultTools()` may skip the main chart tool
4. **Agent Configuration Filter**: Tool availability filtering may exclude main tool

## 🛠️ Implementation Plan

### Phase 1: Diagnostic Implementation
**Goal**: Identify exact failure point in tool loading pipeline

#### Task 1.1: Add Comprehensive Tool Loading Diagnostics
**File**: `src/app/api/chat/shared.chat.ts` (lines 436-465)

```typescript
export const loadAppDefaultTools = (opt?: {
  mentions?: ChatMention[];
  allowedAppDefaultToolkit?: string[];
}) =>
  safe(APP_DEFAULT_TOOL_KIT)
    .map((tools) => {
      // Add diagnostic logging
      console.log('🔧 APP_DEFAULT_TOOL_KIT loaded:', Object.keys(tools));
      console.log('🔧 Artifacts toolkit tools:', Object.keys(tools[AppDefaultToolkit.Artifacts] || {}));

      if (opt?.mentions?.length) {
        const defaultToolMentions = opt.mentions.filter(
          (m) => m.type == "defaultTool",
        );
        console.log('🔧 Default tool mentions:', defaultToolMentions.map(m => m.name));

        return Array.from(Object.values(tools)).reduce((acc, t) => {
          const allowed = objectFlow(t).filter((_, k) => {
            const isAllowed = defaultToolMentions.some((m) => m.name == k);
            console.log(`🔧 Tool ${k}: ${isAllowed ? 'ALLOWED' : 'FILTERED'}`);
            return isAllowed;
          });
          return { ...acc, ...allowed };
        }, {});
      }

      const allowedAppDefaultToolkit =
        opt?.allowedAppDefaultToolkit ?? Object.values(AppDefaultToolkit);

      console.log('🔧 Allowed toolkits:', allowedAppDefaultToolkit);

      const result = allowedAppDefaultToolkit.reduce(
        (acc, key) => {
          const toolsForKey = tools[key] || {};
          console.log(`🔧 Toolkit ${key} has ${Object.keys(toolsForKey).length} tools:`, Object.keys(toolsForKey));
          return { ...acc, ...toolsForKey };
        },
        {} as Record<string, Tool>,
      );

      console.log('🔧 Final loaded tools:', Object.keys(result));
      return result;
    })
    .ifFail((e) => {
      console.error('❌ loadAppDefaultTools failed:', e);
      throw e;
    })
    .orElse({} as Record<string, Tool>);
```

#### Task 1.2: Add Main Chat API Tool Loading Validation
**File**: `src/app/api/chat/route.ts` (lines 182-190)

```typescript
const APP_DEFAULT_TOOLS = await safe()
  .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
  .map(() =>
    loadAppDefaultTools({
      mentions,
      allowedAppDefaultToolkit,
    }),
  )
  .orElse({});

// Add diagnostic validation
console.log('🎯 Chart tools diagnostic:');
console.log('  create_chart available:', 'create_chart' in APP_DEFAULT_TOOLS);
console.log('  create_treemap_chart available:', 'create_treemap_chart' in APP_DEFAULT_TOOLS);
console.log('  Total app default tools:', Object.keys(APP_DEFAULT_TOOLS).length);
console.log('  Chart-related tools:', Object.keys(APP_DEFAULT_TOOLS).filter(k => k.includes('chart')));
```

#### Task 1.3: Validate Tool Registration at Source
**File**: `src/lib/ai/tools/chart-tool.ts` (add at end of file)

```typescript
// Add validation at module load time
console.log('📊 Chart tools module loaded:');
console.log('  createChartTool defined:', typeof createChartTool);
console.log('  chartTools object:', Object.keys(chartTools));
console.log('  create_chart in chartTools:', 'create_chart' in chartTools);

// Validate tool execution doesn't throw
try {
  const testTool = chartTools.create_chart;
  console.log('  create_chart tool accessible:', typeof testTool.execute);
} catch (error) {
  console.error('❌ create_chart tool access failed:', error);
}
```

### Phase 2: Fix Implementation
**Goal**: Resolve identified issues and restore tool availability

#### Task 2.1: Fix Tool Loading Issues
Based on diagnostic results, implement appropriate fixes:

**Option A - Import Resolution Fix** (if import issues found):
```typescript
// In src/lib/ai/tools/chart-tool.ts
// Ensure all imports are properly resolved
import { tool as createTool } from "ai";
import { z } from "zod";
import { generateUUID } from "lib/utils";
import logger from "logger";

// Validate all artifact tool imports
import { areaChartArtifactTool } from "./artifacts/area-chart-tool";
// ... ensure all 15 artifact tools import successfully
```

**Option B - Runtime Error Fix** (if tool execution errors found):
```typescript
// Add error handling to createChartTool
export const createChartTool = createTool({
  description: `Create an interactive chart that streams to the Canvas workspace.`,
  inputSchema: z.object({
    // ... existing schema
  }),
  execute: async function* (params) {
    try {
      // Existing implementation with better error handling
      const chartId = generateUUID();

      // Validate all dependencies are available
      if (!logger) throw new Error("Logger not available");
      if (!generateUUID) throw new Error("UUID generator not available");

      // ... rest of implementation
    } catch (error) {
      logger.error("createChartTool execution failed:", error);
      throw new Error(`Chart tool failed: ${error.message}`);
    }
  }
});
```

#### Task 2.2: Simplify Tool Architecture (Long-term fix)
**Goal**: Eliminate dual tool architecture confusion

**Option A - Consolidate to Main Tool**:
```typescript
// Update createChartTool to support all chart types
export const createChartTool = createTool({
  inputSchema: z.object({
    chartType: z.enum([
      "bar", "line", "pie",           // Basic types
      "area", "scatter", "radar",     // Advanced types
      "funnel", "treemap", "sankey",  // Specialized types
      "geographic", "gauge", "heatmap" // External library types
    ]),
    // ... rest of schema
  }),
  // ... implementation that routes to appropriate chart creation logic
});
```

**Option B - Fix Registration Consistency**:
```typescript
// Ensure all tools use consistent naming and registration
export const chartTools = {
  // Main tools
  create_chart: createChartTool,
  update_chart: updateChartTool,

  // Specialized tools with consistent naming
  create_area_chart: areaChartArtifactTool,
  create_scatter_chart: scatterChartArtifactTool,
  // ... ensure all follow create_[type]_chart pattern
};
```

### Phase 3: Agent Configuration Fix
**Goal**: Ensure agents can access main chart tool

#### Task 3.1: Verify Agent Tool Access
**File**: `src/components/chat-bot.tsx` (lines 381-382)

```typescript
// Ensure tool configuration passes correctly
allowedAppDefaultToolkit: latestRef.current.allowedAppDefaultToolkit,
allowedMcpServers: latestRef.current.allowedMcpServers,

// Add validation
console.log('🤖 Agent tool config:', {
  allowedAppDefaultToolkit: latestRef.current.allowedAppDefaultToolkit,
  mentions: latestRef.current.mentions?.length,
  hasArtifactsToolkit: latestRef.current.allowedAppDefaultToolkit?.includes('artifacts')
});
```

#### Task 3.2: Fix Agent Tool Filtering (if needed)
Ensure no conditional logic excludes chart tools for agents:

```typescript
// Check for problematic patterns like:
// allowedAppDefaultToolkit: mentions?.length ? [] : allowedAppDefaultToolkit,
// This pattern would break agent tool access
```

## 🧪 Validation Gates

### Pre-Implementation Validation
```bash
# 1. Verify build succeeds
pnpm build:local

# 2. Verify no TypeScript errors
pnpm check-types

# 3. Verify linting passes
pnpm lint
```

### Runtime Validation Tests
```bash
# 1. Start development server
pnpm dev

# 2. Test tool loading in browser console (check for diagnostic logs)
# Navigate to http://localhost:3000/chat/new
# Open browser console, look for:
#   🔧 APP_DEFAULT_TOOL_KIT loaded: [...]
#   🔧 Artifacts toolkit tools: [...]
#   🎯 Chart tools diagnostic: [...]

# 3. Test agent chart creation
# Create a test agent, try: "Create a bar chart with sample data"
# Should see successful chart creation, not "unavailable tool" error
```

### Integration Test Validation
```typescript
// Test script: test-chart-tools.js
const testChartToolAccess = () => {
  // Simulate tool loading
  const { loadAppDefaultTools } = require('./src/app/api/chat/shared.chat.ts');
  const { AppDefaultToolkit } = require('./src/lib/ai/tools');

  const tools = loadAppDefaultTools({
    allowedAppDefaultToolkit: [AppDefaultToolkit.Artifacts]
  });

  console.log('Test Results:');
  console.log('✓ create_chart available:', 'create_chart' in tools);
  console.log('✓ create_treemap_chart available:', 'create_treemap_chart' in tools);
  console.log('✓ Total chart tools:', Object.keys(tools).filter(k => k.includes('chart')).length);

  return 'create_chart' in tools;
};
```

### Canvas Integration Validation
```bash
# 1. Test Canvas opening with charts
# 2. Verify "Open Canvas" buttons appear
# 3. Confirm charts render correctly in Canvas workspace
# 4. Test with both regular chat and agent conversations
```

## 📚 Context & References

### Architecture Documentation
- **Main Documentation**: `/CLAUDE.md` - Project architecture and Canvas system overview
- **Tool System**: `src/lib/ai/tools/` - Tool registration and loading patterns
- **Canvas Integration**: `src/components/canvas-panel.tsx` - Canvas workspace implementation
- **API Routes**: `src/app/api/chat/` - Tool loading and execution pipeline

### Key Files Modified
1. `src/app/api/chat/shared.chat.ts` - Tool loading diagnostics and fixes
2. `src/app/api/chat/route.ts` - Tool availability validation
3. `src/lib/ai/tools/chart-tool.ts` - Main tool definition and validation
4. `src/components/chat-bot.tsx` - Agent tool configuration (if needed)

### External References
- **Vercel AI SDK**: https://sdk.vercel.ai/docs/reference/ai-sdk-core/create-tool
- **Canvas Architecture**: Documented in project CLAUDE.md lines 173-189, 613-804
- **Tool Loading Pipeline**: Documented in project CLAUDE.md lines 322-335

## 🎯 Success Criteria

### Primary Success Metrics
- [ ] `create_chart` tool loads successfully in all contexts
- [ ] Agents can create charts using "create a bar chart" prompts
- [ ] No "unavailable tool" errors for main chart tool
- [ ] Canvas opens automatically for chart tool results
- [ ] Both main and specialized tools work consistently

### Secondary Success Metrics
- [ ] Tool loading diagnostics provide clear visibility
- [ ] Error messages are actionable for debugging
- [ ] Performance impact is minimal (<50ms additional load time)
- [ ] Agent tool access patterns are documented and consistent

### User Experience Validation
- [ ] Users can create charts through natural language in agent conversations
- [ ] Chart creation feels reliable and consistent
- [ ] Canvas integration works seamlessly
- [ ] Error states are clear and recoverable

## 🚨 Risk Mitigation

### High Risk Areas
1. **Tool Loading Changes**: Could affect other tool types
   - **Mitigation**: Test all tool categories after changes
2. **Agent Configuration**: Changes could break agent functionality
   - **Mitigation**: Test multiple agent configurations
3. **Canvas Integration**: Tool fixes could affect Canvas behavior
   - **Mitigation**: Comprehensive Canvas testing

### Rollback Plan
1. **Quick Rollback**: Remove diagnostic logging if it causes issues
2. **Full Rollback**: Revert to previous tool loading implementation
3. **Gradual Fix**: Implement fixes incrementally with feature flags

## 📈 Monitoring & Observability

### Success Metrics to Track
- Chart tool success rate (target: >95%)
- Tool loading errors (target: <1% of requests)
- Canvas chart creation time (target: <2 seconds)
- Agent chart creation success rate (target: >90%)

### Logging Strategy
- Tool loading diagnostics (temporary, for debugging)
- Chart creation success/failure rates
- Agent tool access patterns
- Canvas integration performance

## 💡 Implementation Priority

**Priority 1 (Critical)**: Diagnostic implementation to identify root cause
**Priority 2 (High)**: Fix main tool loading based on diagnostics
**Priority 3 (Medium)**: Agent configuration validation and fixes
**Priority 4 (Low)**: Architecture consolidation for long-term maintainability

---

**Implementation Confidence Score: 8/10**
*High confidence due to comprehensive research, clear diagnostic strategy, and well-understood architecture patterns. Risk mitigated through incremental approach and comprehensive validation gates.*