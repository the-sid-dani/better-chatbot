# 🎯 Admin-Controlled Agent Platform Implementation Plan

## Overview

Transform the better-chatbot platform into an admin-controlled agent sharing platform where administrators can create preconfigured agents with specific tools and system prompts that automatically become available to all platform users.

**Vision:** Platform administrators create specialized agents (e.g., "Data Analyst", "Code Reviewer", "Research Assistant") that appear in every user's agent dropdown, providing consistent, curated AI experiences across the organization.

## Phase 1: Foundation - Database & Authentication

### Database Schema Extensions

**User Role System:**
```sql
-- Add role column to existing user table (table name is "user" not "users")
ALTER TABLE "user" ADD COLUMN role VARCHAR(20) DEFAULT 'user';
CREATE INDEX idx_user_role ON "user"(role);

-- Valid roles: 'admin' | 'user'
```

**Agent Visibility Enhancement:**
```typescript
// Current visibility enum in src/lib/db/pg/schema.pg.ts:
visibility: varchar("visibility", {
  enum: ["public", "private", "readonly"], // Current
})

// Target extension:
enum: ["public", "private", "readonly", "admin-shared"] // New
```

**Migration Strategy:**
- Cannot use `ALTER TYPE` directly for enum extension
- Requires careful PostgreSQL enum migration
- Must preserve all existing agents and their visibility settings

### Authentication Enhancement

**Session Extension (src/lib/auth/server.ts):**
```typescript
// Extend existing getSession() function
export const getEnhancedSession = async () => {
  const session = await getSession(); // Existing function
  if (!session?.user?.id) return null;

  // Query user role from database
  const user = await db
    .select({ role: UserSchema.role })
    .from(UserSchema)
    .where(eq(UserSchema.id, session.user.id))
    .limit(1);

  return {
    ...session,
    user: {
      ...session.user,
      role: user[0]?.role || 'user',
    }
  };
};
```

**Middleware Protection:**
```typescript
// Extend existing middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const session = await getEnhancedSession();
    if (session?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Existing middleware logic continues...
  return NextResponse.next();
}
```

## Phase 2: Repository & API Extensions

### Agent Repository Enhancement

**Key File:** `src/lib/db/pg/repositories/agent-repository.pg.ts`

**Critical Modification (Line 156-160):**
```typescript
// EXISTING CODE (lines 156-160):
or(
  eq(AgentSchema.visibility, "public"),
  eq(AgentSchema.visibility, "readonly"),
),

// ENHANCED CODE:
or(
  eq(AgentSchema.visibility, "public"),
  eq(AgentSchema.visibility, "readonly"),
  eq(AgentSchema.visibility, "admin-shared"), // ADD THIS LINE
),
```

This single line addition makes admin-shared agents appear for all users in the existing `selectAgents` method.

### Admin API Endpoints

**New API Structure:**
```
/api/admin/
├── agents/
│   ├── GET    - List admin agents
│   ├── POST   - Create admin agent
│   └── [id]/
│       ├── PUT    - Update admin agent
│       └── DELETE - Delete admin agent
├── users/
│   ├── GET    - List users with roles
│   └── [id]/role/
│       └── PUT    - Update user role
```

**Admin Agent API (src/app/api/admin/agents/route.ts):**
```typescript
export async function POST(request: Request) {
  const session = await getEnhancedSession();

  if (session?.user?.role !== 'admin') {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const agentData = AgentCreateSchema.parse(body);

  // Create agent with admin-shared visibility
  const agent = await agentRepository.insertAgent({
    ...agentData,
    userId: session.user.id,
    visibility: 'admin-shared', // Key difference
  });

  return Response.json(agent);
}
```

### Tool Integration Preservation

**Critical:** The existing tool loading pipeline in `src/app/api/chat/route.ts` requires NO CHANGES.

**Current Tool Loading (Preserved):**
```typescript
// Lines 97-105 in src/app/api/chat/route.ts - KEEP EXACTLY AS IS
const MCP_TOOLS = await loadMcpTools({
  mentions,
  allowedMcpServers,
});

const WORKFLOW_TOOLS = await loadWorkFlowTools({
  mentions,
  dataStream,
});

const APP_DEFAULT_TOOLS = await loadAppDefaultTools({
  mentions,
  allowedAppDefaultToolkit,
});
```

**How Admin Agents Get Tools:**
1. Admin creates agent with `mentions` array specifying tools
2. User selects admin agent in dropdown
3. Agent's `instructions.mentions` are added to chat context (line 141-143)
4. Existing tool loading pipeline automatically provides the tools
5. No modifications to core chat logic needed

## Phase 3: Admin Dashboard UI

### Route Structure
```
src/app/(chat)/admin/
├── layout.tsx          - Admin-only layout with navigation
├── page.tsx            - Dashboard overview
├── agents/
│   ├── page.tsx        - Agent management interface
│   └── [id]/
│       └── edit/
│           └── page.tsx - Edit admin agent
```

### Core Components

**Admin Layout (src/app/(chat)/admin/layout.tsx):**
```typescript
export default async function AdminLayout({ children }) {
  const session = await getEnhancedSession();

  if (session?.user?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
```

**Agent Badge Component (src/components/ui/admin-badge.tsx):**
```typescript
export function AdminResourceBadge({ resource }) {
  if (resource.visibility === 'admin-shared') {
    return (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        <Crown className="w-3 h-3 mr-1" />
        Admin Shared
      </Badge>
    );
  }
  return null;
}
```

