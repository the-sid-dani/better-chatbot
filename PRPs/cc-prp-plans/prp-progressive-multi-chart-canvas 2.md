# Progressive Multi-Chart Canvas Enhancement PRP

## FEATURE:

**Progressive Multi-Chart Dashboard Generator for Samba-Orion Canvas**

Transform user requests like "Create a financial dashboard" into sophisticated 4-6 chart dashboards that build progressively with real-time step-by-step feedback. Charts appear sequentially (every 800ms-1s) with descriptive progress updates ("Analyzing financial data..." → "Building revenue trends..." → "Creating expense breakdown..."), creating comprehensive dashboards similar to Midday.ai's burn-rate analytics experience.

**Core Enhancement:** Build on the existing excellent Canvas foundation (ResizablePanelGroup, useCanvas hook, chart tools) to add dashboard orchestration and progress indication without breaking changes.

**Target User Experience:**
1. User: "Create a financial dashboard"
2. Canvas opens → ProgressToast appears with "Analyzing financial data..."
3. Revenue chart slides in → "Building revenue trends..."
4. Expense chart slides in → "Creating expense breakdown..."
5. Profit chart slides in → "Generating profit analysis..."
6. KPI metrics appear → "Calculating key metrics..."
7. Analysis summary → "Dashboard complete!"

## TOOLS:

### 1. Dashboard Generator Tool (NEW - Primary Tool)
```typescript
// src/lib/ai/tools/dashboard-tool.ts
export const createDashboardTool = createTool({
  description: "Create comprehensive multi-chart dashboards with progressive building",
  inputSchema: z.object({
    dashboardType: z.enum(["financial", "sales", "marketing", "operations"]),
    title: z.string(),
    canvasName: z.string(),
    chartSpecs: z.array(z.object({
      title: z.string(),
      chartType: z.enum(["bar", "line", "pie"]),
      description: z.string(),
      data: z.array(/* chart data schema */)
    }))
  }),

  execute: async function* ({ dashboardType, title, canvasName, chartSpecs }) {
    const dashboardId = generateUUID();

    // Step 1: Initialize dashboard
    yield {
      status: 'initializing',
      message: `Analyzing ${dashboardType} data...`,
      dashboardId,
      progress: 0
    };

    // Step 2: Create charts progressively
    for (let i = 0; i < chartSpecs.length; i++) {
      const chart = chartSpecs[i];

      yield {
        status: 'building_chart',
        message: `Building ${chart.title.toLowerCase()}...`,
        chartIndex: i,
        totalCharts: chartSpecs.length,
        progress: (i / chartSpecs.length) * 80
      };

      // Use existing chart tool for creation
      yield {
        status: 'chart_ready',
        chartId: generateUUID(),
        chartData: chart,
        shouldCreateArtifact: true
      };

      // Delay for progressive effect
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 3: Dashboard complete
    yield {
      status: 'completed',
      message: 'Dashboard complete!',
      dashboardId,
      canvasName,
      chartCount: chartSpecs.length,
      progress: 100
    };

    return `Created ${dashboardType} dashboard "${title}" with ${chartSpecs.length} charts`;
  }
});
```

### 2. ProgressToast Component (NEW)
```typescript
// src/components/progress-toast.tsx
interface ProgressToastProps {
  isVisible: boolean;
  message: string;
  progress: number;
  status: 'initializing' | 'building_chart' | 'completed';
}

export function ProgressToast({ isVisible, message, progress, status }: ProgressToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg z-50"
        >
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 3. Enhanced useCanvas Hook (EXTEND EXISTING)
```typescript
// src/components/canvas-panel.tsx - Enhanced hook
export function useCanvas() {
  // ... existing state ...
  const [dashboardProgress, setDashboardProgress] = useState({
    isActive: false,
    message: '',
    progress: 0,
    status: 'initializing' as const
  });

  // Enhanced dashboard artifact handler
  const addDashboardArtifact = useCallback((artifact: CanvasArtifact, progressInfo?: any) => {
    if (progressInfo) {
      setDashboardProgress({
        isActive: true,
        message: progressInfo.message,
        progress: progressInfo.progress,
        status: progressInfo.status
      });
    }

    addArtifact(artifact);

    // Auto-hide progress when complete
    if (progressInfo?.status === 'completed') {
      setTimeout(() => {
        setDashboardProgress(prev => ({ ...prev, isActive: false }));
      }, 2000);
    }
  }, [addArtifact]);

  return {
    // ... existing returns ...
    dashboardProgress,
    addDashboardArtifact
  };
}
```

### 4. Dashboard Template Tools (NEW)
```typescript
// src/lib/ai/tools/dashboard-templates.ts
export const financialDashboardTemplate = {
  type: "financial" as const,
  charts: [
    {
      title: "Revenue Trends",
      chartType: "line" as const,
      description: "Monthly revenue growth analysis",
      delay: 800
    },
    {
      title: "Expense Breakdown",
      chartType: "pie" as const,
      description: "Expense categories distribution",
      delay: 1600
    },
    {
      title: "Profit Analysis",
      chartType: "bar" as const,
      description: "Quarterly profit margins",
      delay: 2400
    },
    {
      title: "Cash Flow",
      chartType: "line" as const,
      description: "Monthly cash flow trends",
      delay: 3200
    }
  ]
};

