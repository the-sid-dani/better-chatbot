# PRP: Voice Chat Tool Cards Auto-Dismiss

**Status:** Ready for Implementation
**Priority:** Medium
**Estimated Time:** 30-45 minutes
**Complexity:** Low (Single component, UI-only)
**Impact:** Improved UX for voice chat users

**Archon Project ID:** `5f138d31-5cc5-4691-ab8f-79a191c2ccc8`

---

## Executive Summary

**Problem:** Voice chat tool execution cards permanently clutter the left sidebar in Compact View mode, making conversations hard to follow.

**Root Cause:** `CompactMessageView` component renders ALL tool parts from ALL messages with no filtering or auto-dismiss logic.

**Solution:** Implement lean filtering to show executing tools + the last completed tool, with a single 5-second auto-dismiss timer and stable keys. Use minimal CSS transitions for fade-out; Framer Motion is optional and can be added later if desired.

**Risk:** Very Low - UI-only change in single component, no database/API impact, easy rollback.

---

## Problem Statement

### User-Facing Impact

**Current Behavior:**
```
User: "search for sports"
  → Tool card appears ✅
  → Tool completes ✅
  → Card STAYS FOREVER ❌

User: "create a chart"
  → Second card appears ✅
  → Both cards stay forever ❌

After 10 tools:
  → 10 cards cluttering sidebar ❌
  → Hard to focus on conversation ❌
```

**Expected Behavior:**
```
User: "search for sports"
  → Tool card appears (executing) ✅
  → Tool completes, shows results ✅
  → After 5s, card fades out ✅

User: "create a chart"
  → New card appears ✅
  → Previous card dismissed ✅
  → Clean interface maintained ✅
```

### Technical Symptoms

**Location:** `src/components/chat-bot-voice.tsx` lines 1220-1233
**Issue:** `useMemo` returns ALL tool parts with no filtering

```typescript
// CURRENT (BUGGY)
const { toolParts, textPart, userTextPart } = useMemo(() => {
  const toolParts = messages
    .filter((msg) => msg.parts.some(isToolUIPart))
    .map((msg) => msg.parts.find(isToolUIPart)); // ❌ Returns ALL tools

  return { toolParts, textPart, userTextPart };
}, [messages]);
```

**Impact:**
- ALL historical tool cards render (lines 1238-1294)
- No auto-dismiss behavior
- No animation on exit
- UI becomes progressively more cluttered

---

## Root Cause Analysis

### The Problem Chain

**Step 1: Tool Execution**
```
Voice chat → Tool executes → OpenAI Realtime API
  → useOpenAIVoiceChat creates ToolUIPart
  → Message added to messages array
```

**Step 2: Rendering (Current)**
```typescript
CompactMessageView receives messages array
  ↓
useMemo extracts ALL tool parts (no filtering)
  ↓
toolParts.map() renders EVERY tool card
  ↓
Cards accumulate indefinitely ❌
```

**Step 3: Why It Stays Forever**
- No dismissal tracking (no Set to track dismissed tools)
- No auto-dismiss logic (no setTimeout scheduling)
- No filtering by recency (shows all, not last N)
- No re-render trigger when dismissal happens

---

## Solution Design

### Approach: Lean Filtering + Single Timer

**Strategy:**
1. **Derived filtering** – Compute visible tools directly from `messages`: include all executing tools and only the last completed tool.
2. **Single dismissal state** – Track dismissed tool IDs with one `useState(new Set<string>())`.
3. **One auto-dismiss timer** – When the last completed tool changes, schedule a single 5s timeout to add its `toolCallId` to the dismissed Set. Clear the timer on change/unmount.

**Why This Works:**
- ✅ Minimal: No force re-render hacks, no multiple refs or timer maps
- ✅ Safe: UI-only, full history remains intact elsewhere
- ✅ Predictable: Effect keyed to `lastCompleted.toolCallId` avoids churn
- ✅ Performant: Pure derivation via `useMemo`; tiny state surface

---

## Implementation Details

### File Structure

**Single File to Modify:**
- `src/components/chat-bot-voice.tsx`
  - Component: `CompactMessageView` (lines 1215-1335)
  - Changes: useMemo filter, dismissed state, single useEffect timer, stable keys
  - Optional: CSS transition for fade-out (Framer Motion can be added later)
  - Lines added: ~40
  - Lines modified: ~20

