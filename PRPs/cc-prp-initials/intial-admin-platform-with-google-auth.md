# 🎯 Admin-Controlled Agent Platform with Samba Google Auth

## FEATURE OVERVIEW

Transform the better-chatbot platform into an admin-controlled agent sharing platform with **Samba-only Google OAuth authentication**. Administrators can create preconfigured agents with specific tools and system prompts that automatically become available to all authenticated Samba employees.

**Vision:** Samba employees authenticate with their company Google accounts, then access both personal agents and admin-curated specialized agents (e.g., "Data Analyst", "Code Reviewer", "Research Assistant") that appear in every user's agent dropdown.

## CRITICAL CONTEXT FOR IMPLEMENTATION

### Codebase Architecture (PRESERVE EXACTLY)
- **Vercel AI SDK v5.0.26**: Foundation for all AI operations - NO CHANGES to tool loading pipeline
- **Better-Auth v1.3.7**: Current authentication system with session management
- **Agent System**: Single line change in `src/lib/db/pg/repositories/agent-repository.pg.ts` line 156-160
- **Tool Integration**: Existing `loadMcpTools`, `loadWorkFlowTools`, `loadAppDefaultTools` MUST be preserved

### Authentication Requirements
- **Samba Domain Restriction**: Only `@sambatv.com` email addresses allowed (THIS WILL BE CHANGED IN THE FUTURE ONCE THE PRODUCT IS OUT OF BETA TESTING PHASE AND IS READY FOR ALPHA CUSTOMER LAUNCH STAGE)
- **Google Workspace Internal App**: OAuth consent screen configured for internal use
- **No External Access**: Platform restricted to Samba employees only (THIS WILL BE CHANGED IN THE FUTURE ONCE THE PRODUCT IS OUT OF BETA TESTING PHASE AND IS READY FOR ALPHA CUSTOMER LAUNCH STAGE)
- **Admin Role Assignment**: Manual admin role assignment through database (we are using neon for cloud, and postgres docker for local development)

### Database Schema Constraints
- **Table Name**: `"user"` (not `"users"`) - critical for queries (make sure to see which tables we currently have already)
- **Enum Extension**: PostgreSQL enum extension requires careful migration (not ALTER TYPE)
- **Index Strategy**: Add indexes for performance without breaking existing queries

## IMPLEMENTATION PHASES

### Phase 1: Google OAuth Integration & Domain Restriction

#### Google Cloud Project Configuration
```typescript
// Environment variables needed from Samba Google Cloud project
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_AUTHORIZED_DOMAIN=sambatv.com
```

#### Better Auth Google Provider Setup
```typescript
// src/lib/auth/server.ts - EXTEND existing auth config
export const auth = betterAuth({
  // ... existing configuration preserved
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["email", "profile"],
      mapProfileToUser: (profile) => {
        // Restrict to Samba domain
        if (!profile.email?.endsWith('@sambatv.com')) {
          throw new Error('Access restricted to Samba employees');
        }
        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  },
});
```

#### Domain Validation Middleware
```typescript
// src/middleware.ts - ADD domain validation
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Existing ping handler preserved...
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // NEW: Admin route protection
  if (pathname.startsWith('/admin')) {
    const session = await getEnhancedSession();
    if (session?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}
```

### Phase 2: Database Schema Extensions

#### User Role System Migration
```sql
-- Migration: Add role column to existing user table
-- File: src/lib/db/migrations/pg/0014_add_user_roles.sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role ON "user"(role);

-- Valid roles: 'admin' | 'user'
-- Admin assignment done manually via database update
```

#### Agent Visibility Enum Extension
```sql
-- Complex PostgreSQL enum extension (cannot use ALTER TYPE directly)
-- File: src/lib/db/migrations/pg/0015_extend_visibility_enum.sql

-- Step 1: Create new enum with additional value
CREATE TYPE visibility_type_new AS ENUM ('public', 'private', 'readonly', 'admin-shared');

-- Step 2: Update table to use new enum
ALTER TABLE agent
ALTER COLUMN visibility TYPE visibility_type_new
USING visibility::text::visibility_type_new;

-- Step 3: Drop old enum and rename new one
DROP TYPE visibility_type;
ALTER TYPE visibility_type_new RENAME TO visibility_type;

-- Step 4: Add performance index
CREATE INDEX CONCURRENTLY idx_agents_visibility_admin_shared
  ON agent (visibility, "userId")
  WHERE visibility = 'admin-shared';
```

