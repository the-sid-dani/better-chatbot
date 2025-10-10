# PRP: Voice Chat Tool Routing & Persistence Fixes

**Feature:** Voice Chat Tool Execution, Message Persistence, and Conversation History
**Status:** Ready for Implementation
**Priority:** 🔴 CRITICAL
**Complexity:** Medium (pragmatic fixes, no over-engineering)
**Estimated Time:** 4-6 hours (3 focused phases)

**Archon Project ID:** `ca10e121-be60-4c7f-aab1-768f1e5a6d05`
**Retrieve Project:** `mcp__archon__find_projects(project_id="ca10e121-be60-4c7f-aab1-768f1e5a6d05")`
**View All Tasks:** `mcp__archon__find_tasks(filter_by="project", filter_value="ca10e121-be60-4c7f-aab1-768f1e5a6d05")`

---

## Executive Summary

### Problem Statement

Voice chat feature is **critically broken** in three ways, making it unusable for core functionality:

1. **Tool Routing Failure:** Users get `"Client create not found"` errors when requesting charts, code execution, or web searches via voice
2. **No Persistence:** All voice conversations stored in React state only - lost on page refresh
3. **No History:** Cannot resume previous voice conversations with context

**Visual Evidence:**
- ❌ Voice: "Create a pie chart" → Error: "Client create not found"
- ✅ Text: "Create a pie chart" → Chart renders successfully
- ❌ Voice conversation → Refresh → All history gone
- ✅ Text conversation → Refresh → History preserved

### Root Cause

**Issue 1: Incorrect Tool Routing (Lines 234-240)**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
else {
  // ❌ FALSE ASSUMPTION: Everything not voice-specific is MCP
  const toolId = extractMCPToolId(toolName);
  // Splits "create_pie_chart" → {serverName: "create", toolName: "pie_chart"}
  toolResult = await callMcpToolByServerNameAction(
    toolId.serverName, // "create" ❌ Not an MCP server!
    toolId.toolName,   // "pie_chart" ❌ Wrong tool name!
    toolArgs,
  );
}
```

**Issue 2: Missing Persistence Layer**
- No `chatRepository.upsertMessage()` calls anywhere in voice chat code
- Text chat: 3 persistence calls at `src/app/api/chat/route.ts:483-502`
- Voice chat: 0 persistence calls (React state only)

**Issue 3: No Thread Management**
- Voice chat hook has no threadId parameter or state
- Text chat: Full thread management with database integration
- Voice chat: Ephemeral sessions only

### Solution Approach

**3-phase pragmatic fix (reuse existing patterns, no over-engineering):**

**Phase 1 (1.5 hours):** Fix tool routing with 3-tier logic (voice → app default → MCP)
**Phase 2 (2 hours):** Add message persistence via server actions
**Phase 3 (1.5 hours):** Simple conversation history loading (last 20 messages)

**NOT building:** Audio storage, advanced summarization, parallel thread systems, complex context management

### Success Criteria

**Phase 1:**
- ✅ Chart tools work in voice mode (0% → 100% success rate)
- ✅ Code execution works in voice mode
- ✅ Web search works in voice mode
- ✅ MCP tools continue working

**Phase 2:**
- ✅ Voice messages persisted to database
- ✅ Conversation history survives page refresh
- ✅ Voice transcripts searchable

**Phase 3:**
- ✅ Voice chat resumes with last 20 messages of context
- ✅ Natural conversation flow
- ✅ OpenAI has full conversation history

---

## 🚨 CRITICAL ISSUES DISCOVERED DURING QA (2025-10-09)

### QA Finding #1: Missing `await` Statements on Persistence Calls (BLOCKER)

**Severity:** 🔴 CRITICAL - Data Loss Risk
**Status:** ❌ MUST BE FIXED BEFORE PHASE 4
**Discovered By:** Quinn (QA Agent) during Phase 1-3 review
**Archon Task:** `fdea07b4-0bcc-4779-a7be-860326f23181`

**Problem:**
All three `persistVoiceMessageAction()` calls in `use-voice-chat.openai.ts` are fire-and-forget (NOT awaited), creating race conditions that can result in data loss.

**Evidence:**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts

// ❌ Line 425 - User message persistence (NO await)
persistVoiceMessageAction({
  threadId,
  id: event.item_id,
  role: "user",
  parts: [{ type: "text", text: transcript }],
  metadata: { voice, source: "voice" },
});

// ❌ Line 487 - Assistant message persistence (NO await)
persistVoiceMessageAction({
  threadId,
  id: event.item_id,
  role: "assistant",
  parts: [{ type: "text", text: assistantTranscript }],
  metadata: { source: "voice" },
});

// ❌ Line 304 - Tool call persistence (NO await)
persistVoiceMessageAction({
  threadId,
  id: id,
  role: "assistant",
  parts: [{ /* tool output */ }],
  metadata: { source: "voice" },
});
```

**Impact:**
- **Data Loss:** Messages may not save if user closes chat quickly
- **Race Conditions:** Database writes racing with session cleanup
- **Silent Failures:** Errors not caught or logged
- **Unreliable History:** Cannot guarantee message persistence
- **Production Risk:** Intermittent data loss difficult to debug

**Required Fix:**
```typescript
// Add await to all 3 calls:
await persistVoiceMessageAction({...});  // ✅ CORRECT

// Wrap in try/catch for error handling:
try {
  await persistVoiceMessageAction({...});
} catch (error) {
  logger.error('Failed to persist voice message:', error);
  // Optional: Show user notification
}
```

**Task 4.0 (BLOCKER):** Fix must be completed before Phase 4 tasks can begin.

---

### QA Finding #2: Voice Thread Navigation Not Implemented

**Severity:** 🟡 HIGH - Feature Gap
**Status:** ❌ NOT COVERED IN PHASES 1-3
**Discovered By:** User feedback + QA analysis

**Problem:**
Voice chats ARE persisted to database and DO appear in sidebar, but clicking them does NOTHING. No way to reopen/resume voice chat sessions.

**Current Flow:**
1. User clicks "Voice Chat" in sidebar
2. Navigates to `/chat/[threadId]`
3. Loads `ChatBot` component (text-only UI)
4. Shows text interface with voice transcripts (broken UX)

**What's Needed:**
- Voice thread detection on mount
- Auto-open voice chat dialog for voice threads
- Load messages into voice UI (compact mode)
- Restore Canvas artifacts from history

**Solution:** Implemented in Phase 4 (6 tasks)

---

### QA Finding #3: Canvas Restoration Already Works (Positive Finding!)

**Status:** ✅ IMPLEMENTED
**Location:** `src/components/chat-bot-voice.tsx:148-257`

**Verification:**
- ChatBotVoice DOES process ALL historical messages
- Canvas artifacts ARE recreated from tool outputs in message parts
- Duplicate prevention works correctly
- Same pattern as text chat

**No action needed** - just validation testing (Task 4.4)

---

## Technical Context

### Technology Stack

- **Voice API:** OpenAI Realtime API (gpt-realtime model)
- **Transport:** WebRTC (audio) + DataChannel (events)
- **Frontend:** React hooks (`use-voice-chat.openai.ts`)
- **Backend:** Next.js server routes + server actions
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better-Auth sessions

### Architecture Overview

#### Current Flow (Broken)

```
User Voice → WebRTC → OpenAI Realtime → Tool Call
                ↓                           ↓
         React State ONLY      extractMCPToolId(toolName)
                                          ↓
         ❌ NOT persisted      callMcpToolByServerNameAction
         ❌ Lost on refresh        ↓
         ❌ No history        Error: "Client create not found"
```

#### Target Flow (Fixed)

```
User Voice → WebRTC → OpenAI Realtime → Tool Call
                ↓                           ↓
         React State           3-Tier Routing:
                ↓               1. Voice tools?
    persistVoiceMessageAction  2. App default tools? ✅
         ↓                      3. MCP tools?
    Database                       ↓
         ↓              callAppDefaultToolAction
    loadThreadMessages         ↓
         ↓              Async Generator Consumption
    conversation.item.create    ↓
         ↓              Chart/Code/Search Result ✅
    Full Context              ↓
                       persistVoiceMessageAction
                              ↓
                          Database ✅
```

### Key Integration Points

1. **Tool Execution Layer**
   - Server-side tool loading: `/api/chat/openai-realtime/route.ts`
   - Client-side tool routing: `use-voice-chat.openai.ts`
   - Tool registry: `APP_DEFAULT_TOOL_KIT` in `tool-kit.ts`

2. **Persistence Layer (NEW)**
   - Server actions: `/api/chat/openai-realtime/actions.ts` (NEW)
   - Database: `chatRepository` from `src/lib/db/repository.ts`
   - Schema: `ChatMessageSchema` (NO CHANGES NEEDED)

3. **History Layer (NEW)**
   - Loading: `loadThreadMessagesAction()` server action
   - Sending: `conversation.item.create` OpenAI events
   - Timing: BEFORE `session.update` configuration

4. **Thread Management**
   - Source: `appStore.currentThreadId`
   - Fallback: Generate new UUID if none exists
   - Integration: Shared with text chat

---

## Research Findings

### Discovery 1: Tools Already Loaded Server-Side

**Critical Finding from Codebase Analysis:**

