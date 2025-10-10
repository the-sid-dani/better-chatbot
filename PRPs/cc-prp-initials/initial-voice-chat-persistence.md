# Voice Chat Persistence & Tool Routing Issues - Initial Analysis

**Date:** 2025-10-09
**Discovered During:** Canvas Chart Output Capture Fix testing
**Severity:** 🔴 CRITICAL - Voice chat completely non-functional
**Status:** Analysis Complete - Ready for PRP

---

## 🚨 Critical Issues Identified

### Issue 1: Voice Chat Messages Never Persisted (CRITICAL)

**Problem:**
Voice chat conversations are ONLY stored in React state, never persisted to database. When user refreshes page, all voice chat history is lost.

**Evidence:**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
// ❌ NO chatRepository.upsertMessage() calls anywhere
// ✅ Text chat: src/app/api/chat/route.ts:433-438 has full persistence
```

**User Impact:**
- All voice conversations lost on refresh
- No conversation history
- Can't resume voice chats
- No searchable transcript archive

---

### Issue 2: App Default Tools Routed Through MCP Manager (CRITICAL)

**Problem:**
Voice chat incorrectly treats ALL chart tools as MCP tools, causing tool resolution failures.

**Root Cause (Line 234-240):**
```typescript
// ❌ INCORRECT: Treats ALL non-voice tools as MCP tools
const toolId = extractMCPToolId(toolName);
toolResult = await callMcpToolByServerNameAction(
  toolId.serverName,  // "create" (WRONG!)
  toolId.toolName,    // "pie_chart" (WRONG!)
  toolArgs,
);
```

**What Happens:**
1. AI calls tool: `create_pie_chart`
2. Voice chat calls: `extractMCPToolId("create_pie_chart")`
3. Splits as: `{serverName: "create", toolName: "pie_chart"}`
4. Tries to find MCP server called "create"
5. Error: `"Client create not found"`

**User Impact:**
- Chart tools completely broken in voice mode
- Code execution tools broken in voice mode
- Only MCP tools work (by accident)

---

### Issue 3: Missing Conversation History API Support

**Problem:**
OpenAI Realtime API now supports conversation history via `conversation.item.create`, but implementation doesn't use it.

**Current State:**
```typescript
// Voice chat starts fresh every time
setMessages([]);  // Line 482 - Clears all messages

// ❌ No conversation loading from database
// ❌ No conversation.item.create for history restoration
```

**OpenAI Realtime API Capabilities (New):**
- `conversation.item.create` - Add historical messages
- Multi-turn conversation support
- Context preservation across sessions

---

## 🏗️ Architecture Comparison

### Text Chat (Working)
```
User Input → /api/chat → streamText → Tool Loading Pipeline
                ↓                           ↓
         chatRepository.upsertMessage   APP_DEFAULT_TOOLS
                                          MCP_TOOLS
                                       WORKFLOW_TOOLS
         ✅ Persisted              ✅ Correct routing
         ✅ Searchable            ✅ All tools work
         ✅ Restorable            ✅ Canvas integration
```

### Voice Chat (Broken)
```
User Voice → WebRTC → OpenAI Realtime → Tool Call
                ↓                           ↓
         React State ONLY      extractMCPToolId(toolName)
                                          ↓
         ❌ NOT persisted      callMcpToolByServerNameAction
         ❌ Lost on refresh        ↓
         ❌ No history        ❌ WRONG! Charts aren't MCP tools
```

---

## 🔍 Root Cause Analysis

### Why Voice Chat Was Built This Way

**Original Design (Pre-Realtime API):**
- Voice chat was meant for quick Q&A
- Ephemeral conversations
- Limited tool support
- No history needed

**Current Reality (Post-Realtime API + Canvas):**
- Users expect full feature parity
- Chart tools should work everywhere
- Conversations should be saved
- History should be restorable

### The Missing Layer

**Text Chat Has:**
```typescript
// src/app/api/chat/route.ts:433-438
await chatRepository.upsertMessage({
  threadId: thread!.id,
  ...responseMessage,
  parts: responseMessage.parts.map(convertToSavePart),
  metadata,
});
```

**Voice Chat Needs:**
```typescript
// MISSING IN use-voice-chat.openai.ts
// Should persist on:
// 1. input_audio_buffer.committed (user message complete)
// 2. response.output_audio_transcript.done (assistant message complete)
// 3. response.function_call_arguments.done (tool call complete)
```

---

## 💡 Solution Architecture

### Solution 1: Add Persistence Layer

**Where:** `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`

**Add Database Persistence:**
```typescript
import { chatRepository } from "lib/db/repository";

