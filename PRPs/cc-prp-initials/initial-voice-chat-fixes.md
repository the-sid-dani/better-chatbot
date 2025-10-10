# Voice Chat Tool Routing & Persistence Fixes - Initial Plan

**Feature:** Voice Chat Tool Execution, Message Persistence, and Conversation History
**Created:** 2025-10-09
**Priority:** 🔴 CRITICAL - Voice chat completely non-functional
**Complexity:** Medium (pragmatic fixes, no over-engineering)
**Estimated Time:** 4-6 hours (3 focused phases)

---

## Executive Summary

### The Problem (User Impact)

**Voice chat is broken in 3 critical ways:**

1. **Chart tools don't work** - Users get "Client create not found" errors when trying to generate charts via voice
2. **Conversations disappear** - All voice chat history lost on page refresh (stored in React state only)
3. **Can't resume chats** - No way to continue previous voice conversations with context

**Current State:**
- Text chat: ✅ Full persistence, tool support, Canvas integration
- Voice chat: ❌ Broken tools, no persistence, no history

### The Solution (Pragmatic, Not Over-Engineered)

**3-phase focused fix:**

**Phase 1 (CRITICAL - 1.5 hours):** Fix tool routing so charts/code tools work
**Phase 2 (HIGH - 2 hours):** Add basic message persistence
**Phase 3 (MEDIUM - 1.5 hours):** Simple conversation history loading

**Not building:** Complex summarization, advanced context management, audio storage
**Building:** Minimum viable fix for feature parity with text chat

---

## Core Technical Context

### Current Architecture (Better-Chatbot)

**Voice Chat Stack:**
- OpenAI Realtime API (gpt-realtime model)
- WebRTC for audio streaming
- React hooks for state (`use-voice-chat.openai.ts`)
- Server route: `/api/chat/openai-realtime`

**Text Chat Stack (Working Reference):**
- Vercel AI SDK (`streamText`)
- HTTP streaming (SSE)
- Database persistence via `chatRepository`
- Canvas integration via `onData` handler

**Key Discovery from Codebase:**
```typescript
// src/app/api/chat/openai-realtime/route.ts:104-124
// ✅ App default tools ARE ALREADY LOADED server-side!
const appDefaultTools = await loadAppDefaultTools({
  allowedAppDefaultToolkit,
});

const bindingTools = [
  ...openAITools,        // MCP tools
  ...appToolsForOpenAI,  // ✅ Charts, code, web search
  ...DEFAULT_VOICE_TOOLS,
];

// Tools are sent to OpenAI - OpenAI CAN call them
// ❌ Problem is CLIENT-SIDE execution routing
```

---

## Problem Deep Dive

### Issue 1: Tool Routing Bug (CRITICAL)

**Current Flow (Broken):**
```
OpenAI calls: create_pie_chart
     ↓
Voice chat receives: response.function_call_arguments.done
     ↓
clientFunctionCall() checks if DEFAULT_VOICE_TOOLS ❌ No
     ↓
Assumes ALL other tools are MCP tools ❌ WRONG!
     ↓
extractMCPToolId("create_pie_chart")
  → {serverName: "create", toolName: "pie_chart"} ❌ WRONG!
     ↓
callMcpToolByServerNameAction("create", "pie_chart")
     ↓
Error: "Client create not found" ❌ BROKEN
```

**Root Cause (Line 234-240):**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
else {
  // ❌ FALSE ASSUMPTION: Everything not in DEFAULT_VOICE_TOOLS is MCP
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(
    toolId.serverName, // "create" ❌
    toolId.toolName,   // "pie_chart" ❌
    toolArgs,
  );
}
```

**Simple Fix:**
```typescript
// Add middle tier for app default tools
else if (isAppDefaultTool(toolName)) {
  // ✅ NEW: Handle charts, code, web search
  toolResult = await callAppDefaultToolAction(toolName, toolArgs);
} else {
  // MCP tools (has server prefix)
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(...);
}
```

---

### Issue 2: No Message Persistence (CRITICAL)

**Current Behavior:**
```typescript
// Voice chat state: React only
const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);

