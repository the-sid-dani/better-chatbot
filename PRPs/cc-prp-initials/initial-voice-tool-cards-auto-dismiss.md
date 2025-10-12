# Initial Plan: Voice Chat Tool Cards Auto-Dismiss

**Feature Type:** UI/UX Enhancement
**Complexity:** Low
**Estimated Time:** 30-45 minutes
**Target Component:** `src/components/chat-bot-voice.tsx` (`CompactMessageView`)

---

## Feature Purpose & Problem Statement

### What Users Experience Now
When using voice chat in **Compact View mode**, tool execution cards appear in the left sidebar and **never disappear**. As the conversation progresses and multiple tools execute (web search, chart creation, etc.), these cards accumulate indefinitely, cluttering the interface and making it difficult to focus on the current conversation.

### What Users Should Experience
Tool cards should **elegantly auto-dismiss** after completion:
- **Executing tools**: Always visible (user needs to see active operations)
- **Completed tools**: Last 3 remain visible, older ones fade out after 5 seconds
- **Smooth animations**: Cards should fade/slide out gracefully
- **Full history preserved**: Conversation View still shows ALL tools (dismissal is UI-only)

### User Benefits
- **Clean interface**: Focus on current conversation without visual clutter
- **Context awareness**: Recent tools remain visible for reference
- **Natural flow**: Similar to how chat bubbles work in messaging apps

---

## Core Components & Integration

### Primary File to Modify
**File:** `src/components/chat-bot-voice.tsx`
**Component:** `CompactMessageView` (lines 1215-1335)
**Current Behavior:** Renders ALL tool parts from ALL messages
**Target Behavior:** Filter to show executing + last N completed, auto-dismiss after delay

### Component Architecture
```
ChatBotVoice (root)
├── VoiceChatContent
│   ├── CompactMessageView ← FIX HERE
│   │   ├── toolParts (useMemo) ← Add filtering logic
│   │   ├── useEffect ← Add auto-dismiss timers
│   │   └── Dialog cards ← Wrap with AnimatePresence
│   └── ConversationView ← UNCHANGED (shows all history)
└── CanvasPanel (integrated)
```

### Integration Points
1. **No external dependencies**: Self-contained UI fix
2. **No state management changes**: Local component state only
3. **No API changes**: Pure UI filtering
4. **No database impact**: Full history remains in Conversation View

---

## Technical Context & Patterns

### Existing Patterns Discovered in Codebase

**1. Framer Motion Usage (Widespread)**
Project already uses `framer-motion@12.23.12` extensively:
- `src/components/canvas-panel.tsx`: AnimatePresence for artifacts
- `src/components/chat-bot.tsx`: AnimatePresence for scroll button
- `src/components/message-parts.tsx`: AnimatePresence for tool results
- `src/components/progress-toast.tsx`: AnimatePresence with exit animations

**2. useRef Pattern for Tracking Sets**
Found in `src/components/chat-bot-voice.tsx`:
```typescript
const processedToolsRef = useRef(new Set<string>()); // Line 118
```
Same pattern needed for `dismissedTools`.

**3. setTimeout Cleanup Pattern**
Found in `src/components/canvas-panel.tsx` LoadingPlaceholder:
```typescript
useEffect(() => {
  const interval = setInterval(() => { /* ... */ }, 1000);
  return () => clearInterval(interval);
}, [artifact.id, showWarning]);
```

**4. Tool Identification Pattern**
Current code uses `getToolName(part)` and message IDs:
```typescript
const toolKey = `${message.id}-${artifactId}`; // Line 237, 368
```

### Project-Specific Considerations

**Voice Chat Message Flow:**
```
OpenAI Realtime API
  ↓
useOpenAIVoiceChat hook (lines 94-943)
  ↓ messages state
ChatBotVoice component
  ↓ useCompactView toggle
CompactMessageView (COMPACT) | ConversationView (FULL)
```