#### Drizzle Schema Updates
```typescript
// src/lib/db/pg/schema.pg.ts - UPDATE schema definitions

// User schema extension
export const UserSchema = pgTable("user", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: text("password"),
  image: text("image"),
  role: varchar("role", { enum: ["admin", "user"] }).default("user"), // NEW
  preferences: json("preferences").default({}).$type<UserPreferences>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Agent visibility enum extension
export const visibilityEnum = pgEnum("visibility_type", [
  "public",
  "private",
  "readonly",
  "admin-shared" // NEW
]);
```

### Phase 3: Enhanced Session Management

#### Session Extension for Roles
```typescript
// src/lib/auth/server.ts - ADD enhanced session function
export const getEnhancedSession = async () => {
  const session = await getSession(); // Existing function preserved
  if (!session?.user?.id) return null;

  // Query user role from database
  const user = await db
    .select({
      role: UserSchema.role,
      email: UserSchema.email
    })
    .from(UserSchema)
    .where(eq(UserSchema.id, session.user.id))
    .limit(1);

  // Verify Samba domain (double-check)
  if (user[0]?.email && !user[0].email.endsWith('@sambatv.com')) {
    throw new Error('Access restricted to Samba employees');
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user[0]?.role || 'user',
    }
  };
};
```

### Phase 4: Repository Enhancement (CRITICAL SINGLE LINE CHANGE)

#### Agent Repository Modification
```typescript
// src/lib/db/pg/repositories/agent-repository.pg.ts
// CRITICAL: Only modify lines 156-160 in selectAgents method

// EXISTING CODE (FIND THIS EXACT BLOCK):
or(
  eq(AgentSchema.visibility, "public"),
  eq(AgentSchema.visibility, "readonly"),
),

// REPLACE WITH (ADD ONE LINE):
or(
  eq(AgentSchema.visibility, "public"),
  eq(AgentSchema.visibility, "readonly"),
  eq(AgentSchema.visibility, "admin-shared"), // ADD THIS LINE ONLY
),
```

**This single line makes admin-shared agents appear for all Samba users automatically.**

### Phase 5: Admin Management APIs

#### Admin Agent API Structure
```typescript
// src/app/api/admin/agents/route.ts - NEW FILE
import { getEnhancedSession } from "@/lib/auth/server";
import { agentRepository } from "@/lib/db/pg/repositories/agent-repository.pg";
import { AgentCreateSchema } from "@/types/agent";

export async function GET() {
  const session = await getEnhancedSession();

  if (session?.user?.role !== 'admin') {
    return new Response("Forbidden", { status: 403 });
  }

  const adminAgents = await agentRepository.selectAgents(
    session.user.id,
    ["all"]
  ).then(agents =>
    agents.filter(agent => agent.visibility === 'admin-shared')
  );

  return Response.json(adminAgents);
}

export async function POST(request: Request) {
  const session = await getEnhancedSession();

  if (session?.user?.role !== 'admin') {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const agentData = AgentCreateSchema.parse(body);

  // Force admin-shared visibility
  const agent = await agentRepository.insertAgent({
    ...agentData,
    userId: session.user.id,
    visibility: 'admin-shared', // KEY: Auto-shared with all users
  });

  return Response.json(agent);
}
```

#### User Role Management API
```typescript
// src/app/api/admin/users/[id]/role/route.ts - NEW FILE
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getEnhancedSession();

  if (session?.user?.role !== 'admin') {
    return new Response("Forbidden", { status: 403 });
  }

  const { role } = await request.json();

  if (!['admin', 'user'].includes(role)) {
    return new Response("Invalid role", { status: 400 });
  }

  await db
    .update(UserSchema)
    .set({ role, updatedAt: new Date() })
    .where(eq(UserSchema.id, params.id));

  return Response.json({ success: true });
}
```

### Phase 6: Admin Dashboard UI

#### Admin Route Structure
```
src/app/(chat)/admin/
├── layout.tsx          - Role-protected layout
├── page.tsx            - Dashboard overview with stats
├── agents/
│   ├── page.tsx        - Admin agent management
│   ├── create/
│   │   └── page.tsx    - Create admin agent form
│   └── [id]/
│       └── edit/
│           └── page.tsx - Edit admin agent
└── users/
    └── page.tsx        - User role management
```

