# Voice Agent Multi-Provider Integration & Canvas Enhancement

## FEATURE:

**Multi-Provider Voice Agent System with Enhanced Canvas Integration**

Transform the current single-provider (OpenAI beta) voice implementation into a sophisticated multi-provider voice system supporting OpenAI (GA Realtime API), Google Gemini Live, and future xAI integration. Enhance with seamless Canvas integration, streaming transcription, improved tool calling, and voice-optimized web search capabilities.

### Core Enhancements:
1. **Multi-Provider Architecture**: Abstract voice provider interface with OpenAI, Google, and xAI support
2. **Canvas Voice Integration**: Direct voice-to-chart creation with auto-Canvas opening
3. **Streaming Transcription**: Real-time text display during speech processing
4. **Enhanced Tool Calling**: Leverage latest Realtime API's 82.8% accuracy improvement
5. **Smart Conversation Management**: Context-aware memory with intelligent summarization
6. **Voice-Optimized Web Tools**: Search results formatted for audio delivery

## TOOLS:

### Provider-Specific Tools

#### OpenAI Realtime Provider
- **Model**: `gpt-4o-realtime-preview-2024-12-17` (GA version)
- **Voices**: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `cedar`, `marin`
- **Capabilities**: 60-minute sessions, 128K context window, native MCP integration
- **Tool Functions**:
  ```typescript
  create_voice_chart(chartType, data, title, voiceContext)
  voice_web_search(query, responseFormat)
  manage_canvas_workspace(action, artifacts)
  ```

#### Google Gemini Live Provider
- **Model**: `gemini-2.5-flash` (cost-effective) / `gemini-2.5-pro` (advanced)
- **Capabilities**: 120-minute sessions, 1M-2M token context, 45+ languages
- **Tool Functions**:
  ```typescript
  gemini_function_call(functionName, parameters)
  gemini_multimodal_analysis(imageData, audioData)
  gemini_workspace_integration(workspaceTools)
  ```

#### Canvas Integration Tools (CRITICAL MISSING FEATURE)
**Current Gap**: `chat-bot-voice.tsx` lacks Canvas integration that exists in `chat-bot.tsx`

**Required Canvas Integration**:
- **Import Canvas System**: Add `useCanvas` hook and `CanvasPanel` component to voice chat
- **Layout Transformation**: Replace full-screen Drawer with ResizablePanelGroup split view
- **Chart Tool Detection**: Monitor for 17 chart tool types (create_chart, create_area_chart, etc.)
- **Canvas Artifact Creation**: Transform voice tool results into Canvas artifacts
- **Auto-Canvas Opening**: Voice-triggered Canvas display when chart tools execute

**Tool Functions Needed**:
  ```typescript
  // Voice chat needs same Canvas integration as regular chat
  create_voice_chart(chartType, data, title, voiceContext) // Voice-optimized chart creation
  auto_open_canvas_on_chart_tools() // Automatic Canvas opening for voice
  voice_canvas_artifact_creation(toolResult) // Convert voice tool results to Canvas artifacts
  ```

### Enhanced Web Tools
- **Voice Search**: `voice_web_search` with conversational/bullet/brief formats
- **Result Processing**: Voice-optimized summary generation
- **Integration**: Seamless MCP server utilization for search capabilities

### Streaming Tools
- **Transcription Handler**: Real-time partial transcription display
- **Audio Processing**: Enhanced WebRTC and WebSocket streaming
- **Context Management**: Smart conversation history with auto-summarization

## DEPENDENCIES:

### API Keys & Authentication
```env
# Voice Provider API Keys
OPENAI_API_KEY=your_openai_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
XAI_API_KEY=your_xai_key_here  # When available

# Voice Feature Flags
ENABLE_VOICE_CANVAS_INTEGRATION=true
ENABLE_STREAMING_TRANSCRIPTION=true
ENABLE_MULTI_PROVIDER_VOICE=true
DEFAULT_VOICE_PROVIDER=openai
```

### External Dependencies
- **OpenAI SDK**: Latest version with Realtime API GA support
- **Google AI SDK**: `@google/generative-ai` with Live API capabilities
- **WebRTC Libraries**: Enhanced peer connection management
- **Audio Processing**: Native browser AudioContext and MediaStream APIs

### Internal Dependencies
- **Existing Canvas System**: `src/components/canvas-panel.tsx` and related components
- **MCP Infrastructure**: `src/lib/ai/mcp/` for tool integration
- **Vercel AI SDK**: Foundation for streaming and tool execution
- **Web Search Tools**: `src/lib/ai/tools/web/web-search.ts` enhancement