**Files NOT to Touch:**
- `ConversationView` (lines 1131-1213) - Unchanged, shows full history
- `use-voice-chat.openai.ts` - No hook changes needed
- API/Database layers - UI-only change
- Canvas integration - Already working correctly

### Architecture Integration

**Component Hierarchy:**
```
ChatBotVoice (root)
├── VoiceChatContent
│   ├── CompactMessageView ← MODIFY HERE
│   │   ├── State refs (NEW)
│   │   ├── Force update state (NEW)
│   │   ├── useMemo (MODIFY - add filtering)
│   │   ├── useEffect (NEW - auto-dismiss)
│   │   └── Optional CSS transitions (fade-out)
│   └── ConversationView ← NO CHANGES
└── CanvasPanel (integrated) ← NO CHANGES
```

**Data Flow:**
```
messages (from parent)
  ↓
useMemo filtering (NEW LOGIC)
  ↓ toolParts (enriched objects)
useEffect (single timer) (NEW)
  ↓ setTimeout(5s) when lastCompleted changes
setDismissed(prev => new Set(prev).add(lastCompleted.toolCallId))
  ↓
useMemo re-runs → filtered toolParts
  ↓
Optional CSS transition → smooth exit
  ↓
Clean UI ✅
```

---

## All Needed Context

### Documentation & References

```yaml
# Core Technology
- url: https://www.framer.com/motion/animate-presence/
  why: Optional enhancement for exit animations (not required)
  note: Stable keys are required regardless; use `part.toolCallId`

- url: https://react.dev/reference/react/useState
  why: Track dismissed tool IDs using a Set in state
  critical: Always create a new Set when updating state

- url: https://react.dev/reference/react/useMemo
  why: Optimization and dependency tracking
  critical: useMemo re-runs when messages changes

# Project Patterns
- file: src/components/chat-bot.tsx
  lines: 105-125
  why: Example of optional animation pattern; not required for this fix
  pattern: |
    {/* Optional motion wrapper can be added later if needed */}

- file: src/components/canvas-panel.tsx
  lines: 96-122
  why: setTimeout cleanup pattern in LoadingPlaceholder
  pattern: |
    useEffect(() => {
      const interval = setInterval(() => { /* ... */ }, 1000);
      return () => clearInterval(interval);
    }, [artifact.id]);

- file: src/components/chat-bot-voice.tsx
  line: 118
  why: Existing useRef Set pattern for processedTools
  pattern: const processedToolsRef = useRef(new Set<string>());

- file: src/components/artifacts/workspace.tsx
  line: 244
  why: Shows that motion is present in codebase (optional for this change)
  note: No motion changes are needed for this fix
```

### Current Codebase Context

**Target Component Structure:**
```typescript
// src/components/chat-bot-voice.tsx:1215-1335
function CompactMessageView({ messages }: { messages: UIMessageWithCompleted[] }) {
  // CURRENT: Simple extraction, no filtering
  const { toolParts, textPart, userTextPart } = useMemo(() => {
    const toolParts = messages
      .filter((msg) => msg.parts.some(isToolUIPart))
      .map((msg) => msg.parts.find(isToolUIPart)); // Returns ALL tools

    const textPart = messages.findLast((msg) => msg.role === "assistant")?.parts[0] as TextPart;
    const userTextPart = messages.findLast((msg) => msg.role === "user")?.parts[0] as TextPart;

    return { toolParts, textPart, userTextPart };
  }, [messages]);

  // RENDERS: ALL tool parts as Dialog cards (lines 1238-1294)
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute bottom-6 max-h-[80vh] overflow-y-auto left-6 z-10 flex-col gap-2 hidden md:flex">
        {visibleTools.map(({ part, toolId }) => (
          <Dialog key={toolId}> {/* ✅ Stable key via toolCallId */}
            {/* Card content */}
          </Dialog>
        ))}
      </div>
      {/* Text parts rendering... */}
    </div>
  );
}
```

**Tool Part Structure:**
```typescript
ToolUIPart {
  type: `tool-${toolName}`,        // e.g., "tool-webSearch", "tool-create_bar_chart"
  toolCallId: string,              // Unique ID from OpenAI
  input: object,                   // Tool arguments
  state: "input-call" | "output-available" | "output-error",
  output: any                      // Tool results
}
```

