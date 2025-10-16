# Initial Plan: Tool Call Persistence Fix

## Feature Overview

**Goal**: Fix tool calls vanishing after page refresh by correcting the data capture mechanism in the chat API.

**Problem Statement**: Tool calls (like audience_search) display correctly during the chat session but disappear when the page is refreshed. Investigation revealed that the database persistence logic uses `result.steps` (SDK internal state) instead of the UI message stream (SDK public API), causing incomplete tool data to be saved.

**Core Issue**: Architectural mismatch between data sources for client display vs. database persistence.

---

## Root Cause Analysis

### Current Architecture (Broken)

```
Client Display Path (WORKS):
  streamText() → result.toUIMessageStream() → dataStream.merge() → Client sees tool calls ✅

Database Persistence Path (BROKEN):
  streamText() → result.steps → buildResponseMessageFromStreamResult() → Database ❌
                     ↑
                 Internal SDK state - args may be cleared/unavailable
```

### Why Tool Calls Vanish

1. **During Session**: Client receives complete tool data from `toUIMessageStream()` - displays correctly
2. **On Save**: `buildResponseMessageFromStreamResult()` reads `result.steps[].toolCalls[].args`
3. **SDK Behavior**: Vercel AI SDK may clear/optimize args after execution (internal state, not guaranteed)
4. **Empty Args Detection**: Code at `shared.chat.ts:658-674` skips tool calls with empty args (Anthropic API workaround)
5. **On Refresh**: Messages loaded from database are missing tool call parts → tool calls invisible

### Evidence

- Migration error is unrelated (just startup noise)
- Tool calls work during active session (UI stream has data)
- `onStepFinish` payload doesn't include args in toolCalls array
- `result.steps` is internal SDK structure, not public API
- Two different data representations for same information

---

## Solution Architecture

### Principle: Single Source of Truth

**Use the same data source for both client display AND database persistence**: the UI message stream.

### Implementation Strategy

**Intercept UI Message Stream** - Capture tool parts as they stream to client:

```typescript
// In route.ts, streamText() configuration:

// 1. Create capture buffer for tool parts
const capturedToolParts: any[] = [];

// 2. Intercept UI message stream
const uiMessageStream = result.toUIMessageStream({
  messageMetadata: ({ part }) => {
    // Capture ALL tool-related parts as they stream
    if (part.type?.startsWith('tool-')) {
      capturedToolParts.push(part);
    }

    if (part.type == "finish") {
      metadata.usage = part.totalUsage;
      return metadata;
    }
  },
});

// 3. Merge to client (existing behavior)
dataStream.merge(uiMessageStream);

// 4. In onFinish: Use captured data instead of result.steps
const responseMessage = {
  id: result.id || message.id,
  role: "assistant" as const,
  parts: [
    ...(result.text ? [{ type: "text", text: result.text }] : []),
    ...capturedToolParts  // ← Same data client received
  ]
};
```

### Why This Works

- ✅ **Single source of truth**: UI message stream (SDK public API)
- ✅ **Guaranteed completeness**: What client sees = what DB stores
- ✅ **SDK-future-proof**: No dependency on internal structures
- ✅ **Minimal changes**: Intercept existing stream, no new APIs
- ✅ **No data sanitization needed**: Stream already has correct format

---

## Implementation Plan

### Phase 1: Intercept UI Stream (CRITICAL)

**File**: `src/app/api/chat/route.ts`

**Changes**:
1. Add `capturedToolParts` array before `result.toUIMessageStream()`
2. Modify `messageMetadata` callback to capture tool parts
3. Replace `buildResponseMessageFromStreamResult(result, message)` with direct construction using captured parts
4. Remove dependency on `result.steps`

**Impact**:
- Database will store exactly what client displays
- Tool calls persist correctly on page refresh
- No more empty args issues

### Phase 2: Add Observability (VALIDATION)

**File**: `src/app/api/chat/route.ts` (onFinish callback)

**Logging Points**:
1. **Before save**: Log `capturedToolParts.length` and tool types
2. **After save**: Verify persisted message part count matches
3. **On load** (route.ts:130-150): Log any filtering actions

**Purpose**:
- Validate interception works correctly
- Monitor for edge cases
- Enable future debugging

### Phase 3: Clean Up Migration Error (HYGIENE)

**File**: `src/lib/db/migrations/pg/0014_wandering_felicia_hardy.sql`

**Action**: Delete the file

**Reason**:
- `role` column already exists in database
- Migration fails on every startup (noise in logs)
- Unrelated to tool persistence but good housekeeping
- Migration system skips missing files automatically

### Phase 4: Remove Deprecated Code

**File**: `src/app/api/chat/shared.chat.ts`

**Optional Cleanup**:
- `buildResponseMessageFromStreamResult()` function no longer needed
- Can be removed or marked as deprecated
- Keep for now until fully validated

---

## Files Modified

### Primary Changes
- `src/app/api/chat/route.ts` - Intercept UI stream, use captured data for persistence

### Secondary Changes
- Delete `src/lib/db/migrations/pg/0014_wandering_felicia_hardy.sql` - Remove problematic migration

### No Changes Required
- `src/app/api/chat/shared.chat.ts` - Keep existing code (can clean up later)
- `src/lib/db/pg/repositories/chat-repository.pg.ts` - Repository logic stays same
- `src/lib/db/pg/schema.pg.ts` - Schema unchanged

---

## Integration Points

### Vercel AI SDK v5.0.26
- Uses `result.toUIMessageStream()` public API
- Intercepts `messageMetadata` callback (documented pattern)
- No changes to `streamText()` configuration
- Compatible with existing `onStepFinish` and `onFinish` callbacks