```typescript
// src/app/api/chat/openai-realtime/route.ts:104-124
const appDefaultTools = await loadAppDefaultTools({
  allowedAppDefaultToolkit,
});

const appToolsForOpenAI = Object.entries(appDefaultTools).map(
  ([name, tool]) => vercelAIToolToOpenAITool(tool, name)
);

const bindingTools = [
  ...openAITools,        // MCP tools
  ...appToolsForOpenAI,  // ✅ Charts ARE loaded!
  ...DEFAULT_VOICE_TOOLS,
];
```

**Implication:**
- ✅ Chart tools ARE being sent to OpenAI
- ✅ OpenAI CAN and DOES call them
- ❌ Problem is CLIENT-SIDE execution routing only
- ✅ Fix is simpler than expected (routing logic, not tool loading)

---

### Discovery 2: APP_DEFAULT_TOOL_KIT Structure

**From `src/lib/ai/tools/tool-kit.ts` Analysis:**

```typescript
export const APP_DEFAULT_TOOL_KIT = {
  [AppDefaultToolkit.WebSearch]: {
    [DefaultToolName.WebSearch]: exaSearchTool,
    [DefaultToolName.WebContent]: exaContentsTool,
  },
  [AppDefaultToolkit.Http]: {
    [DefaultToolName.Http]: httpFetchTool,
  },
  [AppDefaultToolkit.Code]: {
    [DefaultToolName.JavascriptExecution]: jsExecutionTool,
    [DefaultToolName.PythonExecution]: pythonExecutionTool,
  },
  [AppDefaultToolkit.Artifacts]: {
    // 16 chart tools (15 active + 1 commented out)
    [DefaultToolName.CreateBarChart]: barChartArtifactTool,
    [DefaultToolName.CreateLineChart]: lineChartArtifactTool,
    [DefaultToolName.CreatePieChart]: pieChartArtifactTool,
    [DefaultToolName.CreateTable]: tableArtifactTool,
    // ... 12 more chart tools
  },
};
```

**Tool Names for Routing:**
- Charts: `create_bar_chart`, `create_line_chart`, `create_pie_chart`, etc. (16 total)
- Code: `mini-javascript-execution`, `python-execution`
- Web: `webSearch`, `webContent`
- HTTP: `http`

**Total: 21 app default tools**

---

### Discovery 3: Text Chat Persistence Pattern

**From `src/app/api/chat/route.ts:483-502`:**

```typescript
onFinish: async ({ responseMessage }) => {
  if (responseMessage.id == message.id) {
    await chatRepository.upsertMessage({
      threadId: thread!.id,
      ...responseMessage,
      parts: responseMessage.parts.map(convertToSavePart),
      metadata,
    });
  } else {
    await chatRepository.upsertMessage({
      threadId: thread!.id,
      role: message.role,
      parts: message.parts.map(convertToSavePart),
      id: message.id,
    });
    await chatRepository.upsertMessage({
      threadId: thread!.id,
      role: responseMessage.role,
      id: responseMessage.id,
      parts: responseMessage.parts.map(convertToSavePart),
      metadata,
    });
  }
}
```

**Pattern to Replicate:**
- Use `chatRepository.upsertMessage()`
- Convert parts via `convertToSavePart()` (or direct for voice)
- Include metadata for tracking
- Await completion before proceeding

---

### Discovery 4: Server Action Pattern

**From `src/app/api/chat/actions.ts:1-44`:**

```typescript
"use server";

import { chatRepository } from "lib/db/repository";
import { getSession } from "auth/server";

export async function someAction() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not found");
  }

  // Perform database operation
  await chatRepository.someMethod();
}
```

**Pattern for Voice Chat:**
- Add `"use server"` directive
- Import `chatRepository` from `"lib/db/repository"`
- Validate session for security
- Wrap database operations
- Export for client-side use

---

### Discovery 5: OpenAI Realtime API Patterns (Web Research 2025)

**From OpenAI Platform Documentation:**

**conversation.item.create Structure:**
```javascript
// Text message
{
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user", // or "assistant"
    content: [
      {
        type: "input_text",  // user messages
        // type: "text",     // assistant messages
        text: "Message content here"
      }
    ]
  }
}

// Function call
{
  type: "conversation.item.create",
  item: {
    type: "function_call",
    name: "create_pie_chart",
    call_id: "call_abc123",
    arguments: "{\"title\":\"Sales\",...}"
  }
}

// Function output
{
  type: "conversation.item.create",
  item: {
    type: "function_call_output",
    call_id: "call_abc123",
    output: "{\"success\":true,...}"
  }
}
```

**Critical Constraints:**
- ✅ Text messages: Fully supported
- ❌ Audio messages: NOT supported (must use transcripts)
- ✅ Tool calls: Supported
- ⚠️ Must send BEFORE `session.update`
- ⚠️ Max 128k token context window

---

## Implementation Plan

### Phase 1: Tool Routing Fix (1.5 hours)

**Goal:** Enable chart, code, and web search tools in voice mode

#### Task 1.1: Create Tool Execution Server Action
**File:** `src/app/api/chat/openai-realtime/actions.ts` (NEW)
**Archon Task ID:** `744cd163-8a2d-4ba8-82d4-79ca28441a85`
**Priority:** 🔴 CRITICAL (100)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="744cd163-8a2d-4ba8-82d4-79ca28441a85")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="744cd163-8a2d-4ba8-82d4-79ca28441a85", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="744cd163-8a2d-4ba8-82d4-79ca28441a85", status="review", assignee="QA")`

**Implementation:**
```typescript
"use server";

import { APP_DEFAULT_TOOL_KIT } from "lib/ai/tools/tool-kit";
import { AppDefaultToolkit } from "app-types/tool-kit";
import logger from "lib/logger";

/**
 * Execute app default tools (charts, code, web search) from voice chat
 * Handles both async generators (chart tools) and regular async functions
 */
export async function callAppDefaultToolAction(
  toolName: string,
  args: any
) {
  try {
    logger.info(`Voice chat calling app default tool: ${toolName}`);

    // Search across all toolkits for the tool
    let tool = null;
    let toolkitName = "";

    for (const [toolkit, tools] of Object.entries(APP_DEFAULT_TOOL_KIT)) {
      if (toolName in tools) {
        tool = tools[toolName];
        toolkitName = toolkit;
        break;
      }
    }

    if (!tool) {
      logger.error(`App default tool not found: ${toolName}`);
      throw new Error(`Tool ${toolName} not found in APP_DEFAULT_TOOL_KIT`);
    }

    logger.info(`Executing tool from toolkit: ${toolkitName}`);

    // Execute the tool
    const result = tool.execute(args);

    // Check if it's an async generator (chart tools use this pattern)
    if (Symbol.asyncIterator in Object(result)) {
      logger.info(`Tool ${toolName} is async generator, consuming yields`);

      // Consume all yields and return final value
      let finalValue;
      for await (const value of result) {
        finalValue = value;
        logger.info(`Yield from ${toolName}:`, {
          status: value.status,
          hasChartData: !!value.chartData
        });
      }

      logger.info(`Tool ${toolName} completed, returning final value`);
      return finalValue;
    }

    // Regular async function
    logger.info(`Tool ${toolName} is regular async, awaiting result`);
    return await result;

  } catch (error) {
    logger.error(`Error executing app default tool ${toolName}:`, error);
    throw error;
  }
}
```

**Validation:**
```typescript
// Test async generator consumption
const result = await callAppDefaultToolAction("create_pie_chart", {
  title: "Test",
  data: [{ label: "A", value: 10 }]
});
// Should return final yield with shouldCreateArtifact: true
```

---

#### Task 1.2: Add Tool Name Helper
**File:** `src/lib/ai/tools/tool-kit.ts`
**Archon Task ID:** `744cd163-8a2d-4ba8-82d4-79ca28441a85` (same as 1.1 - combined task)
**Priority:** 🔴 CRITICAL (100)
**Note:** This is part of the same Archon task as 1.1

**Implementation:**
```typescript
// Add near APP_DEFAULT_TOOL_KIT export

/**
 * List of all app default tool names for routing logic
 * Used by voice chat to distinguish app tools from MCP tools
 */
export const APP_DEFAULT_TOOL_NAMES = [
  // Chart tools (16 total - 15 active + 1 commented)
  'create_bar_chart',
  'create_line_chart',
  'create_pie_chart',
  'create_area_chart',
  'create_scatter_chart',
  'create_radar_chart',
  'create_funnel_chart',
  'create_treemap_chart',
  'create_sankey_chart',
  'create_radial_bar_chart',
  'create_composed_chart',
  'create_geographic_chart',
  'create_gauge_chart',
  'create_calendar_heatmap',
  'create_ban_chart',
  'createTable',
  // Code execution tools
  'mini-javascript-execution',
  'python-execution',
  // Web search tools
  'webSearch',
  'webContent',
  // HTTP tool
  'http',
] as const;

/**
 * Check if tool name is an app default tool (vs MCP tool)
 */
export function isAppDefaultTool(toolName: string): boolean {
  return APP_DEFAULT_TOOL_NAMES.includes(toolName as any);
}
```

**Validation:**
```typescript
// Test helper function
expect(isAppDefaultTool("create_pie_chart")).toBe(true);
expect(isAppDefaultTool("webSearch")).toBe(true);
expect(isAppDefaultTool("audience-insights__get_data")).toBe(false);
```

---

#### Task 1.3: Update Voice Chat Tool Routing
**File:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
**Archon Task ID:** `e8e8c5b3-0260-4173-a1e2-a60824ebb724`
**Priority:** 🔴 CRITICAL (90)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="e8e8c5b3-0260-4173-a1e2-a60824ebb724")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="e8e8c5b3-0260-4173-a1e2-a60824ebb724", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="e8e8c5b3-0260-4173-a1e2-a60824ebb724", status="review", assignee="QA")`
**Lines:** 217-274 (clientFunctionCall function)