// On page refresh:
setMessages([]);  // ❌ Everything lost!

// Compare to text chat:
await chatRepository.upsertMessage({...});  // ✅ Persisted
```

**Missing Hooks:**
- User message complete → No database save
- Assistant message complete → No database save
- Tool call complete → No database save

**Simple Fix:** Add 3 persistence calls at right lifecycle moments

---

### Issue 3: No Thread Management (CRITICAL)

**Current State:**
```typescript
// Voice chat hook signature
export function useOpenAIVoiceChat(props?: UseOpenAIVoiceChatProps)

// ❌ No threadId parameter
// ❌ No thread creation
// ❌ No thread persistence
```

**Simple Fix:** Integrate with current text chat thread (don't create parallel system)

---

## Solution Architecture (Pragmatic)

### Design Principle: Reuse Text Chat Patterns

**Don't reinvent:** Text chat already has:
- ✅ Thread management
- ✅ Database persistence
- ✅ Message storage
- ✅ Tool call handling

**Just adapt:** Same patterns for voice chat

---

### Phase 1: Fix Tool Routing (1.5 hours)

**Goal:** Chart and code tools work in voice mode

**Changes:**

**1. Create Server Action** (NEW file)
```typescript
// src/app/api/chat/openai-realtime/actions.ts
"use server";

import { APP_DEFAULT_TOOLS } from "lib/ai/tools/tool-kit";

export async function callAppDefaultToolAction(
  toolName: string,
  args: any
) {
  const tool = (APP_DEFAULT_TOOLS as any).artifacts?.[toolName]
    || (APP_DEFAULT_TOOLS as any).code?.[toolName]
    || (APP_DEFAULT_TOOLS as any).webSearch?.[toolName]
    || (APP_DEFAULT_TOOLS as any).http?.[toolName];

  if (!tool) {
    throw new Error(`App default tool ${toolName} not found`);
  }

  // Handle async generators (chart tools)
  const result = tool.execute(args);

  if (Symbol.asyncIterator in Object(result)) {
    // It's a generator - consume all yields
    let finalValue;
    for await (const value of result) {
      finalValue = value;
    }
    return finalValue;
  }

  // Regular async function
  return await result;
}
```

**2. Add Helper Function**
```typescript
// src/lib/ai/tools/tool-kit.ts
export const APP_DEFAULT_TOOL_NAMES = [
  'create_bar_chart', 'create_line_chart', 'create_pie_chart',
  'create_area_chart', 'create_scatter_chart', 'create_radar_chart',
  'create_funnel_chart', 'create_treemap_chart', 'create_sankey_chart',
  'create_radial_bar_chart', 'create_composed_chart', 'create_geographic_chart',
  'create_gauge_chart', 'create_calendar_heatmap', 'create_ban_chart',
  'createTable', 'mini-javascript-execution', 'python-execution',
  'webSearch', 'webContent', 'http'
];

export function isAppDefaultTool(toolName: string): boolean {
  return APP_DEFAULT_TOOL_NAMES.includes(toolName);
}
```

**3. Update Tool Routing Logic**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts:227-241
import { isAppDefaultTool } from "lib/ai/tools/tool-kit";
import { callAppDefaultToolAction } from "@/app/api/chat/openai-realtime/actions";

if (DEFAULT_VOICE_TOOLS.some((t) => t.name === toolName)) {
  // Voice-specific tools
  switch (toolName) {
    case "changeBrowserTheme":
      setTheme(toolArgs?.theme);
      break;
  }
} else if (isAppDefaultTool(toolName)) {
  // ✅ App default tools (charts, code, web search)
  toolResult = await callAppDefaultToolAction(toolName, toolArgs);
} else {
  // MCP tools (everything else)
  const toolId = extractMCPToolId(toolName);
  toolResult = await callMcpToolByServerNameAction(
    toolId.serverName,
    toolId.toolName,
    toolArgs,
  );
}
```