#### Admin Layout with Samba Branding
```typescript
// src/app/(chat)/admin/layout.tsx
import { getEnhancedSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getEnhancedSession();

  if (session?.user?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="admin-layout min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Samba Admin</h1>
              <p className="text-sm text-slate-600">Agent Platform Management</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {session.user.email} • Admin
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-80px)]">
          <nav className="p-4 space-y-2">
            <NavLink href="/admin" icon={BarChart3}>Dashboard</NavLink>
            <NavLink href="/admin/agents" icon={Bot}>Admin Agents</NavLink>
            <NavLink href="/admin/users" icon={Users}>User Management</NavLink>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Agent Badge Component
```typescript
// src/components/ui/admin-badge.tsx - NEW FILE
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

export function AdminResourceBadge({ resource }: { resource: { visibility: string } }) {
  if (resource.visibility === 'admin-shared') {
    return (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        <Crown className="w-3 h-3 mr-1" />
        Samba Shared
      </Badge>
    );
  }
  return null;
}
```

### Phase 7: UI Component Extensions

#### Extend ShareableActions for Admin Visibility
```typescript
// src/components/shareable-actions.tsx - EXTEND existing component
const VISIBILITY_CONFIG = {
  agent: {
    private: { label: "Agent.private", description: "Agent.privateDescription" },
    readonly: { label: "Agent.readOnly", description: "Agent.readOnlyDescription" },
    public: { label: "Agent.public", description: "Agent.publicDescription" },
    "admin-shared": { // NEW
      label: "Agent.adminShared",
      description: "Available to all Samba employees"
    },
  },
  // ... existing workflow config
} as const;
```

#### Extend AgentCard with Admin Badge
```typescript
// src/components/agent/agent-card.tsx - ADD badge integration
import { AdminResourceBadge } from "@/components/ui/admin-badge";

export function AgentCard({ agent, ...props }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{agent.name}</CardTitle>
          {agent.description && <CardDescription>{agent.description}</CardDescription>}
        </div>
        <div className="flex items-center space-x-2">
          <AdminResourceBadge resource={agent} />
          {/* existing badges */}
        </div>
      </CardHeader>
      {/* existing card content */}
    </Card>
  );
}
```

### Phase 8: Tool Access & Permission System

#### Admin Agent Tool Configuration
Admin agents automatically get full tool access through existing `mentions` system:

```typescript
// Example admin agent configuration
const adminDataAnalyst: Agent = {
  name: "Samba Data Analyst",
  description: "Expert data analysis for Samba metrics and insights",
  visibility: "admin-shared",
  instructions: {
    role: "Data Analyst for Samba",
    systemPrompt: `You are a specialized data analyst for Samba. You help analyze:
    - Viewership metrics and audience insights
    - Content performance analytics
    - Market research data
    - Advertising campaign effectiveness

    Always provide actionable insights specific to Samba's business needs.`,
    mentions: [
      // MCP Tools - Database access
      { type: "mcpTool", serverName: "neon", name: "run_sql", serverId: "neon-id" },
      { type: "mcpTool", serverName: "github", name: "search_repositories", serverId: "gh-id" },

      // App Default Tools - Full visualization suite
      { type: "defaultTool", name: "CreateChart", label: "CreateChart" },
      { type: "defaultTool", name: "CreateGeographicChart", label: "CreateGeographicChart" },
      { type: "defaultTool", name: "JavascriptExecution", label: "JavascriptExecution" },
      { type: "defaultTool", name: "WebSearch", label: "WebSearch" },

      // Workflows - Data processing
      { type: "workflow", name: "Data Processing Pipeline", workflowId: "workflow-id" }
    ]
  }
};
```

#### Permission Enforcement
- **Admin Creation**: Only admins can create `admin-shared` agents
- **User Access**: All Samba users can use admin agents (read-only)
- **Edit Rights**: Only original admin creator can edit admin agents
- **Tool Access**: Determined by agent's `mentions` array (existing system)

### Phase 9: Enhanced Observability

#### Track Admin vs Personal Agent Usage
```typescript
// src/app/api/chat/route.ts - EXTEND existing observability
updateActiveTrace({
  name: "samba-orion",
  sessionId: id,
  userId: session.user.id,
  input: inputText,
  metadata: {
    agentId: agent?.id,
    agentName: agent?.name,
    isAdminAgent: agent?.visibility === 'admin-shared', // NEW
    userRole: session.user.role, // NEW
    userDomain: session.user.email?.split('@')[1], // NEW - should be 'sambatv.com'
    provider: chatModel?.provider,
    model: chatModel?.model,
    toolChoice,
    environment: "production",
  },
});
```

## GOOGLE CLOUD PROJECT CONFIGURATION REQUIRED

### OAuth Consent Screen Setup
1. **Application Type**: Internal (Samba Google Workspace only)
2. **Application Name**: "Samba Agent Platform"
3. **Authorized Domain**: `sambatv.com`
4. **Scopes**: `email`, `profile` (basic information only)

### OAuth Client Credentials
```env
# Required from Samba Google Cloud project
GOOGLE_CLIENT_ID=xxx-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx-xxx-xxx
```

### Domain Restrictions
- **Authorized JavaScript Origins**: `http://localhost:3000`, `https://your-domain.com`
- **Authorized Redirect URIs**: `http://localhost:3000/api/auth/callback/google`
- **Domain Verification**: Verify ownership of `sambatv.com` domain

