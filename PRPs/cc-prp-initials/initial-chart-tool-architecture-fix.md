# Chart Tool Architecture Fix & Dynamic Tool Registry Enhancement

## PROJECT TECHNOLOGY STACK:

**Base Framework:** Next.js 15.3.2 with App Router + TypeScript 5.9.2
**AI Foundation:** Vercel AI SDK v5.0.26 (foundational - all AI operations built on this)
**UI Framework:** React 19.1.1 with Tailwind CSS 4.1.12, Radix UI, Framer Motion 12.23.12
**Authentication:** Better-Auth 1.3.7
**Database:** PostgreSQL with Drizzle ORM 0.41.0
**Observability:** Langfuse SDK v4.1.0 with OpenTelemetry 2.1.0

**Critical Issue:** Chart visualization tools failing with `tool_use`/`tool_result` block mismatch in Vercel AI SDK integration, preventing users from creating bar charts, line charts, and other data visualizations through AI conversation.

---

## FEATURE PURPOSE:

**Restore and enhance the chart tool architecture to eliminate tool_use/tool_result block mismatches that are preventing chart visualizations from being created.**

This critical fix will:
- Resolve the fundamental tool naming architecture mismatch between `DefaultToolName` enum and Vercel AI SDK tool registration
- Restore chart creation functionality for all 17 specialized chart tools (bar, line, pie, area, scatter, radar, funnel, treemap, sankey, radial bar, composed, geographic, gauge, calendar heatmap, table, and dashboard orchestrator)
- Implement robust tool registry validation and debugging capabilities
- Ensure consistent tool naming patterns across the dynamic tool loading pipeline
- Establish architectural patterns that prevent future tool registration failures

**User Impact:** Users will be able to successfully request chart visualizations like "create a bar chart showing quarterly sales" and have the AI generate interactive charts that display in the Canvas workspace.

---

## CORE ARCHITECTURE COMPONENTS & FIXES:

**Essential fixes needed based on architectural investigation:**

1. **Tool Name Consistency Architecture:**
   - Add explicit `name` properties to all chart tools matching `DefaultToolName` enum values
   - Ensure `createTool()` calls include proper name mapping for Vercel AI SDK
   - Validate tool registration keys match expected AI invocation names

2. **Dynamic Tool Registry Enhancement:**
   - Strengthen `loadAppDefaultTools()` function with robust error handling
   - Implement tool name validation at startup
   - Add comprehensive debugging capabilities for tool registration pipeline

3. **Chart Tool Integration Fixes:**
   - Fix artifact tools integration with Canvas system
   - Ensure `shouldCreateArtifact: true` flag properly triggers Canvas processing
   - Validate streaming chart generation with proper tool result handling

4. **Tool Loading Pipeline Hardening:**
   - Enhance `APP_DEFAULT_TOOL_KIT` structure for consistent tool access
   - Implement runtime tool registry validation
   - Add tool name consistency checks across MCP, Workflow, and App Default tools

---

## EXISTING COMPONENTS TO LEVERAGE:

**Current chart tool architecture (discovered via Serena analysis):**

**Chart Tool Files:**
- `src/lib/ai/tools/artifacts/bar-chart-tool.ts` - Bar chart artifact tool (needs name fix)
- `src/lib/ai/tools/artifacts/line-chart-tool.ts` - Line chart tool (needs name fix)
- `src/lib/ai/tools/artifacts/pie-chart-tool.ts` - Pie chart tool (needs name fix)
- `src/lib/ai/tools/artifacts/[13-other-chart-tools].ts` - All specialized chart tools requiring fixes
- `src/lib/ai/tools/artifacts/index.ts` - Chart tool aggregation and exports

**Tool Registry Components:**
- `src/lib/ai/tools/tool-kit.ts` - `APP_DEFAULT_TOOL_KIT` main registry requiring architecture fix
- `src/lib/ai/tools/index.ts` - `DefaultToolName` enum defining expected tool names
- `src/app/api/chat/shared.chat.ts` - `loadAppDefaultTools` function needing enhancement
- `src/app/api/chat/route.ts` - Main chat handler integrating tool pipeline

