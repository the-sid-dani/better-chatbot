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

#### Canvas Integration Tools
- **Chart Creation**: 15 specialized chart tools adapted for voice input
- **Artifact Management**: Voice-triggered artifact creation and Canvas operations
- **Tool Functions**:
  ```typescript
  create_voice_bar_chart(data, title, voiceMetadata)
  create_voice_line_chart(data, title, voiceMetadata)
  create_voice_geographic_chart(geoData, geoType, voiceMetadata)
  open_canvas_workspace()
  add_voice_artifact(artifactData)
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

### Database Schema
```sql
-- Voice session management
ALTER TABLE chat_messages ADD COLUMN voice_provider VARCHAR(50);
ALTER TABLE chat_messages ADD COLUMN voice_metadata JSONB;

-- Voice preferences
ALTER TABLE users ADD COLUMN preferred_voice_provider VARCHAR(50) DEFAULT 'openai';
ALTER TABLE users ADD COLUMN voice_settings JSONB;
```

### System Architecture
- **Provider Interface**: Abstract `VoiceProvider` class for multi-provider support
- **Session Management**: Enhanced conversation state with smart context handling
- **Canvas Integration**: Voice-aware artifact creation and workspace management
- **Tool Pipeline**: MCP + Canvas + Web tools unified under voice interface

## EXAMPLES:

### Voice-to-Chart Creation Flow
```typescript
// User says: "Create a bar chart showing sales data for Q1"
// System processes:
1. Voice → Transcription (streaming display: "Create a bar chart...")
2. Intent Recognition → Chart creation tool selected
3. Data Extraction → Sales data identified/requested
4. Canvas Integration → Auto-open Canvas workspace
5. Artifact Creation → Bar chart artifact created with voice metadata
6. Voice Response → "I've created your Q1 sales bar chart in the Canvas"
```

### Multi-Provider Selection Example
```typescript
// Smart provider selection based on requirements
const requirements = {
  realTimeStreaming: true,
  toolCalling: true,
  canvasIntegration: true,
  language: 'en'
};

// System selects: OpenAI (best tool calling) or Google (best multimodal)
const provider = await voiceManager.selectBestProvider(requirements);
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
- **Auto-Opening Logic**: Respect user's manual Canvas close preference
- **Artifact Race Conditions**: Use existing debounced processing (150ms)
- **Chart Responsiveness**: Ensure `height="100%"` for all voice-generated charts
- **Memory Management**: Leverage existing Canvas cleanup patterns

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

This comprehensive plan builds upon your existing sophisticated Canvas system and MCP infrastructure while adding powerful multi-provider voice capabilities that seamlessly integrate with your current architecture.