## VALIDATION GATES

### Database Validation
```bash
# Test database migrations
pnpm db:generate
pnpm db:push

# Verify schema changes
pnpm db:studio
# Check: user table has 'role' column
# Check: agent visibility enum includes 'admin-shared'
```

### Authentication Testing
```bash
# Test Google OAuth flow
curl -X GET "http://localhost:3000/api/auth/signin/google"

# Verify domain restriction
# Should reject non-@sambatv.com emails
```

### Agent Functionality Testing
```bash
# Test admin agent visibility
# 1. Create admin agent with admin-shared visibility
# 2. Login as regular user
# 3. Verify admin agent appears in dropdown
# 4. Verify tools work correctly
```

### Repository Query Testing
```sql
-- Test admin agent queries
SELECT name, visibility, "userId"
FROM agent
WHERE visibility = 'admin-shared';

-- Test user role queries
SELECT email, role
FROM "user"
WHERE role = 'admin';
```

## DEPLOYMENT STRATEGY

### Prerequisites
1. **Samba Google Cloud project configured**
2. **Domain verification completed**
3. **OAuth consent screen approved for internal use**
4. **Environment variables configured**

### Migration Order
1. **Database migrations** (role column, enum extension)
2. **Authentication updates** (Google OAuth integration)
3. **Repository changes** (single line modification)
4. **API deployments** (admin endpoints)
5. **UI deployments** (admin dashboard, badges)
6. **Admin user promotion** (manual database update)

### Rollback Plan
```bash
# Disable admin features
FEATURE_ADMIN_ROLES=false
FEATURE_GOOGLE_AUTH=false

# Database rollback (if needed)
# Role column can be dropped safely
# Enum extension can revert via migration
```

## SUCCESS CRITERIA

### Authentication
- [x] Only `@sambatv.com` emails can authenticate
- [x] Google OAuth integration working
- [x] Session management with roles
- [x] Admin route protection

### Agent Functionality
- [x] Admin agents appear for all Samba users
- [x] Tool access works through existing pipeline
- [x] Admin badges display correctly
- [x] Permission system enforced

### Performance
- [x] Single repository query modification
- [x] No impact on existing tool loading
- [x] Database indexes optimize queries
- [x] UI conditional rendering efficient

**Confidence Score: 9/10** - This plan leverages existing architecture maximally while adding minimal, well-tested changes. The single-line repository modification and Google OAuth integration are both proven patterns with clear implementation paths.

## CRITICAL GOTCHAS

### Authentication
- **Domain Verification**: Must verify `sambatv.com` ownership in Google Cloud
- **Internal App Setup**: Requires Google Workspace organization configuration
- **Session Security**: Enhanced session validation for admin operations

### Database
- **Enum Extension**: Cannot use `ALTER TYPE` - requires complex migration
- **Table Name**: Must use `"user"` (not `"users"`) for compatibility
- **Index Strategy**: Add indexes concurrently to avoid downtime

### Code Integration
- **Tool Pipeline**: NEVER modify existing `loadMcpTools` functions
- **Agent Mentions**: Preserve existing mention system - it's ADDITIVE
- **Repository Pattern**: Only modify the single line in `selectAgents` method

This plan ensures Samba employees get secure, domain-restricted access to both personal and admin-curated agents through their existing Google Workspace accounts.