**Success Criteria:**
- ✅ User can generate charts in voice mode
- ✅ Code execution works in voice mode
- ✅ Web search works in voice mode
- ✅ MCP tools still work
- ❌ Still no persistence (that's Phase 2)

---

### Phase 2: Add Message Persistence (2 hours)

**Goal:** Voice conversations saved to database

**Key Decision: Thread Integration Strategy**

**Simple Approach (Recommended):**
- Voice chat uses CURRENT text chat thread
- Get threadId from appStore
- Same thread shows both voice and text messages
- Unified history

**Implementation:**

**1. Add ThreadId to Voice Chat Hook**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
export function useOpenAIVoiceChat(props?: UseOpenAIVoiceChatProps) {
  // Get current threadId from appStore
  const currentThreadId = appStore(state => state.currentThreadId);
  const threadId = currentThreadId || generateUUID();

  // Rest of hook...
}
```

**2. Add Persistence Calls (3 locations)**
```typescript
import { chatRepository } from "lib/db/repository";

// User message complete
case "conversation.item.input_audio_transcription.completed": {
  updateUIMessage(event.item_id, {...});

  // ✅ NEW: Persist to database
  await chatRepository.upsertMessage({
    threadId,
    id: event.item_id,
    role: "user",
    parts: [{ type: "text", text: event.transcript || "" }],
    metadata: { source: "voice", voice: voice },
  });
  break;
}

// Assistant message complete
case "response.output_audio_transcript.done": {
  updateUIMessage(event.item_id, {...});

  // ✅ NEW: Persist to database
  await chatRepository.upsertMessage({
    threadId,
    id: event.item_id,
    role: "assistant",
    parts: [{ type: "text", text: event.transcript || "" }],
    metadata: { source: "voice" },
  });
  break;
}

// Tool call complete
case "response.function_call_arguments.done": {
  setMessages((prev) => [...prev, message]);
  const toolResult = await clientFunctionCall({...});

  // ✅ NEW: Persist tool call
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
    metadata: { source: "voice" },
  });
  break;
}
```

**Problem: Client-Side Hook Can't Call Server Functions!**

**Solution:** Use Server Actions
```typescript
// Create persistence server action
"use server";

export async function persistVoiceMessageAction(message: {
  threadId: string;
  id: string;
  role: string;
  parts: any[];
  metadata?: any;
}) {
  return await chatRepository.upsertMessage(message);
}

// Call from voice chat hook
await persistVoiceMessageAction({
  threadId,
  id: event.item_id,
  role: "user",
  parts: [{ type: "text", text: event.transcript }],
  metadata: { source: "voice" },
});
```

**Success Criteria:**
- ✅ Voice messages saved to database
- ✅ Can see voice transcripts in text chat after refresh
- ✅ Conversation history preserved
- ❌ Still can't RESUME voice with context (that's Phase 3)

---

### Phase 3: Conversation History Loading (1.5 hours)

**Goal:** Voice chat resumes with previous conversation context

**Approach: Simple Last-N Messages**

**Implementation:**

**1. Load Messages on Start**
```typescript
// src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
const start = useCallback(async () => {
  setIsLoading(true);
  setMessages([]);

  // ✅ NEW: Load recent history
  const recentMessages = await loadThreadMessagesAction(threadId, 20);
  setMessages(recentMessages);  // Populate UI

  const session = await createSession();
  // ... rest of connection logic
}, [threadId]);
```

**2. Send History to OpenAI**
```typescript
dc.addEventListener("open", async () => {
  // ✅ NEW: Send conversation history BEFORE session config
  for (const msg of recentMessages) {
    const historyEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: msg.role,
        content: [{
          type: msg.role === "user" ? "input_text" : "text",
          text: extractTextFromParts(msg.parts),
        }],
      },
    };
    dc.send(JSON.stringify(historyEvent));
  }

  // THEN send session config (existing code)
  dc.send(JSON.stringify({
    type: "session.update",
    session: {...},
  }));
});
```

**3. Create Server Action for Loading**
```typescript
// src/app/api/chat/openai-realtime/actions.ts
"use server";