**Canvas Integration Components:**
- `src/components/canvas-panel.tsx` - Canvas workspace for chart display
- `src/components/tool-invocation/` - Chart renderers for Canvas artifacts
- `src/hooks/use-canvas.ts` - Canvas state management for chart artifacts

**Testing Infrastructure:**
- `src/app/api/chat/agent-tool-loading.test.ts` - Existing tool loading tests to extend

---

## TECHNICAL INTEGRATION POINTS:

**Vercel AI SDK Integration (Critical Fix Required):**
- **Issue:** Tool names from `DefaultToolName` enum don't match Vercel AI SDK tool registration
- **Fix:** Add explicit `name` properties to `createTool()` calls matching enum values
- **Integration:** `src/app/api/chat/route.ts` uses `streamText()` with tools from `loadAppDefaultTools()`

**Chart Tool Pipeline (Discovered Architecture):**
```
AI Request → loadAppDefaultTools() → APP_DEFAULT_TOOL_KIT.artifacts →
[DefaultToolName.CreateBarChart]: barChartArtifactTool →
createTool({ name: "create_bar_chart" }) → Vercel AI SDK → Canvas
```

**Tool Registry Architecture:**
- `APP_DEFAULT_TOOL_KIT` object maps `DefaultToolName` enum values to tool functions
- Tool functions created with `createTool()` from `ai` package (Vercel AI SDK)
- Missing explicit `name` properties causing runtime tool resolution failures

**Canvas System Integration:**
- Chart tools return `shouldCreateArtifact: true` to trigger Canvas processing
- Canvas renders artifacts using `src/components/tool-invocation/` chart components
- Artifact metadata includes chart type, data, and styling information

**Database Integration (If Needed):**
- Chart data may require temporary storage for complex visualizations
- Canvas state persistence through existing repository patterns
- User preferences for chart styling and defaults

---

## DEVELOPMENT PATTERNS TO FOLLOW:

**Tool Architecture Patterns:**
- **Explicit Tool Naming:** All `createTool()` calls must include `name` property matching `DefaultToolName` enum
- **Consistent Schema Structure:** Use Zod schemas for `inputSchema` validation
- **Streaming Support:** Implement `async function*` generators for progressive chart building
- **Error Handling:** Robust validation with security audit checks and XSS prevention

**Chart Tool Pattern (Discovered from `bar-chart-tool.ts`):**
```typescript
export const chartArtifactTool = createTool({
  name: "create_chart_name", // ⭐ CRITICAL: Must match DefaultToolName enum
  description: "...",
  inputSchema: z.object({...}),
  execute: async function* ({ params }) {
    // Streaming implementation with yield statements
    yield { status: "loading", progress: 0 };
    // ... processing
    yield { status: "success", shouldCreateArtifact: true };
    return { content: [...], structuredContent: {...} };
  }
});
```

**Tool Registry Pattern:**
```typescript
export const APP_DEFAULT_TOOL_KIT = {
  [AppDefaultToolkit.Artifacts]: {
    [DefaultToolName.CreateBarChart]: barChartArtifactTool, // Must have matching name
    // ... other tools
  }
};
```

**Validation Patterns:**
- Runtime tool name validation at application startup
- Comprehensive logging for tool registration debugging
- Security validation for chart data (XSS prevention, data sanitization)
- Performance monitoring for chart generation pipeline

---

## SECURITY & ACCESS PATTERNS:

**Chart Tool Security:**
- **XSS Prevention:** All chart data validated through `CHART_VALIDATORS` with security audits
- **Data Sanitization:** Chart inputs sanitized before processing and rendering
- **Content Security:** Artifact content validated before Canvas rendering
- **Rate Limiting:** Tool execution throttling to prevent abuse

**Tool Registry Security:**
- **Validation Gates:** Tool name consistency checks prevent malicious tool injection
- **Runtime Verification:** Tool availability validation during registration
- **Error Handling:** Secure error messages without exposing internal architecture
- **Debugging Security:** Debug logging carefully designed to avoid sensitive data exposure

**Canvas Security Patterns:**
- **Safe Rendering:** Chart artifacts validated before Canvas display
- **Memory Safety:** Proper cleanup of chart resources to prevent memory leaks
- **User Isolation:** Chart data properly scoped to user sessions
- **Export Security:** Secure chart export functionality with proper validation

