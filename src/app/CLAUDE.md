# CLAUDE.md for src/app/

## Folder Identity
### Classification
- **Primary Type**: Source Code - Next.js App Router Application
- **Secondary Types**: Full-Stack Web Application, TypeScript-based, Production-Ready
- **Domain**: AI Chatbot Platform with MCP Integration, Agent Management, and Workflow Automation
- **Criticality**: Essential - Core application structure

### Purpose Statement
This folder contains the complete Next.js 15 App Router application structure for "better-chatbot", an advanced AI chatbot platform built entirely on **Vercel AI SDK** as the foundational AI framework. It provides unified access to multiple LLM providers through Vercel AI SDK abstractions, integrates with Model Context Protocol (MCP) servers through Vercel AI SDK tool conversion, provides agent management, workflow automation, and comprehensive observability through Langfuse SDK v4 integration. It serves as both the frontend React application and the backend API endpoints in a unified full-stack architecture optimized for Vercel AI SDK streaming patterns and experimental_telemetry.

## Architectural Context

### Position in Project Hierarchy
*App Router core for Next.js 15 application structure*

**Key directories:**
- `(auth)/` - Authentication routes
- `(chat)/` - Main chat interface
- `api/` - Backend API endpoints
- `store/` - Client-side state management

### Integration Points
- **Dependencies**: src/components/ (UI), src/lib/ (business logic), app-types/ (types)
- **External Integrations**: AI providers, MCP servers, PostgreSQL, Redis

## Complete Content Inventory

### File Structure (Detailed)
```
app/
├── 📁 (auth)/                    # Route group for authentication pages
│   ├── 📄 layout.tsx            # Auth-specific layout with animated backgrounds
│   ├── 📁 sign-in/
│   │   └── 📄 page.tsx          # Sign-in page with multiple auth providers
│   └── 📁 sign-up/
│       └── 📄 page.tsx          # User registration page
├── 📁 (chat)/                   # Route group for main chat application
│   ├── 📄 layout.tsx            # Chat layout with sidebar and header
│   ├── 📄 swr-config.tsx       # SWR configuration for data fetching
│   ├── 📁 agent/
│   │   └── 📁 [id]/
│   │       └── 📄 page.tsx      # Individual agent chat interface
│   ├── 📁 agents/
│   │   └── 📄 page.tsx          # Agent management and listing
│   ├── 📁 archive/
│   │   ├── 📄 page.tsx          # Archive listing page
│   │   └── 📁 [id]/
│   │       └── 📄 page.tsx      # Individual archive viewer
│   ├── 📁 chat/
│   │   └── 📁 [thread]/
│   │       └── 📄 page.tsx      # Dynamic chat thread interface
│   ├── 📁 mcp/                  # MCP server management
│   │   ├── 📁 create/
│   │   │   └── 📄 page.tsx      # MCP server creation interface
│   │   ├── 📁 modify/
│   │   │   └── 📁 [id]/
│   │   │       └── 📄 page.tsx  # MCP server modification
│   │   └── 📁 test/
│   │       └── 📁 [id]/
│   │           └── 📄 page.tsx  # MCP server testing interface
│   └── 📁 workflow/
│       └── 📁 [id]/
│           └── 📄 page.tsx      # Workflow execution and management
├── 📁 api/                      # Backend API routes (App Router API)
│   ├── 📁 agent/               # Agent-related API endpoints
│   │   ├── 📄 route.ts          # CRUD operations for agents
│   │   ├── 📁 [id]/
│   │   │   └── 📄 route.ts      # Individual agent operations
│   │   └── 📁 ai/
│   │       └── 📄 route.ts      # AI-powered agent operations
│   ├── 📁 archive/             # Archive management API
│   │   ├── 📄 actions.ts        # Server actions for archives
│   │   ├── 📄 route.ts          # Archive CRUD operations
│   │   └── 📁 [id]/
│   │       ├── 📄 route.ts      # Individual archive operations
│   │       └── 📁 items/
│   │           ├── 📄 route.ts  # Archive item management
│   │           └── 📁 [itemId]/
│   │               └── 📄 route.ts # Individual item operations
│   ├── 📁 auth/                # Authentication API
│   │   ├── 📄 actions.ts        # Auth server actions
│   │   └── 📁 [...all]/
│   │       └── 📄 route.ts      # Better Auth catch-all route
│   ├── 📄 bookmark/
│   │   └── 📄 route.ts          # Bookmark management
│   ├── 📁 chat/                # Core chat API
│   │   ├── 📄 actions.ts        # Chat server actions
│   │   ├── 📄 route.ts          # Main chat endpoint with streaming
│   │   ├── 📄 shared.chat.ts    # Shared chat utilities and logic
│   │   ├── 📁 models/
│   │   │   └── 📄 route.ts      # Available AI models endpoint
│   │   ├── 📁 openai-realtime/
│   │   │   └── 📄 route.ts      # OpenAI Realtime API integration
│   │   ├── 📁 temporary/
│   │   │   └── 📄 route.ts      # Temporary chat sessions
│   │   └── 📁 title/
│   │       └── 📄 route.ts      # Chat title generation
│   ├── 📁 mcp/                 # MCP server integration API
│   │   ├── 📄 actions.ts        # MCP server actions
│   │   ├── 📄 route.ts          # MCP server management
│   │   ├── 📁 list/
│   │   │   └── 📄 route.ts      # List available MCP servers
│   │   ├── 📁 oauth/
│   │   │   ├── 📄 route.ts      # OAuth initiation
│   │   │   └── 📁 callback/
│   │   │       └── 📄 route.ts  # OAuth callback handling
│   │   ├── 📁 server-customizations/
│   │   │   └── 📁 [server]/
│   │   │       └── 📄 route.ts  # Server-specific customizations
│   │   └── 📁 tool-customizations/
│   │       └── 📁 [server]/
│   │           ├── 📄 route.ts  # Tool-level customizations
│   │           └── 📁 [tool]/
│   │               └── 📄 route.ts # Individual tool customization
│   ├── 📄 thread/
│   │   └── 📄 route.ts          # Thread management
│   ├── 📁 user/
│   │   └── 📁 preferences/
│   │       └── 📄 route.ts      # User preference management
│   └── 📁 workflow/            # Workflow automation API
│       ├── 📄 route.ts          # Workflow CRUD operations
│       ├── 📁 [id]/
│       │   ├── 📄 route.ts      # Individual workflow operations
│       │   ├── 📁 execute/
│       │   │   └── 📄 route.ts  # Workflow execution
│       │   └── 📁 structure/
│       │       └── 📄 route.ts  # Workflow structure management
│       └── 📁 tools/
│           └── 📄 route.ts      # Available workflow tools
├── 📁 store/                   # Client-side state management
│   ├── 📄 index.ts             # Main Zustand store with persistence
│   └── 📄 workflow.store.ts    # Workflow-specific state management
├── 📄 layout.tsx               # Root layout with themes, fonts, and providers
├── 📄 globals.css              # Global CSS styles and Tailwind imports
└── 📄 page.tsx                 # Root page (redirects to chat)
```

