# 🎯 **Langfuse + Vercel AI SDK Integration**

## ✅ **Current Implementation - NodeTracerProvider + Langfuse SDK**

This document outlines the **production implementation** for Langfuse integration in Better Chatbot using the Langfuse SDK v4 with OpenTelemetry.

## 🏗️ **Production Architecture**

### **1. Package Setup**
```bash
# Production packages for Vercel AI SDK v5 + Langfuse SDK v4
npm install @langfuse/otel @langfuse/tracing @opentelemetry/sdk-trace-node @opentelemetry/api
```

**IMPORTANT:** The `langfuse-vercel` + `@vercel/otel` approach does **NOT** support Vercel AI SDK v2+ (which includes v5). Use the NodeTracerProvider approach documented below.

### **2. Instrumentation Setup** (`instrumentation.ts`)
```typescript
import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

// Validate required environment variables at startup
function validateLangfuseConfig() {
  const missing = [];
  if (!process.env.LANGFUSE_PUBLIC_KEY) missing.push("LANGFUSE_PUBLIC_KEY");
  if (!process.env.LANGFUSE_SECRET_KEY) missing.push("LANGFUSE_SECRET_KEY");

  if (missing.length > 0) {
    console.error("⚠️ Missing Langfuse variables:", missing.join(", "));
    console.error("Traces will NOT be sent to Langfuse");
  } else {
    const baseUrl = process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";
    const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
    console.log(`✅ Langfuse configured: ${baseUrl} [${environment}]`);
  }
}

validateLangfuseConfig();

// Filter out Next.js infrastructure spans
const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== "next.js";
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

tracerProvider.register();
```

### **3. Chat API Integration** (`/api/chat/route.ts`)

Use Langfuse SDK's `observe()` wrapper with `experimental_telemetry` for complete tracing:

```typescript
import { observe, updateActiveTrace, updateActiveObservation } from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";
import { after } from "next/server";
import { langfuseSpanProcessor } from "@/instrumentation";

// Wrap the handler with observe()
const handler = async (request: Request) => {
  // ... your chat logic ...

  // Set trace metadata early
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
  const mcpClients = await mcpClientsManager.getClients();
  const mcpServerList = mcpClients.map((client) => client.serverName);

  updateActiveTrace({
    name: agent?.name ? `agent-${agent.name}-chat` : "samba-orion-chat",
    sessionId: id,
    userId: session.user.id,
    input: inputText,
    metadata: {
      agentId: agent?.id,
      agentName: agent?.name,
      provider: chatModel?.provider,
      model: chatModel?.model,
      toolChoice,
      environment,
      mcpServerCount: mcpClients.length,
      mcpServerList,
      tags: [
        "chat",
        `provider:${chatModel?.provider || "unknown"}`,
        `model:${chatModel?.model || "unknown"}`,
        ...(agent?.name ? [`agent:${agent.name}`] : []),
        `environment:${environment}`,
      ],
    },
  });

  // Enable telemetry in streamText
  const result = streamText({
    model,
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    experimental_telemetry: {
      isEnabled: true,
    },
    tools: vercelAITooles,
    onFinish: async (result) => {
      // Add tool execution metadata
      const toolExecutionCount = result.steps?.reduce((count, step) => {
        return count + (step.toolCalls?.length || 0) + (step.toolResults?.length || 0);
      }, 0) || 0;

      updateActiveTrace({
        output: result.content,
        metadata: {
          toolExecutionCount,
          mcpToolCount: Object.keys(MCP_TOOLS ?? {}).length,
          workflowToolCount: Object.keys(WORKFLOW_TOOLS ?? {}).length,
          appToolCount: Object.keys(APP_DEFAULT_TOOLS ?? {}).length,
        },
      });

      // End span manually after stream has finished
      trace.getActiveSpan()?.end();
    },
  });

  // CRITICAL: Force flush in serverless environments
  after(async () => {
    await langfuseSpanProcessor.forceFlush();
  });

  return createUIMessageStreamResponse({ stream });
};

// Export the wrapped handler
export const POST = observe(handler, {
  name: "chat-api-handler",
  endOnExit: false, // end observation _after_ stream has finished
});
```

## 🎯 **What This Approach Captures**

### **Automatic Tracing via `experimental_telemetry`**
- ✅ **LLM Calls**: All `streamText`, `generateText` calls automatically traced via OpenTelemetry
- ✅ **Tool Execution**: Individual tool calls within the AI SDK automatically captured
- ✅ **Streaming Responses**: Real-time streaming traces with proper flushing
- ✅ **Token Usage**: Input/output tokens automatically recorded
- ✅ **Costs**: Token costs calculated automatically by Langfuse
- ✅ **Errors**: Failures and exceptions automatically captured
- ✅ **Multi-Provider**: Works with ALL Vercel AI SDK providers (OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter)

### **CRITICAL: Serverless Flush Requirement**
**REQUIRED for Vercel/serverless deployments:** You MUST call `langfuseSpanProcessor.forceFlush()` to ensure traces are sent before the function terminates. Use Next.js `after()` for background flushing without blocking the response.

