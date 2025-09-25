# 🔧 Admin-Shared Agents Visibility Bug Fix - PRP

## 📋 Project Requirements and Planning Document

**Feature:** Fix admin-shared agents visibility bug preventing regular users from seeing admin-created shared agents

**Target Implementation:** One-pass implementation with comprehensive validation

**Framework Context:** Next.js 15 + Better-Auth 1.3.7 + Vercel AI SDK + PostgreSQL + Drizzle ORM

---

## 🎯 Problem Statement

### Current Issue
Admin-shared agents created by admin users are not appearing in the agent dropdown for regular users (e.g., `sid@samba.tv`), despite the admin account seeing them correctly.

### Expected Behavior
- Admin creates agent with `visibility: "admin-shared"`
- Admin-shared agents should appear in all users' agent dropdown menus
- Regular users should be able to select and use admin-shared agents

### Actual Behavior
- Admin-shared agents only visible to admin account
- Regular users see empty or limited agent lists
- Agent dropdown missing admin-created shared agents

## 🔍 Root Cause Analysis

### Primary Bug Identified
**Location:** `src/app/api/agent/route.ts:8`
```typescript
const session = await getSession(); // ❌ INCORRECT - missing role data
```

**Should be:**
```typescript
const session = await getEnhancedSession(); // ✅ CORRECT - includes role data
```

### Why This Matters
1. **Missing Role Context**: `getSession()` only returns basic Better-Auth session without user role
2. **Enhanced Session Pattern**: `getEnhancedSession()` queries database to add role to session object
3. **Repository Logic Correct**: `selectAgents()` method properly supports `admin-shared` visibility
4. **Consistent Pattern Violation**: Admin routes correctly use `getEnhancedSession()`

### Technical Evidence
- **Database Schema**: ✅ `AgentSchema.visibility` supports `"admin-shared"`
- **Repository Query**: ✅ Lines 161, 187, 219 include `admin-shared` in "shared" filter
- **Frontend Filter**: ✅ Uses `filters=mine,shared` which should include admin-shared
- **Migration History**: ✅ Migration 0014 added user.role column

## 🏗️ Implementation Plan

### Implementation Approach

#### 1. **Direct Session Fix** (Primary Solution)
```typescript
// File: src/app/api/agent/route.ts
// Change line 8:
- const session = await getSession();
+ const session = await getEnhancedSession();
```

#### 2. **Validation Points**
- Verify enhanced session includes role data
- Confirm admin-shared agents exist in database
- Test complete user flow: admin creates → user sees → user selects

#### 3. **Error Handling Enhancement**
Add debugging information for session validation:
```typescript
if (!session?.user?.id || !session?.user?.role) {
  console.error('Invalid session data:', {
    hasUserId: !!session?.user?.id,
    hasRole: !!session?.user?.role
  });
  return new Response("Unauthorized", { status: 401 });
}
```

### Technology Context & Patterns

#### Better-Auth Integration Patterns
**Session Management:** Better Auth uses traditional cookie-based sessions with automatic expiration
**Enhanced Sessions:** Custom `getEnhancedSession()` implementation queries database for additional user data
**Role-Based Access:** Follows Better-Auth patterns for role field with `input: false` security

**Reference Documentation:**
- Better-Auth Session Management: https://www.better-auth.com/docs/concepts/session-management
- Next.js Integration: https://www.better-auth.com/docs/integrations/next
- TypeScript Support: https://www.better-auth.com/docs/concepts/typescript

#### Database & Repository Patterns
**Drizzle ORM:** Repository pattern with database-level filtering and limiting
**Query Logic:** Complex OR conditions handle multiple visibility levels including `admin-shared`
**Type Safety:** Full PostgreSQL schema with proper enum constraints

**Reference Patterns:**
- `src/lib/db/pg/repositories/agent-repository.pg.ts:142-283` - `selectAgents()` method
- `src/app/api/admin/agents/route.ts:23` - Correct enhanced session usage
- `src/lib/auth/server.ts:114-149` - Enhanced session implementation