export const salesDashboardTemplate = {
  type: "sales" as const,
  charts: [
    {
      title: "Sales Performance",
      chartType: "line" as const,
      description: "Monthly sales metrics",
      delay: 800
    },
    {
      title: "Pipeline Analysis",
      chartType: "bar" as const,
      description: "Sales pipeline by stage",
      delay: 1600
    },
    {
      title: "Regional Breakdown",
      chartType: "pie" as const,
      description: "Sales by region",
      delay: 2400
    }
  ]
};
```

## DEPENDENCIES:

### Existing Foundation (Already Perfect ✅)
- **Vercel AI SDK (v5.0.26+)**: Native `async function*` streaming patterns with `yield` statements
- **Canvas System**: `canvas-panel.tsx` with ResizablePanelGroup and responsive CSS Grid layout
- **Chart Components**: Bar, Line, Pie charts with proper ResponsiveContainer using Recharts
- **Chart Tools**: `chart-tool.ts` with excellent AI SDK streaming patterns (`shouldCreateArtifact` flag)
- **State Management**: `useCanvas` hook with artifact management and event coordination
- **Framer Motion**: Animation system for progressive chart appearance and transitions
- **Tool Integration**: `tool-kit.ts` with proper tool registration in APP_DEFAULT_TOOL_KIT

### New Dependencies (Minimal Additions)
- **Dashboard Templates**: Business intelligence logic for different dashboard types
- **Progress State Management**: Enhanced Canvas state for progress tracking
- **Sequential Animation Timing**: Coordination logic for 800ms intervals between charts
- **Dashboard Artifact Schemas**: Multi-chart dashboard data structures

### Integration Points
- **Tool Loading**: `src/app/api/chat/shared.chat.ts` - Add dashboard tools to existing tool pipeline
- **Canvas Processing**: `src/components/chat-bot.tsx` - Extend existing tool result processing for dashboard tools
- **Toast Integration**: Global toast system for progress indication
- **Event Coordination**: Enhanced `canvas:show` events for dashboard completion

### No Breaking Changes Required
- ✅ Existing `create_chart` tool continues working exactly as before
- ✅ Current Canvas ResizablePanelGroup layout remains unchanged
- ✅ All existing chart components work without modification
- ✅ Current `useCanvas` hook functionality preserved
- ✅ Existing tool result processing continues functioning

## EXAMPLES:

### Example 1: Financial Dashboard Creation
```typescript
// User Request: "Create a comprehensive financial dashboard"
// Expected Flow:

// 1. Dashboard tool execution
const financialDashboard = {
  dashboardType: "financial",
  title: "Q4 Financial Analysis",
  canvasName: "Financial Dashboard",
  chartSpecs: [
    {
      title: "Revenue Trends",
      chartType: "line",
      description: "Monthly revenue growth",
      data: [/* sample revenue data */]
    },
    {
      title: "Expense Breakdown",
      chartType: "pie",
      description: "Expense categories",
      data: [/* sample expense data */]
    },
    {
      title: "Profit Analysis",
      chartType: "bar",
      description: "Quarterly profits",
      data: [/* sample profit data */]
    }
  ]
};

