# Prime Context for Better-Chatbot Project

## 🎯 Project Overview First

**Better-Chatbot** is a sophisticated AI chatbot platform built on **Vercel AI SDK v5** as the foundational AI framework, with comprehensive Canvas workspace and MCP protocol integration.

## 📋 Context Discovery Process

### 1. **Essential Reading Order**
```bash
# Start with project documentation
tree                          # Project structure overview
cat CLAUDE.md                 # Comprehensive project guide (CRITICAL)
cat README.md                 # Project summary and features

# Core architecture files
cat src/lib/ai/models.ts      # Vercel AI SDK provider setup
cat src/app/api/chat/route.ts # Main chat API with streaming
cat instrumentation.ts        # Langfuse observability (CRITICAL)
```

### 2. **Canvas System Understanding**
The project features a sophisticated **Canvas workspace** for data visualization:

**Key Canvas Files to Examine:**
- `src/components/canvas-panel.tsx` - Multi-grid Canvas workspace
- `src/lib/ai/tools/artifacts/` - **15 specialized chart tools** (bar, line, pie, area, funnel, radar, scatter, gauge, sankey, treemap, calendar-heatmap, composed, radial-bar, geographic)
- `src/components/tool-invocation/` - Chart rendering components
- `src/lib/ai/canvas-naming.ts` - Smart canvas naming system
- `src/lib/ai/tools/chart-tool.ts` - Main chart creation tool

**Canvas Capabilities:**
- **Progressive Chart Building**: Uses `async function*` with `yield` statements
- **Multi-Grid Dashboard Layout**: Responsive CSS Grid (2x2+)
- **Geographic Charts**: World maps, US states/counties with TopoJSON data
- **Real-time Visualization**: Charts appear as AI streams tool execution
- **Memory Management**: Debounced processing with race condition protection

### 3. **MCP (Model Context Protocol) Integration**
Extensive MCP server ecosystem for external tool integration:

**Key MCP Files to Examine:**
- `src/lib/ai/mcp/mcp-manager.ts` - MCP clients manager
- `src/lib/ai/mcp/db-mcp-config-storage.ts` - Database configuration
- `.mcp.json` - File-based MCP configuration (if exists)
- `src/app/api/mcp/` - MCP API endpoints

**MCP Capabilities:**
- **10+ Recommended Servers**: GitHub, Notion, Linear, Neon, Stripe, Canva, etc.
- **Custom Servers**: Archon (localhost:8051), Weather example
- **Three Connection Types**: SSE, STDIO, StreamableHTTP
- **OAuth Integration**: Third-party service authentication
- **Management Interface**: `/mcp` dashboard with real-time monitoring
- **Tool Testing**: `/mcp/test/[id]` for individual tool testing

### 4. **Critical System Dependencies**
**AI Framework Foundation:**
- **Vercel AI SDK v5.0.26** (foundational - ALL AI operations)
- **Streaming Patterns**: `streamText`, `generateText`, `experimental_telemetry`
- **Tool Abstraction**: MCP, Workflow, App tools → Vercel AI SDK tools

**Observability Infrastructure:**
- **Langfuse SDK v4.1.0** with OpenTelemetry 2.1.0
- **NodeTracerProvider** with LangfuseSpanProcessor (NOT @vercel/otel)
- **Health Endpoint**: `/api/health/langfuse` (check before everything)
- **Automatic Tracing**: All AI operations via `experimental_telemetry`

**Core Stack:**
- **Next.js 15.3.2** with App Router and instrumentation.ts
- **TypeScript 5.9.2** in strict mode
- **PostgreSQL** with Drizzle ORM 0.41.0
- **Better-Auth 1.3.7** for authentication
- **Biome 1.9.4** for linting and formatting

### 5. **IMPORTANT: Use Serena for Codebase Exploration**
```bash
# If you get errors using Serena, retry with different tools:
mcp__serena__list_dir "." true                    # Project structure
mcp__serena__get_symbols_overview "src/lib/ai/models.ts"  # AI configuration
mcp__serena__find_symbol "canvasPanel"            # Canvas components
mcp__serena__search_for_pattern "streamText"      # Vercel AI SDK usage
mcp__serena__find_symbol "initMCPManager"        # MCP integration
```

### 6. **Critical Validation Before Starting**
**ALWAYS run these health checks:**
```bash
# Observability health (CRITICAL)
curl -f http://localhost:3000/api/health/langfuse

# System validation
/validate-system quick

# If working with Canvas
/validate-canvas

# If working with MCP
/validate-mcp

# If working with agents
/validate-agents
```

### 7. **Agent System Awareness**
**CRITICAL Anti-Patterns to Avoid:**
- **🚨 NEVER**: `allowedMcpServers: mentions?.length ? {} : servers` - BREAKS AGENTS
- **🚨 NEVER**: Assume mentions mean "no tools needed"
- **✅ ALWAYS**: Agent mentions are ADDITIVE (specify which tools to use)
- **✅ ALWAYS**: Test agents after UI changes

## 📊 What to Explain Back

### **Project Structure Analysis:**
- **Core Architecture**: Vercel AI SDK foundation with streaming patterns
- **Canvas System**: Multi-grid workspace with 15 chart tools
- **MCP Integration**: External tool ecosystem with 10+ servers
- **Observability**: Langfuse + OpenTelemetry comprehensive tracing
- **Authentication**: Better-Auth with OAuth support

### **Project Purpose & Goals:**
- **Unified AI Interface**: Multiple LLM providers through Vercel AI SDK
- **Data Visualization**: Progressive Canvas workspace for charts/dashboards
- **Extensible Architecture**: MCP protocol for external tool integration
- **Production Observability**: Complete AI operation tracing and cost monitoring
- **Developer Experience**: Quality-first with comprehensive testing

### **Key Files & Purposes:**
- `instrumentation.ts` - **Langfuse observability setup (CRITICAL)**
- `CLAUDE.md` - **Comprehensive project documentation**
- `src/lib/ai/models.ts` - **Vercel AI SDK provider configurations**
- `src/components/canvas-panel.tsx` - **Canvas workspace implementation**
- `src/lib/ai/mcp/mcp-manager.ts` - **MCP server management**
- `src/app/api/chat/route.ts` - **Main chat API with streaming**

### **Important Dependencies to Highlight:**
- **Vercel AI SDK v5** (foundational AI framework)
- **Langfuse SDK v4** (observability and tracing)
- **Drizzle ORM** (database layer with PostgreSQL)
- **Better-Auth** (authentication system)
- **Recharts** (chart rendering library for Canvas)

### **Configuration Files:**
- `.env` - API keys, database URL, Langfuse credentials
- `drizzle.config.ts` - Database configuration
- `.mcp.json` - MCP server configuration (if file-based)
- `next.config.ts` - Next.js with instrumentation hook
- `biome.json` - Code formatting and linting rules

## 🚨 Critical Constraints

**LOCALHOST REQUIREMENT**: This project can ONLY run on localhost:3000 and will NOT work on other ports. This is a fundamental constraint of the authentication and observability systems.

## 🎯 Success Criteria

After running `/primer`, you should understand:
1. **Vercel AI SDK** as the foundational AI framework
2. **Canvas system** for progressive data visualization
3. **MCP integration** for external tool ecosystem
4. **Langfuse observability** for comprehensive tracing
5. **Better-chatbot specific architecture** and constraints
6. **Validation workflows** for maintaining system health