# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Samba-Orion** is an AI chatbot platform built entirely on **Vercel AI SDK** as the foundational AI framework, with Next.js 15 and TypeScript. This project is a branded fork of the open-source "better-chatbot" project, strategically rebranded to maintain upstream compatibility while providing a unique user experience.

### 🎨 Dual Branding Strategy
- **User-Facing Elements:** "Samba-Orion" branding (UI, page titles, app names, user-visible text)
- **Backend/Infrastructure:** "better-chatbot" structure preserved (file paths, git history, documentation references)
- **Upstream Compatibility:** Enables easy merging of updates from the open-source better-chatbot project

**Core Features:** Unified interface to multiple LLM providers (OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter) through Vercel AI SDK abstractions, enhanced with MCP protocol support, custom agents, visual workflows, **multi-grid Canvas for data visualization and dashboard creation**, and comprehensive observability.

**Foundational Architecture:**
- **AI Framework:** Vercel AI SDK v5.0.26 (foundational - all AI operations built on this)
- **Framework:** Next.js 15.3.2 with App Router
- **Language:** TypeScript 5.9.2
- **Observability:** Langfuse SDK v4.1.0 with OpenTelemetry 2.1.0
- **Database:** PostgreSQL with Drizzle ORM 0.41.0
- **Authentication:** Better-Auth 1.3.7
- **UI:** React 19.1.1 with Tailwind CSS 4.1.12, Radix UI, Framer Motion 12.23.12
- **Testing:** Vitest 3.2.4 (unit), Playwright 1.55.0 (e2e)
- **Linting/Formatting:** Biome 1.9.4

## 🛠️ Development Commands

### Essential Commands
```bash
# Development server with Turbopack
pnpm dev

# Production build and start (recommended for most development)
pnpm build:local && pnpm start

# Testing
pnpm test                    # Run unit tests with Vitest
pnpm test:watch             # Watch mode for unit tests
pnpm test:e2e               # End-to-end tests with Playwright
pnpm test:e2e:ui           # Playwright UI mode

# Code quality
pnpm lint                   # ESLint + Biome linting
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code with Biome
pnpm check-types           # TypeScript type checking
pnpm check                 # Full check: lint + types + tests

# Database operations
pnpm db:generate           # Generate Drizzle migrations
pnpm db:push              # Push schema to database
pnpm db:migrate           # Run migrations
pnpm db:studio            # Open Drizzle Studio
pnpm db:reset             # Drop and recreate database
pnpm db:pull              # Pull schema from database
pnpm db:check             # Check migration consistency
```

### Docker Commands
```bash
# Local PostgreSQL instance
pnpm docker:pg

# Redis instance
pnpm docker:redis

# Full Docker Compose stack
pnpm docker-compose:up
pnpm docker-compose:down
pnpm docker-compose:logs
pnpm docker-compose:ps
pnpm docker-compose:update

# Individual container commands
pnpm docker:app
```

### Utility Scripts
```bash
# Initialize environment files
pnpm initial:env

# OpenAI-compatible provider management
pnpm openai-compatiable:init
pnpm openai-compatiable:parse

# Clean build artifacts
pnpm clean

# Development setup
pnpm prepare               # Setup husky git hooks
pnpm postinstall          # Run post-install setup
pnpm playwright:install   # Install Playwright browsers
```

## 🏗️ Architecture Overview

### Core System Architecture

**Vercel AI SDK Foundation:**
- **All AI operations** built on `streamText`, `generateText`, and tool abstractions
- **Unified Provider Interface:** OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter through SDK
- **Streaming-First:** Real-time responses with `experimental_telemetry` for observability
- **Tool Integration:** MCP, Workflow, and App tools conform to Vercel AI SDK tool interface
- **Observability:** Automatic tracing through Langfuse SDK v4 integration

**Chat System Flow (Vercel AI SDK-Centric with Canvas Integration):**
1. **Request:** `/api/chat/route.ts` handles chat requests with observability
2. **Tool Loading:** MCP, workflow, and app tools loaded as Vercel AI SDK tools
3. **Model Provider:** `customModelProvider.getModel()` returns Vercel AI SDK models
4. **AI Processing:** `streamText()` with `experimental_telemetry` for comprehensive tracing
5. **Tool Execution:** Automatic tool calls through Vercel AI SDK abstractions
6. **Canvas Processing:** Chart tools stream to Canvas with artifact creation:
   - Tool execution yields progressive updates (`loading` → `processing` → `success`)
   - Canvas automatically opens for chart tools unless manually closed by user
   - Artifacts processed with debounced state management to prevent race conditions
   - Dual result format support (legacy `shouldCreateArtifact` + new `artifact` format)
