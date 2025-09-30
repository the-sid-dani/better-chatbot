# Canvas Chart Generation Pipeline Fix - PRP

name: "Canvas Chart Generation Pipeline Fix - Comprehensive Debugging and Resolution"
description: |
  Critical fix for perpetual loading states in Canvas chart generation where chart tools fail to complete execution pipeline, leaving artifacts stuck at loading icons indefinitely. Based on extensive architectural diagnosis and research into Vercel AI SDK tool execution patterns.

## Goal

Restore complete functionality to the Canvas chart generation system where users can request chart creation and see charts render successfully in Canvas workspace with smooth loading → processing → success state transitions.

**Current State:** Chart tools start execution but fail to complete, leaving Canvas in perpetual loading state
**Desired State:** Chart generation completes successfully with immediate visual feedback and proper Canvas rendering

## Why

- **User Experience:** Users expect immediate chart generation when requesting visualizations
- **Core Functionality:** Canvas chart generation is a primary feature of the platform
- **Security Improvement:** Default tool permissions currently expose unwanted code execution capabilities
- **System Reliability:** Tool execution completion failures indicate pipeline stability issues

## What

### User-Visible Behavior Restoration:
1. User requests "Create a bar chart" → Chart tool executes → Canvas renders chart immediately
2. Loading states properly transition: loading → processing → success → rendered chart
3. Only chart/artifact tools available by default (no Python/JavaScript execution)
4. Canvas automatically opens when charts are generated
5. Multiple chart types (15+) work reliably without hanging

### Success Criteria
- [ ] Chart generation requests complete successfully within 10 seconds
- [ ] Canvas displays charts immediately after tool execution completion
- [ ] Loading states transition properly through all phases
- [ ] Only intended tools (Artifacts) available by default
- [ ] No tool execution hanging or incomplete cycles
- [ ] All 15+ chart types work reliably
- [ ] No performance regressions or memory leaks

## All Needed Context

### Documentation & References
```yaml
# CRITICAL RESEARCH FINDINGS - Vercel AI SDK Tool Execution Issues
- url: https://github.com/vercel/ai/discussions/3327
  why: Tool calls not working with streamText - known hanging issues
  critical: Tool execution gets stuck with maxSteps configuration

- url: https://github.com/vercel/ai/issues/4141
  why: StreamText response stuck in loop - exact issue we're experiencing
  critical: Async generator completion problems in AI SDK

- url: https://ai-sdk.dev/docs/troubleshooting
  why: Official debugging guidance for tool execution issues
  critical: Error types and debugging strategies for failed tool execution

- url: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
  why: Official tool calling documentation and patterns
  critical: Understanding proper tool execution lifecycle

# PROJECT-SPECIFIC CONTEXT
- file: src/lib/ai/tools/artifacts/bar-chart-tool.ts
  why: Reference implementation of async generator pattern with yield states
  critical: Shows proper tool structure that should work but doesn't complete

- file: src/components/chat-bot.tsx:762-765
  why: Canvas artifact detection logic - multiple completion patterns supported
  critical: isCompleted logic shows what tool results Canvas expects

- file: src/app/api/chat/route.ts:260-273
  why: streamText configuration with tool execution orchestration
  critical: Tool execution entry point where completion failures occur

- file: src/app/store/index.ts:65-70
  why: Default tool permission configuration causing unwanted access
  critical: Simple fix to default to Artifacts only
```