---

## ARCHITECTURE PROBLEM ANALYSIS:

**Root Cause Identified:**
1. **Tool Name Mismatch:** `DefaultToolName.CreateBarChart = "create_bar_chart"` but `barChartArtifactTool` has no explicit name property
2. **Registry Inconsistency:** Vercel AI SDK expects tool names to match call signatures, but current architecture relies on object keys
3. **Dynamic Loading Failure:** `loadAppDefaultTools()` creates tool mapping but names don't align with AI invocation expectations

**Critical Evidence:**
```typescript
// Current broken pattern:
[DefaultToolName.CreateBarChart]: barChartArtifactTool
// Where CreateBarChart = "create_bar_chart"
// But barChartArtifactTool = createTool({ /* no name */ })

// AI tries to call: "create_bar_chart"
// But tool registered as: "barChartArtifactTool" (variable name)
// Result: tool_use without matching tool_result
```

**Architecture Violations:**
- Missing explicit tool names violates Vercel AI SDK best practices
- Dynamic tool loading relies on implicit naming conventions
- No validation layer to catch tool registration inconsistencies
- Insufficient debugging capabilities for tool pipeline failures

---

## IMPLEMENTATION BLUEPRINT & TASK BREAKDOWN:

**Phase 1: Immediate Fix (Priority 1)**
1. **Add Explicit Tool Names:** Update all 17 chart tools with matching `name` properties
2. **Validate Single Tool:** Test bar chart creation end-to-end to confirm fix
3. **Registry Verification:** Add debug logging to confirm tool name consistency

**Phase 2: Architecture Hardening (Priority 2)**
1. **Tool Registry Validation:** Implement startup validation for tool name consistency
2. **Enhanced Debugging:** Add comprehensive logging throughout tool loading pipeline
3. **Error Recovery:** Implement graceful fallbacks for tool registration failures

**Phase 3: Testing & Validation (Priority 3)**
1. **Comprehensive Testing:** Test all 17 chart tools with various data inputs
2. **Canvas Integration:** Verify chart artifacts properly display in Canvas workspace
3. **Performance Validation:** Ensure fix doesn't impact tool loading performance

**Phase 4: Prevention Measures (Priority 4)**
1. **Type Safety:** Add TypeScript validation for tool name consistency
2. **Runtime Checks:** Implement tool registry health checks
3. **Developer Experience:** Add tooling to prevent future tool registration issues

**File-Specific Changes Required:**
- `src/lib/ai/tools/artifacts/*.ts` - Add explicit `name` properties to all chart tools
- `src/lib/ai/tools/tool-kit.ts` - Enhance registry with validation
- `src/app/api/chat/shared.chat.ts` - Strengthen `loadAppDefaultTools` with debugging
- `src/app/api/chat/agent-tool-loading.test.ts` - Add tool name validation tests

---

## TECHNOLOGY CONTEXT & BEST PRACTICES:

**Vercel AI SDK Tool Naming Best Practices (Research Findings):**
- Tools registered in `tools` object use **key names** as tool identifiers
- `createTool()` can optionally include explicit `name` property for clarity
- Tool names must be consistent between AI invocation and registry registration
- Best practice: Use descriptive, kebab-case names matching function purpose

**Tool Registration Pattern (AI SDK 5.0.26):**
```typescript
const tools = {
  "create_bar_chart": createTool({
    name: "create_bar_chart", // Optional but recommended for clarity
    description: "...",
    inputSchema: z.object({...}),
    execute: async function* ({...}) { /* implementation */ }
  })
};
```

**Common Tool Issues (Research from AI SDK docs):**
- **ToolInvocation Missing Result Error:** When tools lack proper execute functions
- **Tool Name Mismatches:** When tool registration names don't match AI expectations
- **Tool Call Repair:** Use of `experimental_toToolCallRepair` for failed tool calls
- **Enhanced Error Handling:** NoSuchToolError for undefined tool calls

**Canvas Integration Requirements:**
- Chart tools must return `shouldCreateArtifact: true` for Canvas processing
- Artifact content must be JSON-serializable with proper metadata
- Progressive loading with `yield` statements for better UX
- Proper error handling with structured error responses