export async function loadThreadMessagesAction(
  threadId: string,
  limit: number = 20
) {
  const thread = await chatRepository.selectThreadDetails(threadId);
  const messages = thread?.messages || [];

  // Return last N messages (simple truncation)
  return messages.slice(-limit).map(msg => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    completed: true,
  }));
}
```

**Success Criteria:**
- ✅ Voice chat resumes with last 20 messages
- ✅ OpenAI has conversation context
- ✅ Natural conversation flow

---

## Architecture Decisions (Keep It Simple)

### ADR-1: Thread Management
**Decision:** Reuse current text chat threadId
**Rationale:** Simpler than dual-thread system, unified history
**Implementation:** Get from `appStore.currentThreadId`

### ADR-2: Tool Execution
**Decision:** Server actions for all tools (security + async generator support)
**Rationale:** Matches text chat pattern, handles generators properly
**Implementation:** `callAppDefaultToolAction()` server action

### ADR-3: Persistence Pattern
**Decision:** Mirror text chat persistence hooks
**Rationale:** Proven pattern, already works, minimal new code
**Implementation:** `persistVoiceMessageAction()` server action

### ADR-4: History Loading
**Decision:** Simple last-N messages (N=20)
**Rationale:** No over-engineering, good enough for MVP
**Implementation:** Load from database, send via `conversation.item.create`

### ADR-5: Canvas Integration
**Decision:** DEFER to Phase 4 (optional)
**Rationale:** Tool routing fix might be enough (existing polling may work)
**Implementation:** TBD after Phase 1 testing

---

## Implementation Plan

### Phase 1: Tool Routing Fix (1.5 hours)

**Files to Create:**
1. `src/app/api/chat/openai-realtime/actions.ts`

**Files to Modify:**
1. `src/lib/ai/tools/tool-kit.ts` - Export tool names list
2. `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` - Update routing logic

**Steps:**
1. Create `callAppDefaultToolAction()` server action with async generator support
2. Create `isAppDefaultTool()` helper with tool names list
3. Update `clientFunctionCall()` with 3-tier routing (voice → app default → MCP)
4. Test with chart generation in voice mode
5. Verify MCP tools still work
6. Verify voice tools still work

**Testing:**
```bash
# Manual test in voice mode
1. Open voice chat
2. Say: "Create a pie chart of sales data"
3. Expect: Chart tool executes successfully
4. Verify: No "Client create not found" error
```

---

### Phase 2: Message Persistence (2 hours)

**Files to Create:**
1. `src/app/api/chat/openai-realtime/persistence-actions.ts`

**Files to Modify:**
1. `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` - Add persistence calls

**Steps:**
1. Create `persistVoiceMessageAction()` server action
2. Add threadId management (get from appStore or create new)
3. Persist user messages on `input_audio_buffer.committed`
4. Persist assistant messages on `response.output_audio_transcript.done`
5. Persist tool calls on tool completion
6. Test persistence with database inspection

**Database Schema (Verify Compatibility):**
```typescript
// Current schema from analysis:
ChatMessageSchema {
  id: string,
  threadId: string,
  role: "user" | "assistant",
  parts: JSONB,  // ✅ Can store voice message parts
  metadata: JSONB, // ✅ Can store {source: "voice", voice: "marin"}
}

// ✅ NO SCHEMA CHANGES NEEDED
```

**Testing:**
```bash
# Manual test
1. Voice chat conversation
2. Refresh page
3. Check database: pnpm db:studio
4. Verify messages saved with metadata.source = "voice"
```

---

### Phase 3: History Loading (1.5 hours)

**Files to Modify:**
1. `src/app/api/chat/openai-realtime/persistence-actions.ts` - Add loading function
2. `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` - Load and send history

**Steps:**
1. Create `loadThreadMessagesAction()` server action (last 20 messages)
2. Load messages in `start()` callback
3. Send to OpenAI via `conversation.item.create` before session config
4. Handle tool calls in history (function_call item type)
5. Test conversation resumption

**OpenAI API Pattern (From Community Research):**
```typescript
// Send conversation history BEFORE session.update
{
  type: "conversation.item.create",
  item: {
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: "Hello" }]
  }
}