#### Vercel AI SDK Observability
**Tracing Integration:** Langfuse SDK v4 with automatic instrumentation
**Error Monitoring:** Complete request/response lifecycle tracking
**Performance Metrics:** Session validation and database query performance

### Pseudocode Implementation
```typescript
// 1. Fix API Route Session
export async function GET(request: Request) {
  const session = await getEnhancedSession(); // ✅ Include role

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Validate Session Enhancement (Debug Mode)
  if (process.env.NODE_ENV === 'development') {
    console.log('Enhanced Session Data:', {
      userId: session.user.id,
      userRole: session.user.role,
      hasRole: !!session.user.role
    });
  }

  // 3. Repository Call (Already Correct)
  const agents = await agentRepository.selectAgents(
    session.user.id,
    filters, // "shared" filter includes admin-shared
    limit,
  );

  return Response.json(agents);
}
```

### Database Validation Queries
```sql
-- Verify admin-shared agents exist
SELECT id, name, visibility, "userId"
FROM agent
WHERE visibility = 'admin-shared';

-- Verify user roles
SELECT id, email, role
FROM "user"
WHERE email IN ('admin@email.com', 'sid@samba.tv');

-- Check complete agent access flow
SELECT a.id, a.name, a.visibility, u.email as creator_email, u.role as creator_role
FROM agent a
JOIN "user" u ON a."userId" = u.id
WHERE a.visibility IN ('admin-shared', 'admin-all');
```

## ✅ Implementation Tasks (In Order)

### Phase 1: Core Fix
- [ ] **Update Agent API Route** - Change `getSession()` to `getEnhancedSession()` in `src/app/api/agent/route.ts`
- [ ] **Add Import Statement** - Ensure `getEnhancedSession` is properly imported from `@/lib/auth/server`
- [ ] **Test API Endpoint** - Verify `/api/agent?filters=shared` returns admin-shared agents

### Phase 2: Database Verification
- [ ] **Check Admin-Shared Agents** - Verify admin-shared agents exist in database
- [ ] **Validate User Roles** - Confirm admin and regular user roles are correctly set
- [ ] **Test Repository Logic** - Direct test of `selectAgents()` with different user IDs

### Phase 3: End-to-End Validation
- [ ] **Admin Agent Creation** - Admin creates agent with `admin-shared` visibility
- [ ] **Regular User Access** - Login as `sid@samba.tv` and verify agent appears in dropdown
- [ ] **Agent Selection** - Confirm regular user can select and use admin-shared agent
- [ ] **Observability Check** - Verify Langfuse traces show correct session data

### Phase 4: Quality Assurance
- [ ] **TypeScript Validation** - `pnpm check-types`
- [ ] **Linting** - `pnpm lint`
- [ ] **Unit Tests** - `pnpm test` (if existing tests affected)
- [ ] **Build Validation** - `pnpm build:local`

## 🧪 Validation Gates

### Technical Validation (Required)
```bash
# TypeScript and Code Quality
pnpm check-types           # No TypeScript errors
pnpm lint                  # Biome linting passes
pnpm test                  # All unit tests pass

# Better-Chatbot Specific Validation
pnpm build:local           # Vercel AI SDK build validation
curl -f http://localhost:3000/api/health/langfuse  # Observability check

# Development Server
NODE_OPTIONS="--max-old-space-size=8192" PORT=3000 pnpm dev
```

### Functional Validation (End-to-End)
```bash
# Database Validation
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM agent WHERE visibility = 'admin-shared';"

# API Testing
curl -X GET "http://localhost:3000/api/agent?filters=shared" \
  -H "Cookie: [session-cookie]" \
  -w "\n%{http_code}\n"

# Session Enhancement Test
curl -X GET "http://localhost:3000/api/agent?filters=all" \
  -H "Cookie: [regular-user-session]" \
  | jq '.[] | select(.visibility == "admin-shared")'
```

