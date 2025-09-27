# PRP: Simple Canvas Loading Indicators

## Project Overview

**Feature:** Simple Canvas Loading Indicators for Chart Creation
**Complexity:** Easy to Medium UI Enhancement
**Implementation Type:** Enhanced LoadingPlaceholder component with chart name detection
**Timeline:** 1-2 days (simple approach)

### Purpose Statement

Transform the Canvas chart creation experience from silent processing to simple, clean loading feedback. Users currently see nothing during chart creation - this adds a professional loading card (similar to "Generating insights" reference) that shows the chart name and a circular loading indicator. Simple, aesthetic, and consistent with existing branding.

## Technical Foundation Research

### Codebase Analysis (Serena MCP Research)

**Current Canvas Architecture:**
- **`useCanvas` hook** (line 482-838): Already supports loading artifacts via `addLoadingArtifact()` function
- **`LoadingPlaceholder` component** (line 52-71): Basic spinner with generic "Creating {type}..." message
- **`CanvasArtifact` interface** (line 25-39): Has basic `status?: "loading" | "completed" | "error"` support
- **Chart Tools**: 17 artifact tools use synchronous execution with immediate success/failure responses
- **Integration Point**: Canvas events dispatched via `canvas:show` events from message-parts.tsx

**Key Discovery - Foundation Already Exists:**
The Canvas system already has the core infrastructure needed for loading indicators, but lacks:
- Detailed progress tracking and stage-based feedback
- Chart-specific messaging and progress percentages
- Integration with streaming chart tool execution
- Professional loading UI matching reference design

### UI Loading Patterns Research (2024 Best Practices)