**Voice Chat Message Flow:**
```
OpenAI Realtime API (WebRTC)
  ↓
useOpenAIVoiceChat hook (src/lib/ai/speech/open-ai/use-voice-chat.openai.ts)
  ↓ messages state updates (streaming)
ChatBotVoice component
  ↓ useCompactView toggle (lines 96, 1047-1050)
CompactMessageView (COMPACT) | ConversationView (FULL)
```

### Known Gotchas & Critical Patterns

```typescript
// CRITICAL 1: Streaming updates
// Problem: messages array updates frequently during tool execution
// Solution: Anchor auto-dismiss effect to lastCompleted.toolCallId to avoid timer churn

// CRITICAL 2: State immutability for Set
// Problem: Mutating the same Set in place won't trigger re-renders
// Solution: Always create a new Set when updating: setDismissed(p => new Set(p).add(id))

// CRITICAL 3: Stable keys
// Problem: Using array index as key causes glitches on removal
// Solution: Use toolCallId as the key (e.g., key={part.toolCallId})

// CRITICAL 4: Cleanup timing
// Problem: Timers can leak on unmount or change
// Solution: Clear the single timeout on dependency change/unmount in useEffect

// CRITICAL 5: Animations are optional
// Problem: Animation work can expand scope needlessly
// Solution: Start with CSS transitions; add motion later only if needed
```

**Existing Dependencies (Already Installed):**
```json
// package.json:105
"framer-motion": "^12.23.12"  // ✅ Already available
```

---

## Implementation Blueprint

### Pseudocode (Lean Version)

```typescript
// STEP 1: Track dismissed tool IDs (after line 1218)
function CompactMessageView({ messages }: { messages: UIMessageWithCompleted[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const AUTO_DISMISS_MS = 5000;

  // STEP 2: Derive executing and last completed (1220-1233)
  const { visibleTools, textPart, userTextPart, lastCompleted } = useMemo(() => {
    const all = messages
      .filter((m) => m.parts.some(isToolUIPart))
      .flatMap((m) =>
        m.parts.filter(isToolUIPart).map((part) => ({
          part,
          toolId: (part as any).toolCallId as string,
          isExecuting: part.state.startsWith("input"),
        })),
      );

    const notDismissed = all.filter((t) => !dismissed.has(t.toolId));
    const executing = notDismissed.filter((t) => t.isExecuting);
    const completed = notDismissed.filter((t) => !t.isExecuting && t.part.state.startsWith("output"));
    const lastCompleted = completed.at(-1);
    const visibleTools = lastCompleted ? [...executing, lastCompleted] : executing;

    const textPart = messages.findLast((m) => m.role === "assistant")?.parts[0] as TextPart;
    const userTextPart = messages.findLast((m) => m.role === "user")?.parts[0] as TextPart;
    return { visibleTools, textPart, userTextPart, lastCompleted };
  }, [messages, dismissed]);

  // STEP 3: Auto-dismiss last completed (single timer)
  useEffect(() => {
    if (!lastCompleted) return;
    const t = setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(lastCompleted.toolId));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [lastCompleted?.toolId]);

  // STEP 4: Rendering (stable keys via toolCallId)
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute bottom-6 max-h-[80vh] overflow-y-auto left-6 z-10 flex-col gap-2 hidden md:flex">
        {visibleTools.map(({ part, toolId }) => (
          <Dialog key={toolId}>
            {/* Existing Dialog content unchanged */}
          </Dialog>
        ))}
      </div>
      {/* Text parts rendering unchanged */}
    </div>
  );
}
```

---

## Task Breakdown

### Task 1: Add State (dismissed IDs) (3 minutes)

**File:** `src/components/chat-bot-voice.tsx`
**Location:** Inside `CompactMessageView`, after line 1218

**Add:**
```typescript
const [dismissed, setDismissed] = useState<Set<string>>(new Set());
const AUTO_DISMISS_MS = 5000; // 5 seconds
```

**Imports needed:**
```typescript
// Already imported: useMemo, useEffect
// Ensure: useState is imported from "react"
import { ..., useState } from "react";
```

