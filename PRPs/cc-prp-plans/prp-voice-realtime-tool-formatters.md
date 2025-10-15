name: "Voice Realtime Tool Formatter Registry PRP"
description: |
  Align OpenAI Realtime (voice) tool handling with text chat reliability by introducing a shared formatter registry that emits concise, model-friendly summaries for the voice model while preserving full structured tool output for UI/Canvas and persistence. Provide an optional server shadow pathway using Vercel AI SDK `streamText` for exact parity when needed.

## Purpose
Text chat uses the Vercel AI SDK tool harness (`streamText`) which feeds the model human‑readable content, not raw JSON. Voice currently serializes raw tool results into `function_call_output.output`, which the Realtime model intermittently ignores. We will introduce a formatter registry to restore the “always uses tool data” behavior for voice with minimal latency and high reliability.

## Core Principles
1. Keep UI rich: never degrade the UI—preserve structured output for renderers and Canvas.
2. Give the model short, clean summaries: titles/dates/snippets/URLs; counts for tables/charts; statuses for HTTP; small stdout for code.
3. Generic fallback for any tool; per‑tool specializations progressively.
4. Feature‑flagged rollout and telemetry: easy to toggle and measure.
5. Mirror text‑chat behavior without adding a server/model hop; offer optional shadow path for parity where required.

---

## Goal
- Voice responses consistently reference tool results (web search, charts/tables, HTTP, code) with the same reliability users experienced before recent regressions.

## Why
- When voice sends raw JSON to the Realtime model, the model often ignores it; text never does this. Formatting the outputs for voice restores the reliability of tool‑augmented replies while keeping the structured payload available to the UI and persistence.

## What
- Add `formatToolResult(toolName, result) → { summaryForModel, structuredForUI }` (registry + fallback).
- Use the summary for `function_call_output.output` in voice; keep structured object in `part.output`.
- Optional: tiny defer before `response.create` to avoid rare race conditions.
- Optional: voice prompt nudge: “Tool outputs are summarized; cite titles/dates/links.”
- Optional Path B: SSR “shadow” call to `streamText` for exact parity (toggleable).

### Success Criteria
- [ ] Web search via voice yields bullet list with article titles, dates, URLs.
- [ ] Chart/table voice announcements include type, counts, key fields—no raw JSON spoken.
- [ ] HTTP tool voice replies include status, top-level keys, safe sample.
- [ ] No large JSON appears in `function_call_output.output`.
- [ ] UI tool rendering (structured object) and persistence unchanged.
- [ ] Feature flag allows instant revert.

## All Needed Context

### Documentation & References
```yaml
- file: src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
  why: Realtime tool path; modify clientFunctionCall to use formatter.
- file: src/components/message-parts.tsx
  why: UI rendering expects full structured `part.output`.
- file: src/lib/ai/tools/web/web-search.ts
  why: Exa response structure—titles/urls/dates/snippets.
- file: src/app/api/chat/route.ts
  why: Text harness using `streamText`; parity reference.
- file: src/components/chat-bot-voice.tsx
  why: Voice compact view behavior; ensure visibility unaffected.
- doc: Vercel AI SDK tool calling examples (streamText+tools)
  why: Confirms server harness behavior we mirror via summaries or shadow path.
```

### Current Codebase tree (abridged)
```bash
src/lib/ai/speech/open-ai/use-voice-chat.openai.ts  # Realtime voice loop
src/lib/ai/tools/web/web-search.ts                  # Exa tools
src/components/message-parts.tsx                    # Tool UI renderers
src/components/chat-bot-voice.tsx                   # Voice UI
```

### Desired Codebase tree
```bash
src/lib/ai/tools/formatters.ts                      # NEW: registry + fallback
src/lib/ai/tools/formatters/exa.ts                  # (optional) exa specialization
src/lib/ai/tools/formatters/chart.ts                # (optional) chart/table specialization
src/lib/ai/tools/formatters/http.ts                 # (optional) http specialization
src/lib/ai/speech/open-ai/use-voice-chat.openai.ts  # UPDATED: wire formatter
tests/voice/formatters.spec.ts                      # unit tests
tests/voice/realtime-integration.spec.ts            # smoke tests
```

### Known Gotchas & Quirks
```text
- Realtime models do not reliably parse long/nested JSON. Keep summaries short (≤~1–2 KB).
- UI/Canvas needs full structured `part.output`; do not replace with summary.
- Summary must be safe (strip HTML, sanitize links, redact secrets).
- Some tools return arrays vs objects; generic fallback must detect common shapes.
- Optional defer between `function_call_output` and `response.create` to avoid race conditions.
```

## Implementation Blueprint

### Data Models & Structure
- Formatter signature: `(toolName: string, result: unknown) → { summaryForModel: string; structuredForUI?: unknown }`.
- Registry: `Record<string, (result) => {summaryForModel, structuredForUI?}>` with a `genericFormatter` fallback.