7. **Canvas Artifact Management:** Real-time artifact creation and Canvas state synchronization
8. **Observability:** Complete tool execution and Canvas interactions traced via Langfuse
9. **Response:** Streaming UI with "Open Canvas" buttons for chart tool results
10. **Database:** Messages, metadata, and Canvas states stored via `chatRepository`

**Observability Architecture (Langfuse SDK v4):**
- **Instrumentation:** `instrumentation.ts` with `NodeTracerProvider` and `LangfuseSpanProcessor`
- **Tracing:** Automatic via Vercel AI SDK `experimental_telemetry`
- **Scope:** Complete conversations, tool executions, streaming responses, costs
- **Integration:** Built-in compatibility with Vercel AI SDK patterns

**MCP (Model Context Protocol) Integration:**
- Central to the application's extensibility
- Located in `src/lib/ai/mcp/`
- `mcpClientsManager` manages all MCP server connections
- **Vercel AI SDK Integration:** MCP tools converted to Vercel AI SDK tool interface
- Supports both file-based and database-based configurations
- Tools dynamically loaded and bound through Vercel AI SDK abstractions

**Database Layer (Drizzle ORM):**
- Schema: `src/lib/db/pg/schema.pg.ts`
- Repositories: `src/lib/db/pg/repositories/`
- Migrations: `src/lib/db/migrations/pg/`

### Key Components Architecture

**Authentication (Better-Auth):**
- Configuration: `src/lib/auth/config.ts`
- Server functions: `src/lib/auth/server.ts`
- Client hooks: `src/lib/auth/client.ts`
- Supports OAuth (Google, GitHub, Microsoft) and email/password

**Multi-Provider Support (Vercel AI SDK):**
- **Unified Interface:** All providers accessed through Vercel AI SDK abstractions in `src/lib/ai/models.ts`
- **Provider Coverage:** OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter via `@ai-sdk/*` packages
- **Dynamic Models:** Static models + dynamic OpenAI-compatible providers
- **Consistent API:** All providers use `streamText`/`generateText` with identical interfaces
- **Tool Call Support:** Universal tool calling across all supported providers
- **Observability:** Automatic tracing via `experimental_telemetry` across all providers

**Agent System:**
- Custom AI agents with specific instructions and tool access
- Database schema: `AgentSchema` in schema.pg.ts
- UI: `src/components/agent/`

**Workflow Engine (Vercel AI SDK Integration):**
- Visual workflow builder using XYFlow
- Located in `src/lib/ai/workflow/`
- **Vercel AI SDK Integration:** Workflows converted to Vercel AI SDK tool interface
- **Tool Abstraction:** Workflows become callable tools through `createTool()`
- **Streaming Support:** Workflow execution integrated with Vercel AI SDK streaming
- **Node Types:** LLM nodes (using `generateText`) and Tool nodes (MCP/App tools)
- **Observability:** Workflow execution automatically traced via `experimental_telemetry`

**Canvas System (Multi-Grid Data Visualization):**
- Multi-grid dashboard layout for progressive chart building with real-time artifact creation
- Located in `src/components/canvas-panel.tsx` with comprehensive Canvas workspace management
- **Enhanced Chart Artifacts:** 15 specialized chart tools in `src/lib/ai/tools/artifacts/`:
  - Core charts: `bar-chart-tool.ts`, `line-chart-tool.ts`, `pie-chart-tool.ts`, `area-chart-tool.ts`
  - Advanced visualizations: `funnel-chart-tool.ts`, `radar-chart-tool.ts`, `scatter-chart-tool.ts`, `treemap-chart-tool.ts`
  - Specialized charts: `sankey-chart-tool.ts`, `radial-bar-tool.ts`, `composed-chart-tool.ts`
  - Geographic & metrics: `geographic-chart-tool.ts`, `gauge-chart-tool.ts`, `calendar-heatmap-tool.ts`
  - Dashboard coordination: `dashboard-orchestrator-tool.ts` for unified multi-chart dashboards
- **Dual Tool Architecture:** Main `create_chart` tool for basic charts + individual specialized artifact tools
- **Native AI SDK Streaming:** Chart tools use `async function*` with `yield` statements for progressive building
- **Canvas Integration:** Automatic Canvas opening when chart tools execute with `shouldCreateArtifact` flag
- **Responsive Grid System:** CSS Grid layout adapts from 1x1 to 2x2+ based on chart count
- **Canvas State Management:** `useCanvas` hook with debounced processing and memory leak prevention
- **Event-Driven Visibility:** "Open Canvas" buttons trigger `canvas:show` events for user-controlled access
- **Smart Canvas Naming:** Automatic naming based on chart content analysis (e.g., "Sales Performance Dashboard")
- **ResizablePanelGroup Integration:** Smooth Canvas/chat proportions with drag handles

## 🔍 Observability Architecture

