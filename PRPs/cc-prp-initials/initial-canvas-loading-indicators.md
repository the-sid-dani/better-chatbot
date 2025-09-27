# Initial Plan: Enhanced Canvas Loading Indicators

## Feature Purpose & User Experience Goal

Transform the Canvas chart creation experience from silent processing to engaging, informative feedback that keeps users informed during AI-powered data visualization generation. Currently, users experience uncertainty when charts take time to create - they don't know if the system is working, what it's doing, or how long it might take.

**Target User Experience:**
- Clear visual feedback when chart creation begins
- Specific messaging about what type of chart is being created
- Progressive status updates ("Preparing data...", "Generating insights...", "Rendering visualization...")
- Professional loading animations matching the reference design
- Estimated progress indication where possible

**Reference Design Integration:** Implement loading cards similar to the "Generating insights" card shown in the user's reference image, displaying within Canvas workspace cards with spinners, progress messaging, and chart-specific context.

## Core Technical Components

### 1. Enhanced Loading State Architecture

**Current State Analysis:**
- ✅ `useCanvas` hook has `addLoadingArtifact` function (line 627-644)
- ✅ `LoadingPlaceholder` component exists (line 53-72)
- ❌ Missing detailed progress tracking and stage-based feedback
- ❌ Generic messaging doesn't specify chart types or progress stages

**Enhancement Requirements:**
```typescript
interface CanvasArtifact {
  // ... existing fields
  status?: "initializing" | "processing" | "rendering" | "completed" | "error";
  progress?: {
    stage: "preparing" | "analyzing" | "generating" | "rendering" | "finalizing";
    message: string;
    percentage?: number;
    chartType?: string;
    startTime: number;
    estimatedDuration?: number;
  };
}
```

### 2. Progressive Chart Tool Execution

**Current Pattern Analysis:**
- Chart tools in `src/lib/ai/tools/artifacts/` use synchronous execution
- Tools return immediate success/failure without streaming progress
- No integration with Canvas loading states during execution

**Required Integration Pattern:**
```typescript
// Chart tools need streaming execution pattern
execute: async function* ({ title, data, chartType }) {
  // Trigger Canvas loading state
  yield {
    stage: "preparing",
    message: `Preparing ${chartType} chart: ${title}...`,
    percentage: 0
  };

  // Data validation and processing
  yield {
    stage: "analyzing",
    message: "Analyzing data structure...",
    percentage: 25
  };

  // Chart generation
  yield {
    stage: "generating",
    message: "Generating visualization...",
    percentage: 60
  };

  // Final rendering
  yield {
    stage: "rendering",
    message: "Rendering interactive chart...",
    percentage: 90
  };

  // Return final artifact
  return { success: true, artifact: chartContent };
}
```

### 3. Enhanced LoadingPlaceholder Component

**Current Implementation Analysis:**
- Basic spinner with generic "Creating {type}..." message
- No progress tracking or detailed feedback
- Missing chart-specific context and professional styling

**Enhancement Design:**
```typescript
interface LoadingPlaceholderProps {
  artifact: CanvasArtifact;
  showProgress?: boolean;
  showTimeElapsed?: boolean;
}

function LoadingPlaceholder({
  artifact,
  showProgress = true,
  showTimeElapsed = true
}: LoadingPlaceholderProps) {
  // Professional loading card with:
  // - Chart type-specific icons and messaging
  // - Progress bar or percentage indicator
  // - Stage-based status messages
  // - Time elapsed counter
  // - Animated indicators matching reference design
}
```

## Technical Integration Points

### 1. Vercel AI SDK Streaming Integration

**Architecture Pattern:**
- Leverage existing Vercel AI SDK streaming capabilities (`async function*`)
- Integrate with current `experimental_telemetry` for observability
- Maintain compatibility with Langfuse tracing patterns

**Implementation Strategy:**
- Convert chart tools from synchronous to streaming execution
- Use `yield` statements for progress updates
- Emit Canvas-specific events during tool execution phases
- Integrate with existing tool result handling in `message-parts.tsx`

### 2. Canvas State Management Enhancement

**Current useCanvas Hook Extensions:**
```typescript
// Add progress tracking capabilities
const [loadingProgress, setLoadingProgress] = useState<Map<string, ProgressState>>();

const updateArtifactProgress = useCallback((
  id: string,
  progress: ProgressState
) => {
  // Update progress state with debouncing
  // Emit Canvas progress events
  // Update artifact status and messaging
}, []);
```