// In handleServerEvent callback:
case "input_audio_buffer.committed": {
  // Create thread if doesn't exist
  const thread = await chatRepository.getOrCreateThread(threadId);

  // Persist user message
  await chatRepository.upsertMessage({
    threadId: thread.id,
    id: event.item_id,
    role: "user",
    parts: [{ type: "text", text: transcription }],
  });
  break;
}

case "response.output_audio_transcript.done": {
  // Persist assistant message
  await chatRepository.upsertMessage({
    threadId: thread.id,
    id: event.item_id,
    role: "assistant",
    parts: [{ type: "text", text: event.transcript }],
  });
  break;
}
```

---

### Solution 2: Fix Tool Routing

**Problem Code (Lines 227-241):**
```typescript
if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
  // Handle voice-specific tools
} else {
  // ❌ ASSUMES ALL other tools are MCP tools
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(
    toolId.serverName,
    toolId.toolName,
    toolArgs,
  );
}
```

**Fixed Code:**
```typescript
// Check tool type hierarchy
if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
  // Voice-specific tools (changeBrowserTheme, etc.)
  switch (toolName) {
    case "changeBrowserTheme":
      setTheme(toolArgs?.theme);
      break;
  }
} else if (isAppDefaultTool(toolName)) {
  // ✅ NEW: App default tools (charts, code execution, etc.)
  toolResult = await callAppDefaultToolAction(toolName, toolArgs);
} else {
  // MCP tools
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(
    toolId.serverName,
    toolId.toolName,
    toolArgs,
  );
}
```

**Required:**
- Create `callAppDefaultToolAction()` server action
- Check if tool exists in `APP_DEFAULT_TOOL_KIT`
- Execute directly (not through MCP manager)

---

### Solution 3: Conversation History Restoration

**OpenAI Realtime API Support:**
```typescript
// On voice chat start, load history from database
const start = useCallback(async () => {
  const thread = await chatRepository.selectThreadDetails(threadId);
  const historicalMessages = thread?.messages || [];

  // After WebRTC connection established
  dc.addEventListener("open", () => {
    // Send conversation history to OpenAI
    for (const msg of historicalMessages) {
      const event = {
        type: "conversation.item.create",
        item: {
          type: msg.role === "user" ? "message" : "assistant",
          role: msg.role,
          content: [
            {
              type: "input_text",  // or "text" for assistant
              text: extractTextFromParts(msg.parts),
            },
          ],
        },
      };
      dc.send(JSON.stringify(event));
    }

    // THEN send session config
    // ...existing config code...
  });
});
```

---

## 🎯 Implementation Priority

### Phase 1: Fix Tool Routing (1-2 hours)
**Priority:** 🔴 CRITICAL
**Impact:** Enables chart tools in voice mode
**Complexity:** Medium
**Dependencies:** None

**Tasks:**
1. Create `callAppDefaultToolAction()` server action
2. Add `isAppDefaultTool()` helper function
3. Update tool routing logic in `clientFunctionCall`
4. Test with chart generation in voice mode

---

### Phase 2: Add Message Persistence (2-3 hours)
**Priority:** 🔴 CRITICAL
**Impact:** Voice chat history saved/restorable
**Complexity:** Medium-High
**Dependencies:** Phase 1 (tool routing must work first)

**Tasks:**
1. Add thread management to voice chat
2. Persist user messages on `input_audio_buffer.committed`
3. Persist assistant messages on `response.done`
4. Persist tool calls on `response.function_call_arguments.done`
5. Handle conversation metadata (usage, timing)

---

### Phase 3: Conversation History Loading (1-2 hours)
**Priority:** 🟡 HIGH
**Impact:** Resume voice chats with context
**Complexity:** Medium
**Dependencies:** Phase 2 (persistence must exist)

**Tasks:**
1. Load thread messages from database
2. Convert to OpenAI Realtime format
3. Send via `conversation.item.create` before session config
4. Handle large conversation truncation
5. Implement conversation.item pagination

---

## 📊 Current vs Target State

### Current State (Voice Chat)
- ❌ Messages: React state only
- ❌ Persistence: None
- ❌ History: Lost on refresh
- ❌ Chart tools: Broken (MCP routing error)
- ❌ Code tools: Broken (MCP routing error)
- ✅ MCP tools: Work (accidentally)
- ❌ Canvas integration: Broken

### Target State (After Fix)
- ✅ Messages: Persisted to PostgreSQL
- ✅ Persistence: Real-time via chatRepository
- ✅ History: Restorable via OpenAI API
- ✅ Chart tools: Work via app default routing
- ✅ Code tools: Work via app default routing
- ✅ MCP tools: Continue working
- ✅ Canvas integration: Works with streaming fix

---

## 🔄 Integration with Canvas Fix

**Good News:** Canvas fix is compatible!

The Canvas fix I implemented (onStepFinish + onData) works for TEXT CHAT mode. Voice chat would need:

1. **Different integration point** - Voice chat uses WebRTC, not HTTP streaming
2. **Tool result handling** - Voice chat gets results via `function_call_output`
3. **Canvas trigger** - Same detection logic can work once tools execute

**After voice chat fixes:**
```typescript
// In use-voice-chat.openai.ts
case "response.function_call_arguments.done": {
  // Execute tool
  const toolResult = await executeToolCorrectly(toolName, args);

  // ✅ If chart tool with shouldCreateArtifact, trigger Canvas
  if (isChartTool(toolName) && toolResult?.shouldCreateArtifact) {
    addCanvasArtifact({
      id: toolResult.chartId,
      type: "chart",
      data: toolResult.chartData,
      // ... etc
    });
  }

  // Persist tool call to database
  await chatRepository.upsertMessage(/* ... */);

  break;
}
```

---

## 📋 Recommended Next Steps

### Option 1: Fix Voice Chat Now (5-6 hours total)
**Pros:**
- Feature parity between text and voice
- Complete solution
- Canvas works in voice mode

**Cons:**
- Significant time investment
- Multiple complex integrations
- Requires OpenAI Realtime API research

### Option 2: Document & Defer (30 minutes)
**Pros:**
- Canvas fix (text mode) is complete
- Voice chat can be separate project
- Clear scope separation

**Cons:**
- Voice chat remains broken
- User confusion (why doesn't voice work?)

### Option 3: Quick Fix Tool Routing Only (1-2 hours)
**Pros:**
- Enables chart tools in voice mode
- Smaller scope than full fix
- Immediate user value

**Cons:**
- Still no persistence
- History still lost
- Partial solution

---

## 🎯 My Recommendation

**Defer voice chat fixes to separate project:**

1. **Canvas Fix (Text Chat)** - ✅ COMPLETE & READY
   - All critical code implemented
   - QA approved
   - Ready for production

2. **Voice Chat Fixes** - 🔴 NEW PROJECT NEEDED
   - Create separate PRP
   - Comprehensive fix (persistence + tool routing + history)
   - Estimated: 5-6 hours implementation
   - Requires OpenAI Realtime API research

**Rationale:**
- Canvas fix solves the PRIMARY user pain (charts not rendering)
- Text chat is main usage mode (voice is enhancement)
- Voice chat issues are architectural (not quick fixes)
- Better to deliver complete text chat fix now
- Voice chat deserves full attention in dedicated project

---

## 📝 Voice Chat Fix Scope (Future PRP)

**Title:** "Voice Chat Persistence & Tool Integration Fix"

**Phases:**
1. Tool Routing Fix (2 hours)
   - Create app default tool routing
   - Fix chart tool execution
   - Fix code tool execution

2. Message Persistence (3 hours)
   - Thread management integration
   - Real-time message persistence
   - Tool call persistence
   - Metadata tracking

3. Conversation History (1-2 hours)
   - History loading from database
   - OpenAI conversation.item.create integration
   - Pagination for large conversations

4. Canvas Integration (1 hour)
   - Chart tool detection
   - Canvas artifact creation
   - Same streaming pattern as text chat

5. Testing (1-2 hours)
   - Tool execution tests
   - Persistence tests
   - History restoration tests
   - E2E voice chat tests

**Total Estimate:** 8-10 hours

---

## 🔍 Technical Details

### Issue 1: Missing Persistence Hooks

**Where Persistence Should Happen:**
```typescript
// User message complete
case "input_audio_buffer.committed": {
  await chatRepository.upsertMessage({
    threadId,
    id: event.item_id,
    role: "user",
    parts: [{ type: "text", text: transcript }],
  });
}