**Langfuse SDK v4 Integration:**
- **Framework:** Built on OpenTelemetry with Langfuse SDK v4 packages
- **Packages:** `@langfuse/otel`, `@langfuse/tracing`, `@opentelemetry/sdk-trace-node`
- **Pattern:** `NodeTracerProvider` with `LangfuseSpanProcessor` (not `@vercel/otel` due to compatibility)
- **Instrumentation:** `instrumentation.ts` automatically loaded by Next.js

**Vercel AI SDK Observability:**
- **Automatic Tracing:** All `streamText`/`generateText` calls automatically traced
- **Tool Execution:** Individual tool calls captured as nested spans
- **Streaming Support:** Real-time response tracing without blocking
- **Multi-Provider:** Consistent tracing across all AI providers
- **Configuration:** `experimental_telemetry` enables comprehensive observability

**Trace Structure:**
```
handle-chat-message (observe wrapper)
├── better-chatbot-conversation (trace)
│   ├── ai.streamText (automatic Vercel AI SDK span)
│   ├── tool.execution (automatic for each tool call)
│   │   ├── mcp.toolCall (MCP server interactions)
│   │   ├── workflow.execute (workflow node execution)
│   │   └── app.defaultTool (built-in tool execution)
│   ├── provider.generateText (OpenAI/Anthropic/Google/etc.)
│   └── streaming.response (real-time response chunks)
└── metadata: userId, sessionId, costs, tokens, performance
```

**Captured Metrics:**
- **User Analytics:** Session tracking, user journeys, engagement patterns
- **AI Performance:** Token usage, costs, latency per provider and model
- **Tool Analytics:** MCP server health, tool execution success rates, workflow performance
- **System Health:** Error rates, response times, resource utilization
- **Business Intelligence:** Feature usage, agent effectiveness, cost optimization

**Production Benefits:**
- **Cost Optimization:** Real-time token and cost tracking across all providers
- **Performance Monitoring:** Identify bottlenecks in AI processing and tool execution
- **User Experience:** Track conversation quality and user satisfaction patterns
- **Debugging:** Complete trace visibility for troubleshooting complex AI interactions
- **A/B Testing:** Compare model performance and feature effectiveness

### Directory Structure

```
better-chatbot/
├── instrumentation.ts      # 🔍 Langfuse SDK v4 observability setup (critical)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (chat)/        # Main chat interface
│   │   ├── api/           # API routes (Vercel AI SDK streaming endpoints)
│   │   └── store/         # Client-side state management
│   ├── components/        # React components
│   │   ├── agent/         # Agent management UI
│   │   ├── canvas/        # Canvas workspace components
│   │   ├── layouts/       # App layout components
│   │   ├── tool-invocation/ # Tool result components (Vercel AI SDK tool results)
│   │   ├── ui/            # Reusable UI components
│   │   └── workflow/      # Workflow builder components
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization
│   ├── lib/               # Core business logic
│   │   ├── ai/            # AI-related functionality (Vercel AI SDK-centric)
│   │   │   ├── agent/     # Agent management
│   │   │   ├── artifacts/ # Artifact system
│   │   │   ├── mcp/       # MCP protocol → Vercel AI SDK tool conversion
│   │   │   ├── speech/    # Speech/voice functionality
│   │   │   ├── tools/     # Built-in tools (web search, code execution, chart creation)
│   │   │   │   ├── artifacts/ # Enhanced chart artifact tools
│   │   │   │   ├── code/  # Code execution tools
│   │   │   │   ├── http/  # HTTP request tools
│   │   │   │   ├── visualization/ # Data visualization tools
│   │   │   │   └── web/   # Web search tools
│   │   │   ├── workflow/  # Workflow engine → Vercel AI SDK tool integration
│   │   │   └── models.ts  # Vercel AI SDK provider configurations
│   │   ├── artifacts/     # Artifact management
│   │   ├── auth/          # Authentication logic
│   │   ├── cache/         # Caching (Redis/memory)
│   │   ├── code-runner/   # Code execution system
│   │   ├── db/            # Database layer
│   │   └── observability/ # Langfuse integration
│   ├── middleware.ts      # Next.js middleware
│   └── types/             # TypeScript type definitions
├── app-types/             # Shared TypeScript interfaces
├── custom-mcp-server/     # Custom MCP server implementation
├── docs/                  # Documentation
│   ├── langfuse-vercel-ai-sdk.md # Observability integration guide
│   └── tips-guides/       # Setup and configuration guides
├── docker/                # Docker configuration
├── PRPs/                  # Project Requirements and Plans
├── scripts/               # Build and utility scripts
├── tests/                 # E2E tests
└── trees/                 # Development branches
```

## 🔧 Development Patterns

### Database Patterns
- **Repositories:** Use repository pattern in `src/lib/db/pg/repositories/`
- **Schema:** Main schema in `src/lib/db/pg/schema.pg.ts`
- **Migrations:** Generate with `pnpm db:generate`, run with `pnpm db:migrate`
- **Schema Changes:** Update `schema.pg.ts` then generate migrations
- **Drizzle Config:** Configuration in `drizzle.config.ts`