**Validation:**
```bash
pnpm check-types  # Should compile with no errors
```

---

### Task 2: Derive visible tools (useMemo) (10 minutes)

**File:** `src/components/chat-bot-voice.tsx`
**Location:** Lines 1220-1233 (entire useMemo block)

**Replace with:**
```typescript
const { visibleTools, textPart, userTextPart, lastCompleted } = useMemo(() => {
  const all = messages
    .filter((m) => m.parts.some(isToolUIPart))
    .flatMap((m) =>
      m.parts.filter(isToolUIPart).map((part) => ({
        part,
        toolId: (part as any).toolCallId as string,
        isExecuting: part.state.startsWith("input"),
      })),
    );

  const notDismissed = all.filter((t) => !dismissed.has(t.toolId));
  const executing = notDismissed.filter((t) => t.isExecuting);
  const completed = notDismissed.filter((t) => !t.isExecuting && t.part.state.startsWith("output"));
  const lastCompleted = completed.at(-1);
  const visibleTools = lastCompleted ? [...executing, lastCompleted] : executing;

  const textPart = messages.findLast((m) => m.role === "assistant")?.parts[0] as TextPart;
  const userTextPart = messages.findLast((m) => m.role === "user")?.parts[0] as TextPart;
  return { visibleTools, textPart, userTextPart, lastCompleted };
}, [messages, dismissed]);
```

**Key Changes:**
- ✅ Returns `{toolId, part, isExecuting}` and `lastCompleted`
- ✅ Filters by dismissed status from state
- ✅ Shows all executing + only the last completed

**Validation:**
```bash
pnpm check-types  # Should compile
# Manual: Check visibleTools.map() uses key={toolId}
```

---

### Task 3: Implement Auto-Dismiss Effect (single timer) (5 minutes)

**File:** `src/components/chat-bot-voice.tsx`
**Location:** After useMemo block, around line 1234

**Add:**
```typescript
// Auto-dismiss the last completed tool (single timeout tied to it)
useEffect(() => {
  if (!lastCompleted) return;
  const t = setTimeout(() => {
    setDismissed((prev) => new Set(prev).add(lastCompleted.toolId));
  }, AUTO_DISMISS_MS);
  return () => clearTimeout(t);
}, [lastCompleted?.toolId]);
```

**Critical Behavior:**
- ✅ Schedules a single timeout for the latest completed tool
- ✅ Avoids timer churn by anchoring to `lastCompleted.toolId`
- ✅ Uses state updates (new Set) to trigger re-render
- ✅ Clears timeout on change/unmount

**Validation:**
```bash
pnpm check-types
# Manual: Test timer fires after 5s, card disappears
```

---

### Task 4: Optional CSS Fade (2 minutes)

Keep motion out of scope for this fix. If desired, add simple CSS utility classes to the tool card container:

```tsx
<div className="transition-opacity duration-300 opacity-100">{/* ... */}</div>
```

When a card is dismissed, it naturally unmounts; the brief CSS transition smooths entry/exit without extra deps. Framer Motion can be added later if we want richer transitions.

---

### Task 5: Testing & Validation (10 minutes)

**Validation Gates:**
```bash
# TypeScript validation
pnpm check-types
# Expected: ✅ No errors

# Linting
pnpm lint
# Expected: ✅ No warnings

# Build test
pnpm build:local
# Expected: ✅ Build succeeds (optional validation)
```

**Manual Testing Scenarios:**

**Test 1: Single Tool Auto-Dismiss**
```bash
# Prerequisites: pnpm dev running on localhost:3000

Steps:
1. Click voice chat button
2. Say: "search for technology trends"
3. ✅ Verify: Tool card appears with spinner (executing)
4. ✅ Verify: Tool completes, shows checkmark icon
5. ⏱️ Wait 5 seconds
6. ✅ Verify: Card smoothly fades out to the left
7. ✅ Verify: No console errors
```

**Test 2: Multiple Tools - Last 1 Retention**
```bash
Steps:
1. In voice chat, execute 5 different tools:
   - "search for sports"
   - "create a bar chart"
   - "search for movies"
   - "create a pie chart"
   - "search for technology"

2. ✅ Verify: All executing tools visible during execution
3. ✅ Verify: After each completes, only LAST 1 completed visible
4. ✅ Verify: Older tools auto-dismiss after 5s
5. ✅ Verify: Clean interface (max 1 completed + any executing)
```

