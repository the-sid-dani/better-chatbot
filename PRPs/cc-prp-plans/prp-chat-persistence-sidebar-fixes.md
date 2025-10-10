# PRP: Chat Persistence & Sidebar Fixes (Text + Voice)

**Feature:** Fix text chat persistence, prevent voice ghost threads, ensure sidebar visibility
**Status:** Ready for Implementation
**Priority:** 🔴 CRITICAL - Production Breaking
**Complexity:** Medium (architectural fixes + verification)
**Estimated Time:** 90 minutes

**Archon Project ID:** `d9451681-711b-4cf4-b6b0-d91ee1e5a49c`
**Retrieve Project:** `mcp__archon__find_projects(project_id="d9451681-711b-4cf4-b6b0-d91ee1e5a49c")`
**View All Tasks:** `mcp__archon__find_tasks(filter_by="project", filter_value="d9451681-711b-4cf4-b6b0-d91ee1e5a49c")`

---

## Executive Summary

### Problem Statement

**TWO CRITICAL ISSUES** affecting chat functionality:

1. **Text Chat Persistence Broken (CRITICAL)**
   - Messages NOT saving to database
   - All history lost on page refresh
   - Production unusable for real conversations
   - **Root cause:** Nested `onFinish` callbacks from Langfuse integration

2. **Voice Chat Ghost Threads (HIGH)**
   - Empty threads created when dialog opens accidentally
   - Sidebar cluttered with 0-message threads
   - Database pollution
   - **Root cause:** Premature thread creation in start() function

**VERIFICATION NEEDED:**
3. Voice chat sidebar visibility (should work based on code analysis)
4. Voice chat title generation (should work based on code analysis)

### Solution Approach

**3-phase pragmatic fix:**

**Phase 1 (5 min):** Fix voice ghost threads with lazy thread creation
**Phase 2 (35 min):** Fix text chat persistence by consolidating callbacks
**Phase 3 (25 min):** Verify voice sidebar & titles work correctly
**Phase 4 (25 min):** Comprehensive validation & testing

**Total:** 90 minutes

---

## 🔬 Technical Context

### Root Cause Analysis

#### **Issue 1: Text Chat Persistence Failure**

**Architecture Conflict:**
```typescript
// src/app/api/chat/route.ts - BROKEN ARCHITECTURE

const stream = createUIMessageStream({
  execute: async ({ writer: dataStream }) => {
    const result = streamText({
      // ❌ INNER onFinish (line 350) - Langfuse
      onFinish: async (result) => {
        updateActiveTrace({ output: result.content });
        trace.getActiveSpan()?.end(); // ← TERMINATES SPAN
      },
    });
    result.consumeStream();
    dataStream.merge(result.toUIMessageStream());
  },

  // ❌ OUTER onFinish (line 481) - Persistence
  // 🚨 NEVER EXECUTES - stream already terminated!
  onFinish: async ({ responseMessage }) => {
    await chatRepository.upsertMessage({ ... }); // ← DEAD CODE
  },
});
```

**Why It Breaks:**
1. `streamText.onFinish` executes → Updates Langfuse metadata
2. Calls `trace.getActiveSpan()?.end()` → OpenTelemetry span terminated
3. Stream signals completion → Response lifecycle ends
4. `createUIMessageStream.onFinish` never invoked
5. Messages never saved

**Evidence from Web Research:**
- Vercel AI SDK GitHub Issue #7469: "`onFinish` from `createUIMessageStream` not called when aborted"
- Known reliability issues with createUIMessageStream.onFinish execution
- Recommendation: Use callbacks that execute reliably (like streamText.onFinish)

---

#### **Issue 2: Voice Chat Ghost Threads**

**Current Problem:**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts:175

