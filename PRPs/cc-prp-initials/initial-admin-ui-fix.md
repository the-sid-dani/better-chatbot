# Admin UI Fix - Granular Agent Permission Management

## PROJECT TECHNOLOGY STACK:

**Base Framework:** Next.js 15.3.2 with App Router + TypeScript 5.9.2
**AI Foundation:** Vercel AI SDK v5.0.26 (foundational - all AI operations built on this)
**UI Framework:** React 19.1.1 with Tailwind CSS 4.1.12, Radix UI, Framer Motion 12.23.12
**Authentication:** Better-Auth 1.3.7
**Database:** PostgreSQL with Drizzle ORM 0.41.0
**Observability:** Langfuse SDK v4.1.0 with OpenTelemetry 2.1.0

**UI Feature:** Fix admin dashboard to show all admin-owned agents and add granular user provisioning with dropdown interface

---

## FEATURE PURPOSE:

**Admin needs ability to provision agents to specific users with granular control:**

The current admin dashboard shows "0 Admin Agents" even though the admin has 5 existing agents. The admin should see ALL their agents and be able to:

- View all agents they've created (not filtered by visibility)
- Select specific users for each agent via dropdown interface
- Provision Agent A to Users 1,2,3,4,5 and Agent B to Users 6,7,8,9,10
- Convert existing private agents to shared with selected users
- Have dropdown showing all signed-up users with checkboxes for selection

**Current Problem:** Admin dashboard only shows admin-shared agents, but admin wants to manage permissions for ALL their existing agents.

---

## CORE UI COMPONENTS & FEATURES:

**Essential UI Elements:**

1. **Tabular Admin Dashboard Layout:**
   - Table format similar to provided image (Name | Status | Description | Users | Actions)
   - Show ALL agents owned by admin (not just admin-shared)
   - Display existing agents: "23/09-Audience Agent", "Audience Builder Agent v2", etc.
   - Agent count should reflect actual created agents, not just shared ones

2. **Users Column with Dropdown Interface:**
   - "Users" column in table with dropdown button showing current access count
   - Dropdown opens to show list of all platform users
   - Checkboxes for multi-user selection within dropdown
   - "Select All" and "Clear All" options at top of dropdown
   - Search/filter functionality within dropdown for large user lists
   - Visual indicators for admin vs regular users (badges/icons)

3. **Agent Permission Management via Dropdown:**
   - Each row has "Users" dropdown showing current permissions (e.g., "3 Users", "All Users", "Private")
   - Dropdown content shows:
     - Radio button: "Private" (no users)
     - Radio button: "All Users" (everyone)
     - Radio button: "Selected Users" (shows checkbox list below)
   - When "Selected Users" chosen, checkbox list appears in dropdown
   - Real-time permission updates with optimistic UI

4. **Enhanced Table Features:**
   - Sortable columns (Name, Status, Created Date)
   - Status badges (Active/Inactive)
   - Agent description truncated with hover tooltip
   - Actions column with edit/delete/duplicate options
   - Pagination for large agent lists

---

## EXISTING COMPONENTS TO LEVERAGE:

**Current Components to Extend:**
- `src/components/admin/admin-dashboard.tsx` - Convert from card layout to table layout
- `src/app/(chat)/admin/page.tsx` - Change query from admin-shared filter to all admin agents
- Create new `src/components/admin/agents-table.tsx` - New table component for agent management
- Create new `src/components/admin/user-selection-dropdown.tsx` - Dropdown with user checkboxes
- Leverage existing `src/components/ui/table.tsx` - Base table components
- Leverage existing `src/components/ui/dropdown-menu.tsx` - Dropdown functionality
- Leverage existing `src/components/ui/checkbox.tsx` - Checkbox components

**Database Schema:**
- Add junction table: `agent_user_permission` for agent-user relationships
- Enhance visibility enum: add `admin-selective` option
- Keep existing `agent` and `user` tables structure