**Implementation:**
```typescript
// Add imports at top
import { isAppDefaultTool } from "lib/ai/tools/tool-kit";
import { callAppDefaultToolAction } from "@/app/api/chat/openai-realtime/actions";

// Update clientFunctionCall (lines 227-241)
const clientFunctionCall = useCallback(
  async ({
    callId,
    toolName,
    args,
    id,
  }: { callId: string; toolName: string; args: string; id: string }) => {
    let toolResult: any = "success";
    stopListening();
    const toolArgs = JSON.parse(args);

    // 3-TIER ROUTING LOGIC
    if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
      // Tier 1: Voice-specific tools (changeBrowserTheme)
      switch (toolName) {
        case "changeBrowserTheme":
          setTheme(toolArgs?.theme);
          break;
      }
    } else if (isAppDefaultTool(toolName)) {
      // ✅ Tier 2: App default tools (charts, code, web search) - NEW!
      toolResult = await callAppDefaultToolAction(toolName, toolArgs);
    } else {
      // Tier 3: MCP tools (has server prefix)
      const toolId = extractMCPToolId(toolName);
      toolResult = await callMcpToolByServerNameAction(
        toolId.serverName,
        toolId.toolName,
        toolArgs,
      );
    }

    startListening();
    const resultText = JSON.stringify(toolResult).trim();

    // ... rest of existing code (send to OpenAI, update UI)
  },
  [updateUIMessage, setTheme]  // Add setTheme to deps
);
```

**Validation:**
```bash
# Manual test
1. Open voice chat (click Tool button)
2. Say: "Create a pie chart showing sales by category"
3. Expected: Chart tool executes successfully
4. Verify: No "Client create not found" error
5. Verify: MCP tools still work (test with audience tool)
```

---

### Phase 2: Message Persistence (2 hours)

**Goal:** Voice conversations saved to database

#### Task 2.1: Create Persistence Server Action
**File:** `src/app/api/chat/openai-realtime/actions.ts` (add to existing)
**Archon Task ID:** `946ddeb8-66a2-44b4-a6df-2f7f598036ee`
**Priority:** 🟡 HIGH (80)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="946ddeb8-66a2-44b4-a6df-2f7f598036ee")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="946ddeb8-66a2-44b4-a6df-2f7f598036ee", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="946ddeb8-66a2-44b4-a6df-2f7f598036ee", status="review", assignee="QA")`

**Implementation:**
```typescript
// Add to actions.ts

import { chatRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { UIMessage } from "ai";

/**
 * Persist voice chat message to database
 * Called from client-side voice chat hook via server action
 */
export async function persistVoiceMessageAction(message: {
  threadId: string;
  id: string;
  role: "user" | "assistant";
  parts: any[];
  metadata?: any;
}) {
  const session = await getSession();
  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  logger.info(`Persisting voice message: ${message.id}`);

  await chatRepository.upsertMessage({
    threadId: message.threadId,
    id: message.id,
    role: message.role,
    parts: message.parts,
    metadata: {
      ...message.metadata,
      source: "voice",
      timestamp: new Date().toISOString(),
    },
  });

  logger.info(`Voice message persisted successfully: ${message.id}`);
}

/**
 * Get or create thread for voice chat
 * Ensures voice messages have a valid thread
 */
export async function getOrCreateVoiceThreadAction(threadId?: string) {
  const session = await getSession();
  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  if (threadId) {
    const existing = await chatRepository.selectThreadDetails(threadId);
    if (existing && existing.userId === session.user.id) {
      return existing;
    }
  }

  // Create new thread
  const newThreadId = threadId || generateUUID();
  await chatRepository.insertThread({
    id: newThreadId,
    title: "Voice Chat",
    userId: session.user.id,
  });

  return await chatRepository.selectThreadDetails(newThreadId);
}
```

---

#### Task 2.2: Add ThreadId Management to Voice Hook
**File:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
**Archon Task ID:** `4ec9145b-925e-4a1a-a48a-9f21d87528ac`
**Priority:** 🟡 HIGH (75)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="4ec9145b-925e-4a1a-a48a-9f21d87528ac")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="4ec9145b-925e-4a1a-a48a-9f21d87528ac", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="4ec9145b-925e-4a1a-a48a-9f21d87528ac", status="review", assignee="QA")`
**Lines:** 87-102 (hook initialization)

**Implementation:**
```typescript
export function useOpenAIVoiceChat(
  props?: UseOpenAIVoiceChatProps,
): VoiceChatSession {
  const {
    model = "gpt-realtime",
    voice = OPENAI_VOICE.Marin,
    agentId: propsAgentId,
  } = props || {};

  // ✅ NEW: Get current threadId from appStore
  const [
    storeAgentId,
    allowedAppDefaultToolkit,
    allowedMcpServers,
    currentThreadId,  // NEW
  ] = appStore(
    useShallow((state) => [
      state.voiceChat.agentId,
      state.allowedAppDefaultToolkit,
      state.allowedMcpServers,
      state.currentThreadId,  // NEW
    ]),
  );

  // ✅ NEW: ThreadId state management
  const [threadId, setThreadId] = useState<string>(currentThreadId || "");

  // ✅ NEW: Initialize or reuse thread
  useEffect(() => {
    if (!threadId && currentThreadId) {
      setThreadId(currentThreadId);
    } else if (!threadId) {
      setThreadId(generateUUID());
    }
  }, [currentThreadId, threadId]);

  // Rest of hook with threadId available...
}
```

---

#### Task 2.3: Add Persistence at Lifecycle Events
**File:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
**Archon Task ID:** `a1771e15-5f9d-4637-abdb-f267a145ad63`
**Priority:** 🟡 HIGH (70)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="a1771e15-5f9d-4637-abdb-f267a145ad63")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="a1771e15-5f9d-4637-abdb-f267a145ad63", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="a1771e15-5f9d-4637-abdb-f267a145ad63", status="review", assignee="QA")`
**Lines:** 299-474 (handleServerEvent switch cases)

**Implementation:**
```typescript
// Add import
import { persistVoiceMessageAction } from "@/app/api/chat/openai-realtime/actions";

// Update case statements

// 1. User message complete
case "conversation.item.input_audio_transcription.completed": {
  const transcript = (event as any).transcript || "...speaking";

  updateUIMessage(event.item_id, {
    parts: [{ type: "text", text: transcript }],
    completed: true,
  });

  // ✅ NEW: Persist user message
  if (threadId) {
    await persistVoiceMessageAction({
      threadId,
      id: event.item_id,
      role: "user",
      parts: [{ type: "text", text: transcript }],
      metadata: { voice, source: "voice" },
    });
  }

  break;
}

// 2. Assistant message complete
case "response.output_audio_transcript.done": {
  const transcript = event.transcript || "";

  updateUIMessage(event.item_id, (prev) => {
    const textPart = prev.parts.find((p) => p.type == "text");
    if (!textPart) return prev;
    textPart.text = transcript;
    return { ...prev, completed: true };
  });

  // ✅ NEW: Persist assistant message
  if (threadId) {
    await persistVoiceMessageAction({
      threadId,
      id: event.item_id,
      role: "assistant",
      parts: [{ type: "text", text: transcript }],
      metadata: { source: "voice" },
    });
  }

  break;
}

// 3. Tool call complete
case "response.function_call_arguments.done": {
  const message = createUIMessage({
    role: "assistant",
    id: event.item_id,
    content: {
      type: "tool-invocation",
      name: event.name,
      arguments: JSON.parse(event.arguments),
      state: "call",
      toolCallId: event.call_id,
    },
    completed: true,
  });

  setMessages((prev) => [...prev, message]);

  const toolResult = await clientFunctionCall({
    callId: event.call_id,
    toolName: event.name,
    args: event.arguments,
    id: event.item_id,
  });

  // ✅ NEW: Persist tool call with result
  if (threadId) {
    await persistVoiceMessageAction({
      threadId,
      id: event.item_id,
      role: "assistant",
      parts: [{
        type: `tool-${event.name}`,
        toolCallId: event.call_id,
        input: JSON.parse(event.arguments),
        state: "output-available",
        output: toolResult,
      }],
      metadata: { source: "voice" },
    });
  }

  break;
}
```

**Validation:**
```bash
# Test persistence
1. Voice chat conversation with 3-5 messages
2. Generate a chart via voice
3. Open database: pnpm db:studio
4. Verify:
   - Messages table has voice messages
   - threadId matches current thread
   - metadata.source = "voice"
   - Tool calls persisted with output
```

---

### Phase 3: Conversation History (1.5 hours)

**Goal:** Resume voice conversations with context

#### Task 3.1: Create History Loading Action
**File:** `src/app/api/chat/openai-realtime/actions.ts` (add to existing)
**Archon Task ID:** `47819316-716b-46f4-a5b1-2d4fe398c5d5`
**Priority:** 🟢 MEDIUM (60)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="47819316-716b-46f4-a5b1-2d4fe398c5d5")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="47819316-716b-46f4-a5b1-2d4fe398c5d5", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="47819316-716b-46f4-a5b1-2d4fe398c5d5", status="review", assignee="QA")`

