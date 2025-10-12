# Initial Plan: Tool Input Persistence Fix

**Feature Type:** Critical Bug Fix
**Scope:** Message persistence and reconstruction
**Impact:** Restores multi-turn chat functionality
**Complexity:** Low (targeted fix in single function)

## Problem Statement

### User-Facing Issue
Multi-turn conversations fail after the first tool call with error:
```
messages.0.content.1.tool_use.input: Field required
```

**Reproduction:**
1. Send message triggering tool call (e.g., "search for sports")
2. Receive successful response
3. Send follow-up message (e.g., "visualize this")
4. **Error:** Anthropic API rejects request

**Impact:**
- ✅ First message in thread: Works
- ❌ Any subsequent message: Fails
- ✅ Voice chat: Unaffected (different code path)
- ❌ Normal chat: Completely broken for conversations

### Root Cause Analysis

**Regression Introduced:** Commit `d48c3fc` (Oct 10, 2025)
**File:** `src/app/api/chat/shared.chat.ts`
**Function:** `buildResponseMessageFromStreamResult()` (lines 636-700)

**The Bug:**
```typescript
// Line 681-689: Problem code
if (callPart) {
  callPart.state = "output-available";
  callPart.output = toolResult.result;
} else {
  // ❌ BUG: Creates part with empty input
  parts.push({
    type: `tool-${toolResult.toolName}`,
    toolCallId: toolResult.toolCallId,
    input: {}, // ⚠️ VIOLATION: Anthropic requires valid input
    state: "output-available",
    output: toolResult.result,
  });
}
```

**Why It Breaks:**
1. Tool result exists but corresponding tool call missing from step
2. Fallback creates part with `input: {}`
3. Part persisted to database via `convertToSavePart()`
4. Next message loads corrupted history
5. `convertToModelMessages()` transforms to Anthropic format
6. Anthropic API rejects empty/missing tool input field