// Assistant message complete
case "response.output_audio_transcript.done": {
  await chatRepository.upsertMessage({
    threadId,
    id: event.item_id,
    role: "assistant",
    parts: [{ type: "text", text: event.transcript }],
  });
}

// Tool call complete
case "response.function_call_arguments.done": {
  await chatRepository.upsertMessage({
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
  });
}
```

---

### Issue 2: Tool Routing Logic

**Current (Broken):**
```typescript
if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
  // Voice tools (only changeBrowserTheme)
} else {
  // ❌ Assumes EVERYTHING else is MCP
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(...);
}
```

**Required (Fixed):**
```typescript
if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
  // Voice-specific tools
  toolResult = handleVoiceTool(toolName, toolArgs);
} else if (APP_DEFAULT_TOOL_NAMES.includes(toolName)) {
  // ✅ App default tools (charts, code, web search)
  toolResult = await callAppDefaultToolAction(toolName, toolArgs);
} else {
  // MCP tools (has server prefix like "audience-insights__get_data")
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(...);
}
```

**Required Actions:**
1. Create `APP_DEFAULT_TOOL_NAMES` constant
2. Create `callAppDefaultToolAction()` server action
3. Import from `/api/chat/openai-realtime/route.ts`

---

### Issue 3: History Restoration Pattern

**OpenAI Realtime API Pattern:**
```typescript
// After connection established
dc.addEventListener("open", async () => {
  // 1. Load historical messages
  const thread = await loadThread(threadId);
  const messages = thread?.messages || [];

  // 2. Send history to OpenAI
  for (const msg of messages.slice(-20)) {  // Last 20 messages
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        id: msg.id,
        type: msg.role === "user" ? "message" : "assistant",
        role: msg.role,
        content: extractContent(msg.parts),
      },
    }));
  }

  // 3. THEN send session config
  dc.send(JSON.stringify({
    type: "session.update",
    session: { /* config */ },
  }));
});
```

---

## 🎯 Immediate Recommendation

**FOR THIS SESSION:**
1. **Complete Canvas Fix validation** - Use TEXT CHAT mode
2. **Document voice chat issues** - This analysis
3. **Create Archon project** - Voice Chat Persistence Fix
4. **Schedule dedicated session** - Voice chat implementation

**TESTING WORKAROUND:**
To test the Canvas fix right now:
- Avoid voice chat mode
- Use regular text chat input
- All chart tools work in text mode
- Canvas integration fully functional

---

## 📚 References

**OpenAI Realtime API:**
- Conversation Items: https://platform.openai.com/docs/api-reference/realtime-client-events/conversation/item/create
- Session Management: https://platform.openai.com/docs/api-reference/realtime-client-events/session/update

**Related Files:**
- Voice chat hook: `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
- Realtime API route: `src/app/api/chat/openai-realtime/route.ts`
- Text chat persistence: `src/app/api/chat/route.ts:433-438`
- Chat repository: `src/lib/db/repository/chat.repository.ts`

---

**Status:** Analysis complete - Ready for separate PRP creation
**Estimated Fix Time:** 8-10 hours (full solution)
**Quick Fix Option:** 2 hours (tool routing only)