### Current Codebase Architecture (Relevant Components)
```bash
src/
├── app/
│   ├── api/chat/
│   │   ├── route.ts              # streamText tool execution orchestration
│   │   └── shared.chat.ts        # Tool loading with extensive debugging
│   └── store/index.ts            # Tool permission defaults (NEEDS FIX)
├── lib/ai/tools/
│   ├── tool-kit.ts              # Complete tool registry (15+ chart tools)
│   └── artifacts/               # 15 chart tools with async generator patterns
│       ├── bar-chart-tool.ts    # Reference implementation
│       ├── line-chart-tool.ts   # All follow same pattern
│       └── *.ts                 # All properly structured
├── components/
│   ├── canvas-panel.tsx         # Canvas workspace with artifact state mgmt
│   ├── chat-bot.tsx            # Tool completion detection and Canvas integration
│   └── tool-invocation/         # Chart rendering components (15+ ready)
└── hooks/
    └── use-canvas.ts           # Canvas state management (working correctly)
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Vercel AI SDK v5.0.26 Known Issues
// Tool execution hanging with streamText - documented GitHub issues
// Async generators not completing final return statement
// Tools start execution but never trigger completion handlers

// CRITICAL: Chart Tool Execution Pattern (CORRECT BUT NOT COMPLETING)
execute: async function* ({ title, data }) {
  yield { status: "loading" };      // ✅ WORKS - Canvas shows loading
  yield { status: "processing" };   // ✅ WORKS - Canvas shows processing
  yield { status: "success" };      // ❓ SOMETIMES REACHES HERE
  return { content, structuredContent }; // ❌ NEVER EXECUTED - ROOT CAUSE
}

// CRITICAL: Canvas Completion Detection (WORKING CORRECTLY)
const isCompleted =
  (result?.shouldCreateArtifact && result?.status === "success") ||
  result?.success === true ||
  (result?.structuredContent?.result?.[0]?.success === true &&
   result?.isError === false);

// CRITICAL: Tool Permission Default (WRONG CONFIGURATION)
allowedAppDefaultToolkit: [
  AppDefaultToolkit.Code,        // ❌ EXPOSES: Python/JS execution
  AppDefaultToolkit.Artifacts,  // ✅ CORRECT: Chart tools
  AppDefaultToolkit.WebSearch,  // ❌ UNNECESSARY for charts
  AppDefaultToolkit.Http,       // ❌ UNNECESSARY for charts
],
```

## Implementation Blueprint

### Root Cause Analysis
Based on extensive research, the issue is **Vercel AI SDK tool execution completion failure**, not architectural problems. Chart tools start execution, yield intermediate states, but fail to reach the final `return` statement that triggers Canvas artifact creation.

### Primary Issues Identified:
1. **Tool Execution Hanging**: Known AI SDK issue where async generators don't complete
2. **Permission Misconfiguration**: Defaults include unwanted capabilities
3. **Missing Error Handling**: No timeout/fallback patterns for hanging tools
4. **Insufficient Debugging**: Limited visibility into tool execution lifecycle

### 🎯 Task Management Integration

**CRITICAL:** All implementation tasks have been created in the Archon project management system. The executing agent MUST retrieve and track these tasks for proper implementation coordination.

**Project Location:** Better-Chatbot (Samba-Orion) - Project ID: `c4f2e381-13fd-4153-8db6-f1edde27c80d`

**Required Agent Actions:**
1. Use Archon MCP tools to find and retrieve all Canvas Chart Pipeline Fix tasks
2. Update task status as implementation progresses (todo → doing → review → done)
3. Coordinate task dependencies and validate completion criteria
4. Document any implementation discoveries or issues in task updates

**Task Discovery Method:** Search for tasks with `feature: "Canvas Chart Pipeline Fix"` in the project.

### List of Tasks (In Order of Implementation)

**⚠️ AGENT INSTRUCTION:** You must retrieve detailed task information from Archon using the task IDs below. Do not proceed with implementation without first understanding the complete task context from the project management system.

```yaml
Task 1: Fix Tool Permission Defaults (2 minutes)
ARCHON_TASK_ID: c6f1e3c6-41e7-47a7-bc4c-d4f06f226ff6
Priority: 100 (Highest - Critical immediate fix)
Summary: Remove unwanted code execution access, default to Artifacts only

Task 2: Add Comprehensive Tool Execution Debugging (10 minutes)
ARCHON_TASK_ID: 72d31b99-b484-47f8-8ce1-368dfc1e1835
Priority: 90 (High - Essential for diagnosis)
Summary: Enhanced logging and monitoring for tool execution lifecycle

Task 3: Implement Tool Execution Timeout Handling (10 minutes)
ARCHON_TASK_ID: 4cc2e7ab-2c72-4719-a796-15f17790cb78
Priority: 80 (High - Prevents hanging)
Summary: Timeout wrapper for async generator execution in chart tools

Task 4: Enhance Canvas Loading State Management (5 minutes)
ARCHON_TASK_ID: 36640cff-0548-4670-90e0-e66a335fd91e
Priority: 70 (Medium - UX improvement)
Summary: Timeout detection and error fallback UI for Canvas

Task 5: Add Vercel AI SDK Debugging Configuration (5 minutes)
ARCHON_TASK_ID: c6a3699d-5067-4e73-80d0-d96c92b99841
Priority: 60 (Medium - Telemetry enhancement)
Summary: Enhanced streamText telemetry and tool execution monitoring

Task 6: Implement Tool Execution Health Monitoring (10 minutes)
ARCHON_TASK_ID: 6f94ae8c-0f63-4abf-9743-c6b5cccf560a
Priority: 50 (Medium - Monitoring system)
Summary: Comprehensive health monitoring and automatic retry logic

Task 7: Create Tool Execution Test Suite (15 minutes)
ARCHON_TASK_ID: 504eb6c9-0173-494a-a0b2-67dce2ef20ce
Priority: 40 (Lower - Validation)
Summary: Extensive testing for tool execution completion and Canvas integration
```