**Implementation:**
```typescript
/**
 * Load recent messages for conversation history
 * Returns last N messages in format compatible with voice chat UI
 */
export async function loadThreadMessagesAction(
  threadId: string,
  limit: number = 20
) {
  const session = await getSession();
  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  const thread = await chatRepository.selectThreadDetails(threadId);

  if (!thread || thread.userId !== session.user.id) {
    logger.warn(`Thread ${threadId} not found or unauthorized`);
    return [];
  }

  const messages = thread.messages || [];

  // Return last N messages (simple truncation)
  const recentMessages = messages.slice(-limit);

  logger.info(`Loaded ${recentMessages.length} messages for thread ${threadId}`);

  return recentMessages.map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: msg.parts,
    completed: true,
  }));
}

/**
 * Helper to extract text from message parts
 */
function extractTextFromParts(parts: any[]): string {
  const textPart = parts.find(p => p.type === "text");
  return textPart?.text || "";
}
```

---

#### Task 3.2: Load and Send History to OpenAI
**File:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
**Archon Task ID:** `52dd74a3-62bc-4b9a-9297-3eb5e466c9d8`
**Priority:** 🟢 MEDIUM (50)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="52dd74a3-62bc-4b9a-9297-3eb5e466c9d8")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="52dd74a3-62bc-4b9a-9297-3eb5e466c9d8", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="52dd74a3-62bc-4b9a-9297-3eb5e466c9d8", status="review", assignee="QA")`
**Lines:** 262-474 (start callback and WebRTC setup)

**Implementation:**
```typescript
// Add import
import {
  loadThreadMessagesAction,
  getOrCreateVoiceThreadAction
} from "@/app/api/chat/openai-realtime/actions";

// Update start callback
const start = useCallback(async () => {
  if (isActive || isLoading) return;
  setIsLoading(true);
  setError(null);

  try {
    // ✅ NEW: Ensure thread exists
    const thread = await getOrCreateVoiceThreadAction(threadId);
    if (!threadId) {
      setThreadId(thread.id);
    }

    // ✅ NEW: Load conversation history
    const historyMessages = await loadThreadMessagesAction(thread.id, 20);
    setMessages(historyMessages);  // Populate UI

    logger.info(`Loaded ${historyMessages.length} historical messages`);

    const session = await createSession();
    // ... existing WebRTC setup

    dc.addEventListener("open", () => {
      console.log("🚀 WebRTC Data Channel OPENED");
      sessionUpdatedReceived.current = false;

      // ✅ NEW: Send conversation history BEFORE session config
      if (historyMessages.length > 0) {
        console.log(`📤 Sending ${historyMessages.length} historical messages to OpenAI`);

        for (const msg of historyMessages) {
          const textContent = msg.parts.find(p => p.type === "text")?.text || "";

          // Skip empty messages
          if (!textContent.trim()) continue;

          const historyEvent = {
            type: "conversation.item.create",
            item: {
              type: "message",
              role: msg.role,
              content: [{
                type: msg.role === "user" ? "input_text" : "text",
                text: textContent,
              }],
            },
          };

          dc.send(JSON.stringify(historyEvent));
        }

        console.log("✅ Conversation history sent to OpenAI");
      }

      // THEN send session configuration (existing code)
      if (session.sessionConfig) {
        console.log("📤 Starting session configuration updates");

        // Step 1: Instructions
        const instructionsUpdate = {
          type: "session.update",
          session: {
            type: "realtime",
            model: "gpt-realtime",
            instructions: session.sessionConfig.instructions,
            output_modalities: session.sessionConfig.output_modalities,
          },
        };

        dc.send(JSON.stringify(instructionsUpdate));

        // ... rest of existing session config code
      }
    });

  } catch (err) {
    setError(err instanceof Error ? err : new Error(String(err)));
    setIsActive(false);
    setIsListening(false);
    setIsLoading(false);
  }
}, [isActive, isLoading, createSession, handleServerEvent, threadId]);
```

**Validation:**
```bash
# Test conversation resumption
1. Voice chat with 5+ messages: "Hello", "Create a chart", etc.
2. Stop voice chat (close dialog)
3. Refresh page
4. Open voice chat again
5. Say: "What did we discuss earlier?"
6. Expected: OpenAI responds referencing previous conversation
7. Verify in console: "📤 Sending N historical messages to OpenAI"
```

---

### Phase 4: Voice Chat Navigation & Reopening (3.75 hours)

**Goal:** Enable users to reopen voice chat threads from sidebar with full Canvas restoration and message history

**Status:** Blocked on Critical Bug Fix (Task 4.0)
**Dependencies:** Phases 1-3 MUST be complete, await bug MUST be fixed first

---

#### Task 4.0: CRITICAL - Fix Missing await Statements (BLOCKER)

**File:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
**Archon Task ID:** `fdea07b4-0bcc-4779-a7be-860326f23181`
**Priority:** 🔴 BLOCKER (110 - Highest!)
**Assignee:** Coding Agent
**Time:** 15 minutes
**Retrieve Task:** `mcp__archon__find_tasks(task_id="fdea07b4-0bcc-4779-a7be-860326f23181")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="fdea07b4-0bcc-4779-a7be-860326f23181", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="fdea07b4-0bcc-4779-a7be-860326f23181", status="review", assignee="QA")`

**Problem:**
All 3 persistence calls are fire-and-forget, causing potential data loss.

**Changes Required:**
```typescript
// Line 425 - User message (ADD await)
case "conversation.item.input_audio_transcription.completed": {
  const transcript = (event as any).transcript || "...speaking";

  updateUIMessage(event.item_id, {
    parts: [{ type: "text", text: transcript }],
    completed: true,
  });

  // ✅ FIX: Add await
  if (threadId) {
    try {
      await persistVoiceMessageAction({
        threadId,
        id: event.item_id,
        role: "user",
        parts: [{ type: "text", text: transcript }],
        metadata: { voice, source: "voice" },
      });
    } catch (error) {
      logger.error('Failed to persist user voice message:', error);
    }
  }
  break;
}

// Line 487 - Assistant message (ADD await)
case "response.output_audio_transcript.done": {
  const assistantTranscript = event.transcript || "";

  updateUIMessage(event.item_id, (prev) => {
    const textPart = prev.parts.find((p) => p.type == "text");
    if (!textPart) return prev;
    textPart.text = assistantTranscript;
    return { ...prev, completed: true };
  });

  // ✅ FIX: Add await
  if (threadId) {
    try {
      await persistVoiceMessageAction({
        threadId,
        id: event.item_id,
        role: "assistant",
        parts: [{ type: "text", text: assistantTranscript }],
        metadata: { source: "voice" },
      });
    } catch (error) {
      logger.error('Failed to persist assistant voice message:', error);
    }
  }
  break;
}

// Line 304 - Tool call (ADD await)
// In clientFunctionCall callback, after updateUIMessage
if (threadId) {
  try {
    await persistVoiceMessageAction({
      threadId,
      id: id,
      role: "assistant",
      parts: [{
        type: `tool-${toolName}`,
        toolCallId: callId,
        input: toolArgs,
        state: "output-available",
        output: toolResult,
      }],
      metadata: { source: "voice" },
    });
  } catch (error) {
    logger.error('Failed to persist tool call:', error);
  }
}
```

**Validation:**
```bash
# Verify all 3 calls have await
grep -n "await persistVoiceMessageAction" src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
# Should show 3 results at lines 425, 487, 304 (approx)

# Test: Create voice chat, close quickly, verify DB has all messages
pnpm db:studio
```

---

#### Task 4.1: Create Voice Thread Detection Utility

**File:** `src/lib/utils/voice-thread-detector.ts` (NEW)
**Archon Task ID:** `c551b0a5-9856-4440-ae0c-060dc2f2d06b`
**Priority:** 🟡 HIGH (80)
**Assignee:** Coding Agent
**Time:** 30 minutes
**Retrieve Task:** `mcp__archon__find_tasks(task_id="c551b0a5-9856-4440-ae0c-060dc2f2d06b")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="c551b0a5-9856-4440-ae0c-060dc2f2d06b", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="c551b0a5-9856-4440-ae0c-060dc2f2d06b", status="review", assignee="QA")`

**Implementation:**
```typescript
import { ChatMessage } from "app-types/chat";

/**
 * Detect if a thread contains voice messages
 * Checks first message for voice source metadata
 */
export function isVoiceThread(messages: ChatMessage[]): boolean {
  if (!messages || messages.length === 0) return false;

  // Check if first message has voice source
  const firstMessage = messages[0];
  return firstMessage?.metadata?.source === 'voice';
}

/**
 * Get voice-specific metadata from thread
 * Provides detailed voice thread information
 */
export function getVoiceThreadMetadata(messages: ChatMessage[]) {
  const voiceMessages = messages.filter(m => m.metadata?.source === 'voice');

  return {
    isVoiceThread: voiceMessages.length > 0,
    voiceMessageCount: voiceMessages.length,
    totalMessageCount: messages.length,
    firstVoiceAt: voiceMessages[0]?.createdAt,
    hasCharts: messages.some(m =>
      m.parts.some(p =>
        typeof p.type === 'string' &&
        (p.type.includes('chart') || p.type.includes('table'))
      )
    ),
    hasTools: messages.some(m =>
      m.parts.some(p =>
        typeof p.type === 'string' &&
        p.type.startsWith('tool-')
      )
    ),
  };
}