---

## TESTING & VALIDATION REQUIREMENTS:

**Tool Registration Testing:**
- **Unit Tests:** Validate tool name consistency across all chart tools
- **Integration Tests:** Test complete tool loading pipeline from request to Canvas
- **Error Handling Tests:** Verify graceful failures for malformed tool calls
- **Performance Tests:** Ensure tool registration doesn't impact startup time

**Chart Generation Testing:**
- **Functional Tests:** Test all 17 chart types with various data inputs
- **Canvas Integration Tests:** Verify artifacts properly display in Canvas workspace
- **Streaming Tests:** Validate progressive chart building with yield statements
- **Security Tests:** Confirm XSS prevention and data sanitization

**Validation Commands (Better-Chatbot Specific):**
```bash
# Type checking with chart tool validation
pnpm check-types

# Lint validation for tool architecture
pnpm lint

# Unit tests focusing on tool registry
pnpm test src/app/api/chat/agent-tool-loading.test.ts

# E2E tests for chart creation workflow
pnpm test:e2e

# Build validation ensuring tool registration works
pnpm build:local

# Local development server for testing fixes
pnpm dev
```

**Manual Testing Protocol:**
1. Start development server: `pnpm dev`
2. Test basic chart request: "Create a bar chart showing quarterly sales"
3. Verify Canvas integration: Check if chart appears in Canvas workspace
4. Test multiple chart types: Line, pie, area charts with different data
5. Validate error handling: Test with malformed data inputs

---

## PERFORMANCE OPTIMIZATION:

**Tool Loading Performance:**
- **Lazy Registration:** Tools loaded only when needed to reduce startup time
- **Validation Caching:** Cache tool name validation results
- **Error Prevention:** Early validation prevents expensive error recovery
- **Memory Efficiency:** Proper tool cleanup to prevent memory leaks

**Chart Generation Performance:**
- **Streaming Processing:** Use `async function*` for progressive chart building
- **Data Validation:** Efficient validation without blocking chart generation
- **Canvas Optimization:** Efficient artifact processing for smooth UI updates
- **Caching Strategy:** Cache chart artifacts for repeated requests

**Debug Performance Considerations:**
- **Conditional Logging:** Debug logging only in development environment
- **Minimal Overhead:** Tool validation designed for production efficiency
- **Performance Monitoring:** Integration with existing Langfuse observability

---

## FILE STRUCTURE & ORGANIZATION:

**Critical Files Requiring Updates:**
```
src/lib/ai/tools/artifacts/
├── bar-chart-tool.ts          # Add name: "create_bar_chart"
├── line-chart-tool.ts         # Add name: "create_line_chart"
├── pie-chart-tool.ts          # Add name: "create_pie_chart"
├── [14-other-chart-tools].ts  # Add corresponding names
└── index.ts                   # Update exports if needed

src/lib/ai/tools/
├── tool-kit.ts                # Enhance APP_DEFAULT_TOOL_KIT validation
└── index.ts                   # Verify DefaultToolName enum consistency

src/app/api/chat/
├── shared.chat.ts             # Strengthen loadAppDefaultTools function
├── route.ts                   # Add tool registry debugging
└── agent-tool-loading.test.ts # Add validation tests

src/components/
├── canvas-panel.tsx           # Verify artifact processing
└── tool-invocation/           # Chart renderers (should work after fix)
```

**New Files (If Needed):**
```
src/lib/ai/tools/
├── tool-registry-validator.ts # Runtime tool validation utilities
└── tool-debug-logger.ts       # Centralized debug logging

src/lib/validation/
└── tool-security-validator.ts # Enhanced security validation
```

---

## INTEGRATION FOCUS:

**Vercel AI SDK Integration (Primary Focus):**
- Ensure tool names in `APP_DEFAULT_TOOL_KIT` match Vercel AI SDK expectations
- Validate `streamText()` properly processes chart tool calls
- Confirm `experimental_telemetry` captures chart tool performance metrics
- Test tool error handling with AI SDK error recovery mechanisms

