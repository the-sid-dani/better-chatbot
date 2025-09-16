# CLAUDE.md for /src/app/api/

## Folder Identity
### Classification
- **Primary Type**: Source Code - Next.js 15 App Router API Routes
- **Secondary Types**: RESTful Web Services, Authentication-Protected, TypeScript Strict
- **Domain**: Backend API Layer, AI Chatbot Services, User Management
- **Criticality**: Essential

### Purpose Statement
This folder implements the complete backend API layer for the Better Chatbot application using Next.js 15 App Router conventions. It provides authenticated API endpoints for chat functionality, MCP protocol integration, user management, agent systems, workflow execution, and real-time AI interactions.

## Architectural Context

### Position in Project Hierarchy
```
/Users/sid/Desktop/4. Coding Projects/better-chatbot/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (chat)/          # Chat interface pages
│   │   └── api/             ← YOU ARE HERE
│   │       ├── agent/       # AI agent management
│   │       ├── archive/     # Chat archiving system
│   │       ├── auth/        # Authentication endpoints
│   │       ├── bookmark/    # Bookmark functionality
│   │       ├── chat/        # Core chat functionality
│   │       ├── mcp/         # MCP protocol integration
│   │       ├── thread/      # Chat thread management
│   │       ├── user/        # User preferences
│   │       └── workflow/    # Visual workflow system
│   ├── components/          # React UI components
│   └── lib/                 # Core business logic
```

### Relationship Map
```mermaid
graph TD
    A[/api/ Routes] --> B[auth/server - Authentication]
    A --> C[lib/db/repository - Database Layer]
    A --> D[lib/ai/ - AI Integration Layer]
    A --> E[app-types/ - Type Definitions]
    A --> F[lib/cache - Caching Layer]
    D --> G[lib/ai/mcp - MCP Protocol]
    D --> H[lib/ai/models - LLM Providers]
    D --> I[lib/ai/workflow - Workflow Engine]
    A --> J[Frontend Components via fetch()]
```

### Integration Points
- **Upstream Dependencies**: Database repositories, AI model providers, MCP clients, authentication system
- **Downstream Consumers**: React components, mobile apps (future), third-party integrations
- **Sibling Interactions**: Shares types with app-types/, uses lib/ business logic
- **External Integrations**: OpenAI, Anthropic, Google AI, Ollama, PostgreSQL, Redis

## Complete Content Inventory

### File Structure (Detailed)
```
api/
├── 📁 agent/                    # AI Agent Management System
│   ├── 📄 route.ts             - CRUD operations for AI agents (GET/POST)
│   ├── 📄 ai/route.ts          - AI-powered agent generation endpoint
│   └── 📄 [id]/route.ts        - Individual agent operations (GET/PATCH/DELETE)
├── 📁 archive/                  # Chat Archiving and Export System
│   ├── 📄 route.ts             - Archive CRUD operations (GET/POST)
│   ├── 📄 actions.ts           - Server actions for archive management
│   ├── 📄 [id]/route.ts        - Individual archive operations
│   └── 📄 [id]/items/          - Archive item management
│       ├── 📄 route.ts         - Archive items CRUD
│       └── 📄 [itemId]/route.ts - Individual archive item operations
├── 📁 auth/                     # Authentication System (Better-Auth)
│   ├── 📄 actions.ts           - Server actions for auth operations
│   └── 📄 [...all]/route.ts    - Catch-all Better-Auth handler
├── 📄 bookmark/route.ts         - Bookmark management (GET/POST/DELETE)
├── 📁 chat/                     # Core Chat System - MOST CRITICAL
│   ├── 📄 route.ts             - Main chat endpoint with streaming AI responses
│   ├── 📄 shared.chat.ts       - Shared chat utilities and tool loading
│   ├── 📄 actions.ts           - Server actions for chat operations
│   ├── 📄 temporary/route.ts   - Temporary chat sessions
│   ├── 📄 title/route.ts       - AI-generated chat titles
│   ├── 📄 models/route.ts      - Available AI model listing
│   └── 📄 openai-realtime/route.ts - Real-time voice chat integration
├── 📁 mcp/                      # Model Context Protocol Integration
│   ├── 📄 route.ts             - MCP server management (POST)
│   ├── 📄 actions.ts           - Server actions for MCP operations
│   ├── 📄 list/route.ts        - List available MCP servers
│   ├── 📄 oauth/callback/route.ts - OAuth callback for MCP servers
│   ├── 📄 server-customizations/[server]/route.ts - MCP server customizations
│   └── 📄 tool-customizations/ - MCP tool customization endpoints
├── 📄 thread/route.ts           - Chat thread management (GET/POST/DELETE)
├── 📄 user/preferences/route.ts - User preference management
└── 📁 workflow/                 # Visual Workflow System
    ├── 📄 route.ts             - Workflow CRUD operations
    ├── 📄 actions.ts           - Server actions for workflows
    ├── 📄 tools/route.ts       - Workflow tools listing
    └── 📄 [id]/                - Individual workflow operations
        ├── 📄 route.ts         - Workflow details (GET/PUT/DELETE)
        ├── 📄 execute/route.ts - Workflow execution endpoint
        └── 📄 structure/route.ts - Workflow structure management
```