### Component Patterns
- **Server Components:** Default for data fetching
- **Client Components:** Mark with `"use client"` for interactivity
- **UI Components:** Use Radix UI primitives in `src/components/ui/`
- **Styling:** Tailwind CSS with custom design system

### Vercel AI SDK Patterns
- **AI Operations:** All AI calls use `streamText`/`generateText` from Vercel AI SDK
- **Tool Integration:** Convert all tools (MCP, Workflow, App) to Vercel AI SDK tool interface
- **Streaming:** Leverage `createUIMessageStream` and `experimental_telemetry` for observability
- **Canvas Integration:** Chart tools use native `async function*` streaming with `yield` statements for real-time updates
- **Progressive Building:** Canvas artifacts created progressively with loading → processing → success states
- **Dual Tool System:** Main `create_chart` tool + 15 specialized artifact tools for specific chart types
- **Smart Artifact Processing:** Debounced Canvas updates with race condition protection and duplicate prevention
- **Provider Management:** Use `customModelProvider.getModel()` for unified model access
- **Observability:** Enable `experimental_telemetry` on all AI operations for comprehensive tracing

### API Route Patterns (Vercel AI SDK-Centric)
- **Authentication:** Use `getSession()` from `auth/server`
- **Error Handling:** Use `ts-safe` for safe error handling
- **Validation:** Zod schemas in `app-types/` directory
- **AI Streaming:** Use Vercel AI SDK's `streamText` with `experimental_telemetry`
- **Tool Execution:** Leverage Vercel AI SDK tool abstractions for all tool types
- **Observability:** Automatic tracing via Langfuse integration with zero additional code

### MCP Development (Vercel AI SDK Integration)
- **Tool Conversion:** Convert MCP tools to Vercel AI SDK tool interface in `shared.chat.ts`
- **MCP Servers:** Configure in database or JSON files
- **Tool Binding:** Dynamic loading as Vercel AI SDK tools in chat routes
- **Observability:** MCP tool calls automatically traced via `experimental_telemetry`
- **Testing:** Use `src/app/(chat)/mcp/test/[id]/page.tsx`

### Agent Development (Critical Anti-Patterns)
- **🚨 NEVER disable tools based on mentions:** `allowedMcpServers: mentions?.length ? {} : servers` BREAKS AGENTS
- **🚨 NEVER assume mentions mean "no tools needed":** Agents ALWAYS have mentions for tool configuration
- **🚨 ALWAYS preserve tool configuration:** Pass full `allowedMcpServers` and `allowedAppDefaultToolkit` regardless of mentions
- **✅ Agent mentions are ADDITIVE:** They specify which tools agents can use, not restrictions
- **✅ Test agents after UI changes:** Any chat interface changes must be verified with agent functionality
- **✅ Use established tool loading pipeline:** Never bypass `loadMcpTools()`, `loadWorkFlowTools()`, `loadAppDefaultTools()`

## 🧪 Testing

### Unit Tests (Vitest)
- Files: `*.test.ts` alongside source files
- Config: Uses `vite-tsconfig-paths` for path resolution
- Run: `pnpm test` or `pnpm test:watch`

### E2E Tests (Playwright)
- Directory: `tests/`
- Config: `playwright.config.ts`
- Setup: Authentication states in `tests/lifecycle/`
- Run: `pnpm test:e2e` or `pnpm test:e2e:ui`

### Test Patterns
- **Database Tests:** Use test database with cleanup
- **MCP Tests:** Mock MCP server responses
- **Authentication Tests:** Use setup projects for auth state
- **Agent Tests:** Test agent visibility and permissions

## 🔐 Environment Setup

Required variables (auto-generated `.env`):
```bash
# At least one LLM provider API key
OPENAI_API_KEY=****
ANTHROPIC_API_KEY=****
GOOGLE_GENERATIVE_AI_API_KEY=****

# Database
POSTGRES_URL=postgres://user:pass@localhost:5432/db

# Authentication
BETTER_AUTH_SECRET=****

# Optional features
EXA_API_KEY=****           # Web search
FILE_BASED_MCP_CONFIG=false # MCP config storage
```

## 🎨 Code Style

- **Formatting:** Biome with 2-space indentation, 80-character line width
- **Imports:** Auto-organized with Biome
- **TypeScript:** Strict mode enabled
- **File Naming:** kebab-case for files, PascalCase for components
- **Comments:** Use intelligently for learning purposes (per user config)

## 📋 GitHub Workflow Conventions

### Pull Request Title Format (REQUIRED)
All PR titles MUST follow Conventional Commit format enforced by automated checks:

**Format:** `type(scope): description`