### File Categories and Purposes

#### Core Application Files (Essential for app function)
- **layout.tsx**: Root application layout providing theme support, font configuration, internationalization, and global providers. Sets up the entire application shell.
- **globals.css**: Global CSS file importing Tailwind CSS and custom styles. Critical for application styling.

#### Route Groups (Next.js 13+ App Router Feature)
- **(auth)/** - Route group for authentication pages. Uses parentheses to group routes without affecting URL structure. Includes custom layout with animated backgrounds.
- **(chat)/** - Route group for the main chat application. Contains the primary user interface with sidebar, header, and all chat-related functionality.

#### API Routes (Backend Functionality)
- **api/chat/route.ts**: Core chat endpoint handling streaming responses, tool execution, MCP integration, and AI model management. Most complex API route.
- **api/chat/shared.chat.ts**: Shared utilities for chat functionality including tool loading, execution, and message processing.
- **api/mcp/**: Complete MCP (Model Context Protocol) server integration including OAuth flows, server management, and tool customization.
- **api/agent/**: Agent management system allowing users to create, modify, and interact with AI agents.
- **api/workflow/**: Workflow automation system for complex task orchestration.

#### State Management
- **store/index.ts**: Main Zustand store with persistence handling application-wide state including threads, agents, MCP servers, and user preferences.
- **store/workflow.store.ts**: Specialized store for workflow-related state management.

#### Page Components (UI Entry Points)
- **Dynamic Routes**: Uses Next.js dynamic routing extensively with [id], [thread], [server], [tool] parameters for flexible navigation.
- **Nested Routing**: Deep nesting structure supporting complex navigation patterns like `/chat/[thread]`, `/mcp/modify/[id]`, etc.

### File Relationships and Dependencies
```
layout.tsx (Root)
  ↓ provides context to
(auth)/layout.tsx + (chat)/layout.tsx
  ↓ render
page.tsx components
  ↓ use
store/index.ts (State Management)
  ↓ calls
api/*/route.ts (API Endpoints)
  ↓ uses
shared.chat.ts + actions.ts (Business Logic)
  ↓ integrates with
