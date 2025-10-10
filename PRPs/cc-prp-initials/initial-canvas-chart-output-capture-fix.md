# Initial Plan: Canvas Chart Output Capture Fix

**Feature Name:** Canvas Chart Tool Output Capture and Rendering Pipeline Fix
**Problem Domain:** AI Tool Execution → Output Capture → Canvas Visualization
**Project:** Samba-AI (better-chatbot)
**Created:** 2025-01-09
**Confidence Level:** 9/10

---

## Executive Summary

### The Problem
Canvas workspace opens when users request chart generation, but charts never render. Tool invocations show populated **Inputs** but **Outputs** display as "undefined", preventing the Canvas artifact creation pipeline from detecting completed charts and rendering visualizations.

### Visual Evidence
- ✅ Canvas opens automatically when chart tools invoked
- ✅ Tool inputs populated correctly (pie chart: 5 data points, geographic chart: 4 regions)
- ❌ Tool outputs show "undefined" in UI
- ❌ No charts appear in Canvas workspace
- ❌ Users see "Canvas Ready" empty state instead of visualizations

### Root Cause
**Vercel AI SDK v5.0.26 async generator completion failure** - Tool execution reaches intermediate yield statements (loading, processing) but the final generator return value never gets captured in `part.output`, breaking the completion detection pipeline that creates Canvas artifacts.

### Impact
- **User Experience:** Complete feature failure - chart generation appears broken
- **Core Functionality:** Primary Canvas visualization feature non-functional
- **Business Value:** Users cannot generate any of 17 available chart types
- **Platform Reliability:** Known AI SDK issue requires architectural workaround

---

## Feature Goals & User Experience

### What Users Should Accomplish
1. **Request Chart Creation:** "Create a bar chart showing sales by region"
2. **See Loading Feedback:** Canvas opens with loading indicator
3. **Receive Instant Visualization:** Chart renders in Canvas within 3-5 seconds
4. **Interact with Charts:** Multiple charts in grid layout, all fully functional

### Current User Journey (Broken)
```
User: "Create a pie chart of sales by category"
  ↓
✅ AI recognizes chart tool invocation
  ↓
✅ Canvas opens with loading state
  ↓
✅ Tool executes with correct data (inputs visible)
  ↓
❌ Tool output = undefined (FAILURE POINT)
  ↓
❌ Canvas shows "Canvas Ready" empty state
  ↓
❌ User sees no chart, feature appears broken
```

### Desired User Journey (Target)
```
User: "Create a pie chart of sales by category"
  ↓
✅ AI recognizes chart tool invocation
  ↓
✅ Canvas opens with loading indicator
  ↓
✅ Tool executes: loading → processing → success (3-5s)
  ↓
✅ Tool output captured with chartData + shouldCreateArtifact
  ↓
✅ Canvas artifact created with chart data
  ↓
✅ Chart renders in Canvas workspace
  ↓
✅ User interacts with functional visualization
```

---

## Technical Context & Architecture

### Project Technology Stack
- **AI Framework:** Vercel AI SDK v5.0.26 (streamText, tool calling)
- **Frontend:** Next.js 15.3.2, React 19.1.1, TypeScript 5.9.2
- **UI Components:** Radix UI, Tailwind CSS, Recharts 2.15.4
- **State Management:** Zustand 5.0.8, React hooks (useCanvas custom hook)
- **Observability:** Langfuse SDK v4.2.0 with OpenTelemetry tracing
- **Database:** PostgreSQL + Drizzle ORM 0.41.0

### Current Architecture Overview

#### Tool Execution Flow (Current - Broken)
```typescript
/api/chat/route.ts (streamText)
  ↓ Tool invocation detected
  ↓
src/lib/ai/tools/artifacts/pie-chart-tool.ts
  ↓ execute: async function* ({ data })
  ↓   yield { status: "loading" } ✅
  ↓   yield { status: "processing" } ✅
  ↓   yield { status: "success", shouldCreateArtifact: true, chartData } ✅
  ↓   return "Chart created successfully" ❌ NEVER CAPTURED
  ↓
part.output = undefined ❌ ROOT CAUSE
  ↓
src/components/chat-bot.tsx (useEffect polling)
  ↓ Checks for completedCharts
  ↓ Filters by: result?.shouldCreateArtifact && result?.status === "success"
  ↓ part.output is undefined → filter returns [] ❌
  ↓
No artifacts created → Canvas shows empty state ❌
```

