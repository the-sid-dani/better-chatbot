# src/lib/ai/tools/artifacts/ - Chart Artifact Tools

17 specialized chart tools using native Vercel AI SDK streaming patterns for progressive Canvas building.

## Chart Tools

**Core Charts:** bar, line, pie, area
**Advanced:** funnel, radar, scatter, treemap, sankey, radial-bar, composed
**Specialized:** geographic (with TopoJSON), gauge, calendar-heatmap
**Data:** table-artifact for structured data presentation
**Coordination:** dashboard-orchestrator for multi-chart dashboards

## Development Patterns

**REQUIRED Tool Creation Pattern (Post Architecture Fix):**
```typescript
import { tool as createTool } from "ai";
import { z } from "zod";
import { DefaultToolName } from "../index";
import logger from "../../../logger";

export const chartTool = createTool({
  // 🚨 CRITICAL: Explicit name property required for registry validation
  name: DefaultToolName.CreateChartType, // Must match DefaultToolName enum

  description: "Create charts with progressive building",
  inputSchema: z.object({ /* validation schema */ }),

  execute: async function* ({ data }) {
    try {
      // 🚨 REQUIRED: Enhanced logging for debugging
      logger.info(`🔧 [${DefaultToolName.CreateChartType}] Tool execution started:`, {
        toolName: DefaultToolName.CreateChartType,
        dataCount: data?.length || 0,
      });

      yield { status: 'loading', message: 'Preparing...' };
      yield { status: 'processing', message: 'Creating chart...' };

      // 🚨 CRITICAL: Must return shouldCreateArtifact: true for Canvas
      yield {
        status: 'success',
        chartData: processedData,
        shouldCreateArtifact: true, // Flag for Canvas processing
        artifactId: generateUUID(),
        progress: 100
      };

      // 🚨 REQUIRED: Success logging
      logger.info(`✅ [${DefaultToolName.CreateChartType}] Tool execution completed successfully`);

      return {
        content: [{ type: "text", text: "Chart created successfully" }],
        structuredContent: { result: [chartResult] }
      };
    } catch (error) {
      // 🚨 REQUIRED: Error logging
      logger.error(`❌ [${DefaultToolName.CreateChartType}] Tool execution failed:`, {
        toolName: DefaultToolName.CreateChartType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
});
```

**Registry Integration Pattern:**
```typescript
// In src/lib/ai/tools/tool-kit.ts
export const APP_DEFAULT_TOOL_KIT = {
  [AppDefaultToolkit.Artifacts]: {
    // 🚨 CRITICAL: Key must exactly match DefaultToolName enum value
    [DefaultToolName.CreateChartType]: chartTool,
  }
} as const;
```

**Geographic Charts:** Require TopoJSON files in `/public/geo/` (world, US states, counties, DMA)

**Dashboard Orchestration:** Use `dashboard-orchestrator-tool.ts` for coordinated multi-chart layouts

**Critical:** All tools must return `shouldCreateArtifact: true` for Canvas integration

## Architecture Fix Notes (September 2025)

**Issue Resolved:** Chart tool registration failures in Vercel AI SDK v5.0.26 integration

**Root Cause:** Tool registry mismatch between DefaultToolName enum values and actual tool resolution

**Fix Applied:**
1. **Explicit Naming:** All chart tools now have explicit `name` property matching DefaultToolName enum
2. **Enhanced Debugging:** Structured logging for tool execution tracking
3. **Build-Safe Validation:** Development-only validation prevents production build failures
4. **Type Safety:** Compile-time constraints ensure tool name consistency

**Validation Commands:**
```bash
pnpm test src/app/api/chat/agent-tool-loading.test.ts  # Unit tests
pnpm lint src/lib/ai/tools/                           # Code quality
NODE_ENV=development pnpm dev                          # Debug mode with validation
```

**Debug Tools Available:**
- `DevToolDebugger.quickToolHealthCheck()` - Quick registry validation
- `DevToolDebugger.logToolRegistryDebugInfo()` - Detailed analysis
- `DevToolDebugger.validateSpecificTool(name)` - Individual tool validation

**Prevention:**
- All new chart tools MUST follow the required pattern above
- Registry validation runs automatically in development mode
- Comprehensive test suite prevents regression