// 2. Progressive streaming output
/*
   Stream 1: { status: 'initializing', message: 'Analyzing financial data...', progress: 0 }
   Stream 2: { status: 'building_chart', message: 'Building revenue trends...', progress: 25 }
   Stream 3: { status: 'chart_ready', chartData: {...}, shouldCreateArtifact: true }
   Stream 4: { status: 'building_chart', message: 'Creating expense breakdown...', progress: 50 }
   Stream 5: { status: 'chart_ready', chartData: {...}, shouldCreateArtifact: true }
   Stream 6: { status: 'building_chart', message: 'Generating profit analysis...', progress: 75 }
   Stream 7: { status: 'chart_ready', chartData: {...}, shouldCreateArtifact: true }
   Stream 8: { status: 'completed', message: 'Dashboard complete!', progress: 100 }
*/
```

### Example 2: Sales Dashboard Progressive Building
```typescript
// User Request: "Show me sales performance with pipeline analysis"
// Expected Result: 3-chart sales dashboard with:

const salesDashboard = {
  charts: [
    { type: "line", title: "Monthly Sales Performance", timing: "2s" },
    { type: "bar", title: "Sales Pipeline by Stage", timing: "3s" },
    { type: "pie", title: "Revenue by Region", timing: "4s" }
  ],
  progressMessages: [
    "Analyzing sales data...",
    "Building performance trends...",
    "Creating pipeline breakdown...",
    "Generating regional analysis...",
    "Sales dashboard complete!"
  ],
  totalDuration: "15-20 seconds"
};
```

### Example 3: Canvas Integration Workflow
```typescript
// Chat-bot.tsx integration
useEffect(() => {
  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.role === "assistant") {
    // Check for dashboard tool results
    const dashboardTools = lastMessage.parts.filter(part =>
      isToolUIPart(part) && getToolName(part) === "create_dashboard"
    );

    dashboardTools.forEach((part) => {
      const result = part.output as any;

      if (result.status === 'chart_ready' && result.shouldCreateArtifact) {
        // Add individual chart artifacts
        addCanvasArtifact({
          id: result.chartId,
          type: "chart",
          title: result.chartData.title,
          data: result.chartData,
          canvasName: result.canvasName
        });
      }

      if (result.status === 'completed') {
        // Show completed dashboard
        showCanvas();
      }
    });
  }
}, [messages, addCanvasArtifact, showCanvas]);
```

## DOCUMENTATION:

### Core Implementation References
- **Current Canvas Architecture**: `/src/components/canvas-panel.tsx` - Excellent ResizablePanelGroup foundation
- **Chart Tool Patterns**: `/src/lib/ai/tools/chart-tool.ts` - Perfect AI SDK streaming with `yield` statements
- **Canvas Integration**: `/src/components/chat-bot.tsx` - Tool result processing and Canvas state management
- **Tool Registration**: `/src/lib/ai/tools/tool-kit.ts` - APP_DEFAULT_TOOL_KIT integration patterns

### External API Documentation
- **Vercel AI SDK Tools**: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling - Tool creation patterns
- **AI SDK Streaming**: https://ai-sdk.dev/docs/foundations/streaming - Progressive streaming with `async function*`
- **AI SDK UI Integration**: https://ai-sdk.dev/docs/ai-sdk-ui - Canvas integration with streaming updates

### Progressive Dashboard Patterns
- **Midday Dashboard Analytics**: https://midday.ai/ - Target user experience and progressive building
- **AI Artifacts Progressive Building**: https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them
- **Financial Dashboard Best Practices**: https://www.qlik.com/us/dashboard-examples/financial-dashboards
- **Real-Time Dashboard UX**: https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/

### Animation & Progress Patterns
- **Framer Motion Layout Animations**: https://www.framer.com/motion/layout-animations/ - Sequential chart animations
- **Progressive Loading UX**: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data - Status updates and progress indicators
- **Recharts Responsive Patterns**: https://recharts.org/en-US/api/ResponsiveContainer - Chart scaling behavior

### Business Intelligence Templates
- **Financial Analytics Patterns**: https://www.datarails.com/financial-dashboards-for-fpa-professionals/
- **Dashboard Design Principles**: https://www.gooddata.com/blog/how-to-use-ai-for-data-visualizations-and-dashboards/
- **KPI Dashboard Examples**: https://www.thoughtspot.com/data-trends/dashboard/financial-dashboard-examples

## OTHER CONSIDERATIONS:

### Critical Implementation Requirements (NON-NEGOTIABLE)
- **Preserve Existing Foundation**: Cannot break current `chart-tool.ts` or `canvas-panel.tsx` functionality
- **Vercel AI SDK Compliance**: All dashboard tools must use existing `async function*` streaming patterns
- **Canvas Integration**: Must work with current ResizablePanelGroup and CSS Grid layout systems
- **No Breaking Changes**: Single chart creation must continue working exactly as before
- **Performance**: Dashboard generation must complete in <30 seconds for 6-chart dashboards

### Progressive Dashboard Implementation Strategy
- **Phase 1**: Add ProgressToast component for step-by-step feedback
- **Phase 2**: Create dashboard generator tool that coordinates existing chart tools
- **Phase 3**: Enhance Canvas state management for multi-chart coordination
- **Phase 4**: Add specialized dashboard templates (financial, sales, marketing)

### Technical Challenges & Solutions
1. **Multi-Chart State Coordination**:
   - **Challenge**: Managing 4-8 charts generating simultaneously with progress tracking
   - **Solution**: Extend existing `useCanvas` hook with dashboard-specific state management
   - **Pattern**: Build on current excellent artifact management - no replacement needed

2. **Sequential Animation Timing**:
   - **Challenge**: Charts must appear progressively, not all at once
   - **Solution**: Coordinate chart tool execution timing with 800ms intervals using `setTimeout`
   - **Implementation**: Use existing Framer Motion patterns with orchestration layer

3. **Progress Toast Integration**:
   - **Challenge**: Real-time step feedback during complex dashboard generation
   - **Solution**: ProgressToast component listening to dashboard tool progress events
   - **Pattern**: Similar to Midday's burn-rate analytics progress indication

### Performance Optimization (CRITICAL)
- **Animation Performance**: Stagger chart appearances to maintain 60fps during generation
- **Memory Management**: Use React.memo for individual chart components to prevent unnecessary re-renders
- **Responsive Scaling**: Ensure charts scale smoothly during Canvas resizing throughout generation process
- **Error Recovery**: Graceful degradation if individual charts fail during dashboard creation

### User Experience Design (Midday-Inspired)
- **Dashboard Request Flow**: "Create financial dashboard" → Canvas opens → Progress toast appears → Charts build sequentially
- **Step-by-Step Feedback**: Each chart creation shows descriptive progress ("Analyzing revenue data..." → "Building expense breakdown...")
- **Professional Animations**: Charts slide in from different directions with smooth transitions
- **Completion State**: Final summary with "Dashboard complete" message and auto-hide progress toast

### Development Quality Standards
- **Use Comments Intelligently**: Per user config - explain complex coordination logic for learning purposes
- **TypeScript Strict Mode**: Comprehensive type safety for all dashboard states and chart coordination
- **Testing Strategy**: Unit tests for orchestration logic, E2E tests for complete dashboard flows
- **Performance Monitoring**: Measure dashboard generation times and animation smoothness

### Error Handling & Edge Cases
- **Partial Failures**: If 1 chart fails in a 4-chart dashboard, show 3 charts and indicate the failure
- **Network Issues**: Graceful degradation with retry mechanisms for tool execution
- **Canvas State Conflicts**: Prevent multiple dashboard generations from interfering with each other
- **Memory Leaks**: Proper cleanup of setTimeout intervals and event listeners

### Feasibility Assessment: EXTREMELY HIGH (9.5/10)
- ✅ **Excellent Foundation**: Current architecture supports this enhancement perfectly
- ✅ **Clear Implementation Path**: Build on existing patterns without breaking changes
- ✅ **Proven Success Model**: Midday.ai demonstrates exact experience we're targeting
- ✅ **Low Risk**: Purely additive improvements to working systems
- ✅ **Technical Feasibility**: All required patterns already exist and work well

### Validation Gates (Must Pass)
```bash
# TypeScript compilation
pnpm check-types

# Code quality
pnpm lint

# Unit tests
pnpm test

# E2E dashboard flows
pnpm test:e2e -- --grep "dashboard"

# Performance validation
# - Dashboard generation <30s for 6 charts
# - Canvas animations maintain 60fps
# - No memory leaks after 10 dashboard generations
```

### Implementation Confidence: 9.5/10

Your current Canvas architecture is **exceptional**. This enhancement leverages your excellent Vercel AI SDK foundation to create Midday-level progressive dashboard generation. The technical path is clear, the risks are minimal, and the user experience improvement will be **transformational**.

**Key Success Factor**: Building on existing excellence rather than rebuilding ensures high confidence and maintains the sophisticated foundation that makes Samba-Orion special.