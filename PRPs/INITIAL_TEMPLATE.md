## FEATURE:

Transform the better-chatbot platform into an admin-controlled agent sharing platform where administrators can create preconfigured agents with specific tools and system prompts that automatically become available to all platform users.

**Core Transformation:**
- Add user role system (admin/user) to existing Better-Auth setup
- Extend agent visibility system to include "admin-shared" agents
- Create admin dashboard for managing platform-wide agents
- Ensure admin-created agents appear automatically in all users' agent selectors

## TOOLS:

### Database Extensions
- **User Role System**: Add `role` field to existing `UserSchema` with enum `["admin", "user"]`
- **Visibility Enhancement**: Extend agent visibility from current `["public", "private", "readonly"]` to include `"admin-shared"`
- **Repository Pattern**: Modify existing `pgAgentRepository.selectAgents()` to include admin-shared agents in "all" and "shared" filters

### Authentication & Authorization
- **Session Enhancement**: Extend existing `getSession()` in `src/lib/auth/server.ts` to include user role
- **Middleware Protection**: Add admin route protection to existing `middleware.ts`
- **Role Verification**: Create `requireAdmin()` helper for API route protection

### Agent Management APIs
- **Admin Agent API**: New `/api/admin/agents` endpoints (GET, POST, PUT, DELETE)
- **Bulk Operations**: Admin tools for managing multiple agents
- **Agent Import/Export**: JSON-based agent configuration sharing

### UI Components
- **Admin Dashboard**: New `/admin` route with agent management interface
- **Agent Badges**: Visual indicators for admin-shared agents in existing `AgentCard` components
- **Conditional UI**: Role-based component rendering using existing `ShareableActions` pattern
- **Admin Toolbar**: Quick actions for agent creation and management

### Tool Integration
- **Preserved Tool Loading**: Maintain existing tool loading pipeline in `src/app/api/chat/route.ts`
- **MCP Server Access**: Admin-shared agents get full MCP server access via existing `allowedMcpServers`
- **Workflow Integration**: Admin agents can include workflows via existing `mentions` system
- **App Default Tools**: Full access to existing visualization, web search, code execution tools

## DEPENDENCIES:

### Core Infrastructure
- **Vercel AI SDK v5.0.26**: Foundation for all AI operations (preserved)
- **Better-Auth v1.3.7**: User authentication and session management
- **PostgreSQL + Drizzle ORM**: Database layer with schema extensions
- **Next.js 15 App Router**: Routing and middleware for admin sections

### Existing Systems to Preserve
- **Agent Architecture**: Current `AgentSchema` and repository patterns
- **Tool Loading Pipeline**: Existing `loadMcpTools`, `loadWorkFlowTools`, `loadAppDefaultTools` functions
- **UI Components**: Current `ShareableActions`, `AgentCard`, `EditAgent` components
- **Observability**: Langfuse integration and telemetry system

### New Dependencies
- **Role-Based Access Control**: Middleware and API protection
- **Admin UI Libraries**: Dashboard components (likely Tremor or existing Radix UI)
- **Bulk Operations**: Efficient database queries for admin management

### API Key Requirements
- **Existing API Keys**: OpenAI, Anthropic, Google (for agent operation)
- **MCP Servers**: All existing MCP server configurations preserved
- **Langfuse**: Observability for admin agent usage tracking

### Database Schema Changes
```sql
-- Add role column to existing user table
ALTER TABLE "user" ADD COLUMN role VARCHAR(20) DEFAULT 'user';
CREATE INDEX idx_user_role ON "user"(role);

-- Extend visibility enum (requires migration strategy)
-- Current: ["public", "private", "readonly"]
-- Target: ["public", "private", "readonly", "admin-shared"]
```

## EXAMPLES:

### Agent Configuration Examples
**Located in**: `src/lib/ai/agent/example.ts`
- **RandomDataGeneratorExample**: Shows agent with tool mentions (JavaScript, CreateTable)
- **WeatherExample**: Demonstrates HTTP tool integration
- **Admin Agent Pattern**: How admin agents should be structured with comprehensive tool access

### Tool Integration Examples
**Located in**: `src/lib/ai/tools/tool-kit.ts`
- **APP_DEFAULT_TOOL_KIT**: Complete toolkit including Visualization, WebSearch, HTTP, Code, Artifacts
- **MCP Integration**: Existing MCP tool loading in `src/app/api/chat/shared.chat.ts`
- **Workflow Tools**: Integration pattern in `loadWorkFlowTools` function

### UI Component Examples
**Located in**: `src/components/agent/edit-agent.tsx`
- **Tool Selection**: `AgentToolSelector` for choosing available tools
- **Visibility Control**: `ShareableActions` component for visibility management
- **Permission System**: `hasEditAccess` and `isOwner` patterns

## DOCUMENTATION:

### Internal Documentation
- **CLAUDE.md**: Comprehensive project architecture and patterns
- **src/app/api/CLAUDE.md**: API layer documentation
- **src/components/CLAUDE.md**: UI component system documentation

### Implementation References
- **Agent Repository**: `src/lib/db/pg/repositories/agent-repository.pg.ts` - selectAgents method analysis
- **Tool Loading**: `src/app/api/chat/shared.chat.ts` - MCP, Workflow, App tool integration
- **Authentication**: `src/lib/auth/server.ts` - Session management patterns
- **UI Patterns**: `src/components/shareable-actions.tsx` - Visibility system implementation

### External Resources
- **Better-Auth Documentation**: User role extensions and session management
- **Drizzle ORM**: Schema migrations and enum extensions
- **Vercel AI SDK**: Tool integration patterns and streaming
- **Langfuse**: Admin usage tracking and observability

### MCP Server Documentation
- **Integration Guide**: How admin agents can access MCP servers
- **Tool Customization**: Per-agent MCP server configurations
- **OAuth Flows**: Third-party service authentication for admin agents

## OTHER CONSIDERATIONS:

### Critical Anti-Patterns to Avoid
- **Tool Restriction Bug**: Never use `mentions?.length ? {} : servers` pattern - this breaks agents
- **Agent Mentions Logic**: Agent mentions are ADDITIVE (specify which tools to use), not restrictive
- **Tool Loading Pipeline**: Preserve existing `loadMcpTools`, `loadWorkFlowTools`, `loadAppDefaultTools` structure

### Performance Considerations
- **Database Indexing**: Add indexes for role and visibility queries
- **Repository Optimization**: Single query modifications to existing `selectAgents` method
- **UI Rendering**: Conditional admin UI to avoid unnecessary renders for regular users
- **Observability Impact**: Admin agent usage tracked via existing Langfuse integration

### Security Requirements
- **Role-Based Access**: Strict middleware enforcement for admin routes
- **API Protection**: All admin endpoints require role verification
- **Session Security**: Enhanced session validation for admin operations
- **Agent Isolation**: Admin agents read-only for non-admin users

### Migration Strategy
- **Zero-Downtime**: Database migrations must be additive only
- **Backward Compatibility**: All existing agents and functionality preserved
- **Feature Flags**: Gradual rollout with environment variable controls
- **Rollback Plan**: Ability to disable admin features via configuration

### Testing Requirements
- **Agent Functionality**: Verify admin agents work for all users
- **Tool Loading**: Ensure existing tool pipeline remains functional
- **Permission System**: Test role-based access controls
- **UI Integration**: Admin badges and visibility controls

### Localhost Constraint
- **Development Requirement**: Platform only works on localhost:3000 due to auth/observability constraints
- **Port Restrictions**: Cannot use alternative ports (3001, 3002, etc.)
- **Production Deployment**: Must configure proper domains for production use