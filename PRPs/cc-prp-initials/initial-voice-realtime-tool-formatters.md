# Initial Plan: Voice Realtime Tool Formatter Registry

Feature: Align OpenAI Realtime (voice) tool handling with text chat reliability by introducing a formatter registry that emits model-friendly summaries while preserving full structured output for the UI/persistence.

## Why
- Text chat (Vercel AI SDK `streamText`) reliably uses tool outputs because it feeds concise, readable results to the model.
- Voice chat currently sends raw JSON via `function_call_output.output`, which realtime models intermittently ignore.
- A shared formatter layer mirrors the text harness behavior without adding a server round-trip.

## Scope & Goals
- Add `formatToolResult(toolName, result) -> { summaryForModel, structuredForUI? }` with a strong generic fallback + first-class formatters for Exa search, charts/tables, HTTP fetch, and code execution.
- Wire formatter into `clientFunctionCall` so the voice model always receives readable summaries.
- Keep full structured data available in `part.output` for UI (Canvas, inspectors) and persistence.

## Architecture Integration
- Caller: `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` (Realtime event + tool execution loop)
  - Replace `JSON.stringify(toolResult)` with `formatToolResult(...)` in `clientFunctionCall`.
- Registry: `src/lib/ai/tools/formatters.ts` (new) + optional `formatters/*` per tool family.
- UI: No changes required; `part.output` remains the structured object for renderers.
- Prompt: Optional nudge in voice system prompt to leverage summarized tool outputs.

## Files
- NEW: `src/lib/ai/tools/formatters.ts`
- UPDATE: `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` (`clientFunctionCall`)
- TESTS: `tests/voice/formatters.spec.ts` (unit) and `tests/voice/realtime-integration.spec.ts` (smoke)

## Known Gotchas
- Realtime models may still occasionally fallback; concise summaries with clear fields (title/date/url) mitigate this.
- Keep summaries ≤ ~1–2 KB; strip HTML; sanitize links.
- Do not overwrite `part.output`—UI depends on full structure for Canvas and detail dialogs.
- Consider a tiny defer between `function_call_output` and `response.create` to avoid rare races.

## Implementation Tasks

Task 1: Formatter Registry & Generic Fallback
- Create `formatToolResult(toolName: string, result: unknown)` with dispatcher and default summarizer:
  - Lists: top N items; print `title/name`, `date`, short `snippet`, `url`.
  - Tables/series: rows/points count, key columns/series, 1-row sample.
  - HTTP/JSON: status, content-type, top-level keys, small sample.
  - Binary/unknown: mime, size/length, filename.
- Enforce max length; strip HTML; mask secrets.

Task 2: First-Class Formatters
- Exa search: top 3 items: `Title (YYYY-MM-DD) – 1–2 lines – URL`.
- Charts: `Created {type} "{title}" with {N} points; fields: a, b, c`. (No data dump)
- Tables: `Table “{title}”: {rows} rows, columns: [x, y, …]; first row sample`.
- HTTP fetch: `GET/POST {host} → {status}; keys: [...]; sample: …`.
- Code exec: exit code, stdout (≤200 chars), stderr summary.

Task 3: Wire to Voice Path
- In `clientFunctionCall`:
  - `const { summaryForModel, structuredForUI } = formatToolResult(toolName, toolResult)`
  - `outputText = summaryForModel` → send in `function_call_output.output`.
  - Keep `part.output = structuredForUI ?? toolResult` for UI/persist.
  - Optional defer: `setTimeout(() => send({ type: 'response.create' }), 0)` if needed.

Task 4: Validation & Telemetry
- Unit tests: registry generic fallback + Exa/chart/HTTP cases.
- Smoke: mock Realtime event → ensure assistant uses summary text.
- Add lightweight metrics (counts per formatter, length, truncations) to logger.

Task 5: Prompt Nudge (optional)
- Voice system prompt: “Tool outputs are summarized into short bullet points; cite titles/dates/links when responding.”

## Pseudocode
```ts
// src/lib/ai/tools/formatters.ts
export function formatToolResult(toolName: string, result: any) {
  const fn = registry[toolName] ?? genericFormatter;
  const { summaryForModel, structuredForUI } = fn(result);
  return {
    summaryForModel: clamp(clean(summaryForModel), 1600 /*chars*/ ),
    structuredForUI: structuredForUI ?? result,
  };
}
```

```ts
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts (inside clientFunctionCall)
const { summaryForModel, structuredForUI } = formatToolResult(toolName, toolResult);
const outputText = summaryForModel; // model-readable

// Send concise result to Realtime model
const event = {
  type: 'conversation.item.create',
  previous_item_id: id,
  item: { type: 'function_call_output', call_id: callId, output: outputText },
};

updateUIMessage(id, (prev) => ({
  parts: [{
    type: `tool-${toolName}`,
    state: 'output-available',
    toolCallId: callId,
    input: toolArgs,
    output: structuredForUI, // rich data for UI
  }],
}));

dataChannel.current?.send(JSON.stringify(event));
// Minimal defer to avoid rare race conditions
setTimeout(() => dataChannel.current?.send(JSON.stringify({ type: 'response.create' })), 0);
```

## Validation Plan
- `pnpm lint`, `pnpm check-types`, `pnpm test` (new tests for formatters).
- Manual voice runs:
  - Exa search query → voice must recite titles/dates/snippets.
  - Chart/table creation → voice announces chart/table characteristics.
  - HTTP fetch → voice states status and key fields.
- Inspect logs for formatter selections, summary lengths, and truncation counts.

## Rollout & Risk
- Risk: Low (UI unchanged, server unchanged). Formatter impacts only what the voice model sees.
- Feature flag (optional): `VOICE_TOOL_FORMATTER_ENABLED` to toggle in production.
- Rollback: Set flag off or revert to raw JSON behavior (not recommended except for debugging).

## Success Criteria
- Voice responses consistently reference tool data (titles/dates/links for web search; counts and labels for charts/tables; status/keys for HTTP).
- No large JSON appears in `function_call_output.output`.
- No regressions in UI tool rendering or persistence.

## Confidence
- High. This mirrors what the text tool harness achieves and is standard practice for Realtime integrations without a built-in tool harness.