**Supported Types:**
- `feat` - new features
- `fix` - bug fixes
- `chore` - maintenance tasks
- `docs` - documentation changes
- `style` - formatting changes
- `refactor` - code refactoring
- `test` - test additions/changes
- `perf` - performance improvements
- `build` - build system changes
- `ci` - CI configuration changes
- `revert` - reverting changes

**Examples:**
- ✅ `feat: add user authentication system`
- ✅ `fix: correct database connection timeout`
- ✅ `chore: update dependencies`
- ✅ `feat(auth): add OAuth integration`
- ❌ `Add new feature` (missing type)
- ❌ `Fix bug` (too generic)

### Automated Quality Checks
PRs must pass these automated workflows:
- **Lint Check:** Code formatting with Biome (`pnpm lint`)
- **Type Check:** TypeScript validation (`pnpm check-types`)
- **Unit Tests:** All tests must pass (`pnpm test`)
- **PR Title:** Conventional commit format validation

### Additional CI/CD Workflows
- **E2E Tests:** Full end-to-end testing with Playwright on main/develop branches
- **Container Publishing:** Docker images published to GitHub Container Registry on releases
- **Release Management:** Automated with release-please for changelog generation

## 🚀 Production Deployment

### Build Process
```bash
pnpm build:local          # Local build (no HTTPS)
pnpm build               # Production build with HTTPS
```

### Database Setup
1. Create PostgreSQL database
2. Set `POSTGRES_URL` in environment
3. Run `pnpm db:push` to create tables
4. Optional: Run `pnpm db:migrate` for migrations

### Docker Deployment
- Dockerfile: `docker/Dockerfile`
- Compose: `docker/compose.yml`
- Command: `pnpm docker-compose:up`

### Environment-Specific Notes
- **Vercel:** Use built-in PostgreSQL integration
- **Self-hosted:** Configure PostgreSQL and Redis
- **Development:** Use `pnpm docker:pg` for local database

## 🔍 Debugging Tips

### Common Issues
- **MCP Servers:** Check connection status in `/mcp` page
- **Database:** Use `pnpm db:studio` to inspect data
- **Authentication:** Check session in dev tools
- **Tool Execution:** Monitor logs in chat interface

### Development Tools
- **Database Studio:** `pnpm db:studio`
- **Type Checking:** `pnpm check-types`
- **Playwright Debug:** `pnpm test:e2e:ui`
- **Hot Reload:** `pnpm dev` with Turbopack

## 📚 Key Files for Understanding

### Core Architecture Files
- `instrumentation.ts` - **🔍 Langfuse observability setup (CRITICAL)** - NodeTracerProvider with LangfuseSpanProcessor
- `src/app/api/chat/route.ts` - **Main chat API** - Vercel AI SDK streaming with experimental_telemetry
- `src/lib/ai/models.ts` - **Vercel AI SDK provider configuration** - Unified model interface
- `src/components/chat-bot.tsx` - **Main chat interface** - Handles Vercel AI SDK streaming responses with Canvas integration
- `src/components/canvas-panel.tsx` - **Canvas workspace** - Multi-grid dashboard with progressive chart building

### Integration Files
- `src/lib/ai/mcp/mcp-manager.ts` - **MCP → Vercel AI SDK conversion** - Converts MCP tools to SDK tools
- `src/app/api/chat/shared.chat.ts` - **Tool loading pipeline** - Loads all tools as Vercel AI SDK tools
- `src/lib/ai/workflow/` - **Workflow → Vercel AI SDK integration** - Converts workflows to SDK tools
- `src/lib/ai/tools/chart-tool.ts` - **Chart creation tool** - Native AI SDK streaming patterns for Canvas
- `src/lib/ai/tools/artifacts/` - **Enhanced chart artifact tools** - 15 specialized chart tools for Canvas:
  - Core: bar, line, pie, area charts with Canvas optimization
  - Advanced: funnel, radar, scatter, treemap, sankey, radial-bar, composed charts
  - Specialized: geographic (with TopoJSON support), gauge, calendar-heatmap
  - Coordination: dashboard-orchestrator for multi-chart dashboards
- `src/lib/ai/canvas-naming.ts` - **Canvas naming system** - Intelligent canvas name generation
- `src/components/message-parts.tsx` - **Message rendering** - Handles Canvas integration with "Open Canvas" buttons

### Configuration Files
- `src/lib/db/pg/schema.pg.ts` - Database schema with all tables (ChatThread, ChatMessage, Agent, Bookmark, McpServer, User, Session, Account, Workflow, WorkflowExecution)
- `drizzle.config.ts` - Database configuration
- `next.config.ts` - Next.js configuration (includes instrumentation hook)
- `biome.json` - Code formatting rules
- `playwright.config.ts` - E2E testing configuration
- `vitest.config.ts` - Unit testing configuration
- `tsconfig.json` - TypeScript configuration
- `.mcp.json` - MCP server configuration