**Integration with Existing Patterns:**
- Extend current `addLoadingArtifact` and `updateArtifact` functions
- Maintain compatibility with existing debouncing (150ms) and memory management
- Preserve current Canvas naming and artifact management patterns

### 3. Message Parts Canvas Integration

**Current Integration Analysis:**
- "Open Canvas" buttons trigger `canvas:show` events (line 1047-1057)
- Chart tools detected via `chartToolNames` array (line 1129-1143)
- Success status determines Canvas integration (line 1146-1150)

**Required Enhancements:**
- Trigger loading artifacts when chart tools start execution
- Listen for progress events from streaming chart tools
- Update Canvas artifacts with real-time progress information
- Maintain existing event dispatch patterns for Canvas visibility

## File Architecture & Organization

### Primary Files Requiring Enhancement

**1. Canvas Core (`src/components/canvas-panel.tsx`)**
```
Line 53-72: LoadingPlaceholder component → Enhanced with progress tracking
Line 627-644: addLoadingArtifact function → Extended with progress capabilities
Line 646-673: updateArtifact function → Enhanced for progress updates
New: Progress tracking state management and time elapsed calculations
```

**2. Chart Tools (`src/lib/ai/tools/artifacts/*.ts`)**
```
All 17 chart tools need streaming execution pattern:
- bar-chart-tool.ts → Add yield-based progress emission
- line-chart-tool.ts → Integrate Canvas loading states
- pie-chart-tool.ts → Stage-based progress reporting
- ... (all chart artifacts)
```

**3. Message Integration (`src/components/message-parts.tsx`)**
```
Line 1047-1057: Canvas event dispatch → Extended for progress events
Line 1129-1143: Chart tool detection → Enhanced with loading state triggers
New: Progress event listeners and Canvas artifact creation
```

### New Components Required

**1. Enhanced Loading Components**
```
src/components/canvas/loading-indicator.tsx → Professional loading card
src/components/canvas/progress-tracker.tsx → Progress bar and status
src/components/canvas/chart-loading-states.tsx → Chart-specific loading UI
```

**2. Progress State Management**
```
src/lib/canvas/progress-manager.ts → Progress state coordination
src/lib/canvas/loading-states.ts → Loading state type definitions
```

## Development Strategy & Phases

### Phase 1: Core Infrastructure (Foundation)
**Duration: 2-3 days**

1. **Enhanced useCanvas Hook**
   - Add progress tracking state management
   - Extend artifact update functions for progress
   - Implement time elapsed tracking
   - Add debug logging for progress states

2. **Enhanced LoadingPlaceholder Component**
   - Professional loading card design
   - Chart type-specific messaging
   - Progress bar/percentage display
   - Time elapsed indicator
   - Stage-based status updates

3. **Progress State Type System**
   - Define comprehensive progress interfaces
   - Create chart-specific progress templates
   - Implement progress validation patterns

### Phase 2: Chart Tool Integration (Streaming)
**Duration: 3-4 days**

1. **Convert Core Chart Tools to Streaming**
   - Start with bar, line, and pie charts (most common)
   - Implement `async function*` execution pattern
   - Add stage-based progress emission
   - Integrate with Canvas loading states

2. **Progress Event System**
   - Create progress event emission system
   - Integrate with message-parts.tsx listeners
   - Coordinate Canvas artifact updates
   - Maintain backward compatibility

3. **Advanced Chart Tools Conversion**
   - Geographic, radar, sankey charts
   - Dashboard orchestrator tool
   - Complex multi-stage visualizations

### Phase 3: Integration & Polish (Professional UX)
**Duration: 2-3 days**

1. **Message Parts Integration**
   - Enhanced Canvas event handling
   - Loading artifact creation triggers
   - Progress update coordination
   - Error state handling improvements

2. **Professional Loading Design**
   - Match reference design aesthetics
   - Smooth animations and transitions
   - Responsive loading card layouts
   - Dark/light theme support

3. **Performance Optimization**
   - Progress update debouncing
   - Memory usage optimization
   - Loading state cleanup
   - Race condition prevention

### Phase 4: Testing & Validation
**Duration: 2 days**

1. **Functionality Testing**
   - All chart types with loading indicators
   - Progress accuracy validation
   - Error state handling
   - Canvas integration verification