**Canvas System Integration:**
- Verify chart artifacts trigger Canvas processing via `shouldCreateArtifact: true`
- Ensure Canvas properly renders chart artifacts from all 17 tool types
- Validate Canvas state management with chart artifact lifecycle
- Test Canvas export functionality with generated chart artifacts

**MCP Integration (Secondary):**
- Ensure chart tool fixes don't interfere with MCP tool loading
- Validate dynamic tool registry accommodates both App Default and MCP tools
- Test tool conflict resolution between different tool sources
- Confirm MCP server health doesn't affect chart tool availability

**Observability Integration:**
- Ensure Langfuse captures chart tool execution metrics
- Add tracing for tool registration and validation processes
- Monitor chart generation performance through existing telemetry
- Track tool failure rates and error patterns

---

## ACCESSIBILITY REQUIREMENTS:

**Chart Tool Accessibility:**
- **Alt Text Generation:** Chart tools generate descriptive alt text for visualizations
- **Data Table Fallbacks:** Provide accessible data table alternatives for charts
- **Screen Reader Support:** Chart artifacts include proper ARIA labels
- **Keyboard Navigation:** Canvas chart interactions support keyboard navigation

**Error Accessibility:**
- **Clear Error Messages:** Tool failures provide clear, actionable error descriptions
- **Error Recovery:** Accessible paths to retry or modify chart requests
- **Status Announcements:** Screen reader announcements for chart generation progress
- **Visual Indicators:** Clear visual feedback for tool loading states

---

## QUALITY VALIDATION CHECKLIST:

**Pre-Implementation Research Completed:**
- [x] Deep codebase analysis using Serena MCP tools extensively
- [x] Web research on Vercel AI SDK tool naming and registration patterns
- [x] Root cause analysis of tool_use/tool_result block mismatch
- [x] Architecture investigation revealing tool naming inconsistencies
- [x] Integration strategy analysis for Chart/Canvas/MCP systems

**Feature Goals Clearly Defined:**
- [x] Restore chart visualization functionality for all 17 chart types
- [x] Fix tool naming architecture mismatch in Vercel AI SDK integration
- [x] Implement robust tool registry validation and debugging
- [x] Establish patterns preventing future tool registration failures
- [x] Maintain compatibility with existing Canvas and MCP integrations

**Implementation Strategy Based on Project Conventions:**
- [x] Tool architecture follows existing `createTool()` patterns
- [x] File organization maintains current structure in `src/lib/ai/tools/`
- [x] Testing approach uses established Vitest and Playwright infrastructure
- [x] Error handling aligns with existing security validation patterns
- [x] Performance optimization integrates with Langfuse observability

**Context Completeness for Future PRP Generation:**
- [x] Specific file references and implementation patterns identified
- [x] Integration requirements with Vercel AI SDK documented
- [x] Security considerations and validation patterns defined
- [x] Testing strategy aligned with project infrastructure
- [x] Performance optimization approach established

**Template Adaptation:**
- [x] Template sections customized for architecture fix rather than UI feature
- [x] Focus on tool registry and naming architecture rather than visual components
- [x] Integration points specific to chart tool pipeline identified
- [x] Testing requirements adapted for tool functionality validation
- [x] Performance considerations focused on tool loading and chart generation

---

## CONFIDENCE ASSESSMENT:

**Initial Plan Quality Score: 9.5/10**

**High Confidence Factors:**
- Root cause clearly identified through comprehensive architectural analysis
- Solution approach based on Vercel AI SDK best practices and documentation
- Implementation strategy leverages existing project patterns and infrastructure
- Testing approach uses established project validation methods
- Fix addresses the exact error pattern observed in user reports

**Risk Mitigation:**
- Phased implementation allows validation at each step
- Comprehensive testing prevents regression in existing functionality
- Debug logging provides visibility into tool registration process
- Architecture enhancements prevent future similar issues

**Success Indicators:**
- Users can successfully request chart visualizations via AI conversation
- All 17 chart types generate properly and display in Canvas workspace
- Tool registry validation prevents future tool registration failures
- Performance impact is minimal and properly monitored through Langfuse

This initial plan provides a solid foundation for successful PRP generation and implementation, with clear technical requirements, implementation strategy, and validation approach based on thorough architectural investigation.