// For tool calls in history:
{
  type: "conversation.item.create",
  item: {
    type: "function_call",
    name: "create_pie_chart",
    arguments: "{\"title\":\"Sales\"...}",
    call_id: "call_123"
  }
}

// For tool results:
{
  type: "conversation.item.create",
  item: {
    type: "function_call_output",
    call_id: "call_123",
    output: "{\"success\":true...}"
  }
}
```

**Limitations (Don't Over-Engineer):**
- Last 20 messages only (no summarization)
- Text transcripts only (no audio replay)
- Simple truncation (no smart context window management)
- Good enough for MVP

**Testing:**
```bash
# Manual test
1. Voice chat with 5+ messages
2. Stop voice chat
3. Refresh page
4. Start voice chat again
5. Verify: OpenAI responds with context of previous conversation
```

---

## Technical Prerequisites

### Required Dependencies
✅ All already installed:
- OpenAI SDK (for Realtime API)
- Drizzle ORM (database)
- Better-Auth (sessions)
- Vercel AI SDK (tool patterns)

### Environment Variables
✅ Already configured:
- `OPENAI_API_KEY` - For Realtime API
- `POSTGRES_URL` - For persistence

### Database Schema
✅ NO CHANGES NEEDED:
- Current `ChatMessageSchema` supports voice messages
- Metadata field can store voice-specific data
- Parts JSONB can store tool calls

---

## File Organization

### New Files (2)
```
src/app/api/chat/openai-realtime/
├── route.ts                    (existing)
├── actions.ts                  (NEW - tool execution)
└── persistence-actions.ts      (NEW - message persistence)
```

### Modified Files (2)
```
src/lib/ai/speech/open-ai/
└── use-voice-chat.openai.ts   (MODIFY - add routing + persistence)

