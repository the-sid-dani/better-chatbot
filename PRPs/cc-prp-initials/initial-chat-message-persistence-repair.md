# Initial Plan: Restore Chat Message Persistence

## Feature Purpose & Goals
- Ensure assistant responses (including tool-only outputs) persist in the `chat_message` table with fully populated `parts` arrays so that historical conversations render correctly after navigation or refresh.
- Preserve existing real-time Canvas artifact creation, Langfuse telemetry, and tool streaming behaviours without regression.
- Provide clear instrumentation to detect future persistence gaps (e.g., logging or metrics when an assistant message would otherwise have no renderable parts).

## Current Observations & Constraints
- `src/app/api/chat/route.ts` constructs persisted assistant messages by combining `result.text` with `capturedToolParts`. At present only `tool-*` parts are captured, so tool-only completions result in empty `parts` arrays.
- `PreviewMessage` (`src/components/message.tsx`) short-circuits rendering when `message.parts.length === 0`, causing the “missing chat history” symptom.
- Chat UI relies on `useChat` (`@ai-sdk/react`) initial hydration; persisted data must match client expectations (text, reasoning, tool parts with correct state transitions).
- Database persistence flows through `chatRepository.upsertMessage` (`src/lib/db/pg/repositories/chat-repository.pg.ts`); schema expects an array of JSON parts.
- Langfuse tracing and telemetry updates in `route.ts` depend on the assembled `parts`; modifications must not break metadata updates or span termination.

## Architecture Integration Strategy
- **Streaming Capture**: extend `capturedToolParts` handling in `route.ts` to clone not only tool parts but also `text-delta`/`text` and `reasoning` parts emitted by `result.toUIMessageStream()`. Maintain ordering to preserve UI fidelity.
- **Fallback Assembly**: before persistence, if the assembled `parts` array is still empty, delegate to `buildResponseMessageFromStreamResult(result, message)` to avoid writing blank responses.
- **Data Contract**: ensure persisted parts align with `UIMessage` expectations (states `call`, `output-available`, etc.) so that the Canvas extraction logic in `src/components/chat-bot.tsx` continues functioning.
- **Observability**: add structured logging (and optionally a counter metric) when fallback assembly is triggered or when a message would otherwise persist with empty `parts`.
- **Backward Compatibility**: guard new logic behind minimal changes so historical records with empty `parts` do not crash rendering (UI already skips them).

## Development Patterns & Implementation Approach
1. **Server Route Updates**
   - Introduce capture for text/reasoning parts inside the `messageMetadata` handler of `result.toUIMessageStream`. Store clones with necessary state info.
   - Validate that duplicate tool parts are not produced when both streaming capture and fallback builder run.

2. **Persistence Safeguard**
   - After assembling `parts`, run a guard: if `parts.length === 0`, rebuild via existing helper and/or log error.
   - Ensure new guard runs before both the “assistant reused user ID” branch and the normal branch.

3. **Instrumentation**
   - Use `logger.warn` with a dedicated tag (e.g., `chat-persistence-empty-parts`) when fallback occurs.
   - Consider emitting a Langfuse observation metadata flag for visibility.

4. **UI Validation**
   - Verify `PreviewMessage` correctly renders persisted responses once `parts` contain text or tool outputs.
   - Confirm Canvas artifact replay logic in `ChatBot` still detects tool outputs via `isToolUIPart`.

## File & Module Touchpoints
- `src/app/api/chat/route.ts`: main logic for streaming capture, fallback persistence, instrumentation.
- `src/app/api/chat/shared.chat.ts`: reference `buildResponseMessageFromStreamResult` and ensure compatibility.
- `src/components/message.tsx` & `src/components/message-parts.tsx`: smoke-test rendering; no code changes anticipated but regression testing required.
- `src/lib/db/pg/repositories/chat-repository.pg.ts`: no schema change needed; ensure handling of new part shapes remains valid.
- Tests: consider adding a targeted persistence test (Vitest) using `agent-tool-loading.test.ts` or a new scenario to assert non-empty `parts`.

## Security & Access Control Considerations
- Changes are server-side within authenticated routes; continue leveraging `getSession` authorization checks already in place.
- Ensure logged data does not leak sensitive tool inputs—sanitize logs to omit full payloads when possible.

## Implementation Blueprint & Task Breakdown
1. **Extend Stream Capture**
   - Modify `messageMetadata` callback to clone `text-*` and `reasoning` parts into `capturedToolParts` (rename container to `capturedParts` for clarity).
   - Ensure clones strip large provider metadata fields where unnecessary to reduce payload size.

2. **Enforce Non-Empty Persistence**
   - Before calling `chatRepository.upsertMessage`, run guard to rebuild `parts` when empty and emit warning.
   - Write unit coverage (Vitest) that simulates a tool-only response and ensures persisted message includes `tool-*` part with `state: "output-available"`.

3. **Diagnostics**
   - Add targeted `logger.warn` statement (with thread/message IDs) for fallback events.
   - Optionally add Langfuse metadata flag (`{ persistenceFallback: true }`).

4. **Regression Validation**
   - Manual test: run conversation with chart tool, refresh `/chat/[thread]`, confirm assistant turn renders.
   - Manual test: run plain text completion, ensure persisted parts include text.
   - Confirm Canvas artifacts still load and Langfuse traces complete.

## Testing & Validation Plan
- `pnpm lint` / `pnpm check-types` for static validation.
- `pnpm test --filter chat` (or targeted Vitest file) covering new persistence guard.
- Manual Chrome run-through verifying UI history restoration and Canvas artifacts.
- Optional: inspect DB row (psql or Drizzle query) to confirm non-empty `parts`.

## Risks & Mitigations
- **Risk**: Over-capturing streaming deltas creates bloated `parts`. *Mitigation*: capture final `text` parts only (use `text-end` events) or coalesce buffers before persistence.
- **Risk**: Duplicate tool parts if both capture and fallback add them. *Mitigation*: deduplicate by `toolCallId` when merging.
- **Risk**: Telemetry mutations if metadata callback changes. *Mitigation*: retain existing metadata return semantics; ensure new logic runs before `part.type == "finish"` branch returns usage data.

## Technology Context & References
- Vercel AI SDK `toUIMessageStream` part types: text, reasoning, tool-call/result, finish states; follow documented states for stable integration.
- Anthropic Claude tool results require `input` field (already enforced in `buildResponseMessageFromStreamResult`).
- Better Auth session model already restricts access; no additional auth work needed.

## Recommended Next Steps
1. Implement capture + guard logic in `route.ts`.
2. Add regression test for tool-only persistence.
3. Validate manually with Canvas/tool interactions.
4. Document persistence contract in developer notes (optional but recommended).

## Confidence Score
**8 / 10** – Plan aligns with existing architecture and should resolve the persistence gap while maintaining telemetry and Canvas behaviour. Residual uncertainty remains around optimal handling of streaming text deltas, which can be addressed during implementation/testing.