**Test 3: Streaming Churn Protection**
```bash
Steps:
1. Execute a slow tool (large chart generation)
2. ✅ Verify: Card shows executing state
3. ✅ Verify: During streaming (multiple message updates), timer doesn't restart
4. ✅ Verify: Exactly 5s after completion, card dismisses
5. ✅ Check console: No duplicate timer warnings
```

**Test 4: Conversation View Unaffected**
```bash
Steps:
1. Execute 3+ tools in voice chat
2. Toggle to Conversation View (speech bubble icon)
3. ✅ Verify: ALL tools visible in full history
4. ✅ Verify: No cards missing
5. ✅ Verify: Dismissal only affected Compact View
```

**Test 5: Canvas Integration**
```bash
Steps:
1. Say: "create a bar chart showing sales data"
2. ✅ Verify: Chart tool card appears
3. ✅ Verify: Canvas opens with chart
4. ⏱️ Wait 5s
5. ✅ Verify: Tool card dismisses
6. ✅ Verify: Chart REMAINS in Canvas workspace
7. ✅ Verify: Chart is fully interactive
```

**Test 6: Executing Tools Always Visible**
```bash
Steps:
1. Trigger slow tool (web search with large results)
2. While executing, trigger second tool
3. ✅ Verify: BOTH executing tools visible simultaneously
4. ✅ Verify: Neither dismisses while executing
5. ✅ Verify: Only after completion does 5s timer start
```

---

## Integration Points

### No Changes Required To:
- ✅ `ConversationView` component - Full history unaffected
- ✅ Voice chat hook (`useOpenAIVoiceChat`) - Message structure unchanged
- ✅ Database/API layers - UI-only change
- ✅ Canvas system - Already working, independent of tool cards
- ✅ Message persistence - No impact on saved data

### Compatibility Verification:
- ✅ Framer Motion already installed (v12.23.12)
- ✅ Framer Motion present in codebase (optional; not required here)
- ✅ useRef Set pattern exists (line 118 same file)
- ✅ setTimeout cleanup pattern exists (canvas-panel.tsx)

---

## Validation Loop

### Level 1: Syntax & Type Safety
```bash
# Run FIRST - fix before proceeding
pnpm check-types

# Expected: No errors
# If errors appear:
# 1. Read error message carefully
# 2. Check toolParts type changed from ToolUIPart[] to Array<{toolId, part, ...}>
# 3. Update map() callback to destructure {toolId, part}
# 4. Re-run check-types
```

### Level 2: Code Quality
```bash
# Linting
pnpm lint

# Expected: No warnings
# If warnings:
# 1. Most will auto-fix
# 2. Check for unused variables
# 3. Verify forceUpdate is used in setTimeout
```

### Level 3: Runtime Validation
```bash
# Start dev server
pnpm dev

# Open browser console (F12)
# Execute test scenarios above
# Watch for:
# - ✅ No errors in console
# - ✅ "Voice Chat Tool Processing" debug logs
# - ✅ No timer warnings
# - ✅ Clean dismissals after 5s
```

### Level 4: Edge Case Testing
```bash
# Test: Component unmount with active timers
1. Start voice chat, execute tool
2. Before 5s, close voice chat
3. ✅ Verify: No console warnings about cleared timers
4. ✅ Verify: No memory leaks

# Test: Rapid tool execution
1. Execute 3 tools in quick succession (<1s apart)
2. ✅ Verify: All timers independent
3. ✅ Verify: Each dismisses at correct time (5s after own completion)

# Test: Tool execution during dismissal animation
1. Execute tool, wait 4.5s
2. Execute second tool during first tool's exit animation
3. ✅ Verify: Animations don't conflict
4. ✅ Verify: Second tool appears smoothly
```

---

## Risk Assessment

### Risk Matrix