**🔍 Agent Task Retrieval Instructions:**
```typescript
// Use these Archon MCP commands to get full task details:
mcp__archon__find_tasks(filter_by: "project", filter_value: "c4f2e381-13fd-4153-8db6-f1edde27c80d")
mcp__archon__find_tasks(task_id: "c6f1e3c6-41e7-47a7-bc4c-d4f06f226ff6") // Get specific task details
mcp__archon__manage_task("update", task_id: "...", status: "doing") // Update progress
```

### Per Task Pseudocode

```typescript
// Task 1: Tool Permission Fix
// CRITICAL: Simple configuration change
const initialState = {
  allowedAppDefaultToolkit: [
    AppDefaultToolkit.Artifacts, // ONLY chart tools
  ],
  // ... preserve other config
};

// Task 3: Tool Execution Timeout Pattern
async function* executeWithTimeout<T>(
  generator: AsyncGenerator<any, T, unknown>,
  timeoutMs: number = 30000
): AsyncGenerator<any, T, unknown> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Tool execution timeout")), timeoutMs)
  );

  try {
    let result = await generator.next();
    while (!result.done) {
      yield result.value;
      result = await Promise.race([
        generator.next(),
        timeoutPromise
      ]);
    }
    return result.value;
  } catch (error) {
    logger.error("Tool execution failed:", error);
    throw new ToolExecutionError("Tool execution timeout or failure");
  }
}

// Task 6: Health Monitoring Pattern
class ToolExecutionMonitor {
  private executionTimes = new Map<string, number>();
  private failureRates = new Map<string, number>();

  async monitorExecution<T>(
    toolName: string,
    execution: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await execution();
      this.recordSuccess(toolName, Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(toolName, error);
      throw error;
    }
  }
}
```

### Integration Points
```yaml
VERCEL_AI_SDK:
  - configuration: Enhanced telemetry and error tracking
  - pattern: "experimental_telemetry: { isEnabled: true, functionId: toolName }"

CANVAS_SYSTEM:
  - add to: src/components/canvas-panel.tsx
  - pattern: "Timeout detection and error fallback UI"

OBSERVABILITY:
  - add to: Langfuse tracing configuration
  - pattern: "Tool execution lifecycle tracking"

TESTING:
  - add to: Tool execution validation suite
  - pattern: "Comprehensive chart tool completion testing"
```

## Validation Loop

### Level 1: Tool Permission Fix Verification
```bash
# Verify tool permission changes
pnpm dev
# Open browser dev tools, check network requests
# Verify only Artifacts toolkit loaded in tool loading pipeline
# Expected: No Code/WebSearch/Http tools available

# Browser console should show:
# "🔍 loadAppDefaultTools called with: { allowedAppDefaultToolkit: ['artifacts'] }"
```

### Level 2: Tool Execution Debugging
```bash
# Test chart generation with debug logging
# Open browser console and request: "Create a simple bar chart"
# Monitor console for tool execution lifecycle:

# Expected logs:
# "🔧 [CreateBarChart] Tool execution started"
# "📊 Tool execution processing..."
# "✅ [CreateBarChart] Tool execution completed successfully"

# Canvas should show:
# Loading → Processing → Success → Chart rendered
```

### Level 3: Canvas Integration Testing
```bash
# Verify Canvas artifact creation
# Request multiple chart types: bar, line, pie
# Expected: All charts render successfully within 10 seconds
# Canvas should auto-open with charts displayed

# Browser console should show:
# "🎭 useCanvas Debug: Adding artifact"
# "🎭 CanvasPanel Debug: Rendering canvas panel"
```

### Level 4: Performance and Error Handling
```bash
# Test error scenarios
# Request invalid chart data: "Create chart with empty data"
# Expected: Graceful error handling, no hanging states

# Test timeout scenarios
# Use browser dev tools to throttle network
# Expected: Tool execution timeout with proper error messaging
```