### **Rich Metadata Captured**
- 👤 **User Context**: userId, sessionId for user journey tracking
- 🤖 **Agent Context**: agentId, agentName, agent-specific trace names
- 🔧 **Tool Context**: toolExecutionCount, mcpServerCount, mcpServerList, tool breakdown
- 📊 **Performance**: Token usage, latency, costs per conversation
- 🏷️ **Tags**: Custom tags for filtering and analytics (provider, model, agent, environment)
- 🌍 **Environment**: Automatic production/preview/development detection via VERCEL_ENV

## 🎉 **Key Benefits of This Approach**

### **1. Production-Ready for Vercel AI SDK v5**
- ✅ **Compatible with AI SDK v5** - Uses NodeTracerProvider (langfuse-vercel is incompatible)
- ✅ **Explicit flush control** - Required for serverless, handled via `forceFlush()` + `after()`
- ✅ **Multi-provider support** - Works with ALL your AI providers
- ✅ **Tool execution tracing** - MCP, Workflow, App Default tools captured
- ✅ **Streaming optimized** - Real-time response tracing with proper lifecycle management

### **2. Comprehensive Observability**
- ✅ **Environment validation** - Startup checks ensure credentials are configured
- ✅ **Agent-specific traces** - Trace names reflect which agent handled the conversation
- ✅ **Tool execution metrics** - Track how many tools executed per conversation
- ✅ **Error handling** - Failures automatically captured with context
- ✅ **Health monitoring** - `/api/health/langfuse/traces` endpoint for production monitoring

## 📊 **What You'll See in Langfuse**

### **Trace Structure**
```
agent-CodeAssistant-chat (or samba-orion-chat)
├── chat-api-handler (observe wrapper)
│   └── ai.streamText.doStream (automatic via experimental_telemetry)
│       ├── ai.streamText.doStream.startStep (automatic)
│       ├── ai.toolCall.mcp__tool_name (automatic for each MCP tool)
│       ├── ai.toolCall.workflow__tool_name (automatic for each workflow tool)
│       └── ai.streamText.doStream.finishStep (automatic)
└── metadata: userId, sessionId, agent, environment, tools, execution counts
```

### **Captured Metrics**
- **Conversation Analytics**: User sessions, agent usage patterns, environment breakdown
- **Model Performance**: Token usage, latency, costs per provider
- **Tool Usage**: toolExecutionCount, mcpToolCount, workflowToolCount, appToolCount
- **Agent Effectiveness**: Agent-specific trace names for filtering and comparison
- **Cost Intelligence**: Real-time cost tracking across all providers
- **Environment Tracking**: Production vs preview vs development trace segregation

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Required
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key-here
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key-here

# Optional (defaults to cloud.langfuse.com)
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Automatic (set by Vercel)
VERCEL_ENV=production  # or preview, development
NODE_ENV=production    # Fallback if VERCEL_ENV not set
```

### **Next.js Configuration**
Next.js 15 supports `instrumentation.ts` by default. No configuration needed.

For Next.js < 15, add to `next.config.js`:
```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

## 🚀 **How It Works**

1. **Next.js loads** `instrumentation.ts` automatically on startup
2. **Environment validation** checks for required Langfuse credentials
3. **NodeTracerProvider** sets up OpenTelemetry with LangfuseSpanProcessor
4. **`observe()` wrapper** creates trace context for each API request
5. **`experimental_telemetry`** enables automatic span creation for AI operations
6. **`updateActiveTrace()`** adds custom metadata to traces
7. **`forceFlush()`** ensures traces are sent before serverless function terminates
8. **LangfuseSpanProcessor** sends all spans to Langfuse dashboard

## ✅ **Verification Steps**

1. **Check startup logs** - Should see `✅ Langfuse configured: [baseUrl] [environment]`
2. **Start development server**: `pnpm dev`
3. **Send a chat message** through your app
4. **Check Langfuse dashboard** - traces should appear within 30 seconds
5. **Verify metadata** - Check for userId, agent names, tool counts, environment tags
6. **Test health endpoint**: `curl http://localhost:3000/api/health/langfuse/traces`

## 🔍 **Health Monitoring**

### **Basic Health Check**
```bash
GET /api/health/langfuse
```
Returns: Connectivity status and credential configuration

### **Trace Health Check**
```bash
GET /api/health/langfuse/traces
```
Returns:
- Last trace sent timestamp
- Trace count in last hour
- Flush status
- Connection health
- Configuration validation

## 🎯 **Implementation Summary**

**This implementation is production-ready** and provides:
- ✅ Compatible with Vercel AI SDK v5.0.26
- ✅ Works with Langfuse SDK v4.1.0
- ✅ Supports multi-agent platform with agent-specific tracing
- ✅ Comprehensive tool execution tracking (MCP, Workflow, App tools)
- ✅ Proper serverless flush handling via `forceFlush()` + `after()`
- ✅ Environment validation with clear error messages
- ✅ Production/preview/development environment segregation
- ✅ Health monitoring endpoints for production observability

**Key Differences from langfuse-vercel approach:**
- Uses `@langfuse/otel` + `@langfuse/tracing` instead of `langfuse-vercel`
- Requires explicit `forceFlush()` calls (handled automatically with `after()`)
- Compatible with Vercel AI SDK v2+ (langfuse-vercel only supports v1)
- More control over trace lifecycle and metadata