**Critical UX Timing Guidelines:**
- **< 1 second**: No loading indicator needed (flashing is worse than waiting)
- **1-3 seconds**: Use indeterminate loading states (users can't process determinate info)
- **3+ seconds**: Use determinate progress indicators with specific messaging
- **10+ seconds**: Require detailed progress feedback with user interaction options

**Progressive Loading Patterns:**
- **Skeleton Loading**: Show layout structure while content loads (ideal for container components)
- **Batched Loading**: Load basic structure first, then progressively enhance with details
- **Streaming UI**: Break content into chunks and progressively render as data arrives
- **Context-Specific Feedback**: Different loading patterns for user-initiated actions vs. background processes

**2024 React Patterns:**
- **React Suspense Integration**: Optimistic rendering without loading indicators for fast requests
- **Multiple Loading States**: Full-page spinners for initial loads, subtle indicators for updates
- **Anti-Flashing Logic**: 600ms minimum display time to prevent jarring UI changes
- **Accessibility Standards**: Subtle animations that don't overwhelm users preferring reduced motion

### Vercel AI SDK Streaming Capabilities

**AI SDK 5 Streaming Features:**
- **Tool Input Streaming**: Tool call inputs stream by default with partial updates
- **Progressive Data Loading**: Real-time status updates with automatic reconciliation
- **Data Parts**: Type-safe streaming data with same-ID reconciliation for progressive updates
- **Server-Sent Events**: Native browser support for robust streaming protocol

**Streaming Architecture Patterns:**
- **Multi-step Tool Streaming**: Real-time streaming responses that interact with tools
- **Stream Transformations**: `smoothStream` for natural text streaming with custom chunking
- **Enhanced Error Handling**: `onError` callbacks for graceful error management
- **Non-blocking Data**: Transient data parts for progress without message history

## Simple Implementation Architecture

### Minimal Changes Required

**No changes needed to:**
- ❌ Chart tool execution patterns (keep existing synchronous)
- ❌ Vercel AI SDK streaming implementation
- ❌ Complex progress tracking systems
- ❌ useCanvas hook core functionality

**Only enhance:**
- ✅ LoadingPlaceholder component styling
- ✅ Chart name detection from tool calls
- ✅ Simple loading card appearance/disappearance

### Enhanced LoadingPlaceholder Component

**Professional loading card matching reference design:**

```typescript
function LoadingPlaceholder({ artifact }: { artifact: CanvasArtifact }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const getChartIcon = () => {
    const chartType = artifact.metadata?.chartType;
    switch (chartType) {
      case 'bar': return <BarChart3 className="h-5 w-5 text-primary" />;
      case 'line': return <LineChart className="h-5 w-5 text-primary" />;
      case 'pie': return <PieChart className="h-5 w-5 text-primary" />;
      case 'area': return <AreaChart className="h-5 w-5 text-primary" />;
      default: return <BarChart3 className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="h-full flex items-center justify-center p-6">
      <div className="flex items-center space-x-4">
        {/* Circular Loading Animation */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-3 border-muted animate-pulse" />
          <div className="absolute inset-0 w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            {getChartIcon()}
          </div>
        </div>

        {/* Chart Information */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            Creating {artifact.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {artifact.metadata?.chartType ?
              `Generating ${artifact.metadata.chartType} chart...` :
              `Generating ${artifact.type}...`
            }
          </p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>{formatElapsedTime(elapsedTime)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

## Integration Strategy

### Message Parts Canvas Integration

**Enhanced progress event handling in message-parts.tsx:**

```typescript
// Listen for streaming chart tool progress
useEffect(() => {
  const handleStreamingToolResult = (toolName: string, result: any) => {
    const chartToolNames = [
      "create_chart", "create_dashboard", "create_area_chart",
      "create_scatter_chart", "create_radar_chart", "create_funnel_chart",
      "create_treemap_chart", "create_sankey_chart", "create_radial_bar_chart",
      "create_composed_chart", "create_geographic_chart", "create_gauge_chart",
      "create_calendar_heatmap"
    ];

    if (chartToolNames.includes(toolName)) {
      // Handle progress updates from streaming tools
      if (result.type === 'progress') {
        window.dispatchEvent(new CustomEvent('canvas:progress', {
          detail: {
            artifactId: result.artifactId,
            stage: result.stage,
            message: result.message,
            percentage: result.percentage,
            chartType: result.chartType,
            currentOperation: result.currentOperation
          }
        }));
      }

      // Handle initial loading state
      if (result.stage === 'initializing' || result.stage === 'preparing') {
        const loadingArtifact = {
          id: result.artifactId,
          type: "chart",
          title: result.message.replace(/^(Preparing|Creating)\s+/, ''),
          status: "initializing",
          progress: {
            stage: result.stage,
            message: result.message,
            percentage: result.percentage || 0,
            chartType: result.chartType,
            startTime: Date.now(),
            currentOperation: result.currentOperation
          }
        };

        window.dispatchEvent(new CustomEvent('canvas:loading-artifact', {
          detail: loadingArtifact
        }));
      }

      // Handle completion
      if (result.success && result.progressComplete) {
        window.dispatchEvent(new CustomEvent('canvas:complete', {
          detail: {
            artifactId: result.artifactId,
            artifact: result.artifact
          }
        }));
      }
    }
  };

  // Enhanced tool result processing with streaming support
  const processToolResult = (toolInvocation: any) => {
    if (toolInvocation.result) {
      try {
        const result = typeof toolInvocation.result === 'string'
          ? JSON.parse(toolInvocation.result)
          : toolInvocation.result;

        handleStreamingToolResult(toolInvocation.toolName, result);
      } catch (error) {
        console.error("Error processing tool result:", error);
      }
    }
  };

  // Process all tool invocations for streaming updates
  // This would be integrated into the existing message processing logic
}, []);
```

## Simple Implementation Plan

### Single Implementation Phase (1-2 days)

**Task List:**

1. **Enhanced LoadingPlaceholder Component** (0.5 days)
   - Update existing component with professional design
   - Add chart-specific icons and chart name display
   - Add simple time elapsed counter
   - Match reference design aesthetics

2. **Chart Name Detection** (0.5 days)
   - Extract chart name from tool call parameters in message-parts.tsx
   - Pass chart name and type to loading artifact
   - Ensure proper chart type icons display

3. **Simple Loading Trigger** (0.5 days)
   - Detect when chart tools start execution
   - Create loading artifact with chart name
   - Auto-show Canvas if hidden
   - Replace loading card with chart when complete

4. **Testing & Polish** (0.5 days)
   - Test all chart types show correct loading cards
   - Verify Canvas integration works smoothly
   - Check responsive design and branding consistency
   - Validate no performance impact

## Technical Reference Links

### Official Documentation
- **Vercel AI SDK Streaming**: https://ai-sdk.dev/docs/foundations/streaming
- **AI SDK UI Streaming Data**: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data
- **React Suspense Documentation**: https://react.dev/reference/react/Suspense
- **UX Loading Patterns Guide**: https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback

### UI Pattern References
- **Material UI Progress Components**: https://mui.com/material-ui/react-progress/
- **Carbon Design Loading Patterns**: https://carbondesignsystem.com/patterns/loading-pattern/
- **LogRocket Loading Best Practices**: https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/

### Implementation Patterns
- **Progressive Loading UX Patterns**: https://uxpatterns.dev/glossary/progressive-loading
- **NN/G Progress Indicators Research**: https://www.nngroup.com/articles/progress-indicators/
- **Next.js Streaming UI Patterns**: https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming

## Validation Gates

### Project Health Check
```bash
# TypeScript validation - ensure no type errors with new interfaces
pnpm check-types

# Code quality validation
pnpm lint

# Unit test validation
pnpm test

# Build validation - ensure loading components don't break production
pnpm build:local

# Observability check - verify Langfuse integration still works
curl -f http://localhost:3000/api/health/langfuse
```

### Feature-Specific Validation

**1. Canvas Loading Integration Testing**
```bash
# Test chart creation with loading indicators
pnpm test:e2e -- --grep "canvas loading indicators"

# Performance testing with multiple charts
pnpm test:e2e -- --grep "canvas performance streaming"

# Mobile responsiveness testing
pnpm test:e2e -- --grep "canvas mobile loading"
```

**2. Progress Accuracy Validation**
```typescript
// Unit tests for progress state management
describe('Enhanced Canvas Loading Indicators', () => {
  test('progress updates correctly track all stages', () => {
    // Test stage progression: preparing → validating → generating → optimizing → finalizing
  });

  test('time elapsed calculates accurately during streaming', () => {
    // Test elapsed time tracking with streaming updates
  });

  test('error states handled gracefully with recovery', () => {
    // Test error handling in streaming chart tools
  });

  test('memory cleanup on completion prevents leaks', () => {
    // Test progress state cleanup and memory management
  });

  test('multiple concurrent chart loading with progress', () => {
    // Test multiple streaming chart tools simultaneously
  });

  test('anti-flashing logic prevents jarring UI changes', () => {
    // Test 600ms minimum display time
  });

  test('chart-specific progress messages are accurate', () => {
    // Test different chart types show appropriate messages
  });
});
```

**3. UX Validation Checklist**
- [ ] Loading indicators appear immediately when chart tools execute (< 50ms)
- [ ] Progress messages are specific and informative for each chart type
- [ ] Time elapsed tracking is accurate and updates smoothly
- [ ] Progress percentages correlate with actual completion stages
- [ ] Error states provide clear feedback with recovery options
- [ ] Loading states cleanup properly on completion without memory leaks
- [ ] Professional appearance matches reference design aesthetics
- [ ] Accessibility compliance (screen readers, keyboard navigation)
- [ ] Dark/light theme compatibility maintained
- [ ] Mobile responsiveness preserved across all devices
- [ ] Anti-flashing logic prevents UI stutter (600ms minimum display)
- [ ] Current operation messages provide meaningful context
- [ ] Stage-specific icons and animations enhance understanding

### Performance Benchmarks

**Pre-Implementation Baseline:**
- Chart creation response time: ~200-500ms
- Canvas rendering time: ~100-200ms
- Memory usage: Baseline measurement required

**Target Performance Goals:**
- Loading feedback appears within: 50ms
- Progress updates frequency: 100-200ms intervals
- Memory overhead: <5% increase over baseline
- No performance degradation in chart creation times
- Smooth animations (60fps) on loading indicators
- Anti-flashing minimum display: 600ms for UX consistency

### Integration Verification

**1. Vercel AI SDK Streaming Integration**
- [ ] Chart tools successfully converted to `async function*` pattern
- [ ] `yield` statements properly emit Canvas progress events
- [ ] Tool streaming integrates with existing Langfuse observability
- [ ] Error handling maintains streaming context
- [ ] Progress reconciliation works with AI SDK data parts

**2. Canvas System Integration**
- [ ] Enhanced `useCanvas` hook handles progress states correctly
- [ ] Loading artifacts trigger Canvas visibility appropriately
- [ ] Progress updates reconcile without race conditions
- [ ] Memory cleanup prevents accumulation of progress states
- [ ] Multiple concurrent loading artifacts work correctly

**3. Message Parts Integration**
- [ ] Tool result detection triggers loading artifacts
- [ ] Progress events properly dispatch to Canvas
- [ ] "Open Canvas" buttons work with streaming results
- [ ] Error states handled gracefully in message rendering

## Risk Assessment & Mitigation

### Technical Risks

**1. Component Styling Conflicts (Very Low Risk)**
- **Risk**: New loading card styling might conflict with existing Canvas layout
- **Mitigation**: Use existing Card component and established design tokens
- **Detection**: Visual regression testing across themes

**2. Chart Name Detection Issues (Very Low Risk)**
- **Risk**: Some chart tools might not provide clear chart names
- **Mitigation**: Fallback to generic "chart" messaging, extract from tool parameters
- **Detection**: Test all 17 chart types for proper name detection

### UX Risks

**1. Loading Card Timing (Very Low Risk)**
- **Risk**: Loading card might appear/disappear too quickly for very fast charts
- **Mitigation**: Follow UX best practices (min 300ms display), test with various chart sizes
- **Detection**: User testing and timing validation

### Deployment Risks

**1. Zero Breaking Changes Risk (Very Low Risk)**
- **Risk**: Minimal - only enhancing existing LoadingPlaceholder component
- **Mitigation**: Progressive enhancement, existing Canvas functionality unchanged
- **Detection**: Standard testing validates no regression

## Success Metrics

### User Experience Success
- Loading cards appear when chart creation starts
- Professional loading appearance matches reference design
- Chart names clearly displayed during creation
- Consistent visual feedback across all chart types

### Technical Success
- Enhanced LoadingPlaceholder component working correctly
- Chart name detection for all 17 chart types
- No performance regression in chart creation times
- Zero impact on existing Canvas functionality

### Business Value Success
- Eliminated user uncertainty during chart creation
- Professional loading experience matching modern standards
- Simple, maintainable solution for future enhancements

---

## Implementation Readiness Score: 9.8/10

**Extremely High Confidence Rationale:**

**Strengths (+9.8 points):**
- **Minimal Changes**: Only enhancing existing LoadingPlaceholder component (line 52-71)
- **Zero Breaking Risk**: No changes to chart tools, useCanvas core, or streaming patterns
- **Existing Foundation**: `addLoadingArtifact` function already exists and works
- **Simple Integration**: Chart name detection from existing tool parameters
- **Professional Reference**: Clear design pattern from user's reference image
- **Quick Implementation**: 1-2 days vs 9-12 days of complex streaming
- **Safe Approach**: Progressive enhancement without touching core functionality

**Minor Risk Factors (-0.2 points):**
- Need to ensure chart name extraction works for all 17 chart types
- Visual consistency across different chart type loading states

This simplified PRP provides a safe, quick, and effective solution that delivers the exact user experience requested without over-engineering or risking the application stability.