## Final Validation Checklist

**🎯 CRITICAL:** Update Archon task status as each validation item is completed. Mark tasks as "review" when validation passes, "done" when fully verified.

- [ ] **Tool Permissions** (Task c6f1e3c6): Only Artifacts toolkit available by default
- [ ] **Tool Execution Debugging** (Task 72d31b99): Enhanced logging shows complete execution lifecycle
- [ ] **Timeout Handling** (Task 4cc2e7ab): Chart tools complete or fail gracefully within 30 seconds
- [ ] **Canvas Loading States** (Task 36640cff): Proper timeout detection and error UI
- [ ] **AI SDK Telemetry** (Task c6a3699d): Enhanced tool execution monitoring active
- [ ] **Health Monitoring** (Task 6f94ae8c): Execution monitoring and retry logic operational
- [ ] **Test Suite** (Task 504eb6c9): All chart tools pass completion tests
- [ ] **Chart Generation**: All 15+ chart types complete successfully
- [ ] **Canvas Integration**: Charts render immediately after tool completion
- [ ] **Error Handling**: Graceful failures for invalid inputs
- [ ] **Performance**: No hanging tool execution or memory leaks
- [ ] **Observability**: Comprehensive logging for tool execution lifecycle
- [ ] **Type Safety**: All changes maintain TypeScript compliance
- [ ] **Project Health**: `pnpm check-types && pnpm lint && pnpm test`

**📊 Task Completion Tracking:**
```bash
# Agent must verify all Archon tasks are marked "done" before considering PRP complete
mcp__archon__find_tasks(filter_by: "project", filter_value: "c4f2e381-13fd-4153-8db6-f1edde27c80d")
# Expected: All 7 tasks with status: "done" and validated completion criteria
```

## Project-Specific Validation Commands
```bash
# Essential health checks for better-chatbot
pnpm check-types           # TypeScript validation
pnpm lint                  # Biome linting
pnpm test                  # Vitest unit tests
pnpm build:local           # Vercel AI SDK build validation

# Chart system specific validation
curl -f http://localhost:3000/api/health/langfuse  # Observability check
# Browser test: Request chart generation and monitor completion

# Canvas system validation (if these exist)
/validate-canvas          # Canvas system validation
/validate-agents          # Agent system validation (tool permissions)
```

---

## Anti-Patterns to Avoid
- ❌ Don't modify Canvas architecture - issue is tool execution completion
- ❌ Don't disable tool validation - security checks are working correctly
- ❌ Don't skip timeout handling - AI SDK has known hanging issues
- ❌ Don't ignore console errors during chart generation
- ❌ Don't modify chart tool structure - async generator pattern is correct
- ❌ Don't add new dependencies - use existing observability and error handling

## Expected Resolution Timeline
- **Tool Permission Fix**: 2 minutes (immediate)
- **Tool Execution Debugging**: 30 minutes (systematic)
- **Canvas Integration Validation**: 15 minutes (testing)
- **Total Expected Time**: 45-60 minutes for complete resolution

## Confidence Level: 9/10

**⚡ IMPLEMENTATION READINESS:** This PRP provides comprehensive context for one-pass implementation success through:
- **Extensive Research**: Vercel AI SDK known issues and solutions documented
- **Architectural Understanding**: Complete diagnosis of execution pipeline failure
- **Specific File References**: Exact locations and patterns from codebase analysis
- **Progressive Validation**: Step-by-step verification approach
- **Known Issue Documentation**: Web research findings about AI SDK tool execution problems
- **🎯 Task Management Integration**: All implementation work tracked in Archon system

**🚨 AGENT EXECUTION REQUIREMENTS:**

1. **MANDATORY FIRST STEP**: Retrieve all Archon tasks before starting implementation
2. **PROGRESS TRACKING**: Update task status (todo → doing → review → done) throughout implementation
3. **VALIDATION COORDINATION**: Use task completion as validation checkpoint gates
4. **DISCOVERY DOCUMENTATION**: Record any implementation insights in Archon task updates
5. **FINAL VERIFICATION**: Ensure all 7 Archon tasks marked "done" before PRP completion

**🔍 Success Criteria Integration:**
The combination of simple configuration fixes, systematic debugging based on documented patterns, AND proper task management coordination provides high confidence for successful resolution.

**📋 Agent Accountability:** Proper use of the Archon task management system is REQUIRED for PRP implementation. Failure to coordinate through tasks indicates incomplete implementation approach.