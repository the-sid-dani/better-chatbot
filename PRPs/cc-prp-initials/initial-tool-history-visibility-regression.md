# Initial Plan: Tool Call History Regression

## Feature Purpose & Current Regression
- Restore persisted MCP/Canvas tool call cards so revisiting a chat thread displays
  the full request/response history alongside prior assistant text.
- Current behavior: live runs show tool cards, but after refresh only text remains;
  users lose the ability to inspect tool inputs and outputs for past runs.
- Scope limited to persistence/readback flows powering default chat UI
  (`src/components/chat-bot.tsx`) without touching voice or workspace variants.

## Observations & Evidence
- `ToolMessagePart` still renders any `UIMessage` part whose `type` matches
  `tool-*` (`src/components/message-parts.tsx:774`); rendering layer unchanged.
- Streaming layer emits realtime updates via `onStepFinish` and `dataStream.write`
  (`src/app/api/chat/route.ts:335-360`), explaining why cards appear while the
  session is open.
- Persistence logic in `buildResponseMessageFromStreamResult` now drops tool
  results when `parts.find(...)` cannot locate a matching call part, logging
  "Skipping tool result without matching call" (`src/app/api/chat/shared.chat.ts:772-788`).
- Chat history sanitization filters out persisted tool parts whose `input` is
  missing or empty (`src/app/api/chat/route.ts:123-156`), guarding Anthropic
  payloads but erasing fallback parts.

## Root Cause Summary
- Step transcripts occasionally include `toolResults` without a corresponding
  `toolCalls` entry. After recent hardening we skip those results entirely.
- Saved assistant messages therefore lack the `tool-*` parts needed for replay,
  so any subsequent page load works with text-only history.
- Guard logic that strips empty `input` fields prevents naïve fallback parts from
  surviving even if we attempted to add them post-hoc.
## Integration Points & Constraints
- Persisted message shape must remain compatible with Anthropic validation and
  Langfuse tracing; changes confined to `buildResponseMessageFromStreamResult`
  and the filtering pass in `src/app/api/chat/route.ts`.
- Any synthesized tool `input` must use existing helper `resolveToolInput` to
  recover arguments from result payloads so downstream tooling remains accurate.
- Canvas artifact restoration relies on persisted parts during initial load
  (`src/components/chat-bot.tsx:420-531`); fixing the history flow also protects
  Canvas rehydration.

## Proposed Remediation Strategy
1. Update `buildResponseMessageFromStreamResult` to create a fallback tool part
   when `toolResults` arrive without a matching call by synthesizing `input`
   through `resolveToolInput` and annotating state `output-available`.
2. Relax the sanitization guard to accept fallback parts whose synthesized input
   passes `hasStructuredContent`, while continuing to drop truly missing input.
3. Backfill logging/telemetry to confirm fallback path usage, ensuring future
   regressions surface quickly (reuse existing `logger.warn`).
4. Add regression coverage: a persistence-focused unit test around
   `buildResponseMessageFromStreamResult` and an integration test that reloads a
   thread to assert tool parts survive.

## Validation & Testing Plan
- `pnpm test` with new coverage for `buildResponseMessageFromStreamResult`.
- UI replay check: seed a thread with tool calls, reload `/chat/:id`, verify tool
  cards render.
- `pnpm check-types`, `pnpm lint`, `pnpm build` to guarantee no regressions in
  type or build pipelines.

## Risks & Mitigations
- **Incorrect input reconstruction:** Mitigate by leaning on
  `resolveToolInput`/`extractCandidateFromResult` and adding defensive checks.
- **Double-processing artifacts:** Ensure `processedToolsRef` dedupe remains in
  place; verify persisted parts do not trigger duplicate Canvas entries.
- **Performance impact:** Changes operate on existing arrays; add tests with
  multiple tool calls to ensure no quadratic surprises.

## Confidence & Next Steps
- Confidence score: 7/10 (logic localized but depends on SDK payload nuances).
- Immediate actions: implement fallback persistence, adjust filter, add tests,
  validate with manual thread reload before opening PR.
