name: "Voice Tool Card Visibility Fix PRP"
description: |

## Purpose
Restore trustworthy tool-call visibility inside voice chat's compact view by keeping in-progress cards onscreen and retaining the latest results long enough for the assistant and user to act on them. The PRP supplies all context required for one-pass implementation across the React client and voice routing utilities.

## Core Principles
1. **Context is King**: Highlight the exact React component (`CompactMessageView`) and voice pipeline hooks (`useOpenAIVoiceChat`) that drive tool state.
2. **Validation Loops**: Define lint/unit/manual checks that guarantee voice sessions still persist tools and that UX matches expectations.
3. **Information Dense**: Call out project-specific helpers like `getAllChartToolNames`, `isAppDefaultTool`, and timer cleanup patterns already in the codebase.
4. **Progressive Success**: Start by correcting executing state detection, then iterate on dismissal UX, finally add coverage and docs.
5. **Global rules**: Adhere to the conventions documented in `CLAUDE.md`, repo README, and voice PRPs.

---

## Goal
Keep voice-initiated tool cards visible during execution and ensure the newest completed tool remains accessible until superseded, while preserving compact-view cleanliness.

## Why
- Voice chat users need to confirm tool outputs to trust autonomous actions; current auto-dismiss hides active and latest cards.
- The assistant depends on cached tool output; disappearing UI impedes debugging when the model references recent artifacts.
- Aligns voice compact view with the text-chat experience, where active tool runs remain visible until finished.

## What
- Update `src/components/chat-bot-voice.tsx` (`CompactMessageView`) to treat `part.state === "call"` as executing, alongside existing `"input"` prefix checks.
- Adjust the auto-dismiss effect so the most recent completed tool card stays visible (configurable grace window) until a newer completion occurs or the session ends.
- Retain dismissal for older cards and cap internal state to prevent memory leaks.
- Optionally expose a single configurable timeout constant to tune UX across desktop/mobile voice clients.
- Add regression coverage (component test or custom hook test) to assert executing/complete filtering and dismissal timing.

### Success Criteria
- [ ] Active voice tool cards persist from invocation to completion.
- [ ] The latest completed card remains visible for at least 15 seconds or until the next completion.
- [ ] No React state warnings, memory leaks, or animation regressions when switching threads.
- [ ] Automated tests cover the new filtering/dismissal logic.
- [ ] Manual voice session reproduces the fixed behavior.

## All Needed Context

### Documentation & References (list all context needed to implement the feature)
```yaml
# MUST READ - Include these in your context window
- file: src/components/chat-bot-voice.tsx
  why: Compact voice UI (`CompactMessageView`) handles tool-card rendering, dismissal, and uses `getAllChartToolNames`.

- file: src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
  why: Emits tool invocation/result messages with `state: "call"` and `toolCallId`; confirms lifecycle assumptions.

- file: src/lib/ai/tools/tool-kit.ts
  why: Exposes `isAppDefaultTool`, `getAllChartToolNames`, and tool registry constants relied on by voice chat.

- file: PRPs/cc-prp-initials/initial-voice-tool-cards-auto-dismiss.md
  why: Documents the original auto-dismiss rationale and UX expectations—useful for honoring existing constraints.

- docfile: README.md
  why: Build/test commands (`pnpm check-types`, `pnpm test`, `pnpm dev`) and linting guidelines enforced by Biome.

- docfile: CLAUDE.md
  why: Global coding rules, naming conventions, and MCP integration constraints for this repository.
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase
```bash
$ tree -L 2 src/components | head -n 30
src/components
├── chat-bot-voice.tsx
├── chat-bot.tsx
├── tool-select-dropdown.tsx
├── ...
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
.
├── src/components/chat-bot-voice.tsx      # Update CompactMessageView filtering + dismissal
├── src/lib/ai/speech/open-ai/use-voice-chat.openai.ts  # (Read-only validation of tool states)
├── tests/voice/chat-bot-voice.compact.spec.tsx (optional)  # New Vitest/RTL coverage for tool card visibility
```

### Known Gotchas of our codebase & Library Quirks
```python
# CRITICAL: Voice tool parts arrive with state == "call" until output; don't rely solely on "input".
# CRITICAL: Compact view shares state between pending/manual dismissals; always clone Set when mutating.
# React effect timers must be cleared to avoid memory leaks when switching threads or closing voice chat.
# getAllChartToolNames returns both chart and table tool IDs; treat "createTable" specially.
# Voice chat persists artifacts via processedToolsRef; do not interfere with this dedupe mechanism.
```

## Implementation Blueprint

### Data models and structure
```python
# No new data models. Work with existing UIMessage/ToolUIPart types.
# Reuse ToolVisibility structures derived in CompactMessageView (toolId, isExecuting, states).
```

### list of tasks to be completed to fullfill the PRP in the order they should be completed
```yaml
Task 1:
  MODIFY src/components/chat-bot-voice.tsx:
    - FIND CompactMessageView useMemo building `all` / `visibleTools`.
    - UPDATE executing detection to treat `part.state === "call"` as active.
    - ADD helper constant `VOICE_TOOL_EXECUTING_STATES = ["call"]`.