2. **Performance Testing**
   - Large dataset loading performance
   - Multiple concurrent chart creation
   - Memory usage during extended sessions
   - Loading state cleanup verification

3. **UX Testing**
   - Loading feedback clarity and timing
   - Professional appearance validation
   - Accessibility compliance check
   - Mobile responsiveness verification

## Security & Access Patterns

### Authentication Integration
- **No Additional Auth Required**: Loading indicators are UI enhancement only
- **Existing Patterns**: Leverage current Better-Auth session management
- **Canvas Security**: Maintain existing Canvas access patterns

### Data Security Considerations
- **Progress Messages**: Ensure no sensitive data exposed in loading messages
- **Error States**: Apply existing XSS prevention patterns to progress text
- **Logging**: Use existing debug patterns for progress state logging

## Implementation Blueprint

### Key Files and Modification Strategy

**1. Canvas Panel Enhancement (`canvas-panel.tsx`)**
```typescript
// Add progress state management
const [progressStates, setProgressStates] = useState<Map<string, ProgressInfo>>();

// Enhanced LoadingPlaceholder with reference design elements
function LoadingPlaceholder({ artifact, progress }: Props) {
  return (
    <Card className="h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <ChartIcon className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{progress?.stage || 'Preparing'}</h3>
          <p className="text-sm text-muted-foreground">{artifact.title}</p>
          <p className="text-xs text-muted-foreground">
            {progress?.message || `Creating ${artifact.type}...`}
          </p>
        </div>

        {progress?.percentage && (
          <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-between text-xs mb-1">
              <span>{progress.stage}</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatElapsedTime(progress?.startTime)}</span>
        </div>
      </div>
    </Card>
  );
}
```

**2. Chart Tool Streaming Pattern**
```typescript
// Example: Enhanced bar chart tool with streaming
export const barChartArtifactTool = createTool({
  // ... existing config

  execute: async function* ({ title, data, description, yAxisLabel }) {
    const startTime = Date.now();
    const artifactId = generateUUID();

    // Emit initial loading state to Canvas
    yield {
      type: 'progress',
      artifactId,
      stage: 'preparing',
      message: `Preparing bar chart: ${title}`,
      percentage: 0,
      startTime,
      chartType: 'bar'
    };

    // Data validation phase
    yield {
      type: 'progress',
      artifactId,
      stage: 'analyzing',
      message: 'Validating and processing data...',
      percentage: 25
    };

    try {
      const validationResult = CHART_VALIDATORS.bar({ title, data, description, yAxisLabel });

      if (!validationResult.success) {
        yield { type: 'error', artifactId, message: validationResult.error };
        return;
      }

      // Chart generation phase
      yield {
        type: 'progress',
        artifactId,
        stage: 'generating',
        message: 'Generating visualization...',
        percentage: 60
      };

      const chartContent = {
        type: "bar-chart",
        title: validationResult.data!.title,
        data: validationResult.data!.data,
        // ... chart config
      };

      // Final rendering phase
      yield {
        type: 'progress',
        artifactId,
        stage: 'rendering',
        message: 'Rendering interactive chart...',
        percentage: 90
      };

      // Complete with artifact
      return {
        success: true,
        artifactId,
        artifact: {
          kind: "charts" as const,
          title: `Bar Chart: ${title}`,
          content: JSON.stringify(chartContent, null, 2),
          metadata: chartContent.metadata,
        },
        message: `Created bar chart "${title}" with ${data.length} data points.`,
        canvasReady: true,
      };

    } catch (error) {
      yield {
        type: 'error',
        artifactId,
        message: `Failed to create bar chart: ${error.message}`
      };
      throw error;
    }
  },
});
```

**3. Message Parts Progress Integration**
```typescript
// Enhanced chart tool detection with progress handling
useEffect(() => {
  const handleToolProgress = (event: CustomEvent) => {
    const { artifactId, stage, message, percentage } = event.detail;

    // Trigger Canvas loading artifact if not exists
    if (stage === 'preparing') {
      const loadingArtifact = {
        id: artifactId,
        type: "chart",
        title: message,
        status: "loading",
        progress: { stage, message, percentage, startTime: Date.now() }
      };

      // Dispatch to Canvas
      window.dispatchEvent(new CustomEvent('canvas:loading-artifact', {
        detail: loadingArtifact
      }));
    } else {
      // Update existing progress
      window.dispatchEvent(new CustomEvent('canvas:progress-update', {
        detail: { artifactId, stage, message, percentage }
      }));
    }
  };

  window.addEventListener('tool:progress', handleToolProgress);
  return () => window.removeEventListener('tool:progress', handleToolProgress);
}, []);
```