### User Flow Validation
1. **Admin Flow**: Login as admin → Create agent with `admin-shared` visibility → Verify creation
2. **User Flow**: Login as `sid@samba.tv` → Open agent dropdown → Verify admin-shared agents visible
3. **Usage Flow**: Regular user selects admin-shared agent → Starts conversation → Verify functionality

## 🚨 Error Handling & Edge Cases

### Session Validation
```typescript
if (!session?.user?.id || !session?.user?.role) {
  return new Response("Unauthorized - Invalid session", { status: 401 });
}
```

### Database Connection Issues
```typescript
try {
  const agents = await agentRepository.selectAgents(userId, filters, limit);
  return Response.json(agents);
} catch (error) {
  console.error("Database error in agent selection:", error);
  return new Response("Database error", { status: 500 });
}
```

### Role Validation Edge Cases
- User without role (fallback to "user")
- Session without enhanced data
- Database role query failures

## 📊 Success Criteria

### Primary Success Metrics
- [ ] **Admin-shared agents visible**: `sid@samba.tv` sees admin-created agents in dropdown
- [ ] **Agent selection works**: Regular users can select admin-shared agents
- [ ] **No regression**: Existing agent functionality remains intact
- [ ] **Performance maintained**: No significant API response time increase

### Secondary Success Metrics
- [ ] **Observability**: Langfuse traces show correct session enhancement
- [ ] **Type Safety**: No TypeScript errors in enhanced session usage
- [ ] **Code Consistency**: All API routes follow same session pattern
- [ ] **Database Integrity**: Role-based filtering works correctly

## 🔗 Reference Materials

### Better-Auth Documentation
- **Session Management**: https://www.better-auth.com/docs/concepts/session-management
- **TypeScript Support**: https://www.better-auth.com/docs/concepts/typescript
- **Next.js Integration**: https://www.better-auth.com/docs/integrations/next
- **Admin Plugin**: https://www.better-auth.com/docs/plugins/admin

### Next.js RBAC Patterns
- **Auth.js RBAC Guide**: https://authjs.dev/guides/role-based-access-control
- **Session Enhancement**: https://next-auth.js.org/configuration/callbacks
- **Middleware Patterns**: https://nextjs.org/docs/app/guides/authentication

### Codebase Reference Files
- **Enhanced Session Implementation**: `src/lib/auth/server.ts:114-149`
- **Repository Query Logic**: `src/lib/db/pg/repositories/agent-repository.pg.ts:142-283`
- **Admin Route Pattern**: `src/app/api/admin/agents/route.ts:23`
- **Database Schema**: `src/lib/db/pg/schema.pg.ts:50-61` (Agent visibility enum)
- **Migration History**: `src/lib/db/migrations/pg/0014_wandering_felicia_hardy.sql`

### Project Architecture Context
- **Vercel AI SDK**: Foundation for all AI operations with streaming support
- **Observability**: Langfuse SDK v4 with automatic tracing via `experimental_telemetry`
- **Database**: PostgreSQL with Drizzle ORM and repository pattern
- **Authentication**: Better-Auth with cookie-based sessions and role enhancement

## 🎯 Confidence Score: 9/10

### High Confidence Factors
- **Clear Root Cause**: Single-line change with obvious fix
- **Existing Pattern**: Admin routes already use correct `getEnhancedSession()` pattern
- **Repository Logic Verified**: Database queries correctly handle `admin-shared` visibility
- **Strong Test Coverage**: Multiple validation layers (DB, API, E2E)
- **Minimal Risk**: Change is isolated to single API endpoint

### Risk Mitigation
- **Backward Compatibility**: Enhanced session includes all original session data
- **Error Handling**: Comprehensive validation and fallback mechanisms
- **Observability**: Langfuse tracing provides real-time debugging capability
- **Rollback Plan**: Single-line change can be easily reverted if issues occur

---

**Implementation Time Estimate:** 30 minutes - 1 hour (including testing)
**Testing Time Estimate:** 30 minutes (database validation + user flow testing)
**Total Delivery Time:** 1-2 hours maximum

This PRP provides comprehensive context for one-pass implementation success with minimal risk and maximum validation coverage.