/**
 * Check if thread has mixed voice and text messages
 * Useful for hybrid conversation handling
 */
export function isHybridThread(messages: ChatMessage[]): boolean {
  const voiceCount = messages.filter(m => m.metadata?.source === 'voice').length;
  const totalCount = messages.length;

  return voiceCount > 0 && voiceCount < totalCount;
}
```

**Validation:**
```typescript
// Test with voice thread
const voiceMessages = [
  { metadata: { source: 'voice' }, parts: [...] },
  { metadata: { source: 'voice' }, parts: [...] },
];
expect(isVoiceThread(voiceMessages)).toBe(true);

// Test with text thread
const textMessages = [
  { metadata: {}, parts: [...] },
];
expect(isVoiceThread(textMessages)).toBe(false);
```

---

#### Task 4.2: Add Voice Thread Auto-Detection to ChatBot

**File:** `src/components/chat-bot.tsx`
**Archon Task ID:** `9e888e15-b5e4-4bff-a48b-616f2a674058`
**Priority:** 🟡 HIGH (75)
**Assignee:** Coding Agent
**Time:** 1 hour
**Location:** After line 297 (after thread change cleanup)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="9e888e15-b5e4-4bff-a48b-616f2a674058")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="9e888e15-b5e4-4bff-a48b-616f2a674058", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="9e888e15-b5e4-4bff-a48b-616f2a674058", status="review", assignee="QA")`

**Implementation:**
```typescript
// Add imports at top
import { isVoiceThread } from 'lib/utils/voice-thread-detector';

// Add voice detection effect (after line 297)
useEffect(() => {
  // Detect if this thread contains voice messages on mount
  if (initialMessages.length > 0 && isVoiceThread(initialMessages)) {
    console.log('🎤 Voice thread detected - auto-opening voice chat dialog', {
      threadId,
      messageCount: initialMessages.length,
    });

    // Trigger voice chat dialog to open
    // Note: appStore.currentThreadId is already set (line 705)
    appStoreMutate({
      voiceChat: {
        ...appStore.getState().voiceChat,
        isOpen: true,
      },
    });
  }
}, [initialMessages.length, threadId, appStoreMutate]);
```

**How It Works:**
1. User clicks voice thread in sidebar
2. Navigate to `/chat/[threadId]`
3. Page loads, ChatBot mounts with `initialMessages`
4. useEffect detects voice messages via `isVoiceThread()`
5. Triggers `appStore.voiceChat.isOpen = true`
6. `ChatBotVoice` component renders (controlled by appStore)
7. Voice hook reads `appStore.currentThreadId` (already set line 705)
8. Loads messages via `loadThreadMessagesAction()` (Phase 3)
9. Canvas restores via existing initialization logic (lines 148-257 of chat-bot-voice.tsx)

**UI Flow:**
- Voice dialog opens in **compact mode** (default: `useCompactView = true`)
- User sees latest message in large text
- User can toggle to **conversation mode** to see full history
- Canvas shows all charts from message history

**Validation:**
```bash
# Test voice thread reopening
1. Create voice chat with 3 charts and 5+ messages
2. Close voice dialog
3. Refresh page
4. Click voice thread in sidebar
5. ✅ Verify: Voice dialog opens automatically
6. ✅ Verify: Messages load in compact mode
7. ✅ Verify: All 3 charts visible in Canvas
8. ✅ Verify: Can toggle to conversation mode
9. ✅ Verify: Can continue conversation with context
```

---

#### Task 4.3: Add Visual Indicators for Voice Threads in Sidebar

**File:** `src/components/layouts/app-sidebar-threads.tsx`
**Archon Task ID:** `df9a9ae9-1627-4cb3-ab26-e06296fd4a84`
**Priority:** 🟢 MEDIUM (60)
**Assignee:** Coding Agent
**Time:** 45 minutes
**Lines:** Modify thread rendering (line 247-296)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="df9a9ae9-1627-4cb3-ab26-e06296fd4a84")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="df9a9ae9-1627-4cb3-ab26-e06296fd4a84", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="df9a9ae9-1627-4cb3-ab26-e06296fd4a84", status="review", assignee="QA")`

**Implementation:**
```typescript
// Add Mic icon import (line 14)
import { Mic, MoreHorizontal, Trash } from 'lucide-react';
import { isVoiceThread } from 'lib/utils/voice-thread-detector';

// Enhance thread data fetching to include voice detection
const { data: threadList, isLoading } = useSWR("/api/thread", fetcher, {
  onError: handleErrorWithToast,
  fallbackData: [],
  onSuccess: (data) => {
    storeMutate((prev) => {
      const groupById = groupBy(prev.threadList, "id");

      const generatingTitleThreads = prev.generatingTitleThreadIds
        .map((id) => groupById[id]?.[0])
        .filter(Boolean) as ChatThread[];

      const list = deduplicateByKey(
        generatingTitleThreads.concat(data),
        "id",
      );

      // ✅ NEW: Enrich threads with voice detection
      const enrichedList = list.map((v) => {
        const target = groupById[v.id]?.[0];
        if (!target) return v;
        if (target.title && !v.title) {
          return {
            ...v,
            title: target.title,
          };
        }
        return v;
      });

      return {
        threadList: enrichedList,
      };
    });
  },
});

// Update thread link rendering (line 267)
<Link
  href={`/chat/${thread.id}`}
  className="flex items-center"
>
  {/* ✅ NEW: Show microphone icon for voice threads */}
  <div className="flex items-center gap-2 min-w-0">
    {thread.messages?.[0]?.metadata?.source === 'voice' && (
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
</Link>
```

**Alternative (if thread API doesn't return messages):**
```typescript
// Option: Enhance /api/thread endpoint to include isVoice flag
// File: src/app/api/thread/route.ts

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const threads = await chatRepository.selectThreadsByUserId(session.user.id);

  // ✅ Enrich with voice detection
  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
      const details = await chatRepository.selectThreadDetails(thread.id);
      const isVoice = details?.messages?.[0]?.metadata?.source === 'voice';

      return {
        ...thread,
        isVoice,
      };
    })
  );

  return Response.json(enrichedThreads);
}
```

**Validation:**
```bash
# Test sidebar indicators
1. Create 2 text chats
2. Create 2 voice chats
3. ✅ Verify: Voice chats show microphone icon
4. ✅ Verify: Text chats have no icon
5. ✅ Verify: Icons remain after refresh
```

---

#### Task 4.4: Validate Canvas Restoration for Voice Thread Reopening

**File:** `src/components/chat-bot-voice.tsx` (existing lines 148-257)
**Archon Task ID:** `1041fcaf-c6e9-4960-9125-60e956caa8b5`
**Priority:** 🟢 MEDIUM (50)
**Assignee:** QA
**Time:** 30 minutes (validation only, no code changes)
**Retrieve Task:** `mcp__archon__find_tasks(task_id="1041fcaf-c6e9-4960-9125-60e956caa8b5")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="1041fcaf-c6e9-4960-9125-60e956caa8b5", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="1041fcaf-c6e9-4960-9125-60e956caa8b5", status="review", assignee="QA")`

**Validation Strategy:**

**Code to Verify (Existing - No Changes):**
```typescript
// ChatBotVoice lines 148-257
// ONE-TIME: Process all historical messages on voice chat open to restore charts
useEffect(() => {
  if (isInitializedRef.current || messages.length === 0 || !voiceChat.isOpen) {
    return;
  }

  logger.info("Voice Chat: Initializing artifacts from message history", {
    messageCount: messages.length,
  });

  // Process ALL assistant messages (not just last one)
  messages.forEach((message) => {
    if (message.role !== "assistant") return;

    // Extract chart tools from this message
    const chartTools = message.parts.filter(
      (part) => isToolUIPart(part) && chartToolNames.includes(getToolName(part)),
    );

    // Process completed charts (same logic as real-time processing)
    chartTools.forEach((part) => {
      // ... creates Canvas artifacts from tool outputs ...
      addCanvasArtifact(artifact);
    });
  });

  isInitializedRef.current = true;
}, [messages.length, voiceChat.isOpen, addCanvasArtifact]);
```

**Test Cases:**
```bash
# Test 1: Single Chart Restoration
1. Voice chat: "Create a bar chart with sales data"
2. Close voice dialog
3. Click voice thread in sidebar
4. ✅ Verify: Chart appears in Canvas
5. ✅ Verify: Chart data matches original

# Test 2: Multiple Charts Restoration
1. Voice chat: Create 5 different charts
2. Close and reopen from sidebar
3. ✅ Verify: All 5 charts appear
4. ✅ Verify: No duplicates
5. ✅ Verify: Correct chart types and data

# Test 3: UI Mode Verification
1. Reopen voice thread with charts
2. ✅ Verify: Opens in compact mode (default)
3. Toggle to conversation mode
4. ✅ Verify: Full history visible
5. ✅ Verify: Charts still in Canvas

