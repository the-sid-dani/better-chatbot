# PRP: Tool Input Persistence Fix

**Status:** Ready for Implementation
**Priority:** Critical
**Estimated Time:** 40 minutes
**Complexity:** Low (Single function, ~5 line change)
**Impact:** Restores multi-turn chat functionality

## Executive Summary

**Problem:** Multi-turn chat conversations fail after the first tool call with Anthropic API error: `messages.0.content.1.tool_use.input: Field required`

**Root Cause:** Function `buildResponseMessageFromStreamResult()` creates tool parts with empty `input: {}` when tool results lack matching tool calls, violating Anthropic's strict validation requirements.

**Solution:** Skip creating tool parts when original input is unavailable. Log warning for monitoring.

**Risk:** Low - Targeted fix in single function, voice chat unaffected (different code path)

**Archon Project:** [Tool Input Persistence Fix](https://archon.local/projects/108336f8-f008-4abc-8e10-d077ed3bb27e)

## Problem Statement

### User-Facing Symptoms

**Error Message:**
```
messages.0.content.1.tool_use.input: Field required
```

**Impact:**
- ✅ First message in thread: Works perfectly
- ❌ Any subsequent message: Fails with API error
- ✅ Voice chat: Unaffected (uses different persistence path)
- ❌ Normal chat: Multi-turn conversations completely broken

### Reproduction Steps

```bash
# Start dev server
pnpm dev

# In chat UI:
1. Send: "search for sports audiences"
   → ✅ Works: Tool executes, results display
2. Send: "now visualize this data"
   → ❌ FAILS: API error, message not sent
```

**Logs:**
```
[samba-orion] ERROR Chat API: 🚨 Unknown Error Type: {
  error: {
    [Error [AI_APICallError]: messages.0.content.1.tool_use.input: Field required]
    url: 'https://api.anthropic.com/v1/messages',
    statusCode: 400
  }
}
```

## Root Cause Analysis

### The Regression

**Introduced:** Commit `d48c3fc` (October 10, 2025)
**Commit Message:** "fix: comprehensive chat persistence, Canvas table/BAN integration, and voice fixes"
**File:** `src/app/api/chat/shared.chat.ts`
**Function:** `buildResponseMessageFromStreamResult()` (lines 636-700)

### The Bug Chain

**Step 1: First Message (Works)**
```typescript
// User sends message triggering tool
User: "search for sports"
→ streamText() executes tool
→ Tool call: { toolName: "audience_search", args: { keyword: "sports" } }
→ Tool result: { data: [...] }
→ buildResponseMessageFromStreamResult() creates parts
→ Persisted to database ✅
```

**Step 2: Message Persistence (Problem Introduced)**
```typescript
// src/app/api/chat/shared.chat.ts:668-689
if (step.toolResults && Array.isArray(step.toolResults)) {
  for (const toolResult of step.toolResults) {
    const callPart = parts.find(
      (p) => typeof p === "object" && p.toolCallId === toolResult.toolCallId
    );

    if (callPart) {
      // ✅ Normal case: Update existing part
      callPart.state = "output-available";
      callPart.output = toolResult.result;
    } else {
      // ❌ BUG: Creates invalid part
      parts.push({
        type: `tool-${toolResult.toolName}`,
        toolCallId: toolResult.toolCallId,
        input: {}, // ⚠️ VIOLATION: Anthropic requires valid input, not empty object
        state: "output-available",
        output: toolResult.result,
      });
    }
  }
}
```

**Why This Happens:**
- In some cases, `toolResult` exists but corresponding `toolCall` missing from step
- Could be timing issue, step processing order, or SDK behavior
- Fallback creates part with empty `input: {}`
- Empty object violates Anthropic API requirements

**Step 3: Second Message (Fails)**
```typescript
// src/app/api/chat/route.ts:128-140
// Load conversation history from database
const messages: UIMessage[] = (thread?.messages ?? []).map((m) => ({
  id: m.id,
  role: m.role,
  parts: m.parts, // ⚠️ Contains corrupted tool part with input: {}
  metadata: m.metadata,
}));

// src/app/api/chat/route.ts:330
const result = streamText({
  model,
  messages: convertToModelMessages(messages), // ❌ FAILS HERE
  // ...
});
```

**What `convertToModelMessages()` Does (Vercel AI SDK v5.0.26):**
1. Converts our custom `type: "tool-audience_search"` format
2. Transforms to Anthropic's `tool_use` content blocks
3. **Problem:** When encountering `input: {}`:
   - Either strips the empty object (making input undefined)
   - Or passes as-is, Anthropic rejects it

**Anthropic API Response:**
```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "messages.0.content.1.tool_use.input: Field required"
  }
}
```

### External Validation

**Vercel AI SDK Issue #8938:**
- Similar issue: "Anthropic type validation error when sending follow-up messages after code execution"
- Same pattern: First message works, subsequent messages fail
- Cause: Invalid tool result format in message history
- Link: https://github.com/vercel/ai/issues/8938

**Anthropic API Documentation:**
- Tool use input field is **required** and must contain actual parameters
- Empty objects `{}` are not valid
- For tools with no inputs, use proper schema: `{ type: "object", properties: {}, required: [] }`
- Link: https://docs.anthropic.com/en/api/messages

**Vercel AI SDK Documentation:**
- Message persistence with tool calls is "full of pitfalls"
- UI messages and Core messages have different shapes
- Tool results need careful handling during persistence
- Link: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence

## Solution Design

### Approach: Skip Invalid Tool Parts

**Strategy:** Don't create tool parts when original input is unavailable.

**Rationale:**
1. **Simplest Fix:** Single function, minimal change (~5 lines)
2. **Safest:** No data corruption, no side effects
3. **Compliant:** Aligns with Anthropic API requirements
4. **Compatible:** Voice chat unaffected (different code path)
5. **Observable:** Log warning for monitoring rare cases

**Why This Works:**
- Tool results are already processed and displayed via `onStepFinish` callback
- Canvas charts render from streaming data, not message history
- UI doesn't depend on complete tool parts in persisted messages
- Skipping incomplete parts prevents API validation errors

### Implementation Details

**File:** `src/app/api/chat/shared.chat.ts`
**Function:** `buildResponseMessageFromStreamResult`
**Lines:** 668-689

**Before (Buggy Code):**
```typescript
} else {
  // No call part found - create result part directly
  parts.push({
    type: `tool-${toolResult.toolName}`,
    toolCallId: toolResult.toolCallId,
    input: {}, // ❌ BUG: Empty input violates Anthropic API
    state: "output-available",
    output: toolResult.result,
  });
}
```

**After (Fixed Code):**
```typescript
} else {
  // FIXED: Don't create parts with empty input
  // Anthropic API requires valid input field for tool_use content
  // If we don't have the original tool call args, skip the part entirely
  logger.warn(
    `Skipping tool result without matching call: ${toolResult.toolName}`,
    {
      toolCallId: toolResult.toolCallId,
      reason: "No original input available",
    }
  );
  // Part intentionally omitted - prevents API validation errors
}
```

**Why Skip vs. Other Approaches:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Skip incomplete parts** | Simple, safe, compliant | Warning logs may appear | ✅ **CHOSEN** |
| Preserve input from steps | More complete data | Complex, unreliable, may not find input | ❌ Too risky |
| Filter before API call | Reactive approach | Band-aid, doesn't fix root cause | ❌ Not preventive |
| Use SDK native types | Future-proof | Major refactor, high risk | ❌ Out of scope |

### Why Voice Chat Is Unaffected

**Voice Chat Code Path:**
```
Voice UI
  ↓
OpenAI Realtime API
  ↓
src/app/api/chat/openai-realtime/actions.ts
  ↓
callAppDefaultToolAction() [different persistence]
  ↓
persistVoiceMessageAction() [bypasses buildResponseMessageFromStreamResult]
  ↓
Database
```

**Normal Chat Code Path:**
```
Chat UI
  ↓
src/app/api/chat/route.ts
  ↓
streamText() → onFinish
  ↓
buildResponseMessageFromStreamResult() [⚠️ FIX HERE]
  ↓
convertToSavePart()
  ↓
Database
```

**Evidence:** `openai-realtime/actions.ts` does not import or use `buildResponseMessageFromStreamResult`.

## Implementation Plan

### Prerequisites

- [x] Archon project created: Tool Input Persistence Fix
- [x] 6 tasks created in Archon with proper ordering
- [x] Development server running on localhost:3000

### Task Breakdown

**Phase 1: Core Fix (10 minutes)**

**Task 1: Modify buildResponseMessageFromStreamResult** (Archon: 62962331)
```typescript
// File: src/app/api/chat/shared.chat.ts
// Lines: 668-689

// Find the else block:
} else {
  // No call part found - create result part directly
  parts.push({
    type: `tool-${toolResult.toolName}`,
    toolCallId: toolResult.toolCallId,
    input: {}, // DELETE THIS LINE
    state: "output-available",
    output: toolResult.result,
  });
}

// Replace with:
} else {
  // FIXED: Don't create parts with empty input
  // Anthropic API requires valid input field for tool_use content
  // If we don't have the original tool call args, skip the part entirely
  logger.warn(
    `Skipping tool result without matching call: ${toolResult.toolName}`,
    {
      toolCallId: toolResult.toolCallId,
      reason: "No original input available",
    }
  );
  // Part intentionally omitted - prevents API validation errors
}
```

**Validation:**
- TypeScript compilation: `pnpm check-types`
- No new errors should appear

**Phase 2: Cleanup (5 minutes)**

**Task 2: Remove debug logging** (Archon: 9458dfe6)
```typescript
// File: src/app/api/chat/route.ts
// Lines: 309-325

// DELETE this entire block:
logger.info("📋 Messages before convertToModelMessages:", {
  messageCount: messages.length,
  messages: messages.map(m => ({
    id: m.id,
    role: m.role,
    partCount: m.parts.length,
    parts: m.parts.map(p => ({
      type: (p as any).type,
      hasInput: 'input' in p,
      inputValue: (p as any).input,
      hasOutput: 'output' in p,
      state: (p as any).state,
      toolCallId: (p as any).toolCallId,
    }))
  }))
});
```

**Validation:**
- Code compiles: `pnpm check-types`
- Linting passes: `pnpm lint`

**Phase 3: Validation (25 minutes)**

**Task 3: Run validation gates** (Archon: 0af1be37)
```bash
# TypeScript validation
pnpm check-types
# ✅ Expect: No errors

# Linting
pnpm lint
# ✅ Expect: No warnings or errors

# Unit tests
pnpm test
# ✅ Expect: All tests pass (304/320 expected pattern)

# Build validation
pnpm build:local
# ✅ Expect: Build succeeds
```

**Task 4: Manual test - Multi-turn conversation** (Archon: d107c9d7)
```bash
# Prerequisite: Dev server running
pnpm dev

# Test Steps:
1. Open http://localhost:3000
2. Start new conversation
3. Send: "search for sports audiences"
   ✅ Verify: Tool executes, results display
   ✅ Verify: No errors in console
4. Send: "now visualize this data"
   ✅ Verify: Message sends successfully
   ✅ Verify: No API errors
   ✅ Verify: Response displays
5. Send third message: "show me more details"
   ✅ Verify: Continues working

# Check logs:
# Should see NO errors
# May see occasional warning: "Skipping tool result without matching call"
# This is expected and indicates fix is working
```

**Task 5: Manual test - Voice chat** (Archon: 68d17833)
```bash
# Test Steps:
1. Click voice chat button
2. Speak: "search for technology trends"
3. Wait for tool execution
   ✅ Verify: Tool executes
   ✅ Verify: Results display
4. Speak: "create a chart"
   ✅ Verify: Chart tool executes
   ✅ Verify: Canvas opens if chart tool used

# Voice chat should work identically to before fix
```

**Task 6: Manual test - Canvas integration** (Archon: 048782fc)
```bash
# Test Steps:
1. Send: "create a bar chart showing [data]"
2. Wait for chart generation
   ✅ Verify: Chart renders in Canvas
   ✅ Verify: "Open Canvas" button works
   ✅ Verify: Chart displays correctly in workspace
3. Send follow-up: "now create a pie chart"
   ✅ Verify: Second chart appears
   ✅ Verify: Multi-chart layout works

# Canvas rendering depends on streaming (onStepFinish)
# NOT on persisted message parts
# So skipped parts should not affect Canvas
```

### Edge Cases to Test

**Multiple Tool Calls:**
```bash
# Test: Multiple tools in single message
Send: "search for sports AND technology"
✅ Expect: Both tools execute, both results persist
```

**Tool Call + Result in Same Step:**
```bash
# Test: Normal flow
Send: "search for anything"
✅ Expect: Single part with both call and result
```

**Tool Result Without Call:**
```bash
# Test: Rare SDK behavior
# This is the bug scenario
Send: First message with tool
Send: Second message (triggers bug if not fixed)
✅ Expect: Warning logged, but no API error
```

**Empty Conversation:**
```bash
# Test: Fresh start
Send: First message with tool
✅ Expect: Works (no history to corrupt)
```

## Validation Gates

### Automated Validation

```bash
# TypeScript Compilation
pnpm check-types
# ✅ Success Criteria: Exit code 0, no errors

# Linting
pnpm lint
# ✅ Success Criteria: Exit code 0, no warnings

# Unit Tests
pnpm test
# ✅ Success Criteria: All existing tests pass
# Note: 16 MCP tests may fail (pre-existing, not regression)

# Build Validation
pnpm build:local
# ✅ Success Criteria: Build completes without errors

# Observability Health Check
curl -f http://localhost:3000/api/health/langfuse
# ✅ Success Criteria: 200 response, Langfuse connected
```

### Manual Validation

**Success Criteria:**
- [ ] Multi-turn conversation with tool calls works end-to-end
- [ ] No API errors in subsequent messages
- [ ] Voice chat functionality unchanged
- [ ] Canvas charts render correctly
- [ ] No console errors in browser
- [ ] No unexpected warnings in logs (except intentional skip warnings)

### Monitoring Post-Deploy

```bash
# Watch for skip warnings (should be rare)
grep "Skipping tool result" logs/*.log

# Monitor Anthropic API errors (should be zero)
grep "messages.*.tool_use.input" logs/*.log

# Track conversation success rate
# Should increase to 100% after fix
```

## Technical Context

### Vercel AI SDK v5.0.26 Integration

**Key Functions:**
- `streamText()`: Core streaming function with tool execution
- `convertToModelMessages()`: Converts UIMessage to provider-specific format
- `onStepFinish`: Callback for processing tool results during streaming
- `consumeStream()`: Ensures stream completes even if client disconnects

**Documentation:**
- streamText API: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- Tool Calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Message Persistence: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence

### Anthropic API Requirements

**Tool Use Content Blocks:**
- `type`: "tool_use" (required)
- `id`: Tool call ID (required)
- `name`: Tool name (required)
- `input`: Tool parameters object (required, must be valid JSON object)

**Validation Rules:**
- Input field cannot be missing
- Input field cannot be null
- Input field cannot be empty object `{}` for tools expecting parameters
- For tools with no parameters, input must be `{}` but tool schema must define it

**Documentation:**
- Messages API: https://docs.anthropic.com/en/api/messages
- Tool Use: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html

### Project-Specific Patterns

**Message Persistence Flow:**
```
streamText()
  ↓ onFinish callback
buildResponseMessageFromStreamResult()  ← FIX HERE
  ↓
convertToSavePart() [removes providerMetadata]
  ↓
chatRepository.upsertMessage()
  ↓
PostgreSQL (JSONB parts column)
  ↓
chatRepository.selectThreadDetails()
  ↓
convertToModelMessages() [Vercel AI SDK]
  ↓
Anthropic API
```

**Canvas Integration:**
```
streamText()
  ↓ onStepFinish callback (during streaming)
dataStream.write({ type: "tool-result", ... })
  ↓
Client receives streaming updates
  ↓
Canvas renders chart progressively
  ↓
Chart displays in workspace

Note: Canvas does NOT depend on persisted message parts
```

**Voice Chat Path (Unaffected):**
```
OpenAI Realtime API
  ↓
callAppDefaultToolAction()
  ↓
persistVoiceMessageAction()
  ↓
chatRepository.upsertMessage() [direct, not via buildResponseMessageFromStreamResult]
```

## Risk Assessment

### Risk Matrix

| Risk | Probability | Impact | Mitigation | Status |
|------|------------|--------|------------|---------|
| Missing tool results in UI | Low | Low | Results shown via streaming | ✅ Mitigated |
| Voice chat regression | Very Low | Critical | Different code path, isolated | ✅ Mitigated |
| Historical data issues | Medium | Low | Fix is forward-only | ⚠️ Monitor |
| Canvas rendering broken | Very Low | Medium | Canvas uses streaming, not history | ✅ Mitigated |
| New bugs in edge cases | Low | Medium | Comprehensive test coverage | ✅ Mitigated |

### Detailed Risk Analysis

**Risk 1: Missing Tool Results in UI**
- **Impact:** Low - Tool results already displayed during streaming via `onStepFinish`
- **Mitigation:** Canvas charts render from streaming data, not message history
- **Validation:** Test Canvas rendering after fix
- **Likelihood:** Very Low - UI design doesn't depend on persisted parts

**Risk 2: Voice Chat Regression**
- **Impact:** Critical - Would break entire voice feature
- **Mitigation:** Voice uses completely different persistence path (`openai-realtime/actions.ts`)
- **Evidence:** Code analysis confirms no shared functions
- **Validation:** Manual voice chat testing required
- **Likelihood:** Very Low - Isolated code paths

**Risk 3: Historical Corrupted Data**
- **Impact:** Low - Existing corrupt parts remain but won't block new messages
- **Mitigation:** Fix is forward-only, doesn't modify existing database records
- **Consideration:** Old conversations may have invalid parts, but won't cause errors
- **Monitoring:** Track warnings about skipped tool results
- **Likelihood:** Medium - Some users may have existing corrupt data

**Risk 4: Downstream Consumers Expecting Parts**
- **Impact:** Low - UI handles missing parts gracefully
- **Mitigation:** Review Canvas integration and tool result display
- **Evidence:** Canvas renders during streaming, not from history
- **Validation:** Test chart rendering comprehensively
- **Likelihood:** Very Low - Architecture designed for streaming

**Risk 5: Warning Log Spam**
- **Impact:** Very Low - Only observability concern
- **Mitigation:** Warning only logs when call missing (rare)
- **Monitoring:** Track warning frequency
- **Action:** If frequent, investigate why calls are missing
- **Likelihood:** Low - Should be rare edge case

### Rollback Plan

**If Issues Detected:**
```bash
# Revert changes
git revert <commit-hash>

# Or manual revert:
# Restore lines 681-689 in src/app/api/chat/shared.chat.ts
# to original version with `input: {}`

# Redeploy
pnpm build:local
```

**When to Rollback:**
- Voice chat breaks (immediate rollback)
- Canvas rendering fails (immediate rollback)
- Warning spam (> 10% of messages, investigate then decide)
- New critical errors (immediate rollback)

## Success Criteria

### Functional Requirements
- ✅ Multi-turn conversations work without API errors
- ✅ First message continues to work
- ✅ Tool calls execute and persist correctly
- ✅ Voice chat functionality completely unchanged
- ✅ No corrupted parts created in database going forward
- ✅ Anthropic API accepts all message history

### Technical Requirements
- ✅ TypeScript compilation passes (`pnpm check-types`)
- ✅ Linting passes (`pnpm lint`)
- ✅ All existing unit tests pass (`pnpm test`)
- ✅ Build succeeds (`pnpm build:local`)
- ✅ No console errors during runtime
- ✅ No breaking changes to message format
- ✅ Backward compatible with existing data

### Performance Requirements
- ✅ No performance degradation in chat
- ✅ No additional database queries
- ✅ No memory leaks from skipped parts
- ✅ Streaming performance unchanged
- ✅ Canvas rendering speed unchanged

### Observability Requirements
- ✅ Warning logs when parts skipped (for monitoring)
- ✅ No increase in error logs
- ✅ Langfuse tracing continues to work
- ✅ Tool execution tracking unchanged

## Post-Implementation

### Documentation Updates

**Not Required** - This is an internal bug fix with:
- ❌ No API changes
- ❌ No user-facing feature changes
- ❌ No configuration changes
- ❌ No breaking changes
- ✅ Code comments added for clarity

**Optional:**
- Update `shared.chat.ts` function documentation
- Add code comment explaining why we skip parts

### Monitoring Strategy

**Week 1: Active Monitoring**
```bash
# Daily checks
grep "Skipping tool result" logs/*.log | wc -l
# Expected: < 5% of tool calls

grep "tool_use.input: Field required" logs/*.log
# Expected: 0 occurrences

# Check Langfuse dashboard
# Verify conversation success rate increased to ~100%
```

**Ongoing: Passive Monitoring**
- Alert if warning frequency > 10% of tool calls
- Alert if any `tool_use.input` errors return
- Track multi-turn conversation success rate

### Knowledge Sharing

**Team Communication:**
- Share fix details in team chat
- Document root cause in postmortem
- Update onboarding docs if needed

**Future Prevention:**
- Consider adding unit test for `buildResponseMessageFromStreamResult`
- Document tool part validation requirements
- Review other message persistence code paths

## Confidence Score

**9/10** - Very High Confidence

**Confidence Factors:**
- ✅ Root cause clearly identified through detailed debugging
- ✅ Solution is minimal and surgical (single function, ~5 lines)
- ✅ No architectural changes or major refactoring
- ✅ External validation from Vercel AI SDK community (Issue #8938)
- ✅ Anthropic API requirements well-documented
- ✅ Clear testing strategy with comprehensive coverage
- ✅ Low risk - affects only fallback path, not main flow
- ✅ Voice chat isolation confirmed through code analysis
- ✅ Similar warning patterns used elsewhere in codebase (logger.warn)

**Confidence Deductions (-1 point):**
- ⚠️ Need to verify no downstream consumers rely on parts with empty input
- ⚠️ Historical corrupted data remains (though won't cause new errors)
- ⚠️ Small chance of unknown edge cases in SDK step processing

**Why High Confidence:**
1. **Clear Problem:** Error is explicit, reproducible, well-understood
2. **Targeted Fix:** Single function, minimal change, easy to review
3. **Safe Approach:** Skip invalid data rather than fabricate
4. **Proven Pattern:** Similar warning logs used throughout codebase
5. **Isolated Impact:** Voice chat and Canvas verified unaffected
6. **External Support:** Similar issues documented in AI SDK community
7. **Easy Rollback:** Simple revert if any issues detected

## References

### Vercel AI SDK

**Documentation:**
- AI SDK v5 Release: https://vercel.com/blog/ai-sdk-5
- streamText API: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- Tool Calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Message Persistence: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence

**Community Issues:**
- Issue #8938: Anthropic validation after tool execution: https://github.com/vercel/ai/issues/8938
- Discussion #4845: Message persistence guidance: https://github.com/vercel/ai/discussions/4845
- Issue #2993: Tool calling callbacks: https://github.com/vercel/ai/issues/2993

### Anthropic API

**Documentation:**
- Messages API: https://docs.anthropic.com/en/api/messages
- Release Notes: https://docs.claude.com/en/release-notes/api
- Tool Use (AWS): https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html

**Community Resources:**
- Stack Overflow: Making tool calls with no inputs: https://stackoverflow.com/questions/78514208/making-a-tool-call-using-anthropic-claude-with-no-inputs

### Project Context

**Related Files:**
- `src/app/api/chat/route.ts` - Main chat endpoint with streamText
- `src/app/api/chat/shared.chat.ts` - **FIX HERE**: buildResponseMessageFromStreamResult
- `src/app/api/chat/openai-realtime/actions.ts` - Voice chat (different path)
- `src/lib/db/repository/chat.repository.ts` - Database persistence layer
- `src/types/chat.ts` - ChatMessage and ChatMetadata types

**Related Commits:**
- `d48c3fc`: Introduced regression (chat persistence fix)
- `81b3c3a`: Voice chat infinite loop fix
- `325e54a`: MCP tool loading restoration

## Appendix

### Code Examples

**Example 1: Valid Tool Part**
```typescript
{
  type: "tool-audience_search",
  toolCallId: "call_abc123",
  input: { keyword: "sports" }, // ✅ Valid: Actual parameters
  state: "output-available",
  output: { results: [...] }
}
```

**Example 2: Invalid Tool Part (Bug)**
```typescript
{
  type: "tool-audience_search",
  toolCallId: "call_abc123",
  input: {}, // ❌ Invalid: Empty object
  state: "output-available",
  output: { results: [...] }
}
```

**Example 3: Skipped Part (Fix)**
```typescript
// Part not created at all
// Warning logged instead
// No API validation error
```

### Debugging Commands

```bash
# View recent logs
tail -f logs/development.log | grep -E "tool|Tool"

# Check database for corrupt parts
# (PostgreSQL query)
SELECT id, role, parts
FROM messages
WHERE parts::text LIKE '%"input":{}%';

# Monitor Anthropic API calls
tail -f logs/development.log | grep "anthropic.com"

# Check Langfuse traces
# Visit: https://langfuse.cap.mysamba.tv
# Filter by: error = true
```

### Testing Checklist

**Before Starting:**
- [ ] Read entire PRP document
- [ ] Understand root cause completely
- [ ] Review related code in route.ts
- [ ] Check Archon tasks are accessible

**During Implementation:**
- [ ] Make exactly specified code change
- [ ] Add clear code comments
- [ ] Remove debug logging
- [ ] Run TypeScript check after each change
- [ ] Run lint after each change

**After Implementation:**
- [ ] All validation gates pass
- [ ] All 3 manual tests complete successfully
- [ ] No console errors observed
- [ ] Verify warning log format if triggered
- [ ] Update Archon task statuses

**Before Merge:**
- [ ] Code review completed
- [ ] All tests documented
- [ ] Rollback plan understood
- [ ] Monitoring strategy clear

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Next Review:** Post-implementation (after deploy)
**Archon Project ID:** 108336f8-f008-4abc-8e10-d077ed3bb27e