### UI Integration Points

**Extend Existing Components:**
- **AgentCard**: Add admin badge for admin-shared agents
- **ShareableActions**: Extend visibility dropdown for admin users
- **EditAgent**: Add admin-only visibility option

## Phase 4: Tool Access & Permissions

### Tool Access Strategy

**Admin agents get full tool access through existing patterns:**

1. **MCP Tools**: Admin agents can specify any MCP server in their `mentions`
2. **App Default Tools**: Full access to all toolkit categories:
   - `Visualization`: Charts, tables, data visualization
   - `WebSearch`: EXA search and content tools
   - `Http`: HTTP request tool
   - `Code`: JavaScript and Python execution
   - `Artifacts`: Canvas chart tools (15 specialized chart types)
3. **Workflows**: Admin agents can include any workflow in their `mentions`

**Tool Configuration Example:**
```typescript
const adminAgent: Agent = {
  name: "Data Analyst",
  description: "Expert data analysis and visualization",
  visibility: "admin-shared",
  instructions: {
    role: "Data Analyst",
    systemPrompt: "You are an expert data analyst...",
    mentions: [
      // MCP Tools
      { type: "mcpTool", serverName: "neon", name: "run_sql", serverId: "neon-id" },
      { type: "mcpTool", serverName: "github", name: "search_repositories", serverId: "gh-id" },

      // App Default Tools
      { type: "defaultTool", name: "CreateChart", label: "CreateChart" },
      { type: "defaultTool", name: "JavascriptExecution", label: "JavascriptExecution" },
      { type: "defaultTool", name: "WebSearch", label: "WebSearch" },

      // Workflows
      { type: "workflow", name: "Data Processing", workflowId: "workflow-id" }
    ]
  }
};
```

### Permission System

**Read-Only Access for Users:**
- Users can select and chat with admin agents
- Users cannot edit admin agent configurations
- Admin agents are clearly marked with badges
- Tool access is determined by agent's `mentions` array

## Phase 5: Observability & Analytics

### Langfuse Integration

**Admin Agent Usage Tracking:**
```typescript
// Extend existing observability in src/app/api/chat/route.ts
updateActiveTrace({
  name: "samba-orion",
  sessionId: id,
  userId: session.user.id,
  input: inputText,
  metadata: {
    agentId: agent?.id,
    agentName: agent?.name,
    isAdminAgent: agent?.visibility === 'admin-shared', // NEW
    provider: chatModel?.provider,
    model: chatModel?.model,
    userRole: session.user.role, // NEW
  },
});
```

**Metrics to Track:**
- Admin agent adoption rates
- Most used admin agents
- Tool usage by admin agents
- Cost attribution per admin agent
- User engagement with admin vs personal agents

## Phase 6: Migration & Deployment

### Database Migration Script
```sql
-- Phase 1: Add role column
ALTER TABLE "user" ADD COLUMN role VARCHAR(20) DEFAULT 'user';
CREATE INDEX idx_user_role ON "user"(role);

-- Phase 2: Extend visibility enum (complex PostgreSQL operation)
-- This requires careful enum extension strategy
-- Cannot be done with simple ALTER TYPE

-- Phase 3: Performance optimization
CREATE INDEX CONCURRENTLY idx_agents_visibility_admin_shared
  ON agent (visibility, "userId")
  WHERE visibility = 'admin-shared';
```

### Feature Flag Strategy
```env
# Gradual rollout controls
FEATURE_ADMIN_ROLES=true
FEATURE_ADMIN_AGENTS=true
FEATURE_ADMIN_DASHBOARD=false  # Enable last

# Rollback safety
ADMIN_AGENT_VISIBILITY_ENABLED=true
```

### Deployment Phases

1. **Database Migration**: Add role column and indexes
2. **Authentication Extension**: Deploy enhanced session management
3. **Repository Updates**: Single-line modification to include admin-shared agents
4. **API Deployment**: Admin management endpoints
5. **UI Deployment**: Admin dashboard and badges
6. **Feature Activation**: Enable admin features via environment variables

## Critical Success Factors

### Must Preserve
- **Existing Tool Pipeline**: Zero changes to `src/app/api/chat/route.ts` tool loading
- **Agent Architecture**: Current `AgentSchema` and repository patterns
- **UI Components**: Existing `ShareableActions`, `AgentCard`, `EditAgent` functionality
- **Observability**: Langfuse integration and telemetry

### Must Avoid
- **Tool Restriction Bug**: Never use `mentions?.length ? {} : servers` - breaks agents
- **Breaking Changes**: All existing agents and users must continue working
- **Performance Regression**: Database queries must remain efficient

### Must Test
- **Agent Functionality**: Admin agents work for all users
- **Tool Access**: Proper tool loading for admin agents
- **Permission System**: Admin-only access controls
- **Migration Safety**: Zero-downtime database updates

## Implementation Priority

1. **Database & Auth** (Phase 1): Foundation for all features
2. **Repository Changes** (Phase 2): Core functionality - single line change
3. **Admin APIs** (Phase 2): Management capabilities
4. **UI Components** (Phase 3): Visual interface and badges
5. **Dashboard** (Phase 3): Complete admin experience
6. **Analytics** (Phase 5): Usage insights and optimization

This plan leverages the existing architecture maximally while adding the minimal changes needed to achieve the admin-controlled agent platform vision.