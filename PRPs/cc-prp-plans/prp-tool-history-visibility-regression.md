name: "PRP - Tool Call History Visibility Regression"
description: |
  Restore persisted MCP/Canvas tool call cards in historical chat views by
  repairing server-side message reconstruction and sanitization so that tool
  requests and outputs remain visible after refresh.
---

## Goal
Reinstate full tool request/response history for previously completed chat
threads by fixing persistence gaps in `buildResponseMessageFromStreamResult`
and the message sanitization path used by `/api/chat`.

## Why
- Prevent regression where users lose access to prior MCP/tool execution details
  after navigation or reload.
- Maintain Canvas artifact hydration and downstream analytics that depend on
  tool part metadata.
- Align persisted transcript structure with Anthropic API constraints while
  keeping UI parity between live and historical views.

## What
- Persist tool call parts even when streaming `toolResults` arrive without an
  earlier `toolCalls` entry by synthesizing a valid `input` payload.
- Adjust chat history filtering so synthesized tool parts survive reloads but
  invalid or empty payloads are still pruned.
- Add automated coverage ensuring tool parts remain in stored messages and that
  Canvas/tool UI rehydrates correctly after fetching history.

### Success Criteria
- [ ] Tool call cards (request + response) reappear after refreshing a thread
      that previously executed MCP tools.
- [ ] No Anthropic `tool_use.input` validation errors occur during multi-turn
      chats.
- [ ] Regression tests fail if tool parts are dropped during persistence.
## All Needed Context

### Documentation & References
```yaml
- url: https://sdk.vercel.ai/docs/api-reference/ai-sdk-core/stream-text
  why: Details how `streamText` emits step results and tool events.

- url: https://sdk.vercel.ai/docs/api-reference/ai-sdk-ui/use-chat
  why: Explains UI message structure used by `useChat` and server persistence.

- url: https://docs.anthropic.com/en/api/messages
  why: Clarifies `tool_use` schemas and required `input` fields to avoid
        validation failures when replaying history.

- file: src/app/api/chat/shared.chat.ts
  why: Contains `buildResponseMessageFromStreamResult`, `resolveToolInput`, and
        persistence helpers that currently drop results.

- file: src/app/api/chat/route.ts
  why: `/api/chat` handler filters historical messages before calling
        `streamText`; guards need to respect synthesized tool inputs.

- file: src/components/message-parts.tsx
  why: Renders `ToolMessagePart` elements; ensures the UI still understands the
        persisted structure.

- file: src/components/chat-bot.tsx
  why: Handles Canvas rehydration by scanning assistant message parts on load.
```

### Current Codebase Tree (trimmed)
```bash
src/app/api/chat/
├── actions.ts
├── agent-tool-loading.test.ts
├── route.ts
└── shared.chat.ts
src/components/
├── chat-bot.tsx
├── message.tsx
└── message-parts.tsx
```

### Desired Codebase Tree Updates
```bash
src/app/api/chat/shared.chat.ts        # Adjust fallback tool part persistence
src/app/api/chat/route.ts              # Relax sanitization guard with new checks
tests/core/chat-tool-history.spec.ts   # New regression coverage (Vitest)
```

### Known Gotchas & Library Quirks
```text
# Vercel AI SDK streams tool calls/results in separate arrays; some steps omit
# toolCalls, so fallback logic must tolerate missing entries.
# Anthropic refuses tool parts whose `input` is empty or absent; always rebuild
# inputs via resolveToolInput / extractCandidateFromResult.
# Canvas artifact hydration depends on persisted part IDs; avoid duplicating
# artifacts by honoring processedToolsRef in chat-bot.tsx.
```
## Implementation Blueprint

### Data structures & helpers
```typescript
// buildResponseMessageFromStreamResult
// - Ensure tool part fallback uses:
//   const resolvedInput = resolveToolInput(undefined, toolResult.result);
//   if (!hasStructuredContent(resolvedInput)) skip to avoid invalid payloads.
// - Persist state as "output-available" and include `output` from result.

// route.ts sanitization guard
// - Accept tool parts when `hasStructuredContent(part.input)` is true even if
//   input was synthesized.
// - Keep existing logging for auditing, add context when parts are retained.

// Tests
// - Use mocked streamText result payload mirroring production structure to
//   assert tool parts survive rebuild and sanitization.
```