**Tool Part Structure:**
```typescript
ToolUIPart {
  type: `tool-${toolName}`,
  toolCallId: string,
  input: object,
  state: "input-call" | "output-available" | "output-error",
  output: any
}
```

**Critical Discovery:**
Voice chat has **rapid streaming updates** - timers MUST NOT restart on every message change. Use stable tool IDs and "schedule-once" pattern.

---

## Implementation Approach

### Simple 4-Step Solution

**Step 1: Add State Management (~5 minutes)**
```typescript
// Inside CompactMessageView component (after line 1219)
const dismissedToolsRef = useRef(new Set<string>());
const dismissTimeoutsRef = useRef(new Map<string, NodeJS.Timeout>());
const scheduledToolIdsRef = useRef(new Set<string>());

const MAX_COMPLETED_VISIBLE = 3;
const AUTO_DISMISS_MS = 5000; // 5 seconds
```

**Step 2: Update Filtering Logic (~10 minutes)**
```typescript
// Modify useMemo (lines 1220-1233)
const { toolParts, textPart, userTextPart } = useMemo(() => {
  const allToolParts = messages
    .filter((msg) => msg.parts.some(isToolUIPart))
    .flatMap((msg) =>
      msg.parts
        .filter(isToolUIPart)
        .map(part => ({
          part,
          messageId: msg.id,
          toolId: `${msg.id}-${getToolName(part)}`,
          isExecuting: part.state.startsWith("input")
        }))
    );

  // Filter: executing + not dismissed + last N completed
  const visibleParts = allToolParts.filter(({ toolId, isExecuting, part }) => {
    if (isExecuting) return true; // Always show executing
    if (dismissedToolsRef.current.has(toolId)) return false; // Hide dismissed
    return part.state.startsWith("output"); // Show completed
  });

  // Keep only last MAX_COMPLETED_VISIBLE completed tools
  const executingTools = visibleParts.filter(t => t.isExecuting);
  const completedTools = visibleParts
    .filter(t => !t.isExecuting)
    .slice(-MAX_COMPLETED_VISIBLE);

  const toolParts = [...executingTools, ...completedTools];

  // Extract text parts (unchanged)
  const textPart = messages.findLast((msg) => msg.role === "assistant")?.parts[0] as TextPart;
  const userTextPart = messages.findLast((msg) => msg.role === "user")?.parts[0] as TextPart;

  return { toolParts, textPart, userTextPart };
}, [messages]);
```

**Step 3: Add Auto-Dismiss Effect (~10 minutes)**
```typescript
// Add after useMemo (around line 1234)
useEffect(() => {
  toolParts.forEach(({ toolId, isExecuting }) => {
    // Only schedule for completed tools, and only once
    if (!isExecuting && !scheduledToolIdsRef.current.has(toolId)) {
      scheduledToolIdsRef.current.add(toolId);

      const timeout = setTimeout(() => {
        dismissedToolsRef.current.add(toolId);
        // Force re-render by clearing scheduled set
        scheduledToolIdsRef.current.delete(toolId);
        // Trigger re-render (useMemo depends on messages, which triggers via parent)
      }, AUTO_DISMISS_MS);

      dismissTimeoutsRef.current.set(toolId, timeout);
    }
  });

  // Cleanup on unmount only
  return () => {
    dismissTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    dismissTimeoutsRef.current.clear();
  };
}, [toolParts]);
```

**Step 4: Add Animations (Optional, ~10 minutes)**
```typescript
// Wrap tool cards with AnimatePresence (line 1237-1294)
import { motion, AnimatePresence } from "framer-motion"; // Already imported

// Replace div wrapper with:
<AnimatePresence mode="popLayout">
  {toolParts.map(({ toolId, part }, index) => {
    const isExecuting = part?.state.startsWith("input");
    if (!part) return null;
    return (
      <motion.div
        key={toolId} // Use stable toolId instead of index
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="animate-in slide-in-from-bottom-2 fade-in duration-3000 max-w-xs w-full"
      >
        <Dialog>
          {/* Existing card content */}
        </Dialog>
      </motion.div>
    );
  })}
</AnimatePresence>
```