const start = useCallback(async () => {
  //...
  if (threadId) {
    // ❌ Creates thread IMMEDIATELY when dialog opens
    const thread = await getOrCreateVoiceThreadAction(threadId);
    historyMessages = await loadThreadMessagesAction(thread.id, 20);
  }
}, []);
```

**Why It's Wrong:**
- Voice dialog opens → Thread created immediately
- User closes without speaking → Empty thread persists
- Sidebar fills with "Voice Chat" entries with 0 messages

**Correct Pattern (Lazy Creation):**
```typescript
// Thread creation should happen in persistVoiceMessageAction
// ONLY when first message is actually sent
```

---

### Canvas-Voice-Langfuse Integration Context

**Why This Seemed Complex:**

Recent work on THREE systems simultaneously:
- Canvas integration (Sept 28) ✅
- Voice-Canvas integration (recent) ✅
- Langfuse observability (Oct 2-9) ✅

**Actual Relationship:**
- ✅ Canvas uses `onStepFinish` (different callback) - NO IMPACT
- ✅ Voice uses server actions (separate system) - NO IMPACT
- ❌ Langfuse uses nested `onFinish` - **BREAKS text chat persistence**

**Key Insight:**
Canvas and Voice work fine! The issue is purely the Langfuse callback architecture for TEXT chat.

---

## Implementation Plan

### Phase 1: Fix Voice Ghost Threads (5 min)

#### Task 1.1: Update Voice Chat Start Function

**File:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
**Archon Task ID:** (Created below)
**Lines:** 174-182
**Priority:** 🔴 HIGH (90)

**Current Code:**
```typescript
try {
  // Only load history if thread exists, don't create empty thread yet
  let historyMessages: any[] = [];
  if (threadId) {
    const thread = await getOrCreateVoiceThreadAction(threadId); // ❌ CREATES THREAD
    historyMessages = await loadThreadMessagesAction(thread.id, 20);
    setMessages(historyMessages);
    logger.info(`Loaded ${historyMessages.length} historical messages`);
  } else {
    logger.info(`New voice session - thread will be created on first message`);
  }
```

**Fixed Code:**
```typescript
try {
  // ✅ ONLY load history if thread ALREADY EXISTS (no creation)
  let historyMessages: any[] = [];
  if (threadId) {
    // Use selectThreadDetails (read-only check) instead of getOrCreate
    const thread = await chatRepository.selectThreadDetails(threadId);

    if (thread && thread.userId === session?.user.id) {
      // Thread exists - load its history
      historyMessages = await loadThreadMessagesAction(thread.id, 20);
      setMessages(historyMessages);
      logger.info(`Loaded ${historyMessages.length} historical messages for existing thread`);
    } else {
      // Thread doesn't exist yet - will be created on first message
      logger.info(`New voice session - thread will be created when user speaks`);
      setMessages([]); // Start with empty messages
    }
  } else {
    logger.info(`No threadId - new session starting`);
    setMessages([]);
  }
```

**Import Changes:**
```typescript
// REMOVE (no longer needed in start function):
import { getOrCreateVoiceThreadAction } from "@/app/api/chat/openai-realtime/actions";

// ADD:
import { chatRepository } from "lib/db/repository";
import { getSession } from "auth/server"; // If not already imported

// KEEP (still needed for persistence callbacks):
import {
  callAppDefaultToolAction,
  persistVoiceMessageAction,
  loadThreadMessagesAction,
} from "@/app/api/chat/openai-realtime/actions";
```

**Note:** The `persistVoiceMessageAction()` function (lines 240-270) already calls `getOrCreateVoiceThreadAction()`, so threads ARE created on first message - we're just removing the premature creation from start().

**Validation:**
```bash
# Test ghost prevention
1. Open voice dialog 10 times
2. Close WITHOUT speaking each time
3. Check sidebar: ✅ No new threads
4. Check DB: ✅ No empty threads in chat_thread table

# Test normal flow
1. Open voice dialog
2. Say: "Create a chart"
3. Verify: ✅ Thread created with first message
4. Check sidebar: ✅ Thread appears with title
```

---

### Phase 2: Fix Text Chat Persistence (35 min)

#### Task 2.1: Create Response Message Builder Helper

**File:** `src/app/api/chat/shared.chat.ts`
**Archon Task ID:** (Created below)
**Location:** Add near other helpers (around line 600)
**Priority:** 🔴 CRITICAL (100)
**Time:** 10 minutes

**Implementation:**
```typescript
/**
 * Build UIMessage from streamText result for database persistence
 * Extracts text and tool parts from completed stream
 *
 * @param result - streamText result object with steps and content
 * @param originalMessage - Original user message for ID fallback
 * @returns UIMessage ready for database persistence
 */
export function buildResponseMessageFromStreamResult(
  result: any, // StreamTextResult from Vercel AI SDK
  originalMessage: UIMessage
): UIMessage {
  const parts: any[] = [];

  // Extract text content from result
  if (result.text && result.text.trim()) {
    parts.push({
      type: "text",
      text: result.text
    });
  }

  // Extract tool calls and results from steps
  if (result.steps && Array.isArray(result.steps)) {
    for (const step of result.steps) {
      // Process tool calls
      if (step.toolCalls && Array.isArray(step.toolCalls)) {
        for (const toolCall of step.toolCalls) {
          const toolPart: any = {
            type: `tool-${toolCall.toolName}`,
            toolCallId: toolCall.toolCallId,
            input: toolCall.args,
            state: "call",
          };
          parts.push(toolPart);
        }
      }

      // Process tool results - update corresponding call parts
      if (step.toolResults && Array.isArray(step.toolResults)) {
        for (const toolResult of step.toolResults) {
          // Find the corresponding call part
          const callPart = parts.find(
            (p) =>
              typeof p === 'object' &&
              p.toolCallId === toolResult.toolCallId
          );

          if (callPart) {
            // Update the existing part with result
            callPart.state = "output-available";
            callPart.output = toolResult.result;
          } else {
            // No call part found - create result part directly
            parts.push({
              type: `tool-${toolResult.toolName}`,
              toolCallId: toolResult.toolCallId,
              input: {}, // No input available if call wasn't found
              state: "output-available",
              output: toolResult.result,
            });
          }
        }
      }
    }
  }

  // Build the response message
  return {
    id: result.id || generateUUID(),
    role: "assistant" as const,
    parts,
  };
}
```

**Export Addition:**
```typescript
// Add to exports at end of file
export {
  // ... existing exports
  buildResponseMessageFromStreamResult,
};
```

**Validation:**
```typescript
// Test with text-only message
const result = { text: "Hello", steps: [] };
const msg = buildResponseMessageFromStreamResult(result, userMessage);
expect(msg.parts).toHaveLength(1);
expect(msg.parts[0].type).toBe("text");

// Test with tool calls
const result = {
  text: "Here's a chart",
  steps: [{
    toolCalls: [{ toolName: "create_chart", toolCallId: "123", args: {...} }],
    toolResults: [{ toolCallId: "123", toolName: "create_chart", result: {...} }]
  }]
};
const msg = buildResponseMessageFromStreamResult(result, userMessage);
expect(msg.parts).toHaveLength(2); // text + tool
```

---

#### Task 2.2: Consolidate onFinish Callbacks

**File:** `src/app/api/chat/route.ts`
**Archon Task ID:** (Created below)
**Lines:** 350-392 (expand), 481-510 (remove)
**Priority:** 🔴 CRITICAL (95)
**Time:** 20 minutes

**Step A: Add Import**
```typescript
// At top of file with other imports from shared.chat
import {
  // ... existing imports
  buildResponseMessageFromStreamResult, // ← ADD THIS
} from "./shared.chat";
```

**Step B: Expand streamText.onFinish (lines 350-392)**

Replace the current onFinish with this comprehensive version:

```typescript
onFinish: async (result) => {
  logger.info("🎯 onFinish START: Processing message persistence + observability", {
    threadId: thread!.id,
    messageId: message.id,
    timestamp: new Date().toISOString(),
  });

  // ============================================
  // PHASE 1: MESSAGE PERSISTENCE (CRITICAL)
  // ============================================
  try {
    logger.info("💾 Building response message from stream result");

    // Build assistant response message from streaming result
    const responseMessage = buildResponseMessageFromStreamResult(result, message);

    logger.info("💾 Persisting messages to database", {
      userMessageId: message.id,
      assistantMessageId: responseMessage.id,
      threadId: thread!.id,
      partCount: responseMessage.parts.length,
    });

    // Persist using existing logic from outer onFinish
    if (responseMessage.id == message.id) {
      // Single message case (response merged with user message)
      await chatRepository.upsertMessage({
        threadId: thread!.id,
        ...responseMessage,
        parts: responseMessage.parts.map(convertToSavePart),
        metadata,
      });
      logger.info("✅ Single merged message persisted");
    } else {
      // Separate messages case (user + assistant)

      // Persist user message
      await chatRepository.upsertMessage({
        threadId: thread!.id,
        role: message.role,
        parts: message.parts.map(convertToSavePart),
        id: message.id,
      });
      logger.info("✅ User message persisted", { id: message.id });

      // Persist assistant message
      await chatRepository.upsertMessage({
        threadId: thread!.id,
        role: responseMessage.role,
        id: responseMessage.id,
        parts: responseMessage.parts.map(convertToSavePart),
        metadata,
      });
      logger.info("✅ Assistant message persisted", { id: responseMessage.id });
    }

    // Update agent timestamp if applicable
    if (agent) {
      await agentRepository.updateAgent(agent.id, session.user.id, {
        updatedAt: new Date(),
      } as any);
      logger.info("✅ Agent timestamp updated", { agentId: agent.id });
    }

    logger.info("✅ MESSAGE PERSISTENCE COMPLETE");

  } catch (persistError) {
    // CRITICAL: Log but don't throw - allow observability to continue
    logger.error("🚨 CRITICAL: Message persistence failed", {
      error: persistError instanceof Error ? persistError.message : String(persistError),
      stack: persistError instanceof Error ? persistError.stack : undefined,
      messageId: message.id,
      threadId: thread!.id,
      userId: session.user.id,
    });

    // Future enhancement: Add retry logic or dead letter queue
    // For now, continue with observability updates
  }

  // ============================================
  // PHASE 2: LANGFUSE OBSERVABILITY
  // ============================================
  logger.info("📊 Updating Langfuse trace metadata");

  try {
    // Comprehensive tool execution summary
    const toolExecutions = result.steps?.flatMap(s => s.toolCalls ?? []);
    const toolResults = result.steps?.flatMap(s => s.toolResults ?? []);

    const executionSummary = {
      totalSteps: result.steps?.length || 0,
      totalToolCalls: toolExecutions?.length || 0,
      totalToolResults: toolResults?.length || 0,
      toolNames: toolExecutions?.map(t => t.toolName) || [],
      completionRate: toolExecutions?.length
        ? (toolResults?.length || 0) / toolExecutions.length
        : 0,
    };

    const mcpToolCount = Object.keys(MCP_TOOLS ?? {}).length;
    const workflowToolCount = Object.keys(WORKFLOW_TOOLS ?? {}).length;
    const appToolCount = Object.keys(APP_DEFAULT_TOOLS ?? {}).length;

    // Update Langfuse trace with detailed tool metadata
    updateActiveObservation({
      output: result.content,
      metadata: {
        toolExecutionSummary: executionSummary,
      },
    });

    updateActiveTrace({
      output: result.content,
      metadata: {
        ...executionSummary,
        mcpToolCount,
        workflowToolCount,
        appToolCount,
        totalToolsAvailable:
          mcpToolCount + workflowToolCount + appToolCount,
      },
    });

    logger.info("✅ Langfuse metadata updated successfully");

  } catch (observabilityError) {
    logger.error("⚠️ Langfuse metadata update failed (non-critical)", {
      error: observabilityError instanceof Error ? observabilityError.message : String(observabilityError),
    });
    // Continue - observability failure shouldn't block response
  }

  // ============================================
  // PHASE 3: CLEANUP
  // ============================================
  logger.info("🏁 Ending OpenTelemetry span");
  trace.getActiveSpan()?.end();

  logger.info("✅ onFinish COMPLETE - All phases executed successfully");
},
```

**Step C: Remove Redundant Outer onFinish (lines 481-510)**

```typescript
// ❌ DELETE THIS ENTIRE BLOCK (lines 481-510):
// onFinish: async ({ responseMessage }) => {
//   if (responseMessage.id == message.id) {
//     await chatRepository.upsertMessage({ ... });
//   } else {
//     await chatRepository.upsertMessage({ ... });
//     await chatRepository.upsertMessage({ ... });
//   }
//   if (agent) {
//     agentRepository.updateAgent({ ... });
//   }
// },

// Keep only:
const stream = createUIMessageStream({
  execute: async ({ writer: dataStream }) => { /* ... */ },
  generateId: generateUUID,
  // ❌ onFinish: REMOVED
  onError: handleError,
  originalMessages: messages,
});
```

**Validation:**
```bash
# Verify persistence works
1. Send message: "Test message"
2. Check database immediately: pnpm db:studio
3. Verify: Message in chat_message table ✅
4. Check message parts: Should have text part ✅

# Verify with tools
1. Send: "Create a bar chart"
2. Check DB: Should have tool call + result parts ✅
3. Verify: parts array has tool-create_bar_chart entry ✅
```

---

### Phase 3: Verify Voice Sidebar & Titles (25 min)

#### Task 3.1: Verify Voice Thread Sidebar Visibility

**File:** `src/components/layouts/app-sidebar-threads.tsx`
**Archon Task ID:** (Created below)
**Lines:** 270-272 (mic icon rendering)
**Priority:** 🟡 MEDIUM (60)
**Time:** 10 minutes (verification + potential fixes)

**Current Implementation:**
```typescript
<div className="flex items-center gap-2 min-w-0">
  {thread.isVoice && (
    <Mic className="h-3 w-3 text-primary flex-shrink-0" />
  )}
  {generatingTitleThreadIds.includes(thread.id) ? (
    <TextShimmer className="truncate min-w-0">
      {thread.title || "New Chat"}
    </TextShimmer>
  ) : (
    <p className="truncate min-w-0">
      {thread.title || "New Chat"}
    </p>
  )}
</div>
```

**Verification Steps:**
```bash
1. Create voice chat with messages
2. Close voice dialog
3. Check sidebar:
   - ✅ Thread appears with mic icon
   - ✅ Thread title shows (or "Voice Chat" default)
   - ✅ Thread is clickable

4. Click voice thread:
   - ✅ Should open voice dialog (auto-detection)
   - ✅ Should load message history
   - ✅ Should restore Canvas charts
```

**If NOT Working - Debug Steps:**
```typescript
// Add debug logging to sidebar component
console.log("Thread data:", {
  id: thread.id,
  title: thread.title,
  isVoice: thread.isVoice,
  messageCount: thread.messages?.length,
});

// Check thread API response
const response = await fetch('/api/thread');
const threads = await response.json();
console.log("Threads from API:", threads);
// Should have isVoice: true for voice threads
```

**Potential Fix (if isVoice missing):**
The thread API query already includes isVoice calculation:
```typescript
// src/lib/db/pg/repositories/chat-repository.pg.ts:91-96
firstMessageSource: sql<string | null>`(
  SELECT metadata->>'source'
  FROM ${ChatMessageSchema}
  WHERE ${ChatMessageSchema.threadId} = ${ChatThreadSchema.id}
  ORDER BY ${ChatMessageSchema.createdAt} ASC
  LIMIT 1
)`.as("first_message_source"),

// Mapped to:
isVoice: row.firstMessageSource === "voice",
```

This should already work! If not, verify the thread API endpoint returns isVoice.

---

#### Task 3.2: Verify Voice Chat Title Generation

**File:** `src/components/chat-bot-voice.tsx`
**Archon Task ID:** (Created below)
**Lines:** 146-184 (endVoiceChat callback)
**Priority:** 🟡 MEDIUM (55)
**Time:** 10 minutes (verification)

**Current Implementation:**
```typescript
const endVoiceChat = useCallback(async () => {
  // Generate title for new voice threads (same logic as text chat)
  if (currentThreadId && messages.length > 0) {
    const prevThread = threadList.find((v) => v.id === currentThreadId);
    const isNewThread =
      !prevThread?.title &&
      messages.filter((v) => v.role === "user" || v.role === "assistant")
        .length < 3;

    if (isNewThread) {
      const part = messages
        .slice(0, 2)
        .flatMap((m) =>
          m.parts
            .filter((v) => v.type === "text")
            .map((p: any) => `${m.role}: ${truncateString(p.text || "", 500)}`),
        );
      if (part.length > 0) {
        generateTitle(part.join("\n\n")); // ← CALLS useGenerateThreadTitle
      }
    } else {
      mutate("/api/thread"); // Refresh sidebar
    }
  }
}, [messages, model, currentThreadId, threadList, generateTitle]);
```

**How It Works:**
1. User closes voice dialog → `endVoiceChat()` runs
2. Checks if thread needs title (< 3 messages, no existing title)
3. Extracts text from first 2 messages
4. Calls `generateTitle()` hook
5. Hook calls `/api/chat/title` to generate smart title
6. Title updates in sidebar via appStore

**Verification:**
```bash
1. Open voice chat
2. Say: "Hello, I need help with data visualization"
3. AI responds
4. Say: "Create a pie chart"
5. Close voice dialog
6. Wait 2-3 seconds for title generation
7. Check sidebar: ✅ Should show generated title (e.g., "Data Visualization Help")
8. NOT "Voice Chat" generic title

# If title shows as "Voice Chat":
- Check console for title generation logs
- Verify /api/chat/title endpoint is working
- Check if generateTitle() is being called
```

**Debug Logging:**
```typescript
// Add to endVoiceChat before generateTitle call
console.log("🏷️ Generating title for voice thread:", {
  threadId: currentThreadId,
  messageCount: messages.length,
  isNewThread,
  hasTitle: !!prevThread?.title,
  firstMessages: part.join("\n\n").substring(0, 100),
});
```

**If Broken - Potential Fix:**
```typescript
// Ensure useGenerateThreadTitle is imported and used
import { useGenerateThreadTitle } from "@/hooks/queries/use-generate-thread-title";

const generateTitle = useGenerateThreadTitle({
  threadId: currentThreadId || "",
});

// Call it in endVoiceChat when closing
if (isNewThread && part.length > 0) {
  generateTitle(part.join("\n\n"));
  logger.info("📝 Title generation triggered for voice thread");
}
```

---

#### Task 3.3: Verify Voice Thread Auto-Detection

**File:** `src/components/chat-bot.tsx`
**Archon Task ID:** (Created below)
**Lines:** 322-338 (voice detection useEffect)
**Priority:** 🟡 MEDIUM (50)
**Time:** 5 minutes (verification)

**Current Implementation:**
```typescript
// Voice thread auto-detection - open voice dialog if thread contains voice messages
useEffect(() => {
  if (initialMessages.length > 0 && isVoiceThread(initialMessages)) {
    console.log("🎤 Voice thread detected - auto-opening voice chat dialog", {
      threadId,
      messageCount: initialMessages.length,
    });

    // Trigger voice chat dialog to open
    appStoreMutate({
      voiceChat: {
        ...appStore.getState().voiceChat,
        isOpen: true,
      },
    });
  }
}, [initialMessages.length, threadId, appStoreMutate]);
```

**Verification:**
```bash
1. Create voice chat with messages
2. Close voice dialog
3. Refresh page
4. Click voice thread in sidebar
5. Verify: ✅ Voice dialog opens automatically
6. Verify: ✅ Messages load in voice UI
7. Verify: ✅ Canvas charts restore (if any)
```

**If NOT Working:**
```typescript
// Add debug logging
console.log("Voice thread detection:", {
  hasMessages: initialMessages.length > 0,
  isVoice: isVoiceThread(initialMessages),
  firstMessageMetadata: initialMessages[0]?.metadata,
  source: initialMessages[0]?.metadata?.source,
});

// Verify isVoiceThread utility works
import { isVoiceThread } from "lib/utils/voice-thread-detector";
const result = isVoiceThread([
  { metadata: { source: "voice" }, parts: [] }
]);
console.log("isVoiceThread result:", result); // Should be true
```

---

### Phase 4: Comprehensive Validation (25 min)

#### Task 4.1: Text Chat Validation Suite

**Archon Task ID:** (Created below)
**Priority:** 🟢 MEDIUM (70)
**Time:** 10 minutes

**Test Scenarios:**

```bash
# Scenario 1: Basic Persistence
1. pnpm dev
2. Navigate to http://localhost:3000
3. Send message: "Hello, test message"
4. Open DB: pnpm db:studio
5. Navigate to chat_message table
6. Verify: ✅ Message with text part exists
7. Verify: ✅ threadId matches current thread
8. Verify: ✅ role = "user"

# Scenario 2: History Restoration
1. Send 5 messages back and forth
2. Refresh page (Cmd+R)
3. Verify: ✅ All 10 messages load (5 user + 5 assistant)
4. Verify: ✅ Conversation continuity maintained
5. Verify: ✅ No console errors

# Scenario 3: Tool Call Persistence
1. Send: "Create a bar chart with Q1 sales data"
2. Verify: ✅ Chart appears in Canvas
3. Check DB: chat_message table
4. Verify: ✅ Tool call part saved (type: "tool-create_bar_chart")
5. Verify: ✅ Tool output saved in part
6. Refresh page
7. Verify: ✅ Chart restored from persisted data

# Scenario 4: Multi-Tool Persistence
1. Send: "Create 3 different charts"
2. Verify: ✅ All 3 charts appear
3. Check DB: ✅ All 3 tool calls persisted
4. Refresh: ✅ All 3 charts restore correctly
```

---

#### Task 4.2: Voice Chat Validation Suite

**Archon Task ID:** (Created below)
**Priority:** 🟢 MEDIUM (65)
**Time:** 10 minutes

**Test Scenarios:**

```bash
# Scenario 1: Ghost Thread Prevention
1. Open voice dialog 10 times
2. Close WITHOUT speaking each time
3. Check sidebar: ✅ No new threads appear
4. Check DB (chat_thread table): ✅ No new empty threads
5. Verify count didn't increase

# Scenario 2: Normal Voice Chat Flow
1. Open voice dialog
2. Say: "Hello, I need a pie chart showing sales by region"
3. Verify: ✅ Thread created in DB (first message triggers)
4. Verify: ✅ Messages persisted with source: "voice"
5. Close dialog
6. Check sidebar: ✅ Thread appears with mic icon
7. Wait 3 seconds: ✅ Title generates (not "Voice Chat")
8. Refresh page
9. Click voice thread: ✅ Voice dialog opens
10. Verify: ✅ Message history loads
11. Verify: ✅ Can continue conversation

# Scenario 3: Voice Title Generation
1. Open voice chat
2. Have brief conversation (2-3 exchanges)
3. Generate a chart
4. Close voice dialog
5. Observe sidebar title updates
6. Verify: ✅ Title reflects conversation topic
7. Verify: ✅ NOT generic "Voice Chat" title

# Scenario 4: Voice Thread Reopening
1. Create voice chat with 5 messages + 2 charts
2. Close voice dialog
3. Refresh browser
4. Check sidebar: ✅ Voice thread with mic icon
5. Click thread: ✅ Voice dialog opens
6. Verify: ✅ All 5 messages load
7. Verify: ✅ Both charts restore in Canvas
8. Say: "What did we discuss?"
9. Verify: ✅ AI responds with context (knows previous conversation)
```

---

#### Task 4.3: Langfuse Observability Validation

**Archon Task ID:** (Created below)
**Priority:** 🟢 MEDIUM (60)
**Time:** 5 minutes

**Test Scenarios:**

```bash
# Verify Langfuse Still Works After Fix
1. Send 3 text messages with chart tools
2. Open Langfuse dashboard: https://cloud.langfuse.com
3. Navigate to "Sessions" tab
4. Find session by threadId or userId
5. Verify: ✅ All 3 messages appear as traces
6. Verify: ✅ Grouped by sessionId correctly
7. Verify: ✅ Tool execution counts accurate
8. Verify: ✅ Token usage metrics present
9. Verify: ✅ Cost calculations correct
10. Verify: ✅ Agent name in trace if agent used

# Check trace metadata
1. Click into a trace
2. Verify metadata includes:
   - toolExecutionSummary ✅
   - mcpToolCount ✅
   - workflowToolCount ✅
   - appToolCount ✅
   - environment tag ✅
```

---

## Integration Points

### Database Layer

**Repository Pattern (Unchanged):**
```typescript
await chatRepository.upsertMessage({
  threadId: string,
  id: string,
  role: "user" | "assistant",
  parts: MessagePart[],
  metadata?: any,
});
```

**Schema (No Changes Needed):**
- ChatThreadSchema: id, title, userId, createdAt
- ChatMessageSchema: id, threadId, role, parts (JSONB), metadata (JSONB)

**Voice Detection Query (Already Implemented):**
```sql
-- In selectThreadsByUserId
firstMessageSource: (
  SELECT metadata->>'source'
  FROM chat_message
  WHERE thread_id = chat_thread.id
  ORDER BY created_at ASC
  LIMIT 1
)

-- Mapped to isVoice boolean for sidebar rendering
```

---

### Canvas Integration

**Real-Time Streaming (Unchanged):**
```typescript
// src/app/api/chat/route.ts:322-348
onStepFinish: async ({ stepResult }) => {
  if (stepResult.toolResults?.length > 0) {
    for (const toolResult of stepResult.toolResults) {
      dataStream.write({
        type: "tool-result",
        toolName: toolResult.toolName,
        result: toolResult.result,
      });
    }
  }
},
```

**Status:** ✅ Works perfectly - NO CHANGES

---

### Voice Chat System

**Persistence (Unchanged):**
```typescript
// src/app/api/chat/openai-realtime/actions.ts
export async function persistVoiceMessageAction(message) {
  await getOrCreateVoiceThreadAction(message.threadId); // ← Creates thread
  await chatRepository.upsertMessage({ ... });
}
```

**Status:** ✅ Correct pattern - thread created on first message

**Thread Loading (Fixed):**
```typescript
// use-voice-chat.openai.ts - start() function
// BEFORE: getOrCreateVoiceThreadAction() - creates ghost threads
// AFTER: selectThreadDetails() - read-only check
```

---

## File Change Summary

### Modified Files (3)

1. **`src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`**
   - Lines 174-182: Update start() function
   - Change: getOrCreateVoiceThreadAction → selectThreadDetails
   - Import changes: Add chatRepository, remove getOrCreate from start
   - Risk: LOW (simple read-only check)

2. **`src/app/api/chat/shared.chat.ts`**
   - Location: Around line 625 (after convertToSavePart)
   - Add: buildResponseMessageFromStreamResult() helper (~50 lines)
   - Export: Add to exports list
   - Risk: LOW (pure function, well-typed)

3. **`src/app/api/chat/route.ts`**
   - Lines 350-392: Expand streamText.onFinish (~100 lines)
   - Lines 481-510: Remove redundant outer onFinish (~30 lines deleted)
   - Import: Add buildResponseMessageFromStreamResult
   - Risk: MEDIUM (critical path, but well-tested pattern)

**Total:** 3 files, ~120 lines added, ~30 lines removed, net +90 lines

---

## Validation Gates

### Automated Tests

```bash
# TypeScript & Linting
pnpm check-types          # Must pass - type safety
pnpm lint                 # Must pass - code quality

# Unit Tests
pnpm test                 # Must pass - business logic

# Build Validation
pnpm build:local          # Must pass - production readiness

# Expected Results:
All checks should pass with no errors related to:
- route.ts
- shared.chat.ts
- use-voice-chat.openai.ts
- chat-bot-voice.tsx
- app-sidebar-threads.tsx
```

### Manual Functional Tests

```bash
# Text Chat Persistence (CRITICAL)
✓ Send message → Persists to DB
✓ Refresh page → History loads
✓ Tool calls → Parts saved correctly
✓ Multi-tool → All tools persisted

# Voice Ghost Prevention (CRITICAL)
✓ Open/close without speaking → No thread
✓ First message → Thread created
✓ No sidebar pollution

# Voice Sidebar (VERIFICATION)
✓ Voice threads show mic icon
✓ Threads clickable
✓ Auto-open voice dialog on click
✓ History loads correctly

# Voice Titles (VERIFICATION)
✓ Titles generate on close
✓ Smart titles (not generic)
✓ Titles appear in sidebar
✓ Title generation animation works

# Langfuse (CRITICAL)
✓ Traces appear in dashboard
✓ SessionId grouping works
✓ Tool metrics accurate
✓ Token usage tracked
```

### Health Checks

```bash
# System Health
curl -f http://localhost:3000/api/health/langfuse

# Expected:
# {"status":"healthy","langfuse":{"configured":true}}

# Database Check
pnpm db:studio

# Verify tables:
- chat_thread (should have both text and voice threads)
- chat_message (should have all persisted messages)
- Check isVoice detection works (first message metadata)
```

---

## Known Issues & Gotchas

### Issue 1: createUIMessageStream.onFinish Reliability

**From Vercel AI SDK GitHub (Issue #7469):**
- `onFinish` from `createUIMessageStream` not reliably called
- Especially problematic when streams aborted
- `toUIMessageStreamResponse.onFinish` more reliable

**Our Solution:**
- Move persistence to `streamText.onFinish` (always executes)
- Execute BEFORE span termination
- More reliable than outer createUIMessageStream.onFinish

---

### Issue 2: Voice Thread Detection Timing

**Edge Case:**
If thread API response doesn't include first message metadata, `isVoice` flag won't work.

**Verification:**
```typescript
// Check thread API response
const threads = await fetch('/api/thread').then(r => r.json());
console.log(threads[0]);
// Should have: { id, title, isVoice: boolean, ... }
```

**If Missing:**
The selectThreadsByUserId query should already include:
```sql
firstMessageSource: (SELECT metadata->>'source' FROM chat_message WHERE ...)
```

This was implemented in prp-thread-api-query-optimization.md. If missing, that PRP wasn't fully implemented.

---

### Issue 3: Title Generation Timing

**Gotcha:**
Title generation is ASYNC and happens AFTER voice dialog closes. Users might see "Voice Chat" for 1-2 seconds before real title appears.

**Expected Behavior:**
1. Close voice dialog → endVoiceChat() runs
2. Immediately: Sidebar shows "Voice Chat" (default)
3. 1-2 seconds later: Title generates via AI
4. Sidebar updates with smart title

**Not a Bug:**
This is expected behavior. The shimmer animation indicates loading.

---

## Anti-Patterns to Avoid

❌ **Don't** remove Langfuse integration - Essential for production
❌ **Don't** remove onStepFinish callback - Canvas streaming needs it
❌ **Don't** modify voice persistence logic - Already works correctly
❌ **Don't** change database schema - Current schema perfect
❌ **Don't** add caching layers - Unnecessary complexity
❌ **Don't** create new thread APIs - Current API has isVoice
❌ **Don't** over-engineer title generation - Current pattern works

✅ **Do** consolidate callbacks for text chat persistence
✅ **Do** implement lazy thread creation for voice
✅ **Do** verify voice sidebar features work (likely already functional)
✅ **Do** add comprehensive logging for debugging
✅ **Do** test all systems thoroughly

---

## Success Criteria

### Text Chat Persistence
- [ ] Messages save to database immediately after sending
- [ ] History loads on page refresh
- [ ] Tool calls persisted with outputs
- [ ] Conversation continuity maintained

### Voice Ghost Prevention
- [ ] No threads created on dialog open without speaking
- [ ] Threads created ONLY on first message
- [ ] Sidebar clean of empty threads
- [ ] Database free of 0-message threads

### Voice Sidebar Visibility
- [ ] Voice threads show mic icon in sidebar
- [ ] isVoice flag correctly set (from first message metadata)
- [ ] Threads clickable and navigable
- [ ] Auto-open voice dialog on thread click

### Voice Title Generation
- [ ] Titles generate when closing voice dialog
- [ ] Smart AI-generated titles (not generic "Voice Chat")
- [ ] Title generation animation works
- [ ] Titles persist in database and sidebar

### Langfuse Observability
- [ ] Traces appear in dashboard within 30 seconds
- [ ] SessionId groups conversations correctly
- [ ] Tool execution metrics accurate
- [ ] Token usage and costs tracked

### Canvas Integration
- [ ] Real-time chart streaming works
- [ ] onStepFinish fires for tool results
- [ ] Charts persist and restore
- [ ] No regression in Canvas functionality

---

## Archon Project & Task Tracking

**Project ID:** `d9451681-711b-4cf4-b6b0-d91ee1e5a49c`
**Project Name:** Chat Persistence & Sidebar Fixes (Text + Voice)

### Tasks Created (9 Total)

**Quick Access:**
```bash
# List all tasks
mcp__archon__find_tasks(filter_by="project", filter_value="d9451681-711b-4cf4-b6b0-d91ee1e5a49c")

# Start task
mcp__archon__manage_task("update", task_id="<task-id>", status="doing")

# Complete task
mcp__archon__manage_task("update", task_id="<task-id>", status="review", assignee="QA")
```

#### Phase 1: Voice Ghost Thread Fix (1 task)

1. **Fix voice chat ghost thread creation (lazy creation pattern)**
   - **ID:** `c2a89e01-03c0-4d9d-a219-ec241cd612c9`
   - **Priority:** 100 (High)
   - **Assignee:** Coding Agent
   - **Time:** 5 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="c2a89e01-03c0-4d9d-a219-ec241cd612c9")`

#### Phase 2: Text Chat Persistence (2 tasks)

2. **Create buildResponseMessageFromStreamResult helper function**
   - **ID:** `a804117f-730b-4af5-a4fd-2642f89abc05`
   - **Priority:** 95 (High)
   - **Assignee:** Coding Agent
   - **Time:** 10 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="a804117f-730b-4af5-a4fd-2642f89abc05")`

3. **Consolidate onFinish callbacks in chat route**
   - **ID:** `ea91437b-87b5-4428-9c75-ff76bdc803b5`
   - **Priority:** 90 (High)
   - **Assignee:** Coding Agent
   - **Time:** 20 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="ea91437b-87b5-4428-9c75-ff76bdc803b5")`

#### Phase 3: Voice Verification (3 tasks)

4. **Verify voice thread sidebar visibility works correctly**
   - **ID:** `dc571634-ec85-456b-ba4b-774104d938fc`
   - **Priority:** 60 (Medium)
   - **Assignee:** QA
   - **Time:** 10 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="dc571634-ec85-456b-ba4b-774104d938fc")`

5. **Verify voice chat title generation works correctly**
   - **ID:** `c66c5348-dd9e-44eb-8178-bff163007b4f`
   - **Priority:** 55 (Medium)
   - **Assignee:** QA
   - **Time:** 10 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="c66c5348-dd9e-44eb-8178-bff163007b4f")`