## 🎯 Development Workflows

### Adding a New Feature
1. Update database schema if needed
2. Generate migrations: `pnpm db:generate`
3. Create API routes in `src/app/api/`
4. Build UI components in `src/components/`
5. Add types to `app-types/`
6. Write tests alongside code
7. Run quality checks: `pnpm check`

### Adding Canvas Functionality
1. **Create Chart Artifact Tools:** Add tools in `src/lib/ai/tools/artifacts/` using native AI SDK streaming patterns
   - Use `tool as createTool` from "ai" SDK
   - Implement `async function*` with `yield` statements for progressive states
   - Return structured results with `shouldCreateArtifact: true` for Canvas processing
2. **Chart Component Optimization:** Add/update components in `src/components/tool-invocation/` with Canvas sizing
   - Use `height="100%"` for responsive scaling (not fixed heights like "400px")
   - Implement consistent color system using CSS variables (`var(--chart-1)` etc.)
   - Add proper responsive containers and error handling
3. **Canvas Integration Testing:** Verify complete Canvas workflow
   - Tool execution streams to Canvas workspace automatically
   - "Open Canvas" buttons appear for successful chart tool results
   - Canvas state management handles multiple artifacts without conflicts
   - ResizablePanelGroup allows smooth Canvas/chat proportions
4. **Chart Registry:** Update `src/lib/ai/tools/chart-tool.ts` to include new specialized tools
5. **Geographic Data:** For geographic charts, ensure TopoJSON files exist in `/public/geo/`
6. **Dashboard Creation:** Use `dashboard-orchestrator-tool.ts` for coordinated multi-chart dashboards
7. **Color System Compliance:** Ensure all charts use the established CSS variable color system

### Working with MCP
1. Test MCP servers in `/mcp` page
2. Configure server settings and tool customizations
3. Test tools in `/mcp/test/[id]` page
4. Tools automatically available in chat sessions

### Working with Canvas
1. **Automatic Canvas Opening:** AI opens Canvas when chart tools execute (unless manually closed)
   - Chart tools detected: `create_chart`, `create_area_chart`, `create_geographic_chart`, etc.
   - Canvas opens immediately on tool detection with debounced processing
   - Respects user preference if Canvas was manually closed
2. **Progressive Chart Building:** Charts stream to Canvas with real-time updates
   - Tool execution: `loading` → `processing` → `success` states with `yield` statements
   - Artifacts appear in Canvas as tools complete
   - Loading placeholders with smooth animations during chart creation
3. **Canvas Layout System:** Responsive multi-grid dashboard layout
   - 1 chart: Single full-width display
   - 2+ charts: CSS Grid 2x2 layout that scales vertically
   - Smooth scrolling for large numbers of charts
   - Each chart in rounded card containers with proper spacing
4. **Canvas State Management:** Advanced state handling with race condition protection
   - `useCanvas` hook with `useCallback` memoization to prevent infinite loops
   - Debounced artifact processing (150ms) to prevent rapid-fire updates
   - Memory leak prevention with proper cleanup and unmount detection
   - Processed tools tracking to prevent duplicate artifact creation
5. **Smart Canvas Naming:** Intelligent naming based on chart content and context
   - Canvas names extracted from chart tool results (e.g., "Sales Performance Dashboard")
   - Fallback to "Canvas" for generic visualizations
6. **User Controls:** Flexible Canvas visibility and management
   - ResizablePanelGroup with drag handles for Canvas/chat proportions
   - "Open Canvas" buttons in message tool results
   - Manual close/minimize functionality with state persistence
   - Event-driven show/hide with `canvas:show` events

### Debugging Performance
1. Check database queries in Studio
2. Monitor API response times via Langfuse dashboard
3. Use React DevTools for component performance
4. Check MCP server connection health
5. Monitor Vercel AI SDK streaming performance in Langfuse traces
6. Check `/api/health/langfuse` for observability system status
7. **Monitor Canvas Performance:** Check rendering with large datasets and multiple charts
   - Canvas scrolling performance with 5+ charts
   - Chart responsiveness during Canvas resizing
   - Memory usage with `useCanvas` hook memory tracking
8. **Debug Chart Tools:** Streaming patterns and Canvas integration
   - Check browser DevTools console for Canvas debug logs
   - Verify tool execution: `loading` → `processing` → `success` states
   - Test "Open Canvas" button functionality in message tool results
   - Monitor artifact processing with 150ms debounce timing