src/lib/ai/tools/
└── tool-kit.ts                (MODIFY - export tool names)
```

**Total:** 2 new files, 2 modified files

---

## Integration Points

### 1. With Text Chat
- **Shared:** threadId, chatRepository, message schema
- **Different:** Execution context (client vs server), transport (WebRTC vs HTTP)
- **Integration:** appStore for threadId sharing

### 2. With Canvas (Optional - Phase 4)
- **Option A:** Existing polling may work after Phase 1 fix
- **Option B:** Add explicit Canvas triggering in tool result handling
- **Decision:** Test after Phase 1, only implement if needed

### 3. With Database
- **Repository:** `chatRepository` (existing)
- **Methods:** `upsertMessage`, `selectThreadDetails` (existing)
- **Schema:** No changes needed

### 4. With Observability
- **Consider:** Add Langfuse tracing for voice chat
- **Scope:** Out of scope for MVP (text chat already has it)
- **Future:** Separate enhancement

---

## Risk Analysis & Mitigations

### HIGH RISK

**R1: Async Generator Execution in Server Actions**
- **Risk:** Complex to handle chart tool generators
- **Mitigation:** Consume all yields, return final value
- **Fallback:** Wrap in try-catch, return error object
- **Testing:** Unit tests for generator consumption

**R2: Thread ID Synchronization**
- **Risk:** Voice and text might have different threadIds
- **Mitigation:** Use appStore as single source of truth
- **Fallback:** Create new thread if none exists
- **Testing:** Verify threadId consistency

### MEDIUM RISK

**R3: OpenAI conversation.item.create Ordering**
- **Risk:** History must be sent BEFORE session config
- **Mitigation:** Sequential sends with delays
- **Fallback:** Retry if session.updated not received
- **Testing:** Log OpenAI event sequence

**R4: Database Write Performance**
- **Risk:** Frequent writes during long conversations
- **Mitigation:** Use existing optimized upsertMessage
- **Fallback:** Batch writes if needed (future optimization)
- **Testing:** Monitor database performance

### LOW RISK

**R5: Browser Compatibility**
- **Risk:** WebRTC not universally supported
- **Mitigation:** Already handled (existing voice chat works)
- **Fallback:** Feature detection, graceful degradation

---

## Testing Strategy

### Unit Tests (Phase 1)
```typescript
// tests/voice-chat-tool-routing.test.ts
describe("Voice Chat Tool Routing", () => {
  it("routes app default tools correctly", () => {
    expect(isAppDefaultTool("create_pie_chart")).toBe(true);
    expect(isAppDefaultTool("webSearch")).toBe(true);
    expect(isAppDefaultTool("audience-insights__get_data")).toBe(false);
  });

  it("executes chart tools via server action", async () => {
    const result = await callAppDefaultToolAction("create_pie_chart", {
      title: "Test",
      data: [{label: "A", value: 10}]
    });
    expect(result).toHaveProperty("shouldCreateArtifact", true);
  });
});
```

### Integration Tests (Phase 2)
```typescript
describe("Voice Chat Persistence", () => {
  it("saves user message to database", async () => {
    await persistVoiceMessageAction({
      threadId: "test-thread",
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    });

    const thread = await chatRepository.selectThreadDetails("test-thread");
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0].metadata.source).toBe("voice");
  });
});
```

### E2E Tests (Phase 3)
```typescript
describe("Voice Chat History", () => {
  it("resumes conversation with context", async () => {
    // 1. Create conversation with history
    // 2. Start new voice session
    // 3. Verify OpenAI receives previous messages
    // 4. Verify responses reference previous context
  });
});
```

### Manual Testing Checklist
- [ ] Chart generation works in voice mode
- [ ] Code execution works in voice mode
- [ ] Web search works in voice mode
- [ ] MCP tools still work
- [ ] Messages persist after refresh
- [ ] Can resume voice chat with context
- [ ] Text chat unaffected
- [ ] Canvas opens for voice charts (if Phase 4)

---

## Performance & Cost Considerations

### Database Impact
- **Write frequency:** ~2-4 writes per voice exchange (user + assistant)
- **Volume:** Similar to text chat
- **Optimization:** Use existing upsertMessage (already optimized)

### OpenAI API Costs
- **History loading:** ~20 messages × ~100 tokens = 2000 tokens/session
- **Cost:** Minimal (input tokens are cheap)
- **Optimization:** Truncate to last 20 messages (reasonable context)

### Browser Performance
- **State:** Minimal increase (already managing messages)
- **Memory:** No audio storage (transcripts only)
- **Cleanup:** Existing cleanup hooks sufficient

**Verdict:** ✅ No significant performance concerns

---

## Migration & Backward Compatibility

### Existing Voice Sessions
- **Current:** In-progress sessions unaffected (in-memory only)
- **After deployment:** New sessions use persistence
- **Impact:** Zero (no breaking changes)

### Database
- **Schema:** No changes needed ✅
- **Migration:** Not required
- **Rollback:** Simple (remove new code, no data corruption)

### User Experience
- **Upgrade:** Transparent (just works better)
- **Rollback:** No data loss (persistence additive)

**Verdict:** ✅ Zero migration risk

---

## What We're NOT Building (Scope Boundaries)

❌ **Audio file storage** - Only transcripts (good enough)
❌ **Advanced summarization** - Simple truncation to last 20 messages
❌ **Voice/text mode switching UI** - Use existing patterns
❌ **Conversation threading** - Reuse existing thread system
❌ **Advanced context management** - OpenAI handles that
❌ **Audio playback of history** - Text transcripts only
❌ **Voice-specific UI enhancements** - Fix functionality first
❌ **Langfuse integration** - Text chat has it, voice can wait

---

## Success Metrics

### Phase 1 Success
- Tool execution error rate: 100% → 0%
- Chart tools working in voice: 0% → 100%
- User frustration: High → Low

### Phase 2 Success
- Message persistence rate: 0% → 100%
- History retention after refresh: 0% → 100%
- Searchable voice transcripts: 0% → 100%

### Phase 3 Success
- Conversation resumption: Not possible → Fully functional
- Context preservation: None → Last 20 messages
- User experience: Frustrated → Satisfied

---

## Implementation Sequence

### Week 1: Core Fixes
**Monday-Tuesday (3 hours):**
- Phase 1: Tool routing fix
- Deploy and test

**Wednesday-Thursday (2 hours):**
- Phase 2: Message persistence
- Deploy and monitor

### Week 2: History Support
**Monday (1.5 hours):**
- Phase 3: History loading
- Full E2E testing

**Tuesday (Optional):**
- Phase 4: Canvas integration (only if polling doesn't work)
- Final validation

---

## Validation Commands

### Development
```bash
pnpm dev                    # Start dev server
pnpm check-types           # TypeScript validation
pnpm lint                  # Code quality
pnpm test                  # Unit tests
```

### Feature-Specific
```bash
# Database inspection
pnpm db:studio             # Verify message persistence