External AI/MCP Services
```

## Technology & Patterns

### Technology Stack
*See main project CLAUDE.md for comprehensive technology details*

Key app-specific technologies:
- **Next.js 15 App Router**: File-based routing with route groups
- **Server Components**: React 19 server components for performance
- **Zustand**: Persistent state management (v2.0.1)
- **next-intl**: Internationalization support

### Design Patterns Detected
- **App Router Pattern**: File-based routing with (auth) and (chat) route groups
- **Server/Client Component Split**: Strategic use of React 19 features
- **Route Groups**: Logical grouping without URL impact
- **Dynamic Routing**: Extensive use of [param] and [...catchall] syntax

### Coding Standards Applied
- **File Naming**: kebab-case for directories, PascalCase for React components, camelCase for utilities
- **Import Organization**: External imports first, then internal imports with path aliases (@/)
- **Type Safety**: Comprehensive TypeScript usage with strict configuration
- **Error Handling**: Consistent error boundaries and API error responses
- **Server Actions**: Next.js server actions for form handling and data mutations

## Operational Workflows

### Development Workflow
1. Create page.tsx in appropriate route group
2. Add route.ts files in api/ directory
3. Update Zustand stores for state
4. Define types in app-types/

## Critical Context & Warnings

### ⚠️ Critical Information
- **Do NOT modify**: `api/auth/[...all]/route.ts` - Better Auth catch-all handler
- **Environment Variables**: Required for AI provider API keys, database connections
- **MCP Protocol**: Follows strict MCP specification for server communication
- **Authentication**: Sessions required for most API endpoints
- **Rate Limiting**: AI provider rate limits affect chat functionality

### 📌 Important Conventions
- **Route Groups**: Use parentheses for logical grouping: (auth), (chat)
- **Dynamic Routes**: Use square brackets: [id], [thread], [server]
- **API Routes**: Must export named HTTP methods (GET, POST, PUT, DELETE)
- **Server Actions**: Use "use server" directive for form actions
- **Client Components**: Use "use client" for interactive components

### 🔄 State Management
- **Zustand Store**: Persisted in localStorage with versioning (mc-app-store-v2.0.1)
- **SWR Caching**: API responses cached and revalidated automatically
- **Server State**: Database state managed via Drizzle ORM
- **Real-time Updates**: Server-Sent Events for live chat updates

## Usage Examples

### Example 1: Creating a New API Route
```typescript
// app/api/example/route.ts
import { getSession } from "auth/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your logic here
  return NextResponse.json({ data: "success" });
}
```

### Example 2: Adding a New Page with Layout
```typescript
// app/(chat)/example/page.tsx
import { getTranslations } from "next-intl/server";

export default async function ExamplePage() {
  const t = await getTranslations("common");

  return (
    <div>
      <h1>{t("example")}</h1>
    </div>
  );
}
```

## Evolution & History

### Version History Patterns
- **Change frequency**: High - active development with weekly releases
- **Change types**: Feature additions, bug fixes, performance improvements, MCP integration enhancements
- **Stability**: Production-ready with comprehensive error handling

### Future Considerations
- **Planned changes**: Enhanced workflow system, improved MCP server management, voice chat improvements
- **Scalability**: Designed for multi-user deployment with proper isolation
- **Technical debt**: Some API routes could benefit from better error handling standardization

## Quick Reference

### Essential Commands
*See main project CLAUDE.md for complete command reference*

### Key Files to Understand First
1. **layout.tsx** - Start here to understand overall app structure and providers
2. **api/chat/route.ts** - Core chat functionality and AI integration
3. **store/index.ts** - Application state management and data flow
4. **(chat)/layout.tsx** - Main application layout with sidebar and navigation

### Common Tasks
- **To add a new chat feature**: Modify api/chat/route.ts and update relevant UI components
- **To add a new page**: Create page.tsx in appropriate route group with proper imports
- **To modify state**: Update Zustand store in store/index.ts
- **To add API endpoint**: Create route.ts in api/ directory with proper authentication

## Domain-Specific Intelligence

### AI Chatbot Platform Knowledge
- **Multi-Provider Support**: Integrates with OpenAI, Anthropic, Google AI, XAI, and OpenRouter
- **Model Context Protocol**: Advanced integration allowing dynamic tool loading from external servers
- **Agent System**: Users can create custom AI agents with specific instructions and tool access
- **Workflow Automation**: Visual workflow builder for complex task automation
- **Real-time Streaming**: All chat responses use streaming for better UX
- **Tool Execution**: Supports manual and automatic tool execution with rich UI feedback

### Security Considerations
- **Authentication**: Better Auth provides secure session management
- **Authorization**: Per-user data isolation in database queries
- **API Security**: All endpoints validate user sessions
- **Data Privacy**: User data encrypted and properly isolated
- **Rate Limiting**: Implemented at AI provider level

### Performance Optimizations
- **Server Components**: Reduces client-side JavaScript bundle
- **Streaming**: Real-time responses without blocking UI
- **Caching**: SWR for client-side caching, Redis for server-side
- **Database**: Optimized queries with proper indexing
- **Bundle Optimization**: Next.js automatic code splitting

## Cross-Reference Index
- **Main Documentation**: See project README.md for setup instructions
- **Component Documentation**: src/components/ directory for UI components
- **Type Definitions**: app-types/ directory for TypeScript interfaces
- **Database Schema**: lib/db/ directory for database configuration
- **Authentication**: auth/ directory for authentication logic
- **MCP Integration**: lib/ai/mcp/ directory for MCP-specific functionality

---
*Generated for src/app/ on 2025-09-15*
*Analysis Depth: Comprehensive*
*This CLAUDE.md provides comprehensive context for AI assistance with the better-chatbot application structure*