# Test 4: Agent Mode Compatibility
1. Create voice chat with custom agent
2. Generate charts via voice
3. Close and reopen
4. ✅ Verify: Agent context preserved
5. ✅ Verify: Charts restore correctly
```

**Acceptance Criteria:**
- [ ] All charts from history load in Canvas
- [ ] No duplicate charts created
- [ ] Chart data matches original outputs
- [ ] Both UI modes work correctly
- [ ] Agent mode compatibility verified

---

#### Task 4.5: E2E Testing for Voice Thread Reopening Workflow

**File:** Manual testing + optional E2E test suite
**Archon Task ID:** `803478da-1a22-4b67-b699-eae6793bd007`
**Priority:** 🟢 MEDIUM (40)
**Assignee:** QA
**Time:** 45 minutes
**Retrieve Task:** `mcp__archon__find_tasks(task_id="803478da-1a22-4b67-b699-eae6793bd007")`
**Mark In Progress:** `mcp__archon__manage_task("update", task_id="803478da-1a22-4b67-b699-eae6793bd007", status="doing")`
**Mark Complete:** `mcp__archon__manage_task("update", task_id="803478da-1a22-4b67-b699-eae6793bd007", status="review", assignee="QA")`

**E2E Test Scenarios:**

**Scenario 1: Complete Voice Thread Lifecycle**
```bash
1. Open new voice chat (Tool button in header)
2. Say: "Hello, I need help with data visualization"
3. Say: "Create a pie chart showing Q1 sales by region"
4. Verify: Chart appears in Canvas
5. Say: "Now create a bar chart comparing monthly revenue"
6. Verify: Both charts in Canvas
7. Toggle to conversation mode
8. Verify: Full conversation history visible
9. Close voice dialog (X button)
10. ✅ Verify: Thread appears in sidebar with mic icon
11. Click the voice thread in sidebar
12. ✅ Verify: Voice dialog opens automatically
13. ✅ Verify: Messages load in compact mode
14. ✅ Verify: Both charts visible in Canvas
15. ✅ Verify: Can toggle to conversation mode
16. Say: "What charts did we create?"
17. ✅ Verify: OpenAI responds with context (mentions pie and bar charts)
```

**Scenario 2: Agent Mode Compatibility**
```bash
1. Select custom agent (e.g., "Data Analyst Agent")
2. Open voice chat with agent
3. Say: "Analyze this sales data" (provide data)
4. Agent creates charts with analysis
5. Close voice dialog
6. Click voice thread in sidebar
7. ✅ Verify: Voice dialog opens with agent context
8. ✅ Verify: Charts restore
9. ✅ Verify: Agent personality maintained
10. Continue conversation
11. ✅ Verify: Agent responds consistently
```

**Scenario 3: Hybrid Thread (Voice + Text)**
```bash
1. Start text chat, create a chart via text
2. Click voice button to switch to voice
3. Say: "Create another chart via voice"
4. Close voice dialog
5. Continue in text chat
6. ✅ Verify: Both text and voice messages visible
7. Click voice thread in sidebar
8. ✅ Verify: Voice dialog opens
9. ✅ Verify: Both charts in Canvas
10. ✅ Verify: Mixed conversation history works
```

**Scenario 4: Edge Cases**
```bash
# Empty voice thread
1. Open voice chat
2. Close immediately (no messages)
3. ✅ Verify: Thread NOT saved (no empty threads)

# Voice thread with only failed charts
1. Voice chat with intentionally bad chart requests
2. Close and reopen
3. ✅ Verify: Opens correctly with no Canvas (no charts succeeded)

# Very long voice conversation (20+ messages)
1. Create voice chat with 25+ messages and 10 charts
2. Close and reopen
3. ✅ Verify: Last 20 messages loaded
4. ✅ Verify: All charts from those 20 messages restore
5. ✅ Verify: Performance acceptable (<2s load time)
```

**Acceptance Criteria:**
- [ ] Complete lifecycle works (create → close → reopen → continue)
- [ ] Agent mode fully compatible
- [ ] Hybrid threads supported
- [ ] Edge cases handled gracefully
- [ ] No console errors during workflow
- [ ] Performance acceptable (load < 2s)

---

### Phase 4 Success Criteria Checklist

**Critical Bug Fix (Task 4.0):**
- [ ] await added to line 425 (user message)
- [ ] await added to line 487 (assistant message)
- [ ] await added to line 304 (tool call)
- [ ] All wrapped in try/catch
- [ ] Error logging implemented
- [ ] Manual test: Messages persist reliably

**Voice Thread Detection (Task 4.1):**
- [ ] isVoiceThread() utility created
- [ ] getVoiceThreadMetadata() implemented
- [ ] isHybridThread() implemented (optional)
- [ ] Unit tests pass

**ChatBot Auto-Detection (Task 4.2):**
- [ ] Voice detection useEffect added
- [ ] appStore.voiceChat.isOpen triggered correctly
- [ ] No breaking changes to text chat behavior
- [ ] Works with existing currentThreadId flow

**Sidebar Indicators (Task 4.3):**
- [ ] Microphone icon shows for voice threads
- [ ] Icon positioning correct
- [ ] Works with date grouping
- [ ] Responsive design maintained

**Canvas Restoration (Task 4.4):**
- [ ] All charts from history restore
- [ ] No duplicate charts
- [ ] Both UI modes work
- [ ] Agent mode compatible

**E2E Validation (Task 4.5):**
- [ ] Complete lifecycle tested
- [ ] Agent mode verified
- [ ] Hybrid threads work
- [ ] Edge cases handled
- [ ] Performance acceptable

---

## Integration with Existing Systems

### Canvas System (Optional - Phase 4)

**Current Canvas Integration (Text Chat):**
```typescript
// src/components/chat-bot.tsx:410-477
onData: (data: any) => {
  if (data?.type === "tool-result") {
    const { toolName, result } = data;

    if (chartToolNames.includes(toolName) &&
        result?.shouldCreateArtifact &&
        result?.status === "success") {
      addCanvasArtifact({
        id: result.chartId,
        type: "chart",
        data: result.chartData,
        // ...
      });
    }
  }
}
```

**Voice Chat Integration (If Needed After Phase 1):**
```typescript
// In use-voice-chat.openai.ts, after tool execution
if (isChartTool(toolName) &&
    toolResult?.shouldCreateArtifact &&
    toolResult?.status === "success") {

  // Trigger Canvas via custom event
  window.dispatchEvent(new CustomEvent('voice-canvas:artifact', {
    detail: {
      id: toolResult.chartId,
      type: "chart",
      data: toolResult.chartData,
      title: toolResult.title,
      canvasName: toolResult.canvasName,
    }
  }));
}
```

**Decision:** Test Phase 1 first - existing polling in chat-bot.tsx might detect voice tool outputs automatically.

---

### Database Integration

**Repository:** `chatRepository` from `src/lib/db/repository.ts:12`

**Key Methods Used:**
```typescript
// Thread management
await chatRepository.insertThread({ id, title, userId });
await chatRepository.selectThreadDetails(threadId);

// Message persistence
await chatRepository.upsertMessage({
  threadId,
  id,
  role,
  parts,
  metadata,
});
```

**Schema Compatibility:**
```typescript
// src/lib/db/pg/schema.pg.ts - ChatMessageSchema
{
  id: string,           // ✅ From OpenAI item_id
  threadId: string,     // ✅ From appStore or generated
  role: "user" | "assistant",  // ✅ From OpenAI event
  parts: JSONB,         // ✅ Supports voice message parts
  metadata: JSONB,      // ✅ Can store {source: "voice", voice: "marin"}
  createdAt: timestamp  // ✅ Auto-generated
}
```

**✅ NO SCHEMA CHANGES REQUIRED**

---

### Authentication Integration

**Pattern from `src/app/api/chat/actions.ts:37-44`:**

```typescript
export async function getUserId() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not found");
  }
  return userId;
}
```

**Applied to Voice Actions:**
```typescript
export async function persistVoiceMessageAction(message) {
  const session = await getSession();
  if (!session?.user.id) {
    throw new Error("Unauthorized");
  }

  // Proceed with database operation
  await chatRepository.upsertMessage({...});
}
```

---

## Validation & Testing Strategy

### Level 1: Unit Tests (Phase 4)

```typescript
// Tool routing tests
✓ isAppDefaultTool() correctly identifies all 21 tools
✓ callAppDefaultToolAction() handles async generators
✓ callAppDefaultToolAction() handles regular async functions
✓ Error handling for non-existent tools

// Persistence tests
✓ persistVoiceMessageAction() saves to database
✓ Metadata includes source: "voice"
✓ Thread creation works correctly
```

### Level 2: Integration Tests

```bash
# Manual integration testing
1. Tool Routing:
   - Say: "Create a bar chart" → Chart generates
   - Say: "Execute this JavaScript code" → Code runs
   - Say: "Search the web for X" → Search works
   - Use MCP tool → Still works

2. Persistence:
   - Voice chat → Messages saved
   - Refresh → Messages still in database
   - Text chat → Can see voice messages

3. History:
   - Previous conversation → Resume voice
   - OpenAI responds with context
   - No repeated introductions
```

### Level 3: E2E Scenarios

```bash
# Full user journey testing
Scenario 1: Voice-Only Workflow
1. Open voice chat
2. Have conversation with chart generation
3. Close and refresh
4. Resume - conversation continues naturally

Scenario 2: Voice-Text Hybrid
1. Start in text chat
2. Switch to voice (same thread)
3. Voice messages appear in text view
4. Switch back to text
5. Unified history