### Database Schema (Admin Auth Compatible)
```sql
-- Voice session management (respects existing admin auth system)
ALTER TABLE chat_messages ADD COLUMN voice_provider VARCHAR(50);
ALTER TABLE chat_messages ADD COLUMN voice_metadata JSONB;

-- Voice preferences (integrates with existing user role system)
ALTER TABLE users ADD COLUMN preferred_voice_provider VARCHAR(50) DEFAULT 'openai';
ALTER TABLE users ADD COLUMN voice_settings JSONB;

-- EXISTING ADMIN AUTH SYSTEM (must be preserved):
-- UserSchema.role: enum ["admin", "user"] - controls admin access
-- AgentSchema.visibility: enum ["public", "private", "readonly", "admin-shared", "admin-all", "admin-selective"]
-- AgentUserPermissionSchema: granular agent access control for admin-selective agents
```

### System Architecture (Agent Role Integration)
- **Provider Interface**: Abstract `VoiceProvider` class for multi-provider support
- **Agent System Integration**: Voice chat respects admin agent provisioning and role-based access
- **Session Management**: Enhanced conversation state with smart context handling
- **Canvas Integration**: Voice-aware artifact creation and workspace management
- **Tool Pipeline**: MCP + Canvas + Web tools unified under voice interface (preserves agent tool restrictions)

**CRITICAL**: Voice chat must integrate with existing agent system:
- **Agent Selection**: Voice chat already supports `agentId` in `appStore.voiceChat.agentId`
- **Agent Instructions**: `buildSpeechSystemPrompt()` already integrates agent instructions and roles
- **Tool Restrictions**: Voice chat respects agent's `allowedMcpServers` and `allowedAppDefaultToolkit`
- **Admin Agents**: Voice chat can use admin-shared/admin-all/admin-selective agents based on user permissions
- **Role-Based Access**: Voice system must respect user roles (admin/user) for agent access

## EXAMPLES:

### Voice-to-Chart Creation Flow (Requires Canvas Integration)
```typescript
// User says: "Create a bar chart showing sales data for Q1"
// CURRENT STATE: Voice chat shows tool result in dialog, no Canvas
// REQUIRED STATE: Voice chat opens Canvas side-by-side like regular chat

// Implementation needed in chat-bot-voice.tsx:
1. Voice → Transcription (streaming display: "Create a bar chart...")
2. Intent Recognition → Chart creation tool selected
3. Tool Execution → Chart tool runs with voice metadata
4. Canvas Integration → Auto-open Canvas workspace (MISSING - needs ResizablePanelGroup)
5. Artifact Creation → Bar chart artifact created (MISSING - needs useCanvas hook)
6. Voice Response → "I've created your Q1 sales bar chart in the Canvas"
7. Layout → Side-by-side voice chat + Canvas panel (MISSING - currently full-screen Drawer)
```

### Multi-Provider Selection with Agent Role Integration
```typescript
// Voice provider selection respects agent configuration and user permissions
const requirements = {
  realTimeStreaming: true,
  toolCalling: true,
  canvasIntegration: true,
  language: 'en',
  agentId: 'selected-agent-id', // Admin-provisioned agent
  userId: 'current-user-id',
  userRole: 'user' // or 'admin'
};

// System must:
// 1. Verify user can access the selected agent (admin-shared/admin-all/admin-selective)
// 2. Load agent's specific tools and restrictions
// 3. Select provider based on agent's capabilities + requirements
const provider = await voiceManager.selectBestProvider(requirements);

// Agent integration in voice session:
const voiceSession = await provider.connect({
  agentId: requirements.agentId,
  allowedMcpServers: agent.allowedMcpServers, // Agent-specific tool restrictions
  allowedAppDefaultToolkit: agent.allowedAppDefaultToolkit,
  systemPrompt: buildSpeechSystemPrompt(user, userPreferences, agent), // Agent instructions
  voice: userPreferences.voice || 'alloy'
});
```

### Voice Web Search Integration
```typescript
// User asks: "What's the latest on Tesla stock?"
// Enhanced web search with voice-optimized response:
{
  query: "Tesla stock latest news",
  responseFormat: "conversational",
  result: "Based on my search, Tesla stock is currently trading at $248, up 3.2% today. The main driver appears to be strong Q4 delivery numbers that exceeded analyst expectations..."
}
```

## DOCUMENTATION:

### OpenAI Realtime API References
- **GA Documentation**: https://platform.openai.com/docs/guides/realtime
- **WebRTC Integration**: https://platform.openai.com/docs/guides/realtime-webrtc
- **Tool Calling Guide**: https://platform.openai.com/docs/guides/realtime-function-calling
- **MCP Integration**: https://platform.openai.com/docs/guides/realtime-mcp

### Google Gemini Live API
- **Live API Overview**: https://ai.google.dev/gemini-api/docs/live-api
- **Multimodal Capabilities**: https://ai.google.dev/gemini-api/docs/vision
- **Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling

### Internal Documentation References
- **Canvas System**: `src/components/canvas-panel.tsx` - Existing Canvas architecture
- **MCP Integration**: `src/lib/ai/mcp/mcp-manager.ts` - Tool loading pipeline
- **Voice Implementation**: `src/components/chat-bot-voice.tsx` - Current voice UI
- **Tool Pipeline**: `src/app/api/chat/shared.chat.ts` - Tool integration patterns

### Architecture Documentation
- **Vercel AI SDK Patterns**: Existing streaming and tool integration
- **WebRTC Best Practices**: MDN WebRTC documentation
- **Canvas Artifact Creation**: Existing chart tool implementations in `src/lib/ai/tools/artifacts/`

## OTHER CONSIDERATIONS:

### Critical Implementation Notes

#### Voice Provider Priorities
1. **OpenAI First**: Most mature implementation with proven Canvas integration
2. **Google Second**: Excellent multimodal capabilities, longer sessions
3. **xAI Last**: API not yet available, prepare architecture only

#### Canvas Integration Gotchas
- **CRITICAL**: Voice chat UI (`chat-bot-voice.tsx`) completely lacks Canvas integration
- **Layout Architecture**: Must transform from full-screen Drawer to ResizablePanelGroup split view
- **Missing Hook Integration**: Needs `useCanvas` hook with same chart tool detection as `chat-bot.tsx:630-787`
- **Tool Processing**: Must implement same 17 chart tool detection and artifact creation logic
- **Auto-Opening Logic**: Respect user's manual Canvas close preference (copy from regular chat)
- **Artifact Race Conditions**: Use existing debounced processing (150ms)
- **Chart Responsiveness**: Ensure `height="100%"` for all voice-generated charts
- **Memory Management**: Leverage existing Canvas cleanup patterns

#### Admin Auth & Agent Role Integration Gotchas
- **EXISTING INTEGRATION**: Voice system already integrates with agent system via `agentId` parameter
- **Agent Tool Restrictions**: Voice chat respects agent's `allowedMcpServers` and `allowedAppDefaultToolkit` (src/lib/ai/speech/open-ai/use-voice-chat.openai.ts:162-164)
- **System Prompt Integration**: `buildSpeechSystemPrompt()` already incorporates agent instructions and roles (src/lib/ai/prompts.ts:149-236)
- **Admin Agent Access**: Voice system must support admin-shared/admin-all/admin-selective agent visibility levels
- **Permission Validation**: Voice sessions must validate user access to selected agents via existing `rememberAgentAction()`
- **Role-Based Tools**: Admin agents may have enhanced tool access that voice system must preserve
- **Agent Context Preservation**: Voice conversations must maintain agent personality, tools, and instructions throughout session

#### Performance Considerations
- **Context Window Management**: Use 80% threshold for summarization
- **Streaming Buffer Size**: 150ms debounce for transcription updates
- **WebRTC vs WebSocket**: OpenAI WebRTC for low latency, WebSocket for complex tool flows
- **Provider Fallback**: Graceful degradation when providers are unavailable

#### Security & Privacy
- **API Key Management**: Secure server-side storage for all provider keys
- **Voice Data Handling**: Ensure compliance with privacy policies
- **Session Management**: Proper cleanup of audio streams and peer connections

#### Testing Strategy
- **Voice Integration Tests**: Mock audio streams for automated testing
- **Canvas Voice Tests**: Verify chart creation from voice commands
- **Provider Switching**: Test seamless provider transitions
- **Transcription Accuracy**: Validate streaming vs final transcription

#### Production Deployment
- **Feature Flags**: Gradual rollout with `ENABLE_VOICE_*` flags
- **Monitoring**: Enhanced Langfuse tracking for voice interactions
- **Error Handling**: Graceful provider fallbacks and user feedback
- **Performance Metrics**: Track latency, accuracy, and user satisfaction

#### Known Limitations
- **xAI Voice API**: Not yet available, architecture prepared for future
- **Google Live API**: May require additional authentication flows
- **Canvas Mobile**: Voice + Canvas experience may need mobile optimization
- **Browser Compatibility**: WebRTC requirements for voice functionality

#### Admin Auth & Agent System Compatibility
- **GOOD**: Voice system already respects agent role system and tool restrictions
- **GOOD**: `buildSpeechSystemPrompt()` integrates agent instructions into voice personality
- **GOOD**: Tool loading pipeline preserves agent's MCP and app tool permissions
- **ENHANCEMENT NEEDED**: Canvas integration must respect agent's canvas/visualization tool access
- **TESTING REQUIRED**: Verify admin-shared agents work correctly in voice mode with proper tool access

This comprehensive plan builds upon your existing sophisticated Canvas system and MCP infrastructure while adding powerful multi-provider voice capabilities that seamlessly integrate with your current architecture.