#### Key Integration Points
1. **Tool Loading:** `src/app/api/chat/shared.chat.ts` - loadAppDefaultTools()
2. **Tool Execution:** `src/app/api/chat/route.ts` - streamText() with tools
3. **Output Detection:** `src/components/chat-bot.tsx` - useEffect polling messages
4. **Canvas Management:** `src/components/canvas-panel.tsx` - useCanvas hook
5. **Chart Rendering:** `src/components/tool-invocation/` - 17 chart components

### Critical Files & Patterns Discovered

#### 1. Tool Definition Pattern (All 17 Chart Tools)
**File:** `src/lib/ai/tools/artifacts/pie-chart-tool.ts` (representative)
```typescript
export const pieChartArtifactTool = createTool({
  name: DefaultToolName.CreatePieChart,
  description: "Create beautiful pie chart artifact...",
  inputSchema: z.object({ title, data, description }),

  execute: async function* ({ title, data, description }) {
    // ✅ Intermediate yields work
    yield { status: "loading", message: "Preparing...", progress: 0 };
    yield { status: "processing", message: "Creating...", progress: 50 };

    // ✅ Final yield with shouldCreateArtifact
    yield {
      status: "success",
      chartId: artifactId,
      chartType: "pie",
      chartData: chartContent,
      shouldCreateArtifact: true, // Critical flag
      progress: 100,
    };

    // ❌ This return value never captured in part.output
    return `Created pie chart "${title}" with ${data.length} slices`;
  },
});
```

**Pattern Used By:** All 17 tools (bar, line, pie, area, scatter, radar, funnel, treemap, sankey, radial-bar, composed, geographic, gauge, calendar-heatmap, ban, ai-insights, table)

#### 2. Tool Execution Configuration
**File:** `src/app/api/chat/route.ts:299-418`
```typescript
const result = streamText({
  model,
  system: systemPrompt,
  messages: convertToModelMessages(messages),
  experimental_transform: smoothStream({ chunking: "word" }),
  experimental_telemetry: { isEnabled: true }, // Langfuse tracing
  tools: vercelAITooles, // All chart tools loaded
  toolChoice: "auto",
  maxRetries: 2,
  stopWhen: stepCountIs(10),

  // ❌ MISSING: onToolCall handler for output capture
  // ❌ MISSING: Timeout handling for hanging tools

  onFinish: async (result) => {
    // Called after stream completion
    updateActiveObservation({ output: result.content });
  },
});
```

**Missing Patterns:**
- No `onToolCall` handler to capture tool results directly
- No streaming event handlers for tool-result events
- No timeout mechanism for hanging tool execution
- Relies on message polling instead of event-driven capture

#### 3. Output Detection Logic (Polling-Based)
**File:** `src/components/chat-bot.tsx:291-542`
```typescript
// useEffect runs every 150ms when messages change
useEffect(() => {
  if (!isInitializedRef.current) return;

  processingDebounceRef.current = setTimeout(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return;

    // Find chart tool invocations
    const chartTools = lastMessage.parts.filter(
      (part) => isToolUIPart(part) && chartToolNames.includes(getToolName(part))
    );

    // Open Canvas when tools detected
    if (chartTools.length > 0 && !isCanvasVisible) {
      showCanvas(); // ✅ THIS WORKS
    }

    // Filter for completed charts
    const completedCharts = chartTools.filter((part) => {
      if (!part.state.startsWith("output")) return false;

      const result = part.output as any; // ❌ undefined

      // Try multiple completion patterns
      const isCompleted =
        (result?.shouldCreateArtifact && result?.status === "success") ||
        result?.success === true ||
        (result?.structuredContent?.result?.[0]?.success === true);

      return isCompleted; // ❌ Always false because result is undefined
    });

    // Create Canvas artifacts from completed charts
    completedCharts.forEach((part) => {
      addCanvasArtifact({
        id: result.chartId,
        type: "chart",
        data: result.chartData, // ❌ Can't access - result is undefined
        status: "completed",
      });
    });
  }, 150);
}, [messages, isCanvasVisible, showCanvas, addCanvasArtifact]);
```