Scenario 3: Multi-Tool Usage
1. Voice: "Create a chart" → Works
2. Voice: "Search the web" → Works
3. Voice: "Execute code" → Works
4. Voice: Use MCP tool → Works
5. All persisted correctly
```

### Success Criteria Checklist

**Phase 1 (Tool Routing):**
- [ ] All 16 chart tools work in voice mode
- [ ] Code execution tools work
- [ ] Web search tools work
- [ ] HTTP tool works
- [ ] MCP tools still work
- [ ] No "Client create not found" errors
- [ ] All tests pass

**Phase 2 (Persistence):**
- [ ] User messages saved to database
- [ ] Assistant messages saved to database
- [ ] Tool calls saved with outputs
- [ ] Metadata includes source: "voice"
- [ ] Thread ID properly managed
- [ ] Messages visible in text chat after refresh
- [ ] Database writes complete successfully

**Phase 3 (History):**
- [ ] Last 20 messages loaded on start
- [ ] History sent to OpenAI correctly
- [ ] OpenAI responds with context awareness
- [ ] Tool calls in history handled
- [ ] Conversation flow natural
- [ ] No context loss

---

## Known Issues & Gotchas

### OpenAI Realtime API Limitations (2025)

**1. Audio History Not Supported**
- ❌ Cannot send previous audio messages
- ✅ CAN send text transcripts
- **Solution:** Use transcripts only (good enough)

**2. Context Window: 128k Tokens**
- Performance degrades with large context
- **Solution:** Limit to last 20 messages (~2000-5000 tokens)

**3. Stateless Sessions**
- Each WebRTC connection = new session
- No server-side persistence by OpenAI
- **Solution:** We handle all persistence and history loading

**4. conversation.item.create Timing**
- MUST send history BEFORE `session.update`
- Otherwise history ignored
- **Solution:** Sequential send with proper ordering

---

### Project-Specific Gotchas

**1. Async Generator Tools**
- Chart tools yield 3 times: loading → processing → success
- Must consume ALL yields to get final result
- **Solution:** `for await (const value of generator)`

**2. Server Actions from Client Hooks**
- Client-side hooks can't directly access `chatRepository`
- **Solution:** Wrap in server actions

**3. ThreadId Management**
- Voice hook runs client-side
- appStore might not have threadId yet
- **Solution:** Create new thread if none exists

**4. Tool Output Format**
- Chart tools return object with `shouldCreateArtifact`
- Code tools return different format
- **Solution:** Handle in tool execution, return as-is

---

## Anti-Patterns to Avoid

❌ **Don't** create parallel thread system for voice (use existing)
❌ **Don't** store audio files (transcripts sufficient)
❌ **Don't** implement complex summarization (simple truncation fine)
❌ **Don't** over-engineer context management (OpenAI handles it)
❌ **Don't** modify database schema (current schema works)
❌ **Don't** bypass authentication (always check session)
❌ **Don't** mix client/server code (use server actions properly)
❌ **Don't** ignore async generators (must consume all yields)

✅ **Do** reuse text chat patterns
✅ **Do** use server actions for database operations
✅ **Do** keep it simple (pragmatic MVP)
✅ **Do** test thoroughly at each phase
✅ **Do** validate with real voice interactions
✅ **Do** handle errors gracefully
✅ **Do** log comprehensively for debugging

---

## Rollback Plan

### If Phase 1 Fails
```bash
# Revert tool routing changes
git revert HEAD
# Or comment out new routing logic
# Keep existing MCP-only routing
```

**Impact:** Voice chart tools remain broken (current state)
**Risk:** Low (no database changes)

### If Phase 2 Fails
```bash
# Remove persistence calls
# Comment out persistVoiceMessageAction() calls
# Voice chat works without persistence (Phase 1 still valuable)
```

**Impact:** No history, but tools work
**Risk:** Low (additive feature)

### If Phase 3 Fails
```bash
# Remove history loading
# Comment out loadThreadMessagesAction() call
# Voice chat works with persistence, just no context on resume
```

**Impact:** New conversations only (no resume)
**Risk:** Zero (optional enhancement)

---

## File Change Summary

### New Files (3)
1. `src/app/api/chat/openai-realtime/actions.ts` - Tool execution + persistence actions
2. `src/lib/ai/speech/__tests__/voice-chat-tool-routing.test.ts` - Unit tests
3. `src/lib/utils/voice-thread-detector.ts` - Voice thread detection utilities (Phase 4)

### Modified Files (4)
1. `src/lib/ai/tools/tool-kit.ts` - Add APP_DEFAULT_TOOL_NAMES + isAppDefaultTool()
2. `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` - Tool routing + persistence + history + await fixes
3. `src/components/chat-bot.tsx` - Voice thread auto-detection logic (Phase 4)
4. `src/components/layouts/app-sidebar-threads.tsx` - Microphone icon indicators (Phase 4)

**Total:** 3 new, 4 modified (minimal scope, focused changes)

---

## Performance & Security

### Performance Considerations

**Database Writes:**
- Frequency: 2-4 per voice exchange (similar to text chat)
- Optimization: Use existing optimized `upsertMessage`
- Impact: Negligible (text chat already doing this)

**History Loading:**
- Query: Last 20 messages per session start
- Cost: ~2000-5000 tokens input to OpenAI
- Optimization: Simple LIMIT clause
- Impact: Minimal (~$0.01 per session)

**Memory:**
- Client state: 20 messages max (~50KB)
- No audio storage
- Standard cleanup hooks
- Impact: None

### Security Measures

**✅ Already Implemented:**
- Session validation in all server actions
- User ID checking before database operations
- Better-Auth integration
- Secure WebRTC connections

**✅ No New Vulnerabilities:**
- Server actions prevent direct database access
- Same security model as text chat
- No exposed endpoints
- Metadata doesn't contain sensitive data

---

## Archon Project & Task Tracking

**Project ID:** `ca10e121-be60-4c7f-aab1-768f1e5a6d05`
**Project Name:** Voice Chat Tool Routing & Persistence Fixes

**Retrieve Project:**
```bash
mcp__archon__find_projects(project_id="ca10e121-be60-4c7f-aab1-768f1e5a6d05")
```

### Tasks Created (14 Total - 8 original + 6 Phase 4)

#### Phase 1: Tool Routing (2 tasks - ✅ COMPLETE)
1. **Task:** Create server action for app default tool execution
   - **ID:** `744cd163-8a2d-4ba8-82d4-79ca28441a85`
   - **Priority:** 100 (Critical)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="744cd163-8a2d-4ba8-82d4-79ca28441a85")`

2. **Task:** Add app default tool routing logic to voice chat
   - **ID:** `e8e8c5b3-0260-4173-a1e2-a60824ebb724`
   - **Priority:** 90 (Critical)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="e8e8c5b3-0260-4173-a1e2-a60824ebb724")`

#### Phase 2: Persistence (3 tasks)
3. **Task:** Create persistence server actions for voice messages
   - **ID:** `946ddeb8-66a2-44b4-a6df-2f7f598036ee`
   - **Priority:** 80 (High)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="946ddeb8-66a2-44b4-a6df-2f7f598036ee")`

4. **Task:** Add threadId management to voice chat hook
   - **ID:** `4ec9145b-925e-4a1a-a48a-9f21d87528ac`
   - **Priority:** 75 (High)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="4ec9145b-925e-4a1a-a48a-9f21d87528ac")`

5. **Task:** Persist voice messages at lifecycle events
   - **ID:** `a1771e15-5f9d-4637-abdb-f267a145ad63`
   - **Priority:** 70 (High)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="a1771e15-5f9d-4637-abdb-f267a145ad63")`

#### Phase 3: History (1 task)
6. **Task:** Create history loading server action
   - **ID:** `47819316-716b-46f4-a5b1-2d4fe398c5d5`
   - **Priority:** 60 (Medium)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="47819316-716b-46f4-a5b1-2d4fe398c5d5")`

7. **Task:** Send conversation history to OpenAI on session start
   - **ID:** `52dd74a3-62bc-4b9a-9297-3eb5e466c9d8`
   - **Priority:** 50 (Medium)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="52dd74a3-62bc-4b9a-9297-3eb5e466c9d8")`

#### Phase 4: Voice Navigation (6 tasks - 🔴 CRITICAL BUG + 5 new features)
9. **Task:** CRITICAL - Fix missing await on persistence calls
   - **ID:** `fdea07b4-0bcc-4779-a7be-860326f23181`
   - **Priority:** 110 (BLOCKER)
   - **Assignee:** Coding Agent
   - **Retrieve:** `mcp__archon__find_tasks(task_id="fdea07b4-0bcc-4779-a7be-860326f23181")`

10. **Task:** Create voice thread detection utility
    - **ID:** `c551b0a5-9856-4440-ae0c-060dc2f2d06b`
    - **Priority:** 80 (High)
    - **Assignee:** Coding Agent
    - **Retrieve:** `mcp__archon__find_tasks(task_id="c551b0a5-9856-4440-ae0c-060dc2f2d06b")`

11. **Task:** Add voice thread auto-detection to ChatBot
    - **ID:** `9e888e15-b5e4-4bff-a48b-616f2a674058`
    - **Priority:** 75 (High)
    - **Assignee:** Coding Agent
    - **Retrieve:** `mcp__archon__find_tasks(task_id="9e888e15-b5e4-4bff-a48b-616f2a674058")`

12. **Task:** Add visual indicators for voice threads in sidebar
    - **ID:** `df9a9ae9-1627-4cb3-ab26-e06296fd4a84`
    - **Priority:** 60 (Medium)
    - **Assignee:** Coding Agent
    - **Retrieve:** `mcp__archon__find_tasks(task_id="df9a9ae9-1627-4cb3-ab26-e06296fd4a84")`