6. **Verify voice thread auto-detection works correctly**
   - **ID:** `a7c58158-62c2-4f13-8638-3e67705608bb`
   - **Priority:** 50 (Medium)
   - **Assignee:** QA
   - **Time:** 5 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="a7c58158-62c2-4f13-8638-3e67705608bb")`

#### Phase 4: Validation (3 tasks)

7. **Text chat persistence validation suite**
   - **ID:** `b6c5c8b9-ee7f-47ac-b3d8-78ec4760ede2`
   - **Priority:** 70 (Medium)
   - **Assignee:** QA
   - **Time:** 10 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="b6c5c8b9-ee7f-47ac-b3d8-78ec4760ede2")`

8. **Voice chat complete validation suite**
   - **ID:** `37798048-6c3b-442d-812a-53c2ddd18387`
   - **Priority:** 65 (Medium)
   - **Assignee:** QA
   - **Time:** 10 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="37798048-6c3b-442d-812a-53c2ddd18387")`

9. **Langfuse observability validation**
   - **ID:** `eb31c929-94dd-454f-9e98-04aa96c30e53`
   - **Priority:** 60 (Medium)
   - **Assignee:** QA
   - **Time:** 5 minutes
   - **Retrieve:** `mcp__archon__find_tasks(task_id="eb31c929-94dd-454f-9e98-04aa96c30e53")`

---

## Expected Outcomes

### Text Chat Restoration
**Before:**
- ❌ Messages not saved (0% persistence rate)
- ❌ History lost on refresh
- ❌ Production unusable

**After:**
- ✅ Messages saved immediately (100% persistence rate)
- ✅ History restored reliably
- ✅ Production ready

### Voice Chat Cleanup
**Before:**
- ❌ Ghost threads on every accidental open
- ❌ Sidebar cluttered with empties
- ❌ Database pollution

**After:**
- ✅ No ghost threads created
- ✅ Clean sidebar (only real conversations)
- ✅ Clean database

### Voice Sidebar Features (Verification)
**Expected (Should Already Work):**
- ✅ Voice threads show mic icon in sidebar
- ✅ Smart AI-generated titles (not generic)
- ✅ Clicking thread opens voice dialog
- ✅ History loads correctly

### Langfuse Observability
**Expected (Should Continue Working):**
- ✅ Traces appear in dashboard
- ✅ SessionId grouping functional
- ✅ Tool metrics accurate
- ✅ Cost tracking operational

---

## References & Documentation

### Vercel AI SDK
- **Message Persistence:** https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
- **streamText Reference:** https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- **Known Issues:** https://github.com/vercel/ai/issues/7469 (onFinish execution reliability)

### Langfuse Integration
- **OpenTelemetry:** https://langfuse.com/docs/integrations/opentelemetry
- **Vercel AI SDK:** https://langfuse.com/docs/integrations/vercel-ai-sdk
- **Project Guide:** `docs/langfuse-vercel-ai-sdk-integration.md`

### Codebase Patterns
- **Text chat persistence (broken):** `src/app/api/chat/route.ts:481-510`
- **Voice chat persistence (working):** `src/app/api/chat/openai-realtime/actions.ts:240-270`
- **Canvas streaming (working):** `src/app/api/chat/route.ts:322-348`
- **Title generation:** `src/hooks/queries/use-generate-thread-title.ts`
- **Voice sidebar:** `src/components/layouts/app-sidebar-threads.tsx:270-272`
- **Voice detection:** `src/lib/utils/voice-thread-detector.ts`

---

## PRP Confidence Assessment

### Implementation Confidence: 9/10

**High Confidence (+9):**
- ✅ Root causes clearly identified (nested callbacks + premature thread creation)
- ✅ Solutions straightforward (consolidate + lazy creation)
- ✅ All code patterns proven (voice persistence works, Canvas works)
- ✅ Voice sidebar features likely already working (verification only)
- ✅ Clear validation strategy
- ✅ Easy rollback plan
- ✅ Web research confirms approach
- ✅ Archon tasks created for tracking

**Minor Uncertainty (-1):**
- Building responseMessage from result.steps (10% chance of edge cases)

**Mitigation:**
- Comprehensive logging at each step
- Test multiple message types (text, tools, multi-tool)
- Fallback error handling

### One-Pass Success Probability: 85%

**Success Factors:**
- Well-understood problems
- Proven patterns to follow
- Clear implementation path
- Comprehensive validation

---

**Document Status:** ✅ Ready for Implementation
**Initial Reference:** `PRPs/cc-prp-initials/initial-text-chat-persistence-langfuse-fix.md`
**PRP Quality Score:** 9/10
**Estimated Time:** 90 minutes total
**Risk Level:** LOW (code consolidation + verification)
**Business Impact:** CRITICAL (restores production functionality)

---

## Quick Start Commands

**Start Implementation:**
```bash
# Task 1: Fix ghost threads
mcp__archon__manage_task("update", task_id="c2a89e01-03c0-4d9d-a219-ec241cd612c9", status="doing")

# Task 2: Build helper
mcp__archon__manage_task("update", task_id="a804117f-730b-4af5-a4fd-2642f89abc05", status="doing")

# Task 3: Consolidate callbacks
mcp__archon__manage_task("update", task_id="ea91437b-87b5-4428-9c75-ff76bdc803b5", status="doing")
```

**All Task IDs (Copy-Paste Ready):**
- **Ghost Thread Fix:** `c2a89e01-03c0-4d9d-a219-ec241cd612c9`
- **Helper Function:** `a804117f-730b-4af5-a4fd-2642f89abc05`
- **Callback Consolidation:** `ea91437b-87b5-4428-9c75-ff76bdc803b5`
- **Sidebar Verification:** `dc571634-ec85-456b-ba4b-774104d938fc`
- **Title Verification:** `c66c5348-dd9e-44eb-8178-bff163007b4f`
- **Auto-Detection Verification:** `a7c58158-62c2-4f13-8638-3e67705608bb`
- **Text Validation:** `b6c5c8b9-ee7f-47ac-b3d8-78ec4760ede2`
- **Voice Validation:** `37798048-6c3b-442d-812a-53c2ddd18387`
- **Langfuse Validation:** `eb31c929-94dd-454f-9e98-04aa96c30e53`