**Problems:**
- Polling-based instead of event-driven
- `part.output` is undefined for all tool invocations
- Completion detection logic never fires
- 150ms debounce adds unnecessary latency
- Resource-intensive continuous polling

#### 4. Canvas State Management
**File:** `src/components/canvas-panel.tsx:628-975`
```typescript
export function useCanvas() {
  const [artifacts, setArtifacts] = useState<CanvasArtifact[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addArtifact = useCallback((artifact: CanvasArtifact) => {
    setArtifacts((prev) => {
      // Check for duplicates
      const existing = prev.find((a) => a.id === artifact.id);
      if (existing) return prev.map((a) =>
        a.id === artifact.id ? { ...a, ...artifact } : a
      );
      return [...prev, artifact]; // Add new
    });
    setActiveArtifactId(artifact.id);
    if (!isVisible) setIsVisible(true);
  }, [isVisible]);

  return {
    artifacts,
    addArtifact,
    isVisible,
    showCanvas,
    closeCanvas
  };
}
```

**Status:** ✅ Working correctly - waiting for artifacts that never arrive

---

## Root Cause Deep Dive

### Vercel AI SDK Async Generator Issue

**Documented in GitHub Issues:**
- [vercel/ai#3327](https://github.com/vercel/ai/discussions/3327) - "Tool calls not working with streamText"
- [vercel/ai#4141](https://github.com/vercel/ai/issues/4141) - "StreamText response stuck in loop"

**Problem Behavior:**
```typescript
// Tool execution lifecycle
async function* toolExecute() {
  yield { status: "loading" };      // ✅ Captured in message stream
  yield { status: "processing" };   // ✅ Captured in message stream
  yield { status: "success", data }; // ✅ Captured in message stream
  return "Final result";            // ❌ NEVER CAPTURED - AI SDK bug
}

// What should happen:
// 1. Intermediate yields → message.parts (streaming updates)
// 2. Final return → part.output (completion data)
// 3. part.output used for Canvas artifact creation

// What actually happens:
// 1. Intermediate yields → message.parts ✅
// 2. Final return → void/undefined ❌
// 3. part.output = undefined forever ❌
```

### Why Canvas Opens But Charts Don't Render

**Canvas Opening Logic (Works):**
```typescript
// Detects tool invocation regardless of completion
if (chartTools.length > 0) {
  showCanvas(); // ✅ Triggered by tool presence
}
```

**Chart Rendering Logic (Broken):**
```typescript
// Requires output data to create artifact
const result = part.output; // ❌ undefined
if (result?.shouldCreateArtifact) {
  addCanvasArtifact(result); // ❌ Never called
}
```

### The Async Generator Completion Gap

**AI SDK Behavior:**
1. Tool invocation creates UIToolCallPart
2. Intermediate yields update part.state ("call" → "partial-call" → "result")
3. Final return should populate part.output
4. **BUT:** Generator completion doesn't trigger output capture
5. Part reaches state "result" with output still undefined

**Evidence from Screenshots:**
- Inputs: Full data visible (proves tool received correct arguments)
- Outputs: "undefined" (proves completion data not captured)
- Canvas: Opens (proves tool detection works)
- Charts: Missing (proves artifact creation blocked)

---

## Implementation Strategy

### Approach: Multi-Layered Fix + Monitoring

Given the AI SDK limitation, we need **defensive programming** with:
1. **Primary Fix:** Enhanced streaming integration with event handlers
2. **Fallback Fix:** Timeout detection with error recovery
3. **Monitoring:** Comprehensive debugging for production diagnosis
4. **User Experience:** Loading states with graceful degradation

### Solution Architecture

#### Layer 1: Streaming Event Handlers (Primary)
```typescript
// src/app/api/chat/route.ts
const result = streamText({
  tools: vercelAITooles,

  // NEW: Direct tool result capture
  onToolCall: async ({ toolCall }) => {
    logger.info(`Tool invoked: ${toolCall.toolName}`);
    dataStream.write({
      type: "tool-call-start",
      toolName: toolCall.toolName,
      toolCallId: toolCall.toolCallId,
    });
  },

  // NEW: Capture tool results as they complete
  onStepFinish: async ({ stepResult }) => {
    if (stepResult.toolResults) {
      for (const toolResult of stepResult.toolResults) {
        dataStream.write({
          type: "tool-result",
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
          result: toolResult.result,
        });
      }
    }
  },
});

// Merge tool result stream with UI stream
dataStream.merge(result.toUIMessageStream());
```

#### Layer 2: Client-Side Event Handling (Primary)
```typescript
// src/components/chat-bot.tsx
const { messages, status } = useChat({
  // NEW: Process streaming tool results
  onData: (data: any) => {
    if (data?.type === "tool-result") {
      const { toolName, result } = data;

      // Check if it's a chart tool with completion flag
      if (chartToolNames.includes(toolName) &&
          result?.shouldCreateArtifact &&
          result?.status === "success") {

        // Create Canvas artifact immediately
        addCanvasArtifact({
          id: result.chartId || generateUUID(),
          type: result.chartType === "table" ? "table" : "chart",
          title: result.title,
          data: result.chartData,
          status: "completed",
          metadata: {
            chartType: result.chartType,
            dataPoints: result.dataPoints,
            toolName,
          },
        });
      }
    }
  },
});
```

#### Layer 3: Timeout Handling (Fallback)
```typescript
// src/lib/ai/tools/artifacts/tool-execution-wrapper.ts
export function withTimeout<T>(
  generator: AsyncGenerator<any, T>,
  timeoutMs: number = 30000
): AsyncGenerator<any, T> {
  return (async function* () {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Tool execution timeout")), timeoutMs)
    );

    try {
      let result = await generator.next();
      while (!result.done) {
        yield result.value;
        result = await Promise.race([
          generator.next(),
          timeoutPromise,
        ]);
      }
      return result.value;
    } catch (error) {
      logger.error("Tool execution timeout:", error);
      throw new ToolExecutionError("Chart generation timeout after 30s");
    }
  })();
}

// Apply to all chart tools
export const pieChartArtifactTool = createTool({
  execute: withTimeout(async function* ({ data }) {
    // Original implementation
  }, 30000),
});
```

#### Layer 4: Enhanced Debugging (Monitoring)
```typescript
// src/app/api/chat/route.ts
const result = streamText({
  experimental_telemetry: {
    isEnabled: true,
    functionId: (metadata) => {
      // Enhanced tool execution tracking
      if (metadata.type === "tool-call") {
        return `tool-${metadata.toolName}-${Date.now()}`;
      }
      return undefined;
    },
  },

  onFinish: async (result) => {
    // Log tool execution summary
    const toolExecutions = result.steps?.flatMap(s => s.toolCalls ?? []);
    logger.info("Tool execution summary:", {
      totalTools: toolExecutions?.length,
      completedTools: result.steps?.flatMap(s => s.toolResults ?? []).length,
      toolNames: toolExecutions?.map(t => t.toolName),
    });
  },
});
```

#### Layer 5: Canvas Timeout Detection (UX)
```typescript
// src/components/canvas-panel.tsx
function LoadingPlaceholder({ artifact }: { artifact: CanvasArtifact }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      // Show timeout warning after 15s
      if (elapsed > 15000 && !showTimeout) {
        setShowTimeout(true);
      }

      // Auto-fail after 30s
      if (elapsed > 30000) {
        updateArtifact(artifact.id, {
          status: "error",
          error: "Chart generation timeout"
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (showTimeout) {
    return (
      <Card className="p-6">
        <div className="text-warning">
          <AlertTriangle className="w-6 h-6 mb-2" />
          <p>Chart taking longer than expected ({Math.floor(elapsedTime/1000)}s)</p>
          <p className="text-sm text-muted-foreground">Still processing...</p>
        </div>
      </Card>
    );
  }

  // Normal loading state
  return <LoadingAnimation artifact={artifact} elapsed={elapsedTime} />;
}
```

---

## Implementation Tasks (Prioritized)

### Phase 1: Core Output Capture Fix (30 min)

#### Task 1.1: Add Streaming Event Handlers (15 min)
**File:** `src/app/api/chat/route.ts`
**Priority:** 🔴 CRITICAL
**Dependencies:** None
**Changes:**
- Add `onToolCall` handler to log tool invocations
- Add `onStepFinish` handler to capture tool results
- Write tool results to dataStream with "tool-result" type
- Merge tool result stream with UI message stream

**Validation:**
```bash
# Request chart, check browser console for:
"Tool invoked: create_pie_chart"
"Tool result captured: { shouldCreateArtifact: true }"
```

#### Task 1.2: Client-Side Result Processing (15 min)
**File:** `src/components/chat-bot.tsx`
**Priority:** 🔴 CRITICAL
**Dependencies:** Task 1.1
**Changes:**
- Add `onData` handler to useChat configuration
- Process "tool-result" events from stream
- Check for chart tools with shouldCreateArtifact flag
- Call addCanvasArtifact immediately when result received
- Keep existing polling as fallback for backward compatibility

**Validation:**
```bash
# Request chart, check browser console for:
"onData: tool-result"
"Creating Canvas artifact from streaming result"
"Canvas artifact created: <id>"
```

### Phase 2: Timeout & Error Handling (20 min)

#### Task 2.1: Tool Execution Timeout Wrapper (15 min)
**File:** `src/lib/ai/tools/artifacts/tool-execution-wrapper.ts` (new)
**Priority:** 🟡 HIGH
**Dependencies:** None
**Changes:**
- Create withTimeout wrapper for async generators
- Add configurable timeout (default 30s)
- Proper error handling and cleanup
- Apply to all 17 chart tools

**Validation:**
```bash
# Use network throttling to force timeout
# Verify graceful error after 30s, not infinite hang
```

#### Task 2.2: Canvas Timeout Detection (5 min)
**File:** `src/components/canvas-panel.tsx`
**Priority:** 🟡 HIGH
**Dependencies:** None
**Changes:**
- Add elapsed time tracking to LoadingPlaceholder
- Show warning at 15s threshold
- Auto-fail artifacts at 30s timeout
- Display retry option to user

**Validation:**
```bash
# Artificially delay tool execution
# Verify warning appears at 15s, error at 30s
```

### Phase 3: Enhanced Debugging & Monitoring (15 min)

#### Task 3.1: Comprehensive Tool Execution Logging (10 min)
**File:** `src/app/api/chat/route.ts`
**Priority:** 🟢 MEDIUM
**Dependencies:** None
**Changes:**
- Enhanced experimental_telemetry configuration
- Tool execution lifecycle logging
- Langfuse trace enrichment with tool metadata
- Performance timing for each tool execution

**Validation:**
```bash
# Check Langfuse dashboard for tool execution traces
# Verify detailed tool timing and completion data
```

#### Task 3.2: Canvas Artifact State Debugging (5 min)
**File:** `src/components/canvas-panel.tsx`
**Priority:** 🟢 MEDIUM
**Dependencies:** None
**Changes:**
- Enhanced debug logging for artifact lifecycle
- Track artifact state transitions
- Log memory usage for large datasets
- Add development-mode health monitoring

**Validation:**
```bash
# Enable debug mode, check console for:
"Artifact added: <id> (chart, pie, 5 data points)"
"Artifact transition: loading → completed"
```

### Phase 4: Testing & Validation (20 min)

#### Task 4.1: Tool Execution Test Suite (15 min)
**File:** `src/lib/ai/tools/artifacts/__tests__/tool-execution.test.ts` (new)
**Priority:** 🟢 MEDIUM
**Dependencies:** Phase 1, 2
**Changes:**
- Test all 17 chart tools complete successfully
- Test timeout handling with delayed execution
- Test error recovery and retry logic
- Test streaming result capture

**Test Coverage:**
```typescript
describe("Chart Tool Execution", () => {
  test("pie chart completes within 5s", async () => {
    const result = await executeTool("create_pie_chart", testData);
    expect(result.shouldCreateArtifact).toBe(true);
    expect(result.chartData).toBeDefined();
  });

  test("timeout after 30s triggers error", async () => {
    await expect(executeToolWithDelay(35000))
      .rejects.toThrow("Tool execution timeout");
  });
});
```

#### Task 4.2: Canvas Integration E2E Tests (5 min)
**File:** `tests/canvas/chart-rendering.spec.ts` (new)
**Priority:** 🟢 MEDIUM
**Dependencies:** Phase 1, 2
**Changes:**
- E2E test for chart request → Canvas rendering
- Test all 17 chart types render correctly
- Test timeout and error states
- Test Canvas opening and artifact creation

**Test Scenarios:**
```typescript
test("user can generate pie chart", async ({ page }) => {
  await page.goto("/chat/new");
  await page.fill("#prompt-input", "Create a pie chart of sales data");
  await page.click("#send-button");

  // Canvas should open
  await expect(page.locator(".canvas-panel")).toBeVisible();

  // Chart should render within 10s
  await expect(page.locator(".pie-chart")).toBeVisible({ timeout: 10000 });
});
```

---

## File Organization & Project Structure

### New Files Created
```
src/lib/ai/tools/artifacts/
  ├── tool-execution-wrapper.ts          # Timeout wrapper utility
  └── __tests__/
      └── tool-execution.test.ts         # Tool execution tests

tests/canvas/
  └── chart-rendering.spec.ts            # E2E Canvas tests

PRPs/cc-prp-initials/
  └── initial-canvas-chart-output-capture-fix.md  # This document
```

### Modified Files
```
src/app/api/chat/
  └── route.ts                           # Add streaming handlers

src/components/
  ├── chat-bot.tsx                       # Add onData handler
  └── canvas-panel.tsx                   # Enhance timeout detection

src/lib/ai/tools/artifacts/
  ├── pie-chart-tool.ts                  # Apply timeout wrapper
  ├── bar-chart-tool.ts                  # Apply timeout wrapper
  └── [... all 17 chart tools]          # Apply timeout wrapper
```

---

## Security & Performance Considerations

### Security
- ✅ All tool inputs validated via Zod schemas
- ✅ Output sanitization in chart components
- ✅ Better-Auth session validation before tool execution
- ✅ Langfuse telemetry excludes sensitive data
- ⚠️ Add rate limiting for tool execution (future consideration)

### Performance
- **Current:** 150ms polling overhead per message update
- **Target:** Event-driven capture with <50ms latency
- **Memory:** Monitor artifact count (limit: 25 charts per session)
- **Network:** Streaming reduces payload size vs. full message polling
- **Timeout:** 30s prevents indefinite resource consumption

### Accessibility
- Loading states announced to screen readers
- Timeout warnings visible and audible
- Error messages provide clear retry instructions
- Canvas keyboard navigation maintained

---

## Known Issues & Gotchas

### Vercel AI SDK Limitations
1. **Async Generator Completion:** v5.0.26 has documented issues with capturing final return values
2. **Tool Result Streaming:** Not all AI SDK features support streaming tool results
3. **Step-Based Architecture:** `stepCountIs(10)` can cause premature termination

### Project-Specific Gotchas
1. **Port Requirement:** Must run on `localhost:3000` (auth/observability hardcoded)
2. **Node Memory:** Large chart datasets may require `NODE_OPTIONS="--max-old-space-size=6144"`
3. **Langfuse Flush:** Serverless environments need `after()` hook for trace completion
4. **Canvas State:** User manual close (`userManuallyClosed`) prevents auto-reopening

### Browser Compatibility
- ✅ Modern browsers support streaming (Chrome, Firefox, Safari, Edge)
- ⚠️ Server-Sent Events may have proxy/firewall issues
- ⚠️ Large datasets (>1000 points) may cause rendering lag

---

## Validation & Testing Strategy

### Level 1: Unit Tests (5 min)
```bash
pnpm test src/lib/ai/tools/artifacts/__tests__/tool-execution.test.ts

# Verify:
- All 17 chart tools complete successfully
- Timeout mechanism triggers at 30s
- Error handling works correctly
```

### Level 2: Integration Tests (10 min)
```bash
pnpm test:e2e tests/canvas/chart-rendering.spec.ts

# Verify:
- Chart request → Canvas opens → Chart renders
- All chart types work (17 total)
- Timeout and error states handled gracefully
```

### Level 3: Manual Testing (15 min)
```bash
pnpm dev

# Browser console monitoring:
1. Request: "Create a pie chart of sales by category"
2. Expected logs:
   - "Tool invoked: create_pie_chart"
   - "Tool result captured: { shouldCreateArtifact: true }"
   - "Creating Canvas artifact"
   - "Chart rendered: pie-<id>"
3. Expected UI:
   - Canvas opens with loading animation
   - Chart appears within 5 seconds
   - Proper legend and tooltips

# Test all 17 chart types:
- Bar, Line, Pie, Area, Scatter, Radar
- Funnel, Treemap, Sankey, Radial Bar
- Composed, Geographic, Gauge, Heatmap
- BAN, AI Insights, Table
```

### Level 4: Production Validation (5 min)
```bash
# Build validation
pnpm build:local
pnpm start

# Health checks
curl -f http://localhost:3000/api/health/langfuse

# Langfuse dashboard verification:
- Tool execution traces visible
- Tool completion rates tracked
- Error rates monitored
```

### Success Criteria Checklist
- [ ] All 17 chart tools complete within 10 seconds
- [ ] Tool outputs no longer show "undefined"
- [ ] Canvas displays charts immediately after completion
- [ ] Loading states transition: loading → processing → success
- [ ] Timeout handling triggers gracefully at 30s
- [ ] Error states show retry options
- [ ] No memory leaks with multiple chart generations
- [ ] All TypeScript types validate (`pnpm check-types`)
- [ ] All lints pass (`pnpm lint`)
- [ ] All unit tests pass (`pnpm test`)
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Langfuse traces show complete tool execution lifecycle

---

## Project-Specific Commands

### Development
```bash
# Standard development workflow
pnpm dev                    # Development server (localhost:3000)
pnpm build:local           # Local build (NO_HTTPS=1)
pnpm start                 # Production server

# Quality checks
pnpm check-types           # TypeScript validation
pnpm lint                  # Biome linting
pnpm test                  # Vitest unit tests
pnpm test:e2e              # Playwright E2E tests
pnpm check                 # All checks combined

# Database
pnpm db:studio             # Drizzle Studio (inspect data)
```

### Debugging
```bash
# Enable enhanced logging
NODE_ENV=development pnpm dev

# Memory profiling (if needed)
NODE_OPTIONS="--max-old-space-size=6144" pnpm dev

# Langfuse dashboard
open http://localhost:3000/api/health/langfuse
```

---

## Web Research Insights

### Relevant Documentation
1. **Vercel AI SDK Tool Calling**: https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
2. **Streaming Patterns**: https://sdk.vercel.ai/docs/ai-sdk-core/streaming
3. **Troubleshooting Guide**: https://sdk.vercel.ai/docs/troubleshooting
4. **Known Issues**: GitHub discussions #3327, #4141

### Best Practices Discovered
1. **Event-Driven Over Polling**: Use `onData` handlers for real-time updates
2. **Defensive Timeouts**: Always wrap async operations with timeout limits
3. **Graceful Degradation**: Provide fallback UI for failures
4. **Comprehensive Logging**: Essential for diagnosing streaming issues

---

## Anti-Patterns to Avoid

❌ **Don't** modify the chart tool structure - async generator pattern is correct
❌ **Don't** disable tool validation - security checks are working
❌ **Don't** remove polling entirely - keep as fallback for backward compatibility
❌ **Don't** skip timeout handling - AI SDK has known hanging issues
❌ **Don't** ignore Langfuse tracing - essential for production debugging
❌ **Don't** hard-code artifact IDs - use dynamic generation
❌ **Don't** bypass Zod validation - input validation is critical

✅ **Do** use streaming event handlers for primary flow
✅ **Do** implement timeout wrappers for all async operations
✅ **Do** provide clear error messages and retry options
✅ **Do** maintain comprehensive logging for production diagnosis
✅ **Do** test all 17 chart types thoroughly
✅ **Do** monitor memory usage with multiple charts
✅ **Do** keep Canvas state management clean and debuggable

---

## Expected Outcomes & Success Metrics

### User Experience Improvement
- **Before:** Charts never render, feature appears broken
- **After:** Charts render reliably within 3-5 seconds

### Technical Metrics
- **Tool Completion Rate:** 0% → 99%+ (allow 1% for legitimate errors)
- **Canvas Render Time:** N/A (broken) → 3-5 seconds average
- **Timeout Frequency:** N/A → <1% of requests
- **Memory Leaks:** Zero new leaks introduced
- **Test Coverage:** Add 15+ new tests for tool execution

### Observability Metrics
- **Langfuse Traces:** 100% of tool executions tracked
- **Error Rate:** <1% of chart generations
- **P95 Latency:** <5 seconds for chart rendering
- **Tool Success Rate:** >99%

---

## Confidence Assessment

### Implementation Confidence: 9/10

**High Confidence Factors:**
- ✅ Root cause clearly identified and well-documented
- ✅ Known AI SDK issue with established workarounds
- ✅ Comprehensive codebase analysis completed
- ✅ Clear implementation path with fallback layers
- ✅ Existing PRP document with 7-task breakdown available
- ✅ Strong observability foundation (Langfuse)
- ✅ All chart components already functional
- ✅ Canvas system architecture solid

**Risk Factors (-1 point):**
- ⚠️ Vercel AI SDK limitation requires workaround, not direct fix
- ⚠️ Streaming implementation may have edge cases
- ⚠️ Multiple layers needed for robustness

**Mitigation:**
- Multiple defensive layers (streaming, timeout, polling)
- Comprehensive testing across all 17 chart types
- Enhanced debugging for production diagnosis
- Gradual rollout with monitoring

---

## Next Steps

### Immediate Actions (Post-Initial Plan)
1. **Review this initial plan** with stakeholders
2. **Generate detailed PRP** using `/generate-prp` command
3. **Create Archon tasks** for implementation tracking
4. **Set up monitoring dashboard** for tool execution metrics

### Implementation Sequence
1. **Phase 1** (30 min): Core streaming integration
2. **Phase 2** (20 min): Timeout and error handling
3. **Phase 3** (15 min): Enhanced debugging
4. **Phase 4** (20 min): Comprehensive testing

### Success Criteria for PRP Generation
- [ ] All integration points clearly documented
- [ ] Task breakdown with specific file changes
- [ ] Validation strategy for each phase
- [ ] Rollback plan if streaming approach fails
- [ ] Performance benchmarks defined

---

## Appendix: Reference Materials

### Key Architecture Documents
- `CLAUDE.md` - Project overview and tech stack
- `docs/ARCHITECTURE-VERCEL-AI-SDK.md` - AI SDK integration patterns
- `docs/langfuse-vercel-ai-sdk-integration.md` - Observability setup
- `PRPs/cc-prp-plans/prp-canvas-chart-pipeline-fix.md` - Existing comprehensive PRP

### Critical Code References
- **Tool Definitions:** `src/lib/ai/tools/artifacts/` (17 chart tools)
- **Tool Loading:** `src/app/api/chat/shared.chat.ts:222-230`
- **Stream Configuration:** `src/app/api/chat/route.ts:299-418`
- **Canvas Integration:** `src/components/chat-bot.tsx:291-542`
- **Chart Rendering:** `src/components/canvas-panel.tsx:215-337`

### External Resources
- Vercel AI SDK Documentation: https://sdk.vercel.ai
- GitHub Issue #3327: Tool execution hanging
- GitHub Issue #4141: StreamText response loop
- Recharts Documentation: https://recharts.org
- Langfuse Tracing Guide: https://langfuse.com/docs

---

**Document Status:** ✅ Ready for PRP Generation
**Estimated Implementation Time:** 85 minutes (4 phases)
**Risk Level:** Low (multiple fallback layers)
**Business Impact:** Critical (restores core feature functionality)

---

_This initial plan provides comprehensive context for generating a detailed PRP with specific implementation steps, file changes, and validation criteria. The problem is well-understood, the solution is architected, and the implementation path is clear._