9. **Gauge Chart SubArc Issues:** Fixed validation errors in react-gauge-component
   - **Root Cause:** Library auto-generated subArcs with values outside expected minValue/maxValue range
   - **Solution:** Explicitly set `subArcs: []` in gauge configuration to prevent automatic generation
   - **Fix Location:** `src/components/tool-invocation/gauge-chart.tsx` and `src/lib/ai/tools/artifacts/gauge-chart-tool.ts`
   - **Validation:** Comprehensive data validation prevents infinite/NaN values and minValue >= maxValue scenarios
   - **Testing:** Edge case tests in `src/components/tool-invocation/gauge-chart.test.tsx` prevent regression
10. **Geographic Chart Data:** Ensure TopoJSON files loaded in `/public/geo/`
    - `world-countries-110m.json`, `us-states-10m.json`, etc.
    - Check network requests for geographic data loading

## 🔧 Langfuse + Vercel AI SDK Troubleshooting

### Common Observability Issues
- **Missing Traces**: Check Langfuse credentials in `.env` and verify instrumentation.ts loading
- **Incomplete Traces**: Ensure `experimental_telemetry` is enabled in all `streamText` calls
- **Tool Calls Not Traced**: Verify tools are properly converted to Vercel AI SDK interface
- **Streaming Issues**: Check `observe` wrapper with `endOnExit: false` for streaming routes

### Debugging Commands
```bash
# Check Langfuse connectivity
curl http://localhost:3000/api/health/langfuse

# Enable debug logging
export NODE_ENV=development

# Check server logs for instrumentation
pnpm dev  # Look for "✅ Langfuse instrumentation setup complete!"

# Verify trace export
# Look for "🔍 Span filter: ai -> EXPORT" in server logs
```

### Version Compatibility
- **Critical**: Use `NodeTracerProvider` not `@vercel/otel` due to OpenTelemetry JS SDK v2 compatibility
- **Packages**: Ensure `@langfuse/otel`, `@langfuse/tracing`, `@opentelemetry/sdk-trace-node`
- **Next.js**: Instrumentation hook automatically enabled in Next.js 15+

### Production Deployment
- **Environment Variables**: Ensure Langfuse credentials are set in production
- **Health Monitoring**: Use `/api/health/langfuse` endpoint for uptime monitoring
- **Cost Management**: Monitor token usage and costs in Langfuse dashboard
- **Performance**: Track response latencies and optimization opportunities
- **CRITICAL LOCALHOST REQUIREMENT**: This project can ONLY run on localhost:3000 and will NOT work on any other ports (3001, 3002, etc.). If port 3000 is busy, restart the existing process instead of trying alternative ports. This is a fundamental constraint of the authentication and observability systems.

## 🎨 Canvas System Architecture

### Canvas Integration Overview
The Canvas system is a sophisticated multi-grid workspace that provides real-time data visualization during AI conversations. It represents a major enhancement to the better-chatbot platform, enabling progressive chart creation and dashboard building through advanced Vercel AI SDK streaming patterns.

### Canvas Component Architecture

#### Core Components
- **`canvas-panel.tsx`**: Main Canvas workspace with multi-grid layout, artifact management, and responsive design
- **`useCanvas` hook**: Advanced state management with debounced processing, memory leak prevention, and race condition protection
- **Chart Artifact Tools**: 15 specialized tools in `src/lib/ai/tools/artifacts/` for different chart types
- **Chart Renderers**: Optimized components in `src/components/tool-invocation/` with Canvas-specific sizing

#### Canvas State Management
```typescript
// Advanced Canvas state with comprehensive error handling
export function useCanvas() {
  const [isVisible, setIsVisible] = useState(false);
  const [artifacts, setArtifacts] = useState<CanvasArtifact[]>([]);
  const [userManuallyClosed, setUserManuallyClosed] = useState(false);

  // Debounced processing to prevent race conditions
  const addArtifact = useCallback((artifact: CanvasArtifact) => {
    // 150ms debounce prevents rapid-fire updates
    // Duplicate checking via processed tools tracking
    // Memory leak prevention with proper cleanup
  }, []);
}
```

#### Chart Tool Integration Patterns
The Canvas system supports dual tool architectures:

1. **Main Chart Tool (`create_chart`)**: Basic bar, line, pie charts with streaming
2. **Specialized Artifact Tools**: Individual tools for advanced visualizations

```typescript
// Example: Geographic chart tool with Canvas integration
export const geographicChartArtifactTool = createTool({
  description: "Create geographic map visualizations with TopoJSON support",
  inputSchema: z.object({
    title: z.string(),
    data: z.array(z.object({
      regionCode: z.string(),
      regionName: z.string(),
      value: z.number()
    })),
    geoType: z.enum(["world", "usa-states", "usa-counties", "usa-dma"]),
    colorScale: z.enum(["blues", "reds", "greens", "viridis"])
  }),

  execute: async ({ title, data, geoType, colorScale }) => {
    // Validate geographic data availability
    const geoDataPath = `/geo/${geoType === "world" ? "world-countries-110m.json" : "us-states-10m.json"}`;

    // Create Canvas-ready artifact
    const chartContent = {
      type: "geographic-chart",
      title,
      data,
      geoType,
      colorScale,
      metadata: {
        chartType: "geographic",
        dataPoints: data.length,
        responsive: true,
        sizing: { width: "100%", height: "400px" }
      }
    };

    return {
      content: [{ type: "text", text: `Created ${geoType} map "${title}"` }],
      structuredContent: {
        result: [{
          success: true,
          artifact: {
            kind: "charts",
            title: `Geographic Map: ${title}`,
            content: JSON.stringify(chartContent, null, 2),
            metadata: chartContent.metadata
          },
          canvasReady: true
        }]
      },
      isError: false
    };
  }
});
```

