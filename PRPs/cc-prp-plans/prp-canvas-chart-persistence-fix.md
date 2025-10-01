# PRP: Canvas Chart Persistence Bug Fix

## Overview

**Project ID**: 52edc266-80dc-4c3f-a659-6c50c16e942a
**Feature**: Canvas Chart Persistence
**Priority**: High
**Complexity**: Low (Focused Bug Fix)
**Estimated Effort**: 2-4 hours

## Problem Statement

Charts created in Canvas disappear after page refresh. Users can see all charts during an active chat session, but when they return to the thread later (after refresh or next day), only the last 2 charts are visible - all previous charts are lost.

### Root Cause

The chart processing logic in `src/components/chat-bot.tsx` only processes the **last message** in the conversation (line 600):

```typescript
const lastMessage = messages[messages.length - 1]; // ❌ Only processes last message
```

**What happens:**
- **During active chat**: New messages are processed as they arrive → charts created ✅
- **After page refresh**: All messages load from `initialMessages` → only last message processed → older charts lost ❌

### Impact

- Poor user experience - work is lost
- Users must recreate charts they've already generated
- Affects both regular chat (`chat-bot.tsx`) and voice chat (`chat-bot-voice.tsx`)

## Technical Context

### Current Architecture

**Message Flow:**
1. Page loads → `initialMessages` prop passed to ChatBot component (from database)
2. Messages stored in `useChat` hook state
3. Tool processing useEffect watches `messages` array (line 590-825)
4. Only `messages[messages.length - 1]` is checked for chart tools
5. Chart tools create artifacts via `addCanvasArtifact()`

**Canvas State Management:**
- Canvas state managed by `useCanvas` hook in `canvas-panel.tsx`
- Uses ephemeral React `useState` - no persistence
- Artifacts array: `const [artifacts, setArtifacts] = useState<CanvasArtifact[]>([]);`

**Duplicate Prevention:**
- `processedToolsRef` (useRef<Set<string>>) tracks processed tool IDs
- Key format: `${messageId}-${artifactId}`
- Cleared when thread changes (line 291)

### Relevant Code Locations

**Main Issue:**
- `src/components/chat-bot.tsx:590-825` - Tool processing useEffect
- `src/components/chat-bot.tsx:600` - Last message extraction (bug location)

**Similar Code:**
- `src/components/chat-bot-voice.tsx:145-484` - Same issue in voice chat

**Canvas Management:**
- `src/components/canvas-panel.tsx:613-960` - useCanvas hook
- `src/components/canvas-panel.tsx:686` - addArtifact function

**Chart Tool Names:**
```typescript
const chartToolNames = [
  "create_chart", "create_area_chart", "create_scatter_chart",
  "create_radar_chart", "create_funnel_chart", "create_treemap_chart",
  "create_sankey_chart", "create_radial_bar_chart", "create_composed_chart",
  "create_geographic_chart", "create_gauge_chart", "create_calendar_heatmap",
  "create_bar_chart", "create_line_chart", "create_pie_chart",
  "create_table"
];
```

## Solution Design

### Approach: One-Time Historical Message Processing

Add initialization logic that processes ALL assistant messages on first load, while keeping existing real-time processing for new messages.

### Implementation Pattern

```typescript
// 1. Add initialization flag
const isInitializedRef = useRef(false);

// 2. Process all historical messages on mount
useEffect(() => {
  if (isInitializedRef.current) return; // Already initialized

  // Process ALL assistant messages (not just last one)
  messages.forEach(message => {
    if (message.role !== 'assistant') return;

    // Extract and process chart tools from this message
    // ... existing tool extraction logic ...
  });

  isInitializedRef.current = true;
}, [messages.length]); // Run when messages first load

// 3. Keep existing real-time processing
useEffect(() => {
  if (!isInitializedRef.current) return; // Wait for initialization

  // Existing logic - process last message for new charts
  const lastMessage = messages[messages.length - 1];
  // ...
}, [messages, ...]);
```

### Key Design Decisions

1. **Why not change Canvas to persistent storage?**
   - Over-engineering for this bug fix
   - Would require localStorage/DB integration
   - Current solution is simpler and sufficient

2. **Why process on every mount?**
   - Messages may change between sessions
   - Small performance cost (only runs once per thread load)
   - Reprocessing is idempotent (duplicate prevention exists)

3. **Why keep separate initialization and real-time effects?**
   - Clear separation of concerns
   - Existing real-time logic is well-tested
   - Minimal changes to working code

## Implementation Steps

### Task 1: Add Initialization Logic

**File**: `src/components/chat-bot.tsx`
**Location**: After line 291 (after thread change cleanup)