# Voice chat testing
# 1. Open http://localhost:3000
# 2. Click Tool button (voice chat)
# 3. Say: "Create a pie chart"
# 4. Verify: Chart generates successfully
# 5. Refresh page
# 6. Check: Messages still in database
# 7. Start voice chat again
# 8. Verify: Conversation continues with context
```

---

## Known Constraints (OpenAI Realtime API)

### From Community Research (2025)

**1. History Format:**
- ✅ Text messages: Fully supported
- ❌ Audio messages: NOT supported (must use transcripts)
- ✅ Tool calls: Supported as function_call type
- ✅ Function outputs: Supported

**2. Context Window:**
- Limit: 128k tokens
- Recommendation: 20-30 message history sufficient
- Performance: Degrades with large context
- Strategy: Simple truncation (don't over-engineer)

**3. Stateless Sessions:**
- Each WebRTC connection = fresh session
- History must be sent every time
- No server-side persistence by OpenAI
- We handle all persistence

---

## References & Resources

### Codebase Patterns
- **Text chat persistence:** `src/app/api/chat/route.ts:433-438`
- **Tool loading:** `src/app/api/chat/shared.chat.ts:468-571`
- **Repository pattern:** `src/lib/db/repository/chat.repository.ts`
- **Server actions:** `src/app/api/chat/actions.ts`

### External Resources
- **OpenAI Realtime API:** https://platform.openai.com/docs/guides/realtime
- **Community Discussions:** OpenAI Developer Forum (2025 threads)
- **Vercel AI SDK:** https://ai-sdk.dev/docs (tool patterns)

---

## Confidence Assessment

**Implementation Feasibility:** 8/10
- ✅ Clear root causes identified
- ✅ Proven patterns to follow (text chat)
- ✅ No schema changes needed
- ⚠️ Server action for generators (new pattern)
- ⚠️ OpenAI API history ordering (needs testing)

**Scope Completeness:** 9/10
- ✅ All critical issues addressed
- ✅ Pragmatic approach (no over-engineering)
- ✅ Clear phase boundaries
- ✅ Risks identified with mitigations
- ⚠️ Canvas integration TBD (depends on Phase 1 results)

**Success Probability:** 85%
- High confidence in Phase 1 (tool routing is straightforward)
- Medium confidence in Phase 2 (server actions pattern new for voice)
- Medium confidence in Phase 3 (OpenAI API ordering needs validation)

---

## Next Steps

**Immediate:**
1. ✅ Review this initial plan
2. 📋 Create full PRP with implementation details
3. 🎯 Create Archon project for tracking
4. 🏗️ Begin Phase 1 implementation

**After PRP Generation:**
1. Implement Phase 1 (tool routing)
2. Test and validate
3. Implement Phase 2 (persistence)
4. Test and validate
5. Implement Phase 3 (history)
6. Full E2E validation
7. Deploy to production

---

**Document Status:** ✅ Ready for PRP Generation
**Approach:** Pragmatic, focused, non-over-engineered
**Foundation Quality:** 9/10 (comprehensive yet actionable)

---

_This initial plan provides a solid foundation for PRP generation with clear scope, proven patterns, and pragmatic implementation approach. No over-engineering - just focused fixes to restore voice chat functionality with feature parity to text chat._