---

## TECHNICAL INTEGRATION POINTS:

**Database Integration:**
- New junction table for many-to-many agent-user relationships
- Permission-aware queries in agent repository
- Bulk permission operations for efficiency

**API Integration:**
- `/api/admin/agent-permissions` - Manage user selections for agents
- Enhanced existing `/api/admin/agents` to return all admin-owned agents
- Real-time permission updates

**Authentication Integration:**
- Admin-only permission management
- Role-based access to user selection interface
- Validation that only admins can change agent permissions

---

## DEVELOPMENT PATTERNS TO FOLLOW:

**Component Architecture:**
- Create new tabular layout using existing Table components
- Replace card-based layout with table rows for better data management
- Add dropdown interface using existing DropdownMenu patterns
- Follow existing Radix UI component patterns
- Use consistent table styling with sortable headers and action columns

**State Management:**
- Use existing SWR patterns for user list fetching
- Optimistic updates for permission changes
- Toast notifications for operation feedback
- Maintain existing agent state management patterns

**Database Patterns:**
- Use existing repository pattern
- Add new AgentPermissionRepository for junction table operations
- Maintain existing agent query patterns while extending functionality

---

## SECURITY & ACCESS PATTERNS:

**Access Control:**
- Only admins can see and use user selection interface
- Users can only see agents they have permission to access
- Validate admin role before showing permission management UI

**Permission Validation:**
- Check admin status before allowing permission changes
- Validate user selections before saving to database
- Audit trail for permission changes (granted_by, granted_at)

---

## KEY IMPLEMENTATION REQUIREMENTS:

1. **Admin Dashboard Query Fix:**
   - Change from: `allAgents.filter(agent => agent.visibility === 'admin-shared')`
   - Change to: `pgAgentRepository.selectAgents(session.user.id, ["mine"])`
   - This will show ALL admin-created agents for permission management

2. **User Selection Interface:**
   - Add "Selected Users" option to existing visibility dropdown
   - Opens user selection interface with checkboxes
   - Search functionality for large user lists
   - Multi-select with clear visual feedback

3. **Junction Table Implementation:**
   - `agent_user_permission` table for many-to-many relationships
   - Proper indexing for performance
   - Cascade delete when agents or users are removed

4. **Permission-Aware Queries:**
   - Update agent repository to check junction table for `admin-selective` agents
   - Maintain performance with proper SQL joins and exists clauses

---

## DESIGN SYSTEM INTEGRATION:

**Component Consistency:**
- Use existing DropdownMenu, Checkbox, and Button components
- Follow established card layout patterns
- Maintain consistent spacing and typography
- Use existing Crown icons for admin-related features

**Color System:**
- Use established badge colors for different permission types
- Consistent hover and selected states
- Maintain accessibility contrast ratios

---

## SUCCESS CRITERIA:

- [ ] Admin dashboard displays table format with columns: Name | Status | Description | Users | Actions
- [ ] Admin dashboard shows ALL admin-owned agents (5 existing agents visible)
- [ ] "Users" column shows dropdown with current access summary (e.g., "3 Users", "All Users", "Private")
- [ ] Users dropdown contains:
  - [ ] Radio buttons: "Private", "All Users", "Selected Users"
  - [ ] When "Selected Users" chosen, checkbox list appears below
  - [ ] "Select All" and "Clear All" options at top of checkbox list
  - [ ] Search/filter box for finding specific users in large lists
- [ ] Admin can select 5 users for Agent A, different 5 users for Agent B
- [ ] Permission changes save and reflect immediately with optimistic UI updates
- [ ] Table includes sortable columns and pagination for scalability
- [ ] Users only see agents they have permission to access (end-user verification)

---

**CORE REQUIREMENT:** Fix admin dashboard to display admin's existing agents and add granular user selection dropdown for each agent, enabling selective user provisioning without recreating existing UI patterns.