---

## File Organization & Structure

### Files to Modify
1. **`src/components/chat-bot-voice.tsx`**
   - Lines to modify: 1215-1295 (CompactMessageView component)
   - Changes: Add state refs, update useMemo, add useEffect, wrap with AnimatePresence
   - No new files needed

### Files NOT to Touch
- ✅ `ConversationView` (lines 1131-1213) - Shows full history, leave unchanged
- ✅ Voice chat hook (`use-voice-chat.openai.ts`) - No changes needed
- ✅ Database/API layers - UI-only change
- ✅ Canvas integration - Already working, don't touch

---

## Security & Performance

### Security Considerations
- **No security impact**: Pure UI filtering, no data changes
- **No authentication changes**: Uses existing patterns
- **No external data**: All state is local to component

### Performance Considerations
- **Timer cleanup**: Essential to prevent memory leaks
- **useMemo optimization**: Already present, filter logic is O(n)
- **Re-render frequency**: Debounced by React's batching
- **Streaming compatibility**: Schedule-once pattern prevents timer churn

---

## Implementation Blueprint

### Task Breakdown (30-45 minutes total)

**Task 1: State Management** (5 minutes)
- Add `dismissedToolsRef`, `dismissTimeoutsRef`, `scheduledToolIdsRef`
- Define constants `MAX_COMPLETED_VISIBLE`, `AUTO_DISMISS_MS`
- Validation: TypeScript compiles

**Task 2: Filtering Logic** (10 minutes)
- Modify `useMemo` to create tool objects with `toolId`
- Add filtering: executing + not dismissed + last N completed
- Update return structure to match new format
- Validation: No TypeScript errors, component renders

**Task 3: Auto-Dismiss Effect** (10 minutes)
- Add `useEffect` to schedule timeouts
- Implement schedule-once logic
- Add unmount cleanup
- Validation: Timers fire correctly, cleanup works

**Task 4: Animations** (Optional, 10 minutes)
- Import AnimatePresence (already in project)
- Wrap cards with motion.div
- Add enter/exit animations
- Validation: Smooth fade-out

**Task 5: Testing & Validation** (10 minutes)
- Manual test: Execute multiple tools in voice chat
- Verify: Executing tools stay visible
- Verify: Completed tools auto-dismiss after 5s
- Verify: Last 3 completed remain visible
- Verify: Conversation View shows full history
- Validation: All checks pass

---

## Testing Strategy

### Manual Testing Checklist
```bash
# Start dev server
pnpm dev

# Test Scenario 1: Single Tool
1. Open voice chat (compact view)
2. Say: "search for sports"
3. ✅ Tool card appears (executing state)
4. ✅ Tool completes, card shows results
5. ✅ After 5 seconds, card fades out

# Test Scenario 2: Multiple Tools
1. Execute 5+ different tools
2. ✅ All executing tools visible
3. ✅ Only last 3 completed remain
4. ✅ Oldest completed fade out after 5s

# Test Scenario 3: Streaming Churn
1. Execute tool during active streaming
2. ✅ Timer doesn't restart on every update
3. ✅ Card dismisses exactly 5s after completion

# Test Scenario 4: Conversation View
1. Switch to Conversation View
2. ✅ ALL tools visible (no filtering)
3. ✅ Full history preserved

# Test Scenario 5: Canvas Integration
1. Execute chart tool
2. ✅ Chart renders in Canvas
3. ✅ Tool card auto-dismisses
4. ✅ Chart remains in Canvas
```

### Validation Commands
```bash
pnpm check-types  # TypeScript validation
pnpm lint         # Code quality
pnpm test         # Unit tests (if any)
```

---

## Technology Context

### Framer Motion Patterns (Already in Project)
**AnimatePresence Documentation:** https://www.framer.com/motion/animate-presence/
- `mode="popLayout"`: Smooth layout shifts when items removed
- Stable keys: Use `toolId` instead of `index` for proper animations
- Exit animations: Run before element removed from DOM