### Canvas Performance Optimizations

#### Memory Management
- **Processed Tools Tracking**: Prevents duplicate artifact creation
- **Unmount Detection**: `isMountedRef` prevents state updates after component unmount
- **Memory Usage Monitoring**: Browser memory tracking for debugging large datasets

#### Responsive Design
- **CSS Grid Layout**: Adapts from 1x1 to 2x2+ based on chart count
- **Chart Sizing**: All charts use `height="100%"` for responsive scaling
- **Smooth Scrolling**: Optimized for 5+ charts with proper container heights

#### State Management Optimizations
```typescript
// Debounced artifact processing prevents race conditions
const processingDebounceRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  if (processingDebounceRef.current) {
    clearTimeout(processingDebounceRef.current);
  }

  processingDebounceRef.current = setTimeout(() => {
    // Process chart tools with duplicate prevention
    const completedCharts = chartTools.filter(/* ... */);
    // Create Canvas artifacts with proper state management
  }, 150); // 150ms debounce

  return () => {
    if (processingDebounceRef.current) {
      clearTimeout(processingDebounceRef.current);
    }
  };
}, [messages, /* ... */]);
```

### Geographic Chart Capabilities

#### Supported Geographic Data
- **World Map**: `world-countries-110m.json` with ISO country codes
- **US States**: `us-states-10m.json` with 2-letter state codes (CA, TX, NY, etc.)
- **US Counties**: `us-counties-10m.json` for county-level granularity
- **Nielsen DMA**: `nielsentopo.json` for market area analysis

#### Geographic Data Management
- **Local TopoJSON Files**: All geographic data served from `/public/geo/`
- **Dynamic Projections**: `geoNaturalEarth1` for world, `geoAlbersUsa` for US maps
- **Smart Region Mapping**: Automatic code resolution based on geography type
- **Download Script**: `public/geo/download-geo-data.js` for future data updates

### Chart Color System Integration

#### CSS Variable Architecture
All Canvas charts use the established color system:
```css
:root {
  --chart-1: hsl(221.2 83.2% 53.3%);  /* Beautiful blue */
  --chart-2: hsl(212 95% 68%);         /* Light blue */
  --chart-3: hsl(216 92% 60%);         /* Medium blue */
  --chart-4: hsl(210 98% 78%);         /* Lighter blue */
  --chart-5: hsl(212 97% 87%);         /* Very light blue */
}
```

#### Chart Component Integration
```typescript
// CORRECT pattern for Canvas chart colors
const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Usage in Recharts components:
fill={`var(--color-${sanitizeCssVariableName(seriesName)})`}
```

### Canvas Development Best Practices

#### Tool Development Guidelines
1. **Use Native AI SDK Streaming**: Implement `async function*` with `yield` statements
2. **Return Structured Results**: Include `shouldCreateArtifact: true` for Canvas processing
3. **Responsive Chart Sizing**: Use `height="100%"` not fixed pixel heights
4. **CSS Variable Colors**: Never hardcode colors, use established design system
5. **Error Handling**: Implement comprehensive validation and error states
6. **Chart Library Quirks**: For gauge charts, explicitly set `subArcs: []` to prevent react-gauge-component validation errors

#### Performance Considerations
1. **Debounced Processing**: 150ms debounce prevents rapid artifact updates
2. **Memory Tracking**: Monitor heap usage with large datasets
3. **Cleanup Patterns**: Proper useEffect cleanup and ref management
4. **Responsive Grid**: CSS Grid handles layout optimization automatically

#### Testing Patterns
1. **Chart Tool Execution**: Verify streaming states (loading → processing → success)
2. **Canvas Integration**: Test automatic opening and "Open Canvas" buttons
3. **State Management**: Verify no infinite loops or memory leaks
4. **Geographic Data**: Ensure TopoJSON files load correctly
5. **Multi-Chart Dashboards**: Test layout scaling with 5+ charts

This Canvas system represents a significant advancement in AI-powered data visualization, providing users with a seamless, real-time dashboard creation experience that integrates naturally with conversational AI interactions.
- create any docs whenever i ask claude to create a plan or a task list in the @claude-plan-docs/plans/ folder only