### Ordered Task List
```yaml
Task 1: Repair tool result persistence fallback
  MODIFY src/app/api/chat/shared.chat.ts:
    - Within buildResponseMessageFromStreamResult, detect toolResults without
      matching call parts.
    - Use resolveToolInput to synthesize input and push a tool part when viable.
    - Preserve logging (include toolCallId + reason when skipping).

Task 2: Adjust chat history sanitization
  MODIFY src/app/api/chat/route.ts:
    - Update filter that drops tool parts with missing input so it keeps parts
      where hasStructuredContent(part.input) is true.
    - Add analytics/log metadata for retained synthesized parts.

Task 3: Add regression coverage
  CREATE tests/core/chat-tool-history.spec.ts:
    - Unit-level: feed buildResponseMessageFromStreamResult a result with
      toolResults but missing toolCalls and assert part persists.
    - Integration-level: simulate sanitization filter to ensure part survives.

Task 4: Manual validation script
  UPDATE docs/qa or create docs/qa/chat-tool-history-regression.md (if absent):
    - Document steps to trigger MCP tool run, reload thread, confirm UI cards.
```

### Task Pseudocode Highlights
```typescript
// Task 1 pseudocode
if (!callPart) {
  const synthesizedInput = resolveToolInput(undefined, toolResult.result);
  if (!hasStructuredContent(synthesizedInput)) {
    logger.warn('Skipping...', { reason: 'no structured input' });
    continue;
  }
  parts.push({
    type: `tool-${toolResult.toolName ?? 'unknown'}`,
    toolCallId: toolResult.toolCallId ?? generateUUID(),
    state: 'output-available',
    input: synthesizedInput,
    output: toolResult.result,
  });
}

// Task 2 pseudocode
if (part.type.startsWith('tool-')) {
  if (!hasStructuredContent(part.input)) {
    // existing skip
  } else {
    logger.info('Retaining tool part from history', { toolCallId: part.toolCallId });
  }
}

// Task 3 pseudocode
const result = buildResponseMessageFromStreamResult(mockResult, originalMessage);
expect(result.parts).toContainEqual(expect.objectContaining({ type: 'tool-test_tool' }));

const filtered = sanitizeParts(result.parts);
expect(filtered.some(p => p.type.startsWith('tool-'))).toBe(true);
```
### Integration Points
```yaml
API:
  - /api/chat (src/app/api/chat/route.ts): ensure persisted transcripts remain
    valid for streamText inputs.

Persistence:
  - src/app/api/chat/shared.chat.ts: align with existing convertToSavePart logic
    and Langfuse telemetry expectations.

UI:
  - src/components/chat-bot.tsx & message-parts.tsx: verify no additional changes
    required but confirm Canvas initialization still dedupes artifacts.

Testing:
  - New Vitest spec under tests/core to mirror existing chat-related suites.
```

## Validation Loop

### Level 1 – Static Checks
```bash
pnpm lint
pnpm check-types
```

### Level 2 – Unit & Integration Tests
```bash
pnpm test --filter "chat-tool-history"
```

### Level 3 – Manual QA
```bash
pnpm dev
# 1. Start a chat, invoke MCP tool producing structured output.
# 2. Confirm tool card appears live.
# 3. Refresh /chat/:id and ensure tool card + Canvas artifacts persist.
# 4. Monitor logs for warnings about synthesized inputs.
```

### Optional System Checks
```bash
pnpm build:local
curl -f http://localhost:3000/api/health/langfuse
```

## Final Validation Checklist
- [ ] Tool cards persist after full page reload.
- [ ] No duplicate Canvas artifacts produced on history rehydration.
- [ ] Lint, type, and unit tests pass.
- [ ] Langfuse and server logs confirm synthesized inputs are structured.
- [ ] QA doc updated with manual validation steps.

## Confidence
Score: 8/10 — Changes are localized with clear test coverage, but relies on SDK
payload consistency; logs and tests should catch mismatches quickly.