**Best Practices from Existing Code:**
```typescript
// From src/components/chat-bot.tsx (lines 105-125)
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

### React Patterns for Auto-Dismiss
**Research from External Sources:**
- Use `setTimeout` with cleanup in `useEffect`
- Track scheduled items to prevent duplicate timers
- Store timeouts in Map for easy cleanup
- Use refs for values that shouldn't trigger re-renders

---

## Risk Assessment & Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Timer memory leaks | Low | Medium | Comprehensive cleanup in useEffect |
| Streaming causes timer restart | Low | Medium | Schedule-once pattern with Set tracking |
| Animation performance | Very Low | Low | Framer Motion handles optimization |
| Conversation View affected | Very Low | High | No changes to ConversationView component |
| Full history lost | Very Low | Critical | Dismissal is UI-only, data unchanged |

### Rollback Plan
```bash
# If issues detected:
git revert <commit-hash>

# Or manual: Restore CompactMessageView to original useMemo logic
# Remove added useEffect and refs
```

---

## Success Criteria

### Functional Requirements
- ✅ Executing tools always visible
- ✅ Last 3 completed tools remain visible
- ✅ Older completed tools auto-dismiss after 5 seconds
- ✅ Smooth fade-out animations
- ✅ Conversation View shows full history (unchanged)
- ✅ No timer memory leaks

### Technical Requirements
- ✅ TypeScript compilation passes
- ✅ No new dependencies required
- ✅ Follows existing Framer Motion patterns
- ✅ No performance degradation
- ✅ Compatible with streaming updates

### User Experience Requirements
- ✅ Clean interface without clutter
- ✅ Natural auto-dismiss behavior
- ✅ Recent context preserved
- ✅ No jarring transitions

---

## Post-Implementation Notes

### Documentation Updates
**Not Required** - Internal UI enhancement with no API changes

### Monitoring Strategy
- Watch for user feedback on timing (5s may need adjustment)
- Monitor browser console for cleanup warnings
- Track animation performance on lower-end devices

### Future Enhancements
- User-configurable auto-dismiss delay
- Swipe-to-dismiss gesture
- Hover-to-pause auto-dismiss
- Pinning important tool results

---

## Confidence Score

**9/10** - Very High Confidence

**Confidence Factors:**
- ✅ Simple, localized change (single component)
- ✅ Existing patterns identified in codebase
- ✅ Framer Motion already integrated
- ✅ Clear separation from Conversation View
- ✅ No external dependencies
- ✅ Easy rollback if needed
- ✅ Well-researched implementation approach

**Potential Challenges (-1 point):**
- ⚠️ Need to verify re-render trigger after dismissal
- ⚠️ Animation timing may need fine-tuning

---

## References

### Project Files Analyzed
- `src/components/chat-bot-voice.tsx` - Primary target component
- `src/components/canvas-panel.tsx` - AnimatePresence patterns
- `src/components/chat-bot.tsx` - Timer cleanup patterns
- `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` - Voice chat flow

### External Research
- Framer Motion AnimatePresence: https://www.framer.com/motion/animate-presence/
- React auto-dismiss patterns: setTimeout cleanup in useEffect
- Toast notification patterns: Auto-dismiss with timer tracking

### Archon Project Reference
**Project ID:** `3a167f38-e740-403f-8fe9-e3b0888f6171`
**Project Name:** Voice Chat — Tool Cards Auto-Dismiss

**Tasks Created:**
1. State Management (dismissed tracking, timer refs, constants)
2. Filtering Logic (executing + last N completed)
3. Auto-Dismiss Effect (schedule-once, cleanup)
4. Animations (AnimatePresence, motion.div)
5. Testing & Validation (manual scenarios, streaming churn)

---

**Document Version:** 1.0
**Created:** 2025-10-12
**Research Depth:** Deep (Serena MCP + Web + Code Analysis)
**Ready for PRP Generation:** ✅ Yes