| Risk | Probability | Impact | Mitigation | Status |
|------|------------|--------|------------|---------|
| Timer memory leaks | Low | Medium | Comprehensive cleanup in useEffect return | ✅ Mitigated |
| Streaming causes timer restart | Low | Medium | Effect keyed to lastCompleted.toolCallId | ✅ Mitigated |
| Re-render doesn't trigger | Low | Medium | State update with new Set instance | ✅ Mitigated |
| Animation performance lag | N/A | Low | CSS-only by default (Motion optional) | ✅ Mitigated |
| Conversation View broken | Very Low | Critical | No code changes to ConversationView | ✅ Mitigated |
| Full history lost | Very Low | Critical | Dismissal is UI filter only, data unchanged | ✅ Mitigated |

### Detailed Risk Analysis

**Risk 1: Re-render Not Triggering After Dismissal**
- **Impact:** MEDIUM - Card may not disappear
- **Cause:** Mutating a Set in place
- **Solution:** Create a new Set when updating state
- **Pattern:** `setDismissed((p) => new Set(p).add(id))`
- **Likelihood:** LOW with proper state updates

**Risk 2: Duplicate Timers from Streaming**
- **Impact:** LOW - Timer churn
- **Cause:** Recomputations during streaming updates
- **Solution:** Anchor effect to `lastCompleted.toolCallId` only
- **Pattern:** `useEffect(..., [lastCompleted?.toolCallId])`
- **Likelihood:** LOW with dependency guard

**Risk 3: Timer Memory Leaks**
- **Impact:** MEDIUM - Performance degradation over time
- **Cause:** Timers not cleared on component unmount
- **Solution:** Comprehensive cleanup in useEffect return
- **Pattern:** `return () => { timeoutsMap.forEach(clearTimeout); }`
- **Likelihood:** LOW with cleanup

---

## Success Criteria

### Functional Requirements
- ✅ Executing tools always visible (spinner icon)
- ✅ Last 1 completed tool remains visible for 5 seconds
- ✅ Older completed tools auto-dismiss with a brief fade-out
- ✅ Conversation View shows full history (unchanged)
- ✅ No timer memory leaks or console warnings

### Technical Requirements
- ✅ TypeScript compilation passes (`pnpm check-types`)
- ✅ Linting passes (`pnpm lint`)
- ✅ No new dependencies required
- ✅ No dependency on animation libraries (Motion optional later)
- ✅ No performance degradation
- ✅ Compatible with rapid streaming updates

### User Experience Requirements
- ✅ Clean, uncluttered interface
- ✅ Natural auto-dismiss behavior (similar to toast notifications)
- ✅ Recent context preserved (last completed tool visible)
- ✅ Smooth transitions (no jarring flickers)
- ✅ No jarring transitions or flickers

---

## Post-Implementation

### Documentation Updates
**Not Required** - Internal UI enhancement with:
- No API changes
- No user-facing configuration
- No breaking changes
- Code is self-documenting with comments

### Monitoring Strategy
**Week 1: Active Observation**
- Watch for user feedback on timing (5s may need adjustment)
- Monitor browser console for cleanup warnings
- Track animation performance on various devices

**Ongoing: Passive Monitoring**
- No specific metrics needed (pure UX enhancement)
- User feedback will indicate if timing needs tuning

### Future Enhancements
- User-configurable auto-dismiss delay
- Hover-to-pause dismissal
- Swipe-to-dismiss gesture
- Pin important tool results

---

## Anti-Patterns to Avoid

### ❌ Don't Do These:

```typescript
// ❌ WRONG: Using index as key
{visibleTools.map((item, index) => (
  <Dialog key={index}>

// ✅ RIGHT: Stable key via toolCallId
{visibleTools.map(({ part, toolId }) => (
  <Dialog key={toolId}>

// ❌ WRONG: Mutate same Set instance
dismissed.add(id); setDismissed(dismissed); // no re-render

// ✅ RIGHT: Create a new Set when updating
setDismissed((prev) => new Set(prev).add(id));

// ❌ WRONG: Schedule per tool list change
useEffect(() => { setTimeout(...); }, [visibleTools]); // churn

// ✅ RIGHT: Anchor to lastCompleted
useEffect(() => { /* setTimeout */ }, [lastCompleted?.toolId]);

// ❌ WRONG: Multiple concurrent timers for same tool
// ✅ RIGHT: Single timeout tied to lastCompleted only
```

---

## Confidence Score

**9/10** - Very High Confidence for One-Pass Success

