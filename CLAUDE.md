# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**Better Chatbot** is an open-source AI chatbot platform built with Next.js 15 and TypeScript. It integrates multiple LLM providers (OpenAI, Anthropic, Google, xAI, Ollama) with powerful features like MCP protocol support, custom agents, visual workflows, and real-time voice chat.

**Key Technologies:**
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Better-Auth
- **UI:** React with Tailwind CSS, Radix UI, Framer Motion
- **AI SDK:** Vercel AI SDK
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

**MCP (Model Context Protocol) Integration:**
- Central to the application's extensibility
- Located in `src/lib/ai/mcp/`
- `mcpClientsManager` manages all MCP server connections
- Supports both file-based and database-based configurations
- Tools are dynamically loaded and bound to chat sessions

**Chat System Flow:**
1. **Request:** `/api/chat/route.ts` handles chat requests
2. **Tool Loading:** MCP tools, workflow tools, and app default tools are loaded
3. **Model Provider:** `customModelProvider` routes to appropriate LLM
4. **Response:** Streaming responses with tool execution
5. **Database:** Messages stored via `chatRepository`

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

**Multi-Model Support:**
- Provider abstraction in `src/lib/ai/models.ts`
- Static models + dynamic OpenAI-compatible providers
- Tool call support detection per model

**Agent System:**
- Custom AI agents with specific instructions and tool access
- Database schema: `AgentSchema` in schema.pg.ts
- UI: `src/components/agent/`

**Workflow Engine:**
- Visual workflow builder using XYFlow
- Located in `src/lib/ai/workflow/`
- Workflows become callable tools in chat
- Node types: LLM nodes and Tool nodes

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Main chat interface
│   └── api/               # API routes
├── components/            # React components
│   ├── agent/            # Agent management UI
│   ├── layouts/          # App layout components
│   ├── tool-invocation/  # Tool result components
│   └── ui/               # Reusable UI components
└── lib/                  # Core business logic
    ├── ai/               # AI-related functionality
    │   ├── mcp/          # MCP protocol implementation
    │   ├── tools/        # Built-in tools (web search, code execution)
    │   └── workflow/     # Workflow engine
    ├── auth/             # Authentication logic
    ├── db/               # Database layer
    └── cache/            # Caching (Redis/memory)
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

### API Route Patterns
- **Authentication:** Use `getSession()` from `auth/server`
- **Error Handling:** Use `ts-safe` for safe error handling
- **Validation:** Zod schemas in `app-types/` directory
- **Streaming:** Use Vercel AI SDK's streaming utilities

### MCP Development
- **Adding Tools:** Create in `src/lib/ai/tools/`
- **MCP Servers:** Configure in database or JSON files
- **Tool Binding:** Happens dynamically in chat routes
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

- `src/app/api/chat/route.ts` - Main chat API logic
- `src/lib/ai/mcp/mcp-manager.ts` - MCP client management
- `src/lib/db/pg/schema.pg.ts` - Database schema
- `src/lib/ai/models.ts` - LLM provider configuration
- `src/components/chat-bot.tsx` - Main chat interface
- `drizzle.config.ts` - Database configuration
- `next.config.ts` - Next.js configuration
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