# src/app/api/ - Backend API Routes

Next.js 15 App Router API endpoints with Vercel AI SDK integration and Langfuse observability.

## Key Endpoints

**Core Chat:**
- `chat/route.ts` - Main chat endpoint with streaming AI responses and Canvas integration
- `chat/shared.chat.ts` - Tool loading pipeline (MCP, workflow, app tools)

**Authentication:**
- `auth/[...all]/route.ts` - Better-Auth catch-all handler

**Features:**
- `agent/` - AI agent CRUD and AI-powered generation
- `mcp/` - MCP server management and OAuth flows
- `workflow/` - Visual workflow execution
- `thread/route.ts` - Chat thread management

## Development Patterns

**Authentication Pattern:**
```typescript
const session = await getSession();
if (!session?.user.id) {
  return new Response("Unauthorized", { status: 401 });
}
```

**AI Streaming:** All AI operations use `streamText` with `experimental_telemetry`

**Tool Integration:** Convert all tools (MCP, Workflow, App) to Vercel AI SDK interface

**Critical:**
- Chart tools return `shouldCreateArtifact: true` for Canvas integration
- Use repository pattern for database operations
- Validate all inputs with Zod schemas from `app-types/`