**Confidence Factors:**
- ✅ Simple, localized change (single component)
- ✅ Existing patterns clearly identified in codebase
- ✅ Clear separation (CompactView modified, ConversationView untouched)
- ✅ No new dependencies required (CSS-only transitions)
- ✅ Stable keys via `toolCallId`
- ✅ Edge cases identified and mitigated
- ✅ Comprehensive test scenarios provided
- ✅ Easy rollback if needed

**Potential Challenges (-1 point):**
- ⚠️ Need to verify destructuring works in map callback
- ⚠️ Optional fade timing may need minor tuning

**Why One-Pass Will Succeed:**
1. **Clear Requirements:** User specified "only last 1 tool" (not 3)
2. **Complete Context:** All patterns, gotchas, and examples included
3. **Validation Loop:** Executable commands with expected outputs
4. **Error Prevention:** Anti-patterns documented with corrections
5. **Proven Patterns:** All techniques exist in current codebase

---

## References

### Codebase Files Referenced
- `src/components/chat-bot-voice.tsx:1215-1335` - Target component
- `src/components/chat-bot.tsx:105-125` - Optional animation pattern (not required)
- `src/components/canvas-panel.tsx:96-122` - setTimeout cleanup pattern
- `src/components/artifacts/workspace.tsx:244` - Motion usage elsewhere (optional)
- `src/components/chat-bot-voice.tsx:118` - Existing ref usage elsewhere (unrelated)

### External Documentation
- Framer Motion AnimatePresence: https://www.framer.com/motion/animate-presence/
- React useState (Set state updates): https://react.dev/reference/react/useState

### Archon Project
- **Project ID:** `5f138d31-5cc5-4691-ab8f-79a191c2ccc8`
- **Tasks Created:** 4 (State → Filter → Effect → Test)

---

## Appendix: Code Examples

### Example 1: Complete Component (Lean)

```typescript
function CompactMessageView({ messages }: { messages: UIMessageWithCompleted[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const AUTO_DISMISS_MS = 5000;

  const { visibleTools, textPart, userTextPart, lastCompleted } = useMemo(() => {
    const all = messages
      .filter((m) => m.parts.some(isToolUIPart))
      .flatMap((m) =>
        m.parts.filter(isToolUIPart).map((part) => ({
          part,
          toolId: (part as any).toolCallId as string,
          isExecuting: part.state.startsWith("input"),
        })),
      );

    const notDismissed = all.filter((t) => !dismissed.has(t.toolId));
    const executing = notDismissed.filter((t) => t.isExecuting);
    const completed = notDismissed.filter((t) => !t.isExecuting && t.part.state.startsWith("output"));
    const lastCompleted = completed.at(-1);
    const visibleTools = lastCompleted ? [...executing, lastCompleted] : executing;

    const textPart = messages.findLast((m) => m.role === "assistant")?.parts[0] as TextPart;
    const userTextPart = messages.findLast((m) => m.role === "user")?.parts[0] as TextPart;
    return { visibleTools, textPart, userTextPart, lastCompleted };
  }, [messages, dismissed]);

  useEffect(() => {
    if (!lastCompleted) return;
    const t = setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(lastCompleted.toolId));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [lastCompleted?.toolId]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute bottom-6 max-h-[80vh] overflow-y-auto left-6 z-10 flex-col gap-2 hidden md:flex">
        {visibleTools.map(({ part, toolId }) => {
          const isExecuting = part?.state.startsWith("input");
          return (
            <Dialog key={toolId}>
              <DialogTrigger asChild>
                <div className="transition-opacity duration-300 max-w-xs w-full">
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    className="w-full bg-card flex items-center gap-2 px-2 text-xs text-muted-foreground"
                  >
                    <WrenchIcon className="size-3.5" />
                    <span className="text-sm font-bold min-w-0 truncate mr-auto">
                      {getToolName(part)}
                    </span>
                    {isExecuting ? (
                      <Loader className="size-3.5 animate-spin" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="z-50 md:max-w-2xl! max-h-[80vh] overflow-y-auto p-8">
                {/* Inputs/Outputs unchanged */}
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
      {/* User transcription and text parts - unchanged */}
    </div>
  );
}
```

---

**Document Version:** 1.0
**Created:** 2025-10-12
**Ready for Implementation:** ✅ Yes
**One-Pass Success Probability:** 90%