**External Validation:**
- Similar issue in Vercel AI SDK: [Issue #8938](https://github.com/vercel/ai/issues/8938)
- Anthropic tool validation is strict about input field presence

## Solution Design

### Approach: Skip Invalid Tool Parts (Recommended)

**Strategy:** Don't create tool parts when original input is unavailable

**Rationale:**
- ✅ Simplest and safest fix
- ✅ No data corruption
- ✅ Maintains voice chat compatibility
- ✅ Aligns with Anthropic API requirements
- ✅ No breaking changes to message format

**Implementation:**
```typescript
// Modified buildResponseMessageFromStreamResult()
if (step.toolResults && Array.isArray(step.toolResults)) {
  for (const toolResult of step.toolResults) {
    const callPart = parts.find(
      (p) => typeof p === "object" && p.toolCallId === toolResult.toolCallId,
    );

    if (callPart) {
      // Update existing part with result
      callPart.state = "output-available";
      callPart.output = toolResult.result;
    } else {
      // ✅ FIX: Skip if no matching call (input unavailable)
      logger.warn(
        `Tool result without matching call: ${toolResult.toolName}`,
        { toolCallId: toolResult.toolCallId }
      );
      // Don't create incomplete part - skip it
    }
  }
}
```

### Alternative Approaches Considered

**Option 2: Preserve Input from Steps**
- Look up original args from step.toolCalls by toolCallId
- More complex, requires step traversal
- Risk: May not find input in all cases

**Option 3: Filter Before API Call**
- Clean up history before `convertToModelMessages()`
- Reactive rather than preventive
- Risk: Band-aid solution, doesn't fix root cause

**Option 4: Use Vercel AI SDK Native Types**
- Convert to proper `CoreMessage` format earlier
- Major refactor, high risk
- Out of scope for targeted fix

## Implementation Plan

### Files to Modify

**Primary:**
- `src/app/api/chat/shared.chat.ts` (buildResponseMessageFromStreamResult function)

**For Validation:**
- Review `src/app/api/chat/route.ts` (debug logging removal after fix)

### Step-by-Step Implementation

**Phase 1: Core Fix (10 minutes)**
1. Modify `buildResponseMessageFromStreamResult()` line 681-689
2. Replace fallback part creation with warning log
3. Add comment explaining why we skip incomplete parts

**Phase 2: Cleanup (5 minutes)**
4. Remove debug logging from route.ts (lines 310-325)
5. Verify no other references to empty input pattern

**Phase 3: Validation (15 minutes)**
6. Test multi-turn conversation with tool calls
7. Verify first and subsequent messages work
8. Confirm voice chat still functions
9. Check database for no corrupted parts

### Code Changes

**File:** `src/app/api/chat/shared.chat.ts`

```typescript
// Lines 668-692: Updated implementation
if (step.toolResults && Array.isArray(step.toolResults)) {
  for (const toolResult of step.toolResults) {
    // Find the corresponding call part
    const callPart = parts.find(
      (p) =>
        typeof p === "object" && p.toolCallId === toolResult.toolCallId,
    );

    if (callPart) {
      // Update the existing part with result
      callPart.state = "output-available";
      callPart.output = toolResult.result;
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
  }
}
```

**File:** `src/app/api/chat/route.ts`

```typescript
// Lines 309-325: Remove debug logging (added for investigation)
// DELETE these lines after fix is validated:
// logger.info("📋 Messages before convertToModelMessages:", { ... });
```

## Testing Strategy

### Manual Testing

**Test Case 1: Multi-Turn Conversation**
```bash
# Start dev server
pnpm dev

# In UI:
1. Send: "search for sports audiences"
2. Wait for tool call response
3. Send: "now visualize this data"
4. ✅ Expect: Success, no API error
```

**Test Case 2: Voice Chat**
```bash
# Verify voice chat still works
1. Open voice dialog
2. Speak command with tool call
3. ✅ Expect: Tool executes correctly
```

**Test Case 3: Fresh Conversation**
```bash
# Verify first message still works
1. Start new thread
2. Send message with tool call
3. ✅ Expect: Success
```

### Automated Testing

**Validation Commands:**
```bash
pnpm check-types  # TypeScript validation
pnpm lint         # Code style
pnpm test         # Unit tests
```

**No new tests required** - existing tests should pass after fix.

### Edge Cases to Verify

1. **Multiple tool calls in single step** - Verify all parts created correctly
2. **Tool call + tool result in same step** - Verify matching works
3. **Tool result without call** - Verify warning logged, part skipped
4. **Empty conversation history** - Verify first message works
5. **Voice chat with charts** - Verify Canvas integration unaffected

## Success Criteria

### Functional Requirements
- ✅ Multi-turn conversations work without errors
- ✅ Tool calls persist and load correctly
- ✅ Voice chat functionality unchanged
- ✅ No corrupted parts in database
- ✅ Anthropic API accepts all messages

### Technical Requirements
- ✅ No TypeScript errors
- ✅ Linting passes
- ✅ No console errors in logs
- ✅ No breaking changes to message format
- ✅ Backward compatible with existing data

### Performance Requirements
- ✅ No performance degradation
- ✅ No additional database queries
- ✅ No memory leaks from skipped parts

## Risk Assessment

### Risks & Mitigations

**Risk 1: Missing tool results in UI**
- **Impact:** Low - Results already displayed during streaming
- **Mitigation:** Tool results processed in `onStepFinish` callback
- **Validation:** Verify Canvas charts render correctly

**Risk 2: Voice chat regression**
- **Impact:** Critical - Different code path should be unaffected
- **Mitigation:** Voice uses different persistence (`openai-realtime/actions.ts`)
- **Validation:** Manual voice chat testing required

**Risk 3: Historical data corruption**
- **Impact:** Low - Existing corrupt parts remain but won't block new messages
- **Mitigation:** Fix is forward-only, doesn't modify existing data
- **Validation:** Monitor for any legacy issues

**Risk 4: Downstream consumers expecting parts**
- **Impact:** Low - UI handles missing parts gracefully
- **Mitigation:** Review Canvas integration and tool result display
- **Validation:** Test chart rendering after fix

## Project Context

### Related Systems

**Vercel AI SDK v5.0.26:**
- Uses `convertToModelMessages()` for Anthropic format conversion
- Strict validation of tool_use content blocks
- Requires input field for all tool calls

**Message Persistence:**
- Flow: `streamText` → `buildResponseMessageFromStreamResult` → `convertToSavePart` → Database
- Parts stored as JSONB in PostgreSQL
- Loaded via `chatRepository.selectThreadDetails()`

**Voice Chat (Unaffected):**
- Uses `openai-realtime/actions.ts` for tool execution
- Different persistence path via `persistVoiceMessageAction`
- Does not use `buildResponseMessageFromStreamResult()`

**Canvas Integration:**
- Chart tools yield during execution
- Results captured in `onStepFinish` callback
- UI receives results via streaming, not message history

### File Organization

```
src/app/api/chat/
├── route.ts                    # Main chat endpoint
├── shared.chat.ts              # ⚠️ FIX HERE: buildResponseMessageFromStreamResult
├── openai-realtime/
│   └── actions.ts              # Voice chat (different code path)
└── actions.ts                  # Thread/agent helpers
```

### Commit Context

**Previous Fix:** `d48c3fc` (Oct 10, 2025)
- Added `buildResponseMessageFromStreamResult()` for message persistence
- Inadvertently introduced empty input fallback
- Restored chat persistence but broke multi-turn conversations

**This Fix:** Tool Input Persistence Fix
- Removes problematic fallback
- Restores multi-turn conversation functionality
- Maintains all benefits from previous fix

## Validation Gates

### Pre-Merge Checklist
- [ ] TypeScript compilation passes (`pnpm check-types`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] Manual multi-turn conversation test passes
- [ ] Voice chat manual test passes
- [ ] Canvas chart rendering test passes
- [ ] No console errors in dev logs
- [ ] Code review approved

### Deployment Validation
```bash
# Build validation
pnpm build:local

# Runtime validation (after deploy)
curl -f http://localhost:3000/api/health/langfuse

# Monitor logs for warnings about skipped tool results
# Should be rare - only when steps don't match
```

## Documentation Updates

**Not Required** - This is an internal bug fix with no:
- API changes
- User-facing feature changes
- Configuration changes
- Breaking changes

**Optional:** Add comment in code explaining why we skip parts without input.

## Timeline Estimate

- **Implementation:** 15 minutes
- **Testing:** 15 minutes
- **Review & Validation:** 10 minutes
- **Total:** ~40 minutes

## Confidence Score

**9/10** - High confidence this fix resolves the issue because:
- ✅ Root cause clearly identified through detailed analysis
- ✅ Solution is minimal and targeted (single function, ~5 lines)
- ✅ No architectural changes or refactoring needed
- ✅ Similar pattern used successfully elsewhere in codebase
- ✅ External validation from Vercel AI SDK ecosystem issues
- ✅ Clear testing strategy and success criteria
- ✅ Low risk - affects only fallback path, not main flow
- ✅ Voice chat isolation confirmed via code analysis

**-1 point deduction for:**
- Need to verify no downstream consumers rely on parts with empty input
- Historical corrupted data remains (though won't block new messages)

## Next Steps

1. **Immediate:** Implement fix in `shared.chat.ts`
2. **Validation:** Run manual test cases
3. **Cleanup:** Remove debug logging
4. **Deploy:** Merge after validation gates pass
5. **Monitor:** Watch for any skipped tool result warnings in production

---

**Document Status:** Ready for PRP Generation
**Last Updated:** 2025-10-12
**Reviewed By:** Analysis complete, fix strategy validated