### File Categories and Purposes

#### Core Chat System Files (Mission Critical)
- **chat/route.ts:292 lines** - Central chat API handling AI streaming, tool integration, message persistence. Contains complex logic for MCP tools, workflows, and multi-model support
- **chat/shared.chat.ts:487 lines** - Extensive shared utilities for tool loading, filtering, execution. Handles MCP tool binding, workflow conversion, manual tool confirmation
- **chat/actions.ts** - Server actions for chat-related operations including agent and MCP server customizations

#### Authentication & Authorization Files
- **auth/[...all]/route.ts:5 lines** - Minimal Better-Auth handler using toNextJsHandler
- **All route files** - Consistently use `getSession()` from "auth/server" for authentication

#### MCP Protocol Integration Files
- **mcp/route.ts** - MCP server registration and management
- **mcp/actions.ts** - MCP-specific server actions
- **mcp/server-customizations/** - Per-server customization endpoints
- **mcp/tool-customizations/** - Per-tool customization endpoints

#### Agent System Files
- **agent/route.ts** - Agent CRUD with filtering and query support
- **agent/ai/route.ts** - AI-powered agent generation
- **agent/[id]/route.ts** - Individual agent management

#### Workflow System Files (Visual AI Workflows)
- **workflow/route.ts** - Workflow management with access control
- **workflow/[id]/execute/route.ts** - Workflow execution engine integration
- **workflow/tools/route.ts** - Available workflow tools

#### Supporting System Files
- **archive/** - Complete archiving system with hierarchical items
- **bookmark/route.ts** - Simple bookmark CRUD operations
- **thread/route.ts** - Chat thread lifecycle management
- **user/preferences/route.ts** - User preference persistence

### File Relationships and Dependencies
```
[chat/route.ts] - MAIN CHAT ENDPOINT
  ↓ imports heavily from
[chat/shared.chat.ts] - SHARED CHAT UTILITIES
  ↓ loads tools from
[lib/ai/mcp/mcp-manager.ts] + [lib/ai/workflow/] + [lib/ai/tools/]
  ↓ uses types from
[app-types/chat] + [app-types/mcp] + [app-types/workflow]
  ↓ persists via
[lib/db/repository] → [PostgreSQL Database]
  ↓ authenticates via
[auth/server.getSession()] → [Better-Auth]
```

## Technology & Patterns

### Technology Stack
- **Runtime**: Node.js with Next.js 15 App Router
- **Language**: TypeScript with strict configuration
- **Framework**: Next.js App Router API Routes (route.ts convention)
- **Authentication**: Better-Auth with session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Vercel AI SDK with multiple providers
- **Validation**: Zod schemas from app-types/
- **Error Handling**: ts-safe library for functional error handling
- **Caching**: Redis and in-memory caching via lib/cache
- **Logging**: Custom logger with consola

### Design Patterns Detected

#### **Next.js App Router Conventions**
- File-based routing with route.ts files
- Dynamic routes using [param] and [...catchall] syntax
- HTTP method exports (GET, POST, PUT, DELETE, PATCH)
- Request/Response object handling

#### **Authentication Pattern**
```typescript
const session = await getSession();
if (!session?.user.id) {
  return new Response("Unauthorized", { status: 401 });
}
```
- Consistent across ALL protected endpoints (25/25 route files)
- Session-based authentication using Better-Auth
- User ID validation before any operations

#### **Repository Pattern**
- Database operations abstracted through repositories
- Examples: `chatRepository`, `agentRepository`, `workflowRepository`
- Imported from `lib/db/repository`

#### **Type-Safe API Pattern**
```typescript
const data = SchemaName.parse(body); // Zod validation
```
- Extensive use of Zod schemas from app-types/
- Runtime type validation for all API inputs
- Type inference for TypeScript safety

#### **Streaming AI Response Pattern**
- Used in chat/route.ts for real-time AI responses
- Vercel AI SDK's `createUIMessageStream` and `streamText`
- Progressive tool execution with streaming updates

#### **Tool Loading Strategy**
- Dynamic tool loading based on mentions and permissions
- Three tool types: MCP tools, Workflow tools, App default tools
- Filtering based on user permissions and mentions

### Coding Standards Applied
- **Naming**: kebab-case for files, camelCase for variables
- **Imports**: Organized with lib/ imports before app-types/
- **Error Handling**: Consistent try/catch with proper HTTP status codes
- **Type Safety**: All inputs validated with Zod, strict TypeScript
- **Authentication**: Universal session checking pattern
- **Logging**: Structured logging with context information

## Operational Workflows

### Development Workflow
1. **Route Creation**: Create route.ts file with HTTP method exports
2. **Authentication**: Add session validation using getSession()
3. **Validation**: Define Zod schema in app-types/ and validate input
4. **Business Logic**: Implement using repository pattern
5. **Response**: Return structured JSON or stream responses

### API Request Lifecycle
1. **Authentication Check**: Session validation via Better-Auth
2. **Input Validation**: Zod schema parsing with error handling
3. **Authorization**: User ownership/permission checks
4. **Business Logic**: Repository calls, AI model interactions
5. **Response**: JSON or streaming response with proper status codes

### Chat System Workflow (Most Complex)
1. **Message Reception**: Parse chat API schema from client
2. **Thread Management**: Create or retrieve existing chat thread
3. **Tool Loading**: Dynamic loading of MCP, workflow, and default tools
4. **System Prompt Building**: Merge user preferences, agent instructions, customizations
5. **AI Streaming**: Process with selected model using Vercel AI SDK
6. **Tool Execution**: Handle tool calls with streaming updates
7. **Message Persistence**: Save messages and metadata to database

### MCP Integration Workflow
1. **Server Registration**: Add MCP server configurations
2. **Tool Discovery**: Load available tools from MCP servers
3. **Permission Filtering**: Apply user-allowed tools and mentions
4. **Customization**: Apply server and tool-specific customizations
5. **Execution**: Route tool calls to appropriate MCP servers

## Critical Context & Warnings

### ⚠️ Critical Information
- **DO NOT modify chat/route.ts** without understanding the complete tool loading pipeline
- **Session validation is mandatory** - every endpoint except auth/[...all] requires it
- **Tool execution is async** - handle streaming responses properly in UI
- **MCP servers can fail** - implement proper error handling for external dependencies
- **Database transactions** - some operations require atomic updates

### 📌 Important Conventions
- **All API routes use Next.js 15 App Router** - no pages/api/ directory
- **HTTP methods as named exports** - export async function GET/POST/etc.
- **Zod validation before database operations** - prevents invalid data persistence
- **Server-only imports** - use "server-only" directive where needed
- **Error responses follow HTTP status conventions** - 401 unauthorized, 403 forbidden, 500 server error

### 🔄 State Management Considerations
- **Chat threads persist across sessions** - implement proper cleanup
- **AI model responses are streamed** - handle partial responses in UI
- **MCP tool states are ephemeral** - no persistent state between calls
- **User preferences cached** - invalidate cache on updates
- **Agent instructions cached** - clear cache on agent updates

### Security Considerations
- **All endpoints authenticated except public auth handler**
- **User isolation enforced** - users can only access their own data
- **API key management** - stored securely, not exposed in responses
- **Input sanitization** - Zod schemas prevent injection attacks
- **Rate limiting** - implement for production deployment

## Usage Examples

### Chat API Usage
```typescript
// POST /api/chat
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    id: 'thread-id',
    message: { role: 'user', content: 'Hello' },
    chatModel: { provider: 'openai', model: 'gpt-4' },
    toolChoice: 'auto',
    allowedMcpServers: { 'server-id': { tools: ['tool-name'] } }
  })
});
```

### Agent Management
```typescript
// GET /api/agent?type=custom&filters=personal,shared&limit=10
const agents = await fetch('/api/agent?type=custom&filters=personal,shared&limit=10');

// POST /api/agent
const newAgent = await fetch('/api/agent', {
  method: 'POST',
  body: JSON.stringify({
    name: 'My Agent',
    description: 'Custom AI assistant',
    instructions: 'You are a helpful assistant...'
  })
});
```

### Workflow Execution
```typescript
// POST /api/workflow/[id]/execute
const result = await fetch(`/api/workflow/${workflowId}/execute`, {
  method: 'POST',
  body: JSON.stringify({ input: 'user input' })
});
```

## Evolution & History

### Version History Patterns
- **Change frequency**: High activity in chat/ and mcp/ directories
- **Change types**: Feature additions, tool integrations, performance optimizations
- **Stability**: Core chat system stable, MCP integration actively evolving

### Architecture Evolution
- **Initial**: Simple chat API with basic AI integration
- **Current**: Complex multi-modal system with tools, agents, workflows
- **Scaling**: Added streaming, tool execution, real-time features
- **Integration**: MCP protocol for extensibility

### Future Considerations
- **Planned changes**: Enhanced real-time features, mobile API support
- **Scalability**: Consider API rate limiting, request queuing
- **Technical debt**: Some complex functions in shared.chat.ts could be refactored
- **Monitoring**: Add observability for AI model usage and performance

## Quick Reference

### Essential Commands
```bash
# Start development server
pnpm dev

# Type checking
pnpm check-types

# Database operations
pnpm db:push        # Apply schema changes
pnpm db:studio      # Open database viewer

# Testing API endpoints
pnpm test           # Run unit tests
pnpm test:e2e       # Run integration tests
```

### Key Files to Understand First
1. **chat/route.ts** - Start here to understand the core chat system and AI integration
2. **chat/shared.chat.ts** - Then review this for tool loading and execution patterns
3. **auth/[...all]/route.ts** - Simple authentication handler pattern
4. **agent/route.ts** - Standard CRUD pattern example

### Common Tasks
- **To add a new API endpoint**: Create route.ts with HTTP method exports and session validation
- **To modify AI chat behavior**: Update chat/route.ts and chat/shared.chat.ts
- **To add MCP integration**: Update mcp/route.ts and tool loading logic
- **To debug API issues**: Check authentication, input validation, and database connectivity

### HTTP Method Distribution
- **GET endpoints**: 15 (data retrieval, listings)
- **POST endpoints**: 16 (creation, chat, execution)
- **PUT/PATCH endpoints**: 8 (updates)
- **DELETE endpoints**: 3 (resource removal)
- **Total API endpoints**: 42 across 25 route files

## Domain-Specific Intelligence

### AI Chat System Architecture
- **Multi-model support**: OpenAI, Anthropic, Google, xAI, Ollama
- **Tool execution pipeline**: MCP tools → Workflow tools → App default tools
- **Streaming responses**: Real-time AI output with progressive tool execution
- **Context management**: System prompts, user preferences, agent instructions
- **Message persistence**: Complete conversation history with metadata

### MCP Protocol Integration
- **Dynamic tool discovery**: Tools loaded from external MCP servers
- **Permission system**: User-controlled tool access and mentions
- **Customization layer**: Per-server and per-tool customizations
- **Error handling**: Graceful degradation when MCP servers unavailable

### Workflow System
- **Visual workflow builder**: Node-based workflow creation
- **Tool conversion**: Workflows become callable tools in chat
- **Execution engine**: Async workflow execution with progress tracking
- **Integration**: Workflows can call other tools and AI models

### Business Logic Patterns
- **Repository abstraction**: Database operations through typed repositories
- **Type-safe validation**: Runtime validation with compile-time types
- **Error boundary**: Graceful error handling with user-friendly messages
- **Permission enforcement**: User-based access control throughout

## Cross-Reference Index
- **Authentication documentation**: `/src/lib/auth/`
- **Database schemas**: `/src/lib/db/pg/schema.pg.ts`
- **Type definitions**: `/app-types/` directory
- **Business logic**: `/src/lib/` directory
- **UI components**: `/src/components/` directory
- **Main project documentation**: `/CLAUDE.md`
- **Environment setup**: `/.env` and `/AGENTS.md`

---
*Generated for /src/app/api/ on 2025-09-15*
*Analysis Depth: comprehensive*
*This CLAUDE.md provides comprehensive context for AI assistance with the Better Chatbot API layer*