13. **Task:** Validate Canvas restoration for voice thread reopening
    - **ID:** `1041fcaf-c6e9-4960-9125-60e956caa8b5`
    - **Priority:** 50 (Medium)
    - **Assignee:** QA
    - **Retrieve:** `mcp__archon__find_tasks(task_id="1041fcaf-c6e9-4960-9125-60e956caa8b5")`

14. **Task:** E2E testing for voice thread reopening workflow
    - **ID:** `803478da-1a22-4b67-b699-eae6793bd007`
    - **Priority:** 40 (Medium)
    - **Assignee:** QA
    - **Retrieve:** `mcp__archon__find_tasks(task_id="803478da-1a22-4b67-b699-eae6793bd007")`

#### Testing (1 task)
8. **Task:** Create unit tests for tool routing and persistence
   - **ID:** `95a9db95-b997-4683-9500-4bf5865c930d`
   - **Priority:** 40 (Medium)
   - **Retrieve:** `mcp__archon__find_tasks(task_id="95a9db95-b997-4683-9500-4bf5865c930d")`

**Quick Task Management:**
```bash
# List all tasks
mcp__archon__find_tasks(filter_by="project", filter_value="ca10e121-be60-4c7f-aab1-768f1e5a6d05")

# Start task
mcp__archon__manage_task("update", task_id="<id>", status="doing")

# Complete task
mcp__archon__manage_task("update", task_id="<id>", status="done")
```

---

## Expected Outcomes & Metrics

### User Experience

**Before:**
- ❌ Voice: "Create a chart" → Error
- ❌ Voice conversation → Refresh → Gone
- ❌ Cannot resume voice chats

**After:**
- ✅ Voice: "Create a chart" → Chart renders
- ✅ Voice conversation → Refresh → Preserved
- ✅ Resume voice chats with full context

### Technical Metrics

**Tool Execution:**
- Success rate: 0% → 100%
- Error rate: 100% → 0%
- Supported tools: 1 (voice only) → 22 (voice + app default + MCP)

**Persistence:**
- Message retention: 0% → 100%
- History availability: 0% → 100%
- Cross-session continuity: Not possible → Fully functional

**Database:**
- Voice messages stored: 0 → All
- Searchable transcripts: No → Yes
- Unified chat history: No → Yes

---

## References & Documentation

### Codebase Patterns (Serena Analysis)
- **Text chat persistence:** `src/app/api/chat/route.ts:483-502`
- **Tool loading:** `src/app/api/chat/shared.chat.ts:468`
- **Server actions:** `src/app/api/chat/actions.ts:1-44`
- **Tool kit structure:** `src/lib/ai/tools/tool-kit.ts:34-73`
- **Repository pattern:** `src/lib/db/repository.ts:12`

### OpenAI Realtime API (Web Research)
- **Official Docs:** https://platform.openai.com/docs/guides/realtime
- **conversation.item.create:** https://platform.openai.com/docs/api-reference/realtime-client-events/conversation/item/create
- **Session Management:** https://platform.openai.com/docs/api-reference/realtime-client-events/session/update
- **Community Examples:** OpenAI Developer Forum (2025 discussions)

### Vercel AI SDK
- **Tool Patterns:** https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- **Server Actions:** https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- **Async Generators:** https://ai-sdk.dev/docs/ai-sdk-core/streaming

---

## PRP Confidence Assessment

### Implementation Confidence: 8.5/10

**High Confidence Factors (+8.5):**
- ✅ Root causes clearly identified via codebase analysis
- ✅ Tools ALREADY loaded server-side (simpler than expected)
- ✅ Proven patterns from text chat to follow
- ✅ No database schema changes needed
- ✅ Clear 3-phase implementation path
- ✅ Comprehensive testing strategy
- ✅ All Archon tasks created for tracking
- ✅ Pragmatic scope (no over-engineering)

**Risk Factors (-1.5):**
- ⚠️ Server action async generator pattern (new for voice)
- ⚠️ OpenAI history ordering (needs validation)
- ⚠️ Canvas integration TBD (might need Phase 4)

**Mitigation:**
- Unit tests for async generator execution
- Phased approach allows testing at each stage
- Canvas integration optional (test Phase 1 first)
- Clear rollback strategy for each phase

### One-Pass Implementation Probability: 75%

**Success Factors:**
- Detailed code examples with exact file locations
- Existing patterns clearly referenced
- Web research confirms approach
- Comprehensive validation strategy

**Potential Challenges:**
- First-time async generator consumption in server action
- OpenAI conversation.item.create ordering
- Thread ID synchronization edge cases

---

## Next Steps

### Immediate Actions (Post-PRP)
1. ✅ **Review PRP** with stakeholders
2. 🏗️ **Begin Phase 1** implementation (tool routing fix)
3. 📊 **Monitor Archon tasks** for progress tracking
4. 🧪 **Test after each phase** before proceeding

### Implementation Sequence
1. ✅ **Phase 1** (1.5 hours): Tool routing fix → COMPLETE (QA PASSED)
2. ✅ **Phase 2** (2 hours): Message persistence → COMPLETE (QA PASSED)
3. ✅ **Phase 3** (1.5 hours): History loading → COMPLETE (QA PASSED)
4. 🚨 **Critical Bug Fix** (15 min): Add await to persistence → MUST DO FIRST
5. **Phase 4** (3.75 hours): Voice navigation & reopening → Ready to start after bug fix

### Post-Implementation
1. **Monitor metrics:** Tool success rates, persistence rates
2. **Gather feedback:** User satisfaction with voice chat
3. **Optimize if needed:** Database performance, context window tuning
4. **Document learnings:** Update architecture docs

---

**Document Status:** ✅ Phases 1-3 COMPLETE, Phase 4 Ready for Implementation
**Estimated Time:** 7.75 hours total (5 hours complete, 3.75 hours remaining for Phase 4)
**Risk Level:** Low (phased approach, proven patterns, critical bug identified)
**Business Impact:** Critical (restores core voice chat functionality + enables reopening)

**Archon Integration:** ✅ COMPLETE + UPDATED
- **Project ID:** `ca10e121-be60-4c7f-aab1-768f1e5a6d05`
- **Tasks Created:** 14 tasks total (8 original + 6 Phase 4)
- **Phases Complete:** 1-3 (QA Approved)
- **Phases Remaining:** 4 (blocked on critical bug fix)
- **Document Stored:** `591a039b-150e-41c1-9d7c-396489fccc48`
- **Zero Hunting Required:** All task IDs embedded throughout PRP

### Quick Start Commands

**Retrieve All Tasks:**
```bash
mcp__archon__find_tasks(filter_by="project", filter_value="ca10e121-be60-4c7f-aab1-768f1e5a6d05")
```

**Task Execution Pattern:**
```bash
# 1. Get task details
mcp__archon__find_tasks(task_id="<task-id>")

# 2. Mark as doing
mcp__archon__manage_task("update", task_id="<task-id>", status="doing")

# 3. Implement the task
# ... (follow PRP instructions)

# 4. Mark for QA review
mcp__archon__manage_task("update", task_id="<task-id>", status="review", assignee="QA")

# 5. After QA approval
mcp__archon__manage_task("update", task_id="<task-id>", status="done")
```

**All Task IDs (Copy-Paste Ready):**

**✅ Phases 1-3 (COMPLETE):**
- **Phase 1 Task 1:** `744cd163-8a2d-4ba8-82d4-79ca28441a85` (Tool execution server action) - DONE
- **Phase 1 Task 2:** `e8e8c5b3-0260-4173-a1e2-a60824ebb724` (Tool routing logic) - DONE
- **Phase 2 Task 1:** `946ddeb8-66a2-44b4-a6df-2f7f598036ee` (Persistence server actions) - DONE
- **Phase 2 Task 2:** `4ec9145b-925e-4a1a-a48a-9f21d87528ac` (ThreadId management) - DONE
- **Phase 2 Task 3:** `a1771e15-5f9d-4637-abdb-f267a145ad63` (Lifecycle persistence) - DONE
- **Phase 3 Task 1:** `47819316-716b-46f4-a5b1-2d4fe398c5d5` (History loading action) - DONE
- **Phase 3 Task 2:** `52dd74a3-62bc-4b9a-9297-3eb5e466c9d8` (Send history to OpenAI) - DONE
- **Testing Task:** `95a9db95-b997-4683-9500-4bf5865c930d` (Unit tests) - TODO

**🚨 Phase 4 (READY TO START):**
- **Phase 4 Task 0:** `fdea07b4-0bcc-4779-a7be-860326f23181` (CRITICAL - Fix await bug) - BLOCKER
- **Phase 4 Task 1:** `c551b0a5-9856-4440-ae0c-060dc2f2d06b` (Voice thread detector)
- **Phase 4 Task 2:** `9e888e15-b5e4-4bff-a48b-616f2a674058` (ChatBot auto-detection)
- **Phase 4 Task 3:** `df9a9ae9-1627-4cb3-ab26-e06296fd4a84` (Sidebar indicators)
- **Phase 4 Task 4:** `1041fcaf-c6e9-4960-9125-60e956caa8b5` (Canvas validation)
- **Phase 4 Task 5:** `803478da-1a22-4b67-b699-eae6793bd007` (E2E testing)

---

_This PRP provides comprehensive context for focused, pragmatic implementation through extensive codebase analysis, proven pattern identification, and clear phased execution. No over-engineering - just targeted fixes to restore voice chat feature parity with text chat._
