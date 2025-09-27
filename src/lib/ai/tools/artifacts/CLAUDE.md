# src/lib/ai/tools/artifacts/ - Chart Artifact Tools

17 specialized chart tools using native Vercel AI SDK streaming patterns for progressive Canvas building.

## Chart Tools

**Core Charts:** bar, line, pie, area
**Advanced:** funnel, radar, scatter, treemap, sankey, radial-bar, composed
**Specialized:** geographic (with TopoJSON), gauge, calendar-heatmap
**Data:** table-artifact for structured data presentation
**Coordination:** dashboard-orchestrator for multi-chart dashboards

## Development Patterns

**Tool Creation:**
```typescript
import { tool as createTool } from "ai";
import { z } from "zod";

export const chartTool = createTool({
  description: "Create charts with progressive building",
  inputSchema: z.object({ /* validation schema */ }),

  execute: async function* ({ data }) {
    yield { status: 'loading', message: 'Preparing...' };
    yield { status: 'processing', message: 'Creating chart...' };
    yield {
      status: 'success',
      chartData: processedData,
      shouldCreateArtifact: true // Critical for Canvas
    };
    return "Chart created";
  }
});
```

**Geographic Charts:** Require TopoJSON files in `/public/geo/` (world, US states, counties, DMA)

**Dashboard Orchestration:** Use `dashboard-orchestrator-tool.ts` for coordinated multi-chart layouts

**Critical:** All tools must return `shouldCreateArtifact: true` for Canvas integration