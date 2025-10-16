# PRP: Chat History Persistence & ID Stability

Status: Draft
Owner: Platform
Target Release: Hotfix + Minor Release

## 1) Problem Statement
Users lose conversation history after refresh or navigation. In some cases the sidebar shows a thread title, but opening the thread reveals missing assistant turns or a completely empty conversation.

## 2) User Impact
- Chat continuity is broken; conversations disappear on reload.
- Tool-only answers (e.g., charts/tables) fail to show up after refresh.
- Confidence in the system is reduced due to data loss.

## 3) Evidence & Observed Failure Modes
- UI drops empty messages: `src/components/message.tsx:51` returns `null` if `message.parts.length === 0`.
- Server filters tool parts with empty input in history reconstruction: `src/app/api/chat/route.ts` (around early message rebuild). Tool-only responses with `{}` input can be elided, ending with assistant parts `[]`.
- Assistant message built from stream capture can still be empty when both text and tool parts are absent: `src/app/api/chat/route.ts` (assistant assembly section).
- Error path persists nothing: `src/app/api/chat/route.ts` onError handler logs but does not persist the user message or an assistant stub.
- ID churn risk: new chats are seeded with a fresh id at `src/app/(chat)/page.ts:7–9` and the transport uses that id in requests; if id changes or routing occurs before persistence completes, the page can later load a different id with no messages.
- Authorization guard: `src/app/api/chat/actions.ts:selectThreadWithMessagesAction` returns `null` if `thread.userId !== session.user.id`; SSR refresh with a different/expired session would show an empty thread.

Timeline context (from prior notes):
- a880c7d – Tool persistence implementation
- 19ceaf1 – Message ID collision fix
- d4135ae – Safety fallback to avoid persisting empty parts arrays

## 4) Goals
- Chats render after refresh for both text-only and tool-only turns.
- Eliminate silent data loss on error paths.
- Stabilize id handling so the thread id used for persistence equals the id used for read.
- Keep Canvas replay for artifacts working on reload.

## 5) Non-Goals
- UI redesign.
- Changing provider models/tool semantics beyond what’s required for persistence.

## 6) Root Cause Summary (Technical)
- Persisted assistant messages can have `parts: []` due to:
  - Tool-only outputs with `{}` input filtered out before saving.
  - Error/abort cases never persisting any message.
- The renderer intentionally hides messages with zero parts to avoid blank bubbles.
- If a thread id changes (between send and reload), the server will read a _different_ thread than the one used to persist.

## 7) Solution Architecture

A. Persistence contract (server)
- Guarantee an assistant message never persists with `parts: []`.
- For tool-only responses, persist the completed tool parts with valid `input`/`state`/`toolCallId` and the final `output`.
- On any error/abort in the stream path, persist:
  - the user message; and
  - an assistant stub with a small text explanation (to keep history intact) and structured error metadata.

B. Tool part handling
- When reconstructing history, do not drop tool parts solely because `input` is `{}`; instead, normalize/augment minimal input where necessary to keep the part renderable.
- Ensure tool parts conform to `isToolUIPart` shape so Canvas replay can restore artifacts after reload.

C. ID stability
- Canonicalize the thread id for the entire request lifecycle:
  - Server creates/reads by id from the request payload consistently.
  - Client should only set `history.replaceState` after the first successful persistence.
  - Add guardrails to avoid creating two different threads for one UI session.

D. SSR and auth
- Preserve the existing guard, but surface a clear error UI if the SSR user changes. Log diagnostics to differentiate “empty because unauthorized” vs “empty because no messages”.

E. Observability
- Log when we would otherwise save `parts: []` and when we persist an error-stub message.
- Add counters for: “assistant_empty_parts_prevented”, “tool_parts_filtered_empty_input”, “onerror_persisted_stub”.

F. Backfill (data hygiene)
- One-off SQL migration to replace historical assistant rows with `parts: []` with a placeholder text part (so threads render). This is safe and idempotent.

## 8) Detailed Design Notes
- Message assembly (reference): `src/app/api/chat/route.ts`.
- UI behavior (reference): `src/components/message.tsx`, `src/components/message-parts.tsx`.
- Tool replay (reference): `src/components/chat-bot.tsx` – ONE-TIME artifact restoration.
- DB contract: `src/lib/db/pg/schema.pg.ts` → `ChatMessageSchema.parts` JSON[].

## 9) Risks
- Double-saving tool parts when both builder and capture paths contribute; mitigate via deduping by `toolCallId`.
- Persisting large provider metadata; mitigate by stripping non-essential fields.
- Regressions in Canvas replay if tool parts are malformed.

## 10) Acceptance Criteria
- Create a text-only message → Refresh → both user and assistant render.
- Trigger a tool-only response (chart/table) → Refresh → assistant renders and Canvas artifacts replay.
- Induce a tool error (invalid args) → assistant error-stub renders after refresh (no vanishing turn).
- Start a chat → don’t lose the turn after navigating quickly between pages.
- No database rows with `assistant` and `parts: []` after fix is deployed.

## 11) Validation Gates
```bash
pnpm check-types
pnpm lint
pnpm test
pnpm build:local
curl -f http://localhost:3000/api/health/langfuse
# Manual: create text-only, tool-only, and error runs; refresh and verify history persists
```

## 12) Task Breakdown (Engineering)
1. Persistence contract
   - Ensure assistant persistence path never writes `parts: []`.
   - Persist user + assistant stub in onError flow.
2. Tool parts
   - Normalize/retain tool parts even if input is `{}`; ensure `toolCallId`, `state`, `output` integrity.
   - Add minimal input fallback for renderability.
3. ID stability
   - Audit id generation/update flows (`src/app/(chat)/page.ts`, client transport handler) to prevent drift.
   - Add logs when request id ≠ recent persisted thread id.
4. Observability/logging
   - Add counters & structured logs for empty-parts prevented, filtered tool inputs, and error-stub persistence.
5. Backfill migration (one-off)
   - Idempotent SQL to patch historical `assistant` rows with empty parts.
6. QA pass & documentation
   - Document persistence contract; add a troubleshooting section for “missing history”.

## 13) Out of Scope
- Redesign of the chat UI.
- Provider-level changes beyond shaping data to our contract.

## 14) Rollout Strategy
- Ship behind a quick feature flag (optional) for onError persistence.
- Run the migration in prod off-hours (it’s safe and fast).
- Monitor logs/metrics for 48 hours; verify disappearance reports drop to 0.

## 15) References
- Renderer drop condition: `src/components/message.tsx:51`
- Stream assembly + telemetry: `src/app/api/chat/route.ts`
- Tool replay: `src/components/chat-bot.tsx` (artifact initialization effect)
- DB schema: `src/lib/db/pg/schema.pg.ts`
