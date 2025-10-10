# CLAUDE.md

**Samba-AI** is an AI chatbot platform built on **Vercel AI SDK** with Next.js 15. This is a branded fork of "better-chatbot" that maintains upstream compatibility.

## Core Features
- Unified LLM interface (OpenAI, Anthropic, Google, xAI, Ollama, OpenRouter)
- MCP protocol integration with dynamic tool loading
- Custom AI agents with tool permissions
- Visual workflow builder
- **Multi-grid Canvas for real-time data visualization**
- Comprehensive observability via Langfuse

## Tech Stack
- **AI:** Vercel AI SDK v5.0.26, Langfuse SDK v4.1.0
- **Backend:** Next.js 15.3.2, PostgreSQL, Drizzle ORM 0.41.0
- **Auth:** Better-Auth 1.3.7
- **Frontend:** React 19.1.1, Tailwind CSS, Radix UI
- **Tools:** TypeScript 5.9.2, Biome 1.9.4, Vitest, Playwright

## Essential Commands

```bash
# Development
pnpm dev                    # Development server
pnpm build:local && pnpm start  # Production build and start

# Quality checks
pnpm check                  # Lint + types + tests
pnpm test                   # Unit tests
pnpm test:e2e              # E2E tests

# Database
pnpm db:generate           # Generate migrations
pnpm db:push              # Push schema
pnpm db:studio            # Open Drizzle Studio

# Docker
pnpm docker:pg             # Local PostgreSQL
pnpm docker-compose:up     # Full stack
```

## Architecture

**Core Flow:**
1. **Chat API** (`/api/chat/route.ts`) - Vercel AI SDK streaming with Langfuse observability
2. **Tool Loading** - MCP, workflow, and app tools converted to Vercel AI SDK interface
3. **AI Processing** - `streamText()` with `experimental_telemetry` tracing
4. **Canvas Integration** - Chart tools automatically stream to Canvas workspace
5. **Persistence** - Messages and states stored via Drizzle ORM repositories

**Key Integrations:**
- **MCP Protocol:** External tool servers via `src/lib/ai/mcp/`
- **Observability:** Langfuse SDK v4 with automatic tracing
- **Canvas System:** Multi-grid dashboard with 17 specialized chart tools
- **Database:** PostgreSQL with Drizzle ORM schema in `src/lib/db/pg/`

## Key Components

**Authentication:** Better-Auth with OAuth (Google, GitHub, Microsoft) + email/password

**Agents:** 6-component system for creating/managing custom AI agents with tool permissions

**Canvas System:** Multi-grid workspace for real-time data visualization
- 17 specialized chart tools (bar, line, geographic, sankey, etc.)
- Progressive building with `async function*` streaming
- Responsive grid layout with smart positioning

**MCP Integration:** Dynamic tool loading from external servers

**Workflow Engine:** Visual workflow builder using XYFlow

## Observability

**Langfuse Integration:** Automatic tracing of all AI operations via `experimental_telemetry`
- Complete conversation tracking with costs, tokens, and performance metrics
- Tool execution monitoring and MCP server health
- Real-time debugging and optimization insights

## Directory Structure

```
src/
├── app/                   # Next.js App Router (auth, chat, API routes)
├── components/            # React components (agent, canvas, ui, workflows)
├── lib/                   # Core logic (ai, auth, db, observability)
└── hooks/                 # Custom React hooks

Key files:
├── instrumentation.ts     # Langfuse observability setup
├── app-types/            # Shared TypeScript interfaces
└── docker/               # Docker configuration
```

## Development Patterns

**Database:** Use repository pattern, generate migrations with `pnpm db:generate`

**Components:** Server components for data fetching, client components with `"use client"`

**AI Integration:**
- All AI operations use `streamText`/`generateText` from Vercel AI SDK
- Enable `experimental_telemetry` for automatic tracing
- Convert all tools (MCP, Workflow, App) to Vercel AI SDK interface

**Canvas Development:**
- Chart tools use `async function*` with `yield` statements
- Return `shouldCreateArtifact: true` for Canvas processing
- Use responsive sizing (`height="100%"`) for proper scaling

**Critical Agent Anti-Patterns:**
- 🚨 NEVER disable tools based on mentions - agents ALWAYS need tool configuration
- ✅ Agent mentions are ADDITIVE - they specify allowed tools, not restrictions

## Environment Setup

Required variables:
```bash
# LLM Provider (at least one)
OPENAI_API_KEY=****
ANTHROPIC_API_KEY=****
GOOGLE_GENERATIVE_AI_API_KEY=****

# Database & Auth
POSTGRES_URL=postgres://...
BETTER_AUTH_SECRET=****

# Optional
EXA_API_KEY=****  # Web search
```

## Key Files

**Core Architecture:**
- `instrumentation.ts` - Langfuse observability setup
- `src/app/api/chat/route.ts` - Main chat API with streaming
- `src/lib/ai/models.ts` - AI provider configuration
- `src/components/chat-bot.tsx` - Main chat interface with Canvas
- `src/components/canvas-panel.tsx` - Canvas workspace

**Integration:**
- `src/app/api/chat/shared.chat.ts` - Tool loading pipeline
- `src/lib/ai/tools/artifacts/` - 17 specialized chart tools
- `src/lib/db/pg/schema.pg.ts` - Database schema

## Important Notes

**CRITICAL PORT REQUIREMENT:** This project ONLY works on `localhost:3000` - no other ports supported due to auth/observability constraints.

**Debugging:**
- Use `/mcp` page to check MCP server connections
- Use `pnpm db:studio` to inspect database
- Check `instrumentation.ts` loading for observability