## Validation Requirements

### Standard Project Health Checks
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
pnpm test:e2e -- --grep "canvas loading"

# Performance testing with multiple charts
pnpm test:e2e -- --grep "canvas performance"

# Mobile responsiveness testing
pnpm test:e2e -- --grep "canvas mobile"
```

**2. Progress Accuracy Validation**
```typescript
// Unit tests for progress state management
describe('Canvas Loading Indicators', () => {
  test('progress updates correctly track stages');
  test('time elapsed calculates accurately');
  test('error states handled gracefully');
  test('memory cleanup on completion');
  test('multiple concurrent chart loading');
});
```

**3. UX Validation Checklist**
- [ ] Loading indicators appear immediately when chart tools execute
- [ ] Progress messages are specific and informative
- [ ] Time elapsed tracking is accurate
- [ ] Progress percentages correlate with actual completion stages
- [ ] Error states provide clear feedback
- [ ] Loading states cleanup properly on completion
- [ ] Professional appearance matches reference design
- [ ] Accessibility compliance (screen readers, keyboard nav)
- [ ] Dark/light theme compatibility
- [ ] Mobile responsiveness maintained

### Performance Benchmarks

**Before Implementation Baseline:**
- Chart creation response time: ~200-500ms
- Canvas rendering time: ~100-200ms
- Memory usage: Baseline TBD

**Target Performance Goals:**
- Loading feedback appears within: 50ms
- Progress updates frequency: 100-200ms intervals
- Memory overhead: <5% increase
- No performance degradation in chart creation times
- Smooth animations (60fps) on loading indicators

## Risk Assessment & Mitigation

### Technical Risks

**1. Performance Impact (Medium Risk)**
- *Risk*: Progress updates could slow chart creation
- *Mitigation*: Debounced updates, efficient state management, benchmarking

**2. State Management Complexity (Medium Risk)**
- *Risk*: Complex loading states could introduce bugs
- *Mitigation*: Comprehensive testing, gradual rollout, fallback patterns

**3. Backward Compatibility (Low Risk)**
- *Risk*: Breaking existing Canvas functionality
- *Mitigation*: Maintain existing API patterns, progressive enhancement

### UX Risks

**1. Loading Indicator Accuracy (Medium Risk)**
- *Risk*: Progress percentages not matching actual completion
- *Mitigation*: Realistic progress estimation, stage-based rather than percentage-based progress where appropriate

**2. Information Overload (Low Risk)**
- *Risk*: Too much loading feedback overwhelming users
- *Mitigation*: Clean, minimal design following reference aesthetic, user preference controls

## Success Metrics

### User Experience Success
- Loading feedback appears within 50ms of chart tool execution
- Users receive informative progress messages throughout creation
- Professional loading appearance matches reference design quality
- Zero loading state memory leaks or cleanup issues

### Technical Success
- All 17 chart tools support streaming progress updates
- Canvas loading states integrate seamlessly with existing architecture
- No performance regression in chart creation times
- Comprehensive test coverage for all loading scenarios

### Business Value Success
- Enhanced perceived performance and professional appearance
- Reduced user uncertainty during chart creation
- Improved user confidence in system reliability
- Foundation for future advanced progress tracking features

---

## Implementation Readiness Score: 9/10

**High Confidence Rationale:**
- **Solid Foundation**: Existing `useCanvas` hook already supports loading artifacts and progress tracking infrastructure
- **Clear Integration Points**: Well-defined integration with message-parts.tsx Canvas events and chart tool execution patterns
- **Proven Architecture**: Vercel AI SDK streaming patterns provide robust foundation for progress updates
- **Existing Components**: LoadingPlaceholder component exists and needs enhancement rather than ground-up creation
- **Comprehensive Analysis**: Deep understanding of codebase patterns and integration requirements established

**Minor Risk Factors (-1 point):**
- Converting 17 chart tools to streaming execution requires careful testing
- Progress accuracy tuning may need iteration based on real usage patterns

This initial plan provides a comprehensive foundation for PRP generation and successful implementation of professional Canvas loading indicators that will transform the user experience during chart creation.