### Task List (ordered)
```yaml
Task 1: Create formatter registry & generic fallback
  - File: src/lib/ai/tools/formatters.ts
  - Implement registry + default summarizer for lists/tables/http/json/unknown
  - Add utilities: clampLength(str, max), stripHtml(str), pickKeys(obj), sampleList(items, n)

Task 2: Add Exa search formatter
  - File: src/lib/ai/tools/formatters/exa.ts (or inline registry entry)
  - Top 3: Title (date) – snippet – URL; handle missing fields; cap length

Task 3: Add chart/table formatters
  - Chart: type, title, series count, point count
  - Table: row count, column names, first row sample (safe)

Task 4: Add HTTP fetch formatter
  - Status code, content-type, top-level keys, safe sample values

Task 5: Add code execution formatter
  - Exit code, stdout ≤ 200 chars, stderr summary

Task 6: Wire into voice clientFunctionCall
  - File: src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
  - Replace JSON.stringify(toolResult) with formatter output’s summary
  - Keep structuredForUI || toolResult in `part.output`
  - Optionally setTimeout(…, 0) before `response.create`

Task 7: Add unit tests for formatters
  - tests/voice/formatters.spec.ts: generic + exa + chart + http + code

Task 8: Add smoke test for realtime integration
  - Simulate tool result → confirm `function_call_output.output` contains summary string

Task 9: Feature flag & telemetry
  - Env: VOICE_TOOL_FORMATTER_ENABLED (default true)
  - Log formatter name, summary length, truncations

Task 10: Documentation & prompt nudge
  - Update README/PRP references; add one‑line voice system prompt hint
```

### Pseudocode
```ts
// src/lib/ai/tools/formatters.ts
export function formatToolResult(toolName: string, result: any) {
  const specific = registry[toolName];
  const impl = specific ?? genericFormatter;
  const out = impl(result);
  return {
    summaryForModel: clampLength(stripHtml(out.summaryForModel), 1600),
    structuredForUI: out.structuredForUI ?? result,
  };
}
```

```ts
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
const { summaryForModel, structuredForUI } = formatToolResult(toolName, toolResult);
const event = {
  type: 'conversation.item.create',
  previous_item_id: id,
  item: { type: 'function_call_output', call_id: callId, output: summaryForModel },
};
updateUIMessage(id, (prev) => ({
  parts: [{ type: `tool-${toolName}`, state: 'output-available', toolCallId: callId, input: toolArgs, output: structuredForUI }],
}));
dataChannel.current?.send(JSON.stringify(event));
setTimeout(() => dataChannel.current?.send(JSON.stringify({ type: 'response.create' })), 0);
```

## Integration Points
```yaml
DATABASE: none (persistence unchanged)
CONFIG: VOICE_TOOL_FORMATTER_ENABLED feature flag (boolean)
ROUTES: none required (client-only change); optional shadow server endpoint if adopting Path B
```

## Validation Loop
### Level 1: Syntax & Style
```bash
pnpm lint
pnpm check-types
```

### Level 2: Unit Tests
```bash
pnpm test -- tests/voice/formatters.spec.ts
```

### Level 3: Integration (manual)
```bash
pnpm dev
# Voice: “Search the web for {topic}” -> expect concise spoken list with titles/dates/urls
# Voice: “Create a bar chart from …” -> expect brief chart confirmation
# Voice: “GET https://api.example.com/data” -> expect status + keys
```

## Final Validation Checklist
- [ ] `function_call_output.output` contains clean summaries, not raw JSON
- [ ] UI tool rendering still shows rich details
- [ ] Voice replies consistently cite tool data
- [ ] Telemetry shows formatter usage and truncations within bounds
- [ ] Feature flag allows safe rollback

---

## Anti-Patterns to Avoid
- ❌ Dumping entire JSON into function_call_output
- ❌ Overwriting `part.output` with summary text (breaks UI)
- ❌ Unbounded summaries (token/char bloat)
- ❌ Prompt injection via HTML in tool fields (strip/sanitize)

## Rollout Strategy
1) Enable formatter registry behind flag (on in staging).
2) Validate with common tools: Exa, charts/tables, http, code.
3) Monitor telemetry for summary length and fallback rate.
4) Enable in production; keep optional shadow “parity” path for critical journeys.

## Risks & Mitigations
- Risk: Some exotic tool payloads → generic fallback might be bland. Mitigation: add specialization over time.
- Risk: Latency if using shadow `streamText` path. Mitigation: keep disabled unless needed.
- Risk: Rare Realtime race between tool output and response. Mitigation: small defer before `response.create`.

## Confidence
- High. Matches how the text harness achieves reliability. Uses a pattern well‑documented in Realtime agent examples: send concise text for model consumption, keep full data for UI.