Task 2:
  MODIFY src/components/chat-bot-voice.tsx:
    - TUNE auto-dismiss effect: keep `lastCompleted` visible until replaced.
    - Optionally extend `AUTO_DISMISS_MS` to 15000ms; expose as top-level constant.
    - Ensure dismissed Set pruning retains only older IDs, freeing newest.

Task 3:
  ADD tests/voice/chat-bot-voice.compact.spec.tsx (optional but recommended):
    - Mock UIMessage arrays covering executing ("call"), completed ("output-available"), and older cards.
    - Assert filtering keeps executing + latest completed while older ones dismiss after timer.

Task 4:
  VALIDATE:
    - Run `pnpm lint`, `pnpm check-types`, `pnpm test`.
    - Manual voice session: trigger web search/artifact tool, confirm UI behavior.
```

### Per task pseudocode as needed added to each task
```python
# Task 1 - executing filter
is_executing = part.state == "call" or part.state.startswith("input")

# Task 2 - dismissal logic
if lastCompleted:
    timer = setTimeout(() => {
        setDismissed(prev => {
            next = new Set(prev)
            # preserve newest completed id
            for id in completedIds[:-1]:
                next.add(id)
            # optional: prune size
            while len(next) > MAX_DISMISSED:
                next.delete(next.values().next().value)
            return next
        })
    }, AUTO_DISMISS_MS)

# Task 3 - component test
render(<CompactMessageView messages={[executingMessage, completedMessage, oldMessage]} />)
expect(screen.getByText("create_bar_chart")).toBeVisible()
advanceTimersByTime(AUTO_DISMISS_MS - 1000)
expect(screen.getByText("create_bar_chart")).toBeVisible()  # still latest
advanceTimersByTime(5000)  # when new completion simulated
```

### Integration Points
```yaml
DATABASE: none

CONFIG:
  - Optionally centralize auto-dismiss duration as constant at top of chat-bot-voice.tsx.

ROUTES:
  - No backend changes; verify useOpenAIVoiceChat continues to emit states as assumed.
```

## Validation Loop

### Level 1: Syntax & Style
```bash
pnpm lint         # Biome formatting + lint checks
pnpm check-types  # Next.js / TypeScript project-wide type safety
```

### Level 2: Unit Tests each new feature/file/function use existing test patterns
```bash
pnpm test -- filter=chat-bot-voice  # or run full suite if filters unavailable
```
```tsx
// Example Vitest cases:
it("keeps call-state tool visible", () => { ... })
it("dismisses only older completed ids", () => { ... })
```

### Level 3: Integration Test
```bash
pnpm dev
# In browser: open voice chat, request tool usage (e.g., "Search the web for...").
# Confirm executing spinner persists and last result card remains until next tool finishes.
```

## Final validation Checklist
- [ ] `pnpm lint`
- [ ] `pnpm check-types`
- [ ] `pnpm test`
- [ ] Manual voice run verifying tool card persistence
- [ ] Screenshots or logs documenting before/after behavior (optional but helpful for PR)

---

## Anti-Patterns to Avoid
- ❌ Filtering only by `"input"` states; include `"call"` to match voice events.
- ❌ Dismissing all completed IDs at once; always preserve the latest.
- ❌ Leaving timers uncleared when components unmount.
- ❌ Growing the dismissed Set indefinitely without pruning.
- ❌ Introducing new UX affordances (e.g., hover-to-pause) without design approval.
