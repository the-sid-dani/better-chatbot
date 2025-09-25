# 🔍 Admin-Shared Agents Visibility Bug Investigation Plan

## 🎯 Problem Summary

**Issue**: Admin-shared agents are not appearing in the agent dropdown for the new user account `sid@samba.tv`, despite the main admin account seeing them correctly.

**Context**: Recently implemented admin-auth features following the PRPs:
- `PRPs/cc-prp-initials/intial-admin-platform-with-google-auth.md`
- `PRPs/cc-prp-plans/prp-admin-privileges-implementation-plan 3.md`

**Expected Behavior**: Admin-shared agents should appear in all users' agent dropdown menus
**Actual Behavior**: Admin-shared agents only visible to admin account, not regular users

## 📋 System Analysis Results

### ✅ Components Verified Working

1. **Database Schema**: Properly configured
   - `AgentSchema.visibility` enum includes `"admin-shared"`
   - `UserSchema.role` column exists with `["admin", "user"]` enum
   - Migration `0014_wandering_felicia_hardy.sql` correctly adds admin-shared visibility type

2. **Repository Logic**: Correctly implemented
   - `selectAgents()` method in `agent-repository.pg.ts` includes admin-shared agents in "shared" filter
   - Lines 156-160 contain proper OR conditions for shared agents including `admin-shared`
   - Query logic handles `"all"` filter correctly (line 62-84)

3. **Authentication System**: Working as designed
   - `getEnhancedSession()` function properly queries user role from database
   - Session includes user role information
   - Domain verification temporarily disabled for development

4. **Frontend Components**: Using correct filters
   - `agents-list.tsx` uses `"/api/agent?filters=mine,shared"` (line 43)
   - Should include admin-shared agents through "shared" filter

## 🔍 Identified Issues & Investigation Areas

### 🚨 Primary Suspects

#### 1. **API Route Session Issue** (HIGH PRIORITY)
**Problem**: `src/app/api/agent/route.ts` uses `getSession()` instead of `getEnhancedSession()`
- **Line 8**: `const session = await getSession();`
- **Impact**: Agent API doesn't have user role information, may affect query logic
- **Fix**: Change to use `getEnhancedSession()` for proper role-based filtering

#### 2. **Database State Investigation** (HIGH PRIORITY)
**Questions**:
- Are there actually admin-shared agents in the database?
- What is the exact visibility value of the admin agent?
- Is the user `sid@samba.tv` properly created in the database?
- Does the admin user have the correct role in the database?

#### 3. **Session/Authentication Flow** (MEDIUM PRIORITY)
**Questions**:
- Is `sid@samba.tv` getting proper session data?
- Is the enhanced session working correctly for the new user?
- Are there any middleware issues blocking the new user?

### 🔄 Investigation Workflow

## Phase 1: Database Verification (CRITICAL)
```sql
-- 1. Check if admin-shared agents exist
SELECT id, name, visibility, "userId" FROM agent WHERE visibility = 'admin-shared';

-- 2. Verify user roles
SELECT id, email, role FROM "user" WHERE email IN ('admin@email.com', 'sid@samba.tv');

-- 3. Check agent creation by admin user
SELECT a.id, a.name, a.visibility, u.email as creator_email
FROM agent a
JOIN "user" u ON a."userId" = u.id
WHERE u.role = 'admin';
```

## Phase 2: API Route Fix (IMMEDIATE)
```typescript
// Fix: src/app/api/agent/route.ts
// Change line 8 from:
const session = await getSession();

// To:
const session = await getEnhancedSession();
```

## Phase 3: Session Debugging (VERIFICATION)
```typescript
// Add debugging to API route to verify session data
console.log('Session data:', {
  userId: session?.user?.id,
  userEmail: session?.user?.email,
  userRole: session?.user?.role
});
```

## Phase 4: Repository Query Testing (VALIDATION)
```typescript
// Test direct repository call
const agents = await agentRepository.selectAgents(
  'sid-user-id-here',
  ['shared'],
  50
);
console.log('Shared agents for sid:', agents);
```

## 🎯 Step-by-Step Investigation Plan

### Step 1: Verify Database State
- [ ] Connect to database and check if admin-shared agents exist
- [ ] Verify user roles are properly set
- [ ] Confirm migrations were applied successfully

### Step 2: Fix API Route Session Issue
- [ ] Update `src/app/api/agent/route.ts` to use `getEnhancedSession()`
- [ ] Test API endpoint with new session handling

### Step 3: Add Debugging & Logging
- [ ] Add temporary console logs to track session data
- [ ] Log repository query results for debugging
- [ ] Verify filters being passed to selectAgents

### Step 4: Test User Flow
- [ ] Create test admin agent with admin-shared visibility
- [ ] Login as `sid@samba.tv` and verify agent appears
- [ ] Test with different filters ('all', 'shared', 'mine,shared')

### Step 5: Validate Complete Flow
- [ ] End-to-end test: Admin creates agent → Regular user sees agent
- [ ] Verify agent dropdown population
- [ ] Confirm agent selection and usage works

## 🔧 Quick Debug Commands

```bash
# Check database directly (if using local PostgreSQL)
psql $POSTGRES_URL -c "SELECT id, name, visibility FROM agent WHERE visibility = 'admin-shared';"

# Test API endpoint directly
curl -X GET "http://localhost:3000/api/agent?filters=shared" \
  -H "Cookie: [session-cookie]"

# Check user session in browser dev tools
localStorage.getItem('session'); // or check Network tab for session cookies
```

## 🚨 Immediate Actions Required

### Priority 1 (Fix Now)
1. **Update API Route**: Change `getSession()` to `getEnhancedSession()` in agent route
2. **Database Verification**: Confirm admin-shared agents exist and user roles are correct

### Priority 2 (Investigate)
1. **Session Flow Testing**: Verify enhanced session works for new users
2. **Repository Testing**: Direct test of selectAgents with sid's user ID

### Priority 3 (Validate)
1. **End-to-End Testing**: Complete admin-create → user-see flow
2. **Clean Up Debugging**: Remove console logs after fix confirmed

## 📋 Success Criteria

- [ ] Admin-shared agents appear in `sid@samba.tv` agent dropdown
- [ ] Regular users can select and use admin-shared agents
- [ ] No regression in existing agent functionality
- [ ] Proper error handling for edge cases

## 🔍 Root Cause Hypothesis

**Primary Theory**: API route session issue preventing proper user role detection, causing admin-shared agents to be filtered out incorrectly.

**Secondary Theory**: Database state issue - either missing admin-shared agents or incorrect user roles.

**Testing Strategy**: Fix API route first (low risk, high impact), then verify database state if issue persists.

---

**Next Action**: Implement API route fix and test with sid@samba.tv account to confirm admin-shared agents become visible.