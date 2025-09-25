# Granular Agent Permission Management System

## PROJECT TECHNOLOGY STACK:

**Base Framework:** Next.js 15.3.2 with App Router + TypeScript 5.9.2
**AI Foundation:** Vercel AI SDK v5.0.26 (foundational - all AI operations built on this)
**UI Framework:** React 19.1.1 with Tailwind CSS 4.1.12, Radix UI, Framer Motion 12.23.12
**Authentication:** Better-Auth 1.3.7
**Database:** PostgreSQL with Drizzle ORM 0.41.0
**Observability:** Langfuse SDK v4.1.0 with OpenTelemetry 2.1.0

**UI Feature:** Granular agent permission management system for selective user provisioning

---

## FEATURE PURPOSE:

**Admin can provision specific agents to specific users with granular control:**

- Admin creates or manages existing agents
- Admin selects specific users (5 users, 10 users, etc.) who can access each agent
- Different agents can have different user sets
- Some agents available to all users, others to selected users only
- Visual interface for bulk permission management

**User Experience Goals:**
- Admin sees ALL their agents in admin dashboard (not just admin-shared)
- Admin can convert existing private agents to shared with specific users
- Dropdown interface to select users for each agent
- Clear visual indicators of who has access to what

---

## CORE UI COMPONENTS & FEATURES:

**Essential UI Elements:**

1. **Enhanced Admin Dashboard:**
   - Shows ALL agents created by admin (not filtered by visibility)
   - Agent cards with current permission status
   - Quick actions to manage permissions per agent

2. **User Selection Dropdown:**
   - Multi-select dropdown with user search
   - Show all platform users with checkboxes
   - "Select All" and "Clear All" options
   - Visual indicators for admin vs regular users

3. **Agent Permission Manager:**
   - Agent card with current visibility status
   - User list showing who has access
   - Add/remove users with real-time updates
   - Bulk permission operations

4. **Visibility Options Enhancement:**
   - `admin-all`: Available to all users
   - `admin-selective`: Available to specific selected users
   - Visual differentiators for each type

---

## EXISTING COMPONENTS TO LEVERAGE:

**Current Components to Extend:**
- `src/components/agent/agents-list.tsx` - Main agent listing component
- `src/components/shareable-actions.tsx` - Visibility controls
- `src/components/shareable-card.tsx` - Agent cards with badges
- `src/components/admin/admin-dashboard.tsx` - Admin dashboard layout

**Database Schema:**
- `src/lib/db/pg/schema.pg.ts` - Agent and user schemas
- New junction table: `agent_user_permission`
- Enhanced visibility enum with granular options

---

## TECHNICAL INTEGRATION POINTS:

**Database Integration:**
- Junction table for agent-user relationships
- Permission-aware queries in agent repository
- Bulk operations for user assignment/removal

**API Integration:**
- `/api/admin/agent-permissions` - Bulk permission management
- Enhanced `/api/admin/agents` - Show all admin-owned agents
- Real-time permission updates

**Authentication Integration:**
- Admin-only permission management
- Role-based UI element visibility
- Session validation for permission operations

---

## DEVELOPMENT PATTERNS TO FOLLOW:

**Component Architecture:**
- Reuse existing agent card patterns
- Follow ShareableActions component design
- Maintain consistency with existing admin UI

**State Management:**
- Permission state with optimistic updates
- Real-time synchronization between UI and database
- Error handling for permission operations

**Performance Patterns:**
- Efficient permission queries with proper indexing
- Bulk operations to minimize database calls
- Cached user lists for faster dropdown rendering

---

## SECURITY & ACCESS PATTERNS:

**Access Control:**
- Only admins can manage agent permissions
- Users can only see agents they have permission to access
- Audit trail for all permission changes

**Data Validation:**
- Validate user selections before saving permissions
- Prevent self-removal from critical agents
- Ensure referential integrity in permission assignments

---

## KEY MISSING PIECES TO IMPLEMENT:

1. **Admin Dashboard Fix:** Show ALL admin-owned agents, not just admin-shared
2. **Permission Dropdown:** User selection interface in agent cards
3. **Bulk Operations:** Select multiple users for agent access
4. **Real-time Updates:** Immediate reflection of permission changes
5. **Migration Strategy:** Convert existing agents to new permission system

---

## SUCCESS CRITERIA:

- [ ] Admin sees all their agents in admin dashboard
- [ ] Admin can select specific users for each agent
- [ ] Different agents can have different user sets
- [ ] User selection dropdown with search and multi-select
- [ ] Real-time permission updates across the platform
- [ ] Existing agents can be converted to shared with selected users
- [ ] Clear visual indicators of permission status

---

**CORE REQUIREMENT:** Transform the current basic "admin-shared" system into granular user provisioning where admins can assign Agent A to Users 1,2,3,4,5 and Agent B to Users 6,7,8,9,10 with flexible, per-agent user selection.