```typescript
// Track if we've initialized artifacts from history
const isInitializedRef = useRef(false);

// ONE-TIME: Process all historical messages on first load
useEffect(() => {
  // Skip if already initialized or no messages
  if (isInitializedRef.current || messages.length === 0) {
    return;
  }

  console.log('🔄 ChatBot: Initializing artifacts from message history', {
    messageCount: messages.length,
    threadId,
  });

  // Process ALL assistant messages (not just last one)
  messages.forEach((message) => {
    if (message.role !== 'assistant') return;

    // Extract chart tools from this message
    const chartTools = message.parts.filter(
      (part) => isToolUIPart(part) && chartToolNames.includes(getToolName(part))
    );

    // Process completed charts (same logic as real-time processing)
    chartTools.forEach((part) => {
      if (!isToolUIPart(part) || !part.state.startsWith('output')) return;

      const result = part.output as any;
      const isCompleted =
        (result?.shouldCreateArtifact && result?.status === 'success') ||
        result?.success === true ||
        (result?.structuredContent?.result?.[0]?.success === true &&
          result?.isError === false);

      if (!isCompleted) return;

      const artifactId =
        result.chartId ||
        result.artifactId ||
        result.structuredContent?.result?.[0]?.artifactId ||
        generateUUID();

      const toolKey = `${message.id}-${artifactId}`;

      // Duplicate prevention
      if (processedToolsRef.current.has(toolKey)) return;
      processedToolsRef.current.add(toolKey);

      // Create artifact (reuse existing logic)
      const toolName = getToolName(part);
      const isTableTool = toolName === 'create_table';
      const chartData = result.chartData;
      const chartType = result.chartType;
      const title = result.title;

      const artifact = {
        id: artifactId,
        type: (isTableTool ? 'table' : 'chart') as 'chart' | 'table',
        title: title || (isTableTool ? `Table: ${chartType}` : `${chartType} Chart`),
        canvasName: result.canvasName || 'Data Visualization',
        data: chartData,
        status: 'completed' as const,
        metadata: {
          chartType: chartType || 'bar',
          dataPoints: result.dataPoints || chartData?.data?.length || 0,
          toolName,
          lastUpdated: new Date().toISOString(),
        },
      };

      addCanvasArtifact(artifact);
    });
  });

  isInitializedRef.current = true;
  console.log('✅ ChatBot: Artifact initialization complete', {
    artifactCount: canvasArtifacts.length,
  });
}, [messages.length, threadId]); // Re-run if messages change or thread switches
```

### Task 2: Guard Real-Time Processing

**File**: `src/components/chat-bot.tsx`
**Location**: Line 590 (existing useEffect)

```typescript
useEffect(() => {
  // Wait for initialization before processing new messages
  if (!isInitializedRef.current) {
    return;
  }

  // ... existing debounce and processing logic ...
}, [
  messages,
  isCanvasVisible,
  userManuallyClosed,
  showCanvas,
  addCanvasArtifact,
  updateCanvasArtifact,
  canvasArtifacts,
]);
```

### Task 3: Reset on Thread Change

**File**: `src/components/chat-bot.tsx`
**Location**: Line 287 (existing thread change useEffect)

```typescript
useEffect(() => {
  console.log('🧼 ChatBot Debug: Thread changed - clearing processed tools cache');
  processedToolsRef.current.clear();
  isInitializedRef.current = false; // ⬅️ ADD THIS LINE
}, [threadId]);
```

### Task 4: Apply to Voice Chat

**File**: `src/components/chat-bot-voice.tsx`
**Location**: After line 101

Apply identical pattern to voice chat component (same logic, different file).

## Validation & Testing

### Manual Test Cases

**Test 1: Multi-Chart Persistence**
1. Create 5 different charts in a conversation
2. Refresh browser
3. ✅ Verify all 5 charts visible in Canvas
4. Switch to different thread and back
5. ✅ Verify all 5 charts still present

**Test 2: New Charts After Refresh**
1. Start with thread containing 3 charts
2. Refresh page
3. ✅ Verify 3 charts loaded
4. Create 2 new charts
5. ✅ Verify 5 total charts (no duplicates)

**Test 3: Thread Switching**
1. Thread A: Create 3 charts
2. Thread B: Create 2 charts
3. Switch back to Thread A
4. ✅ Verify Thread A shows 3 charts (not Thread B's charts)

**Test 4: Voice Chat Charts**
1. Use voice chat to create 3 charts
2. Refresh page
3. ✅ Verify voice chat charts persist

### Edge Cases to Verify

- Empty thread (no charts) → No errors
- Thread with only failed chart attempts → No artifacts created
- Very long conversation (50+ messages) → No performance issues
- Rapid thread switching → Correct artifacts for each thread

## Success Criteria

- [ ] All charts from conversation history load after page refresh
- [ ] New charts during active session work as before
- [ ] No duplicate charts created
- [ ] Thread switching shows correct charts for each thread
- [ ] Voice chat has same fix applied
- [ ] No console errors during initialization
- [ ] Performance acceptable (<100ms for 50 messages)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance impact on large conversations | Add console timing logs; if >100ms, add message limit |
| Duplicate charts | Existing `processedToolsRef` prevents duplicates |
| Race conditions | Initialization flag prevents double-processing |
| Memory leaks | `processedToolsRef` is cleared on thread change |

## Rollback Plan

If issues arise:
1. Remove initialization useEffect
2. Reset `isInitializedRef.current` guard in real-time effect
3. Revert `isInitializedRef.current = false` in thread change effect

Original functionality will be restored.

## References

**Codebase Patterns:**
- Duplicate prevention: `processedToolsRef` (chat-bot.tsx:281)
- Chart tool list: chat-bot.tsx:613-632
- Artifact creation: chat-bot.tsx:730-795

**External Documentation:**
- React useEffect: https://react.dev/reference/react/useEffect
- Vercel AI SDK useChat: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

**Related Issues:**
- Canvas versioning system (scrapped) left state without persistence
- Voice chat has identical issue (chat-bot-voice.tsx:154)

## Confidence Score

**8/10** - High confidence for one-pass implementation

**Reasoning:**
- Simple, focused change (add one useEffect)
- Existing duplicate prevention handles edge cases
- Pattern already exists in codebase
- Well-understood problem and solution
- Low risk (easily reversible)

**Deductions:**
- -1: Need to verify performance with large message histories
- -1: Voice chat component needs identical fix (2 locations)
