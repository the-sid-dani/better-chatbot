# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Better Chatbot** is an open-source AI chatbot platform built entirely on **Vercel AI SDK** as the foundational AI framework, with Next.js 15 and TypeScript. It provides a unified interface to multiple LLM providers (OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter) through Vercel AI SDK abstractions, enhanced with MCP protocol support, custom agents, visual workflows, and comprehensive observability.

**Foundational Architecture:**
- **AI Framework:** Vercel AI SDK (foundational - all AI operations built on this)
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Observability:** Langfuse SDK v4 with OpenTelemetry
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Better-Auth
- **UI:** React with Tailwind CSS, Radix UI, Framer Motion
- **Testing:** Vitest (unit), Playwright (e2e)
- **Linting/Formatting:** Biome

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
```

## 🏗️ Architecture Overview

### Core System Architecture

**Vercel AI SDK Foundation:**
- **All AI operations** built on `streamText`, `generateText`, and tool abstractions
- **Unified Provider Interface:** OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter through SDK
- **Streaming-First:** Real-time responses with `experimental_telemetry` for observability
- **Tool Integration:** MCP, Workflow, and App tools conform to Vercel AI SDK tool interface
- **Observability:** Automatic tracing through Langfuse SDK v4 integration

**Chat System Flow (Vercel AI SDK-Centric):**
1. **Request:** `/api/chat/route.ts` handles chat requests with observability
2. **Tool Loading:** MCP, workflow, and app tools loaded as Vercel AI SDK tools
3. **Model Provider:** `customModelProvider.getModel()` returns Vercel AI SDK models
4. **AI Processing:** `streamText()` with `experimental_telemetry` for comprehensive tracing
5. **Tool Execution:** Automatic tool calls through Vercel AI SDK abstractions
6. **Observability:** Real-time trace capture via Langfuse integration
7. **Response:** Streaming UI components handle Vercel AI SDK message streams
8. **Database:** Messages and metadata stored via `chatRepository`

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
│   │   └── api/           # API routes (Vercel AI SDK streaming endpoints)
│   ├── components/        # React components
│   │   ├── agent/         # Agent management UI
│   │   ├── layouts/       # App layout components
│   │   ├── tool-invocation/ # Tool result components (Vercel AI SDK tool results)
│   │   └── ui/            # Reusable UI components
│   └── lib/               # Core business logic
│       ├── ai/            # AI-related functionality (Vercel AI SDK-centric)
│       │   ├── mcp/       # MCP protocol → Vercel AI SDK tool conversion
│       │   ├── tools/     # Built-in tools (web search, code execution)
│       │   ├── workflow/  # Workflow engine → Vercel AI SDK tool integration
│       │   └── models.ts  # Vercel AI SDK provider configurations
│       ├── auth/          # Authentication logic
│       ├── db/            # Database layer
│       └── cache/         # Caching (Redis/memory)
└── docs/                  # Documentation
    ├── langfuse-vercel-ai-sdk.md # Observability integration guide
    └── tips-guides/       # Setup and configuration guides
```

## 🔧 Development Patterns

### Database Patterns
- **Repositories:** Use repository pattern in `src/lib/db/repository.ts`
- **Migrations:** Generate with `pnpm db:generate`, run with `pnpm db:migrate`
- **Schema Changes:** Update `schema.pg.ts` then generate migrations

### Component Patterns
- **Server Components:** Default for data fetching
- **Client Components:** Mark with `"use client"` for interactivity
- **UI Components:** Use Radix UI primitives in `src/components/ui/`
- **Styling:** Tailwind CSS with custom design system

### Vercel AI SDK Patterns
- **AI Operations:** All AI calls use `streamText`/`generateText` from Vercel AI SDK
- **Tool Integration:** Convert all tools (MCP, Workflow, App) to Vercel AI SDK tool interface
- **Streaming:** Leverage `createUIMessageStream` and `experimental_telemetry` for observability
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
- `src/components/chat-bot.tsx` - **Main chat interface** - Handles Vercel AI SDK streaming responses

### Integration Files
- `src/lib/ai/mcp/mcp-manager.ts` - **MCP → Vercel AI SDK conversion** - Converts MCP tools to SDK tools
- `src/app/api/chat/shared.chat.ts` - **Tool loading pipeline** - Loads all tools as Vercel AI SDK tools
- `src/lib/ai/workflow/` - **Workflow → Vercel AI SDK integration** - Converts workflows to SDK tools

### Configuration Files
- `src/lib/db/pg/schema.pg.ts` - Database schema
- `drizzle.config.ts` - Database configuration
- `next.config.ts` - Next.js configuration (includes instrumentation hook)
- `biome.json` - Code formatting rules

## 🎯 Development Workflows

### Adding a New Feature
1. Update database schema if needed
2. Generate migrations: `pnpm db:generate`
3. Create API routes in `src/app/api/`
4. Build UI components in `src/components/`
5. Add types to `app-types/`
6. Write tests alongside code
7. Run quality checks: `pnpm check`

### Working with MCP
1. Test MCP servers in `/mcp` page
2. Configure server settings and tool customizations
3. Test tools in `/mcp/test/[id]` page
4. Tools automatically available in chat sessions

### Debugging Performance
1. Check database queries in Studio
2. Monitor API response times
3. Use React DevTools for component performance
4. Check MCP server connection health