### Database (PostgreSQL + Drizzle ORM)
- Uses existing `chatRepository.upsertMessage()`
- No schema changes required
- `ChatMessageSchema.parts` already supports tool parts
- `convertToSavePart()` still used for sanitization

### Client Display
- No changes required
- Client continues receiving data from `dataStream.merge()`
- Tool invocation components unchanged
- Message rendering logic untouched

---

## Testing Strategy

### Unit Tests
- Not applicable (integration-level fix)

### Manual Testing
1. **Baseline**: Use audience_search tool, verify displays during session
2. **Refresh Test**: Reload page, verify tool call still visible
3. **Database Verification**: Check `chat_message.parts` JSON structure
4. **Multiple Tools**: Test with multiple tool calls in sequence
5. **Tool Results**: Verify both calls and results persist

### Validation Commands
```bash
# Health check
pnpm check-types
pnpm lint

# Build validation
pnpm build:local

# Runtime validation
# 1. Start dev server
pnpm dev

# 2. Use Audience Manager tool in chat
# 3. Refresh page
# 4. Verify tool call persists
```

### Success Criteria
- ✅ Tool calls visible during active session
- ✅ Tool calls persist after page refresh
- ✅ Both tool requests and responses displayed
- ✅ No "Filtering out tool part" warnings in logs
- ✅ Migration error no longer appears on startup

---

## Risks & Mitigation

### Risk: UI Message Stream Incomplete
**Likelihood**: Very Low
**Mitigation**: UI stream is SDK's public API - guaranteed complete. Client already displays correctly.

### Risk: Part Type Changes
**Likelihood**: Low
**Mitigation**: Tool part types are stable (`tool-{toolName}`). Can add validation.

### Risk: Performance Impact
**Likelihood**: Very Low
**Mitigation**: Only capturing tool parts (typically 0-3 per message), minimal memory overhead.

### Risk: Breaking Existing Messages
**Likelihood**: None
**Mitigation**: Changes only affect new message persistence. Existing messages unchanged.

---

## Rollback Plan

If issues arise:

1. **Revert route.ts changes**: Restore `buildResponseMessageFromStreamResult()` usage
2. **Keep migration deleted**: Startup error removal is safe
3. **No database changes**: Schema untouched, safe to rollback code

---

## Alternative Approaches Considered

### ❌ Fix buildResponseMessageFromStreamResult()
**Why Rejected**: Can't guarantee `result.steps[].args` availability (SDK internal state)

### ❌ Wrap All Tools to Capture Args
**Why Rejected**: Complex, fragile, requires wrapping MCP/Workflow/App tools

### ❌ Use onStepFinish to Build Message
**Why Rejected**: `stepResult.toolCalls` doesn't include args field

### ✅ Intercept UI Message Stream
**Why Chosen**: Uses SDK public API, single source of truth, minimal changes, future-proof

---

## Project Context

### Architecture Patterns (Better-Chatbot)
- **Chat API**: `src/app/api/chat/route.ts` - Vercel AI SDK streaming with Langfuse
- **Message Flow**: streamText → toUIMessageStream → client + database
- **Tool Loading**: MCP + Workflow + App tools via shared.chat.ts
- **Persistence**: Drizzle ORM repositories with upsert pattern

### Key Components
- **UI Message Stream**: Primary data flow to client (`toUIMessageStream()`)
- **Langfuse Observability**: `onFinish` callback for tracing
- **Tool Parts**: Typed message parts with `type: "tool-{name}"` format
- **Canvas Integration**: Chart tools stream via same mechanism

### Development Workflow
```bash
pnpm dev          # Development server (localhost:3000 only)
pnpm check        # Lint + types + tests
pnpm build:local  # Production build validation
```

---

## Success Metrics

### Immediate (Post-Implementation)
- Tool calls persist across page refreshes
- No "empty args" warnings in logs
- No migration errors on startup

### Long-Term (Monitoring)
- No reports of missing tool calls
- Consistent tool call display behavior
- Reduced debugging time for tool-related issues

---

## Documentation Updates

### Code Comments
- Add comment explaining UI stream interception pattern
- Document why `capturedToolParts` is necessary
- Note that this replaces `buildResponseMessageFromStreamResult()`

### Architectural Documentation
No formal docs to update, but consider adding to project notes:
- Tool persistence mechanism
- Why UI stream is source of truth
- Migration from result.steps to toUIMessageStream

---

## Confidence Score: 9/10

**Rationale**:
- ✅ Root cause clearly identified and validated
- ✅ Solution uses SDK public API (stable, documented)
- ✅ Minimal code changes required
- ✅ No schema or breaking changes
- ✅ Clear testing strategy
- ⚠️ Minor: Needs validation with production workload

**Risk Level**: **Low**
- Single-responsibility change
- No database migrations
- Backward compatible
- Easy rollback

---

## Next Steps

1. Review and approve this initial plan
2. Generate PRP using `/generate-prp` command
3. Implement Phase 1 (UI stream interception)
4. Validate with manual testing
5. Deploy and monitor

---

## References

### Vercel AI SDK Documentation
- UI Message Stream: https://ai-sdk.dev/docs/ai-sdk-core/streaming-text
- Message Metadata: https://ai-sdk.dev/docs/ai-sdk-ui/stream-ui-messages

### Project Files
- `src/app/api/chat/route.ts` - Main chat API handler
- `src/app/api/chat/shared.chat.ts` - Tool loading and message utilities
- `src/lib/db/pg/repositories/chat-repository.pg.ts` - Message persistence
- `src/lib/db/pg/schema.pg.ts` - Database schema

### Investigation Analysis
- Root cause: SDK internal state (`result.steps`) vs. public API (`toUIMessageStream()`)
- Evidence: Tool calls display correctly during session, vanish on refresh
- Solution: Intercept UI stream for persistence (single source of truth)
