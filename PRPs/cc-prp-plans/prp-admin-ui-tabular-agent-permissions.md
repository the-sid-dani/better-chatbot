# Admin UI Tabular Agent Permissions Management

## Goal

Transform the admin dashboard from card-based to tabular layout with granular user permission management. Enable admins to see ALL their created agents (currently showing 0 instead of 5) and provision specific agents to selected users through dropdown interfaces with checkboxes.

**End State**: Professional table interface showing: Name | Status | Description | Users | Actions, where "Users" column contains dropdown with checkbox-based user selection for granular agent provisioning.

## Why

- **Admin Efficiency**: Current card layout doesn't scale for managing multiple agents and users
- **Granular Control**: Admins need to provision "Agent A to Users 1,2,3,4,5" and "Agent B to Users 6,7,8,9,10"
- **Visibility Issue**: Admin dashboard incorrectly shows "0 Admin Agents" when 5 agents exist
- **Professional Interface**: Table format matches enterprise admin dashboard expectations
- **Scalability**: Dropdown with checkboxes handles large user lists better than modal interfaces

## What

### User-Visible Behavior
1. **Admin Dashboard Table**: Clean table showing all admin-owned agents with sortable columns
2. **Users Column Dropdown**: Click "3 Users" button → dropdown opens with user list and checkboxes
3. **Permission Management**: Select/deselect users → permissions update immediately with visual feedback
4. **Search & Filter**: Type in dropdown search to find specific users quickly
5. **Bulk Operations**: "Select All" and "Clear All" options for efficient management

### Technical Requirements
- **Database**: New `agent_user_permission` junction table with proper indexing
- **API**: Enhanced admin endpoints for user listing and bulk permission operations
- **Frontend**: Responsive table with dropdown checkbox interfaces
- **Authentication**: Admin-only access with proper role validation
- **Performance**: Optimized queries with proper joins and pagination

### Success Criteria
- [ ] Admin dashboard displays table format with columns: Name | Status | Description | Users | Actions
- [ ] Admin dashboard shows ALL admin-owned agents (5 existing agents visible, not 0)
- [ ] "Users" column shows dropdown with current access summary (e.g., "3 Users", "All Users", "Private")
- [ ] Users dropdown contains radio buttons: "Private", "All Users", "Selected Users"
- [ ] When "Selected Users" chosen, checkbox list appears with search functionality
- [ ] "Select All" and "Clear All" options work correctly
- [ ] Permission changes save and reflect immediately with optimistic UI updates
- [ ] Users only see agents they have permission to access (end-user verification)

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/components/admin/admin-user-selector.tsx
  why: Perfect reference implementation for multi-select user interface with search, checkboxes, and visual feedback
  critical: Uses proper state management and component patterns already established in codebase

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/components/tool-invocation/interactive-table.tsx
  why: Complete table implementation with search, sorting, pagination, column visibility
  critical: Shows exact pattern for table state management and responsive design

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/app/api/admin/agent-permissions/route.ts
  why: Backend API pattern for permission management with bulk operations
  critical: Handles admin authentication, validation, and transaction management

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/lib/db/pg/repositories/agent-permission-repository.pg.ts
  why: Data layer with comprehensive CRUD operations for agent permissions
  critical: Bulk operations, proper error handling, and performance optimization

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/lib/db/pg/repositories/agent-repository.pg.ts
  why: Complex query patterns with proper joins and permission filtering
  critical: Shows how to implement permission-aware queries with exists clauses

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/components/ui/table.tsx
  why: Base table primitive components with consistent styling
  critical: Proper table structure and responsive behavior

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/components/ui/dropdown-menu.tsx
  why: Dropdown with checkbox items pattern using Radix primitives
  critical: DropdownMenuCheckboxItem with controlled state management

- file: /Users/sid/Desktop/4. Coding Projects/better-chatbot/src/app/(chat)/admin/page.tsx
  why: Current admin dashboard implementation and data fetching patterns
  critical: Shows existing authentication flow and component integration

- docfile: /Users/sid/Desktop/4. Coding Projects/better-chatbot/CLAUDE.md
  why: Project-specific patterns, architecture guidelines, and development conventions
  critical: Vercel AI SDK patterns, database patterns, component patterns, testing patterns
```

### Current Codebase Structure
```bash
src/
├── app/(chat)/admin/
│   ├── page.tsx                 # Current admin dashboard (needs query fix)
│   ├── agents/                  # Agent management routes
│   └── users/                   # User management routes
├── components/
│   ├── admin/
│   │   ├── admin-dashboard.tsx  # Current card-based layout (convert to table)
│   │   └── admin-user-selector.tsx # Perfect multi-select reference implementation
│   ├── ui/
│   │   ├── table.tsx           # Base table components
│   │   ├── dropdown-menu.tsx   # Dropdown with checkbox support
│   │   └── checkbox.tsx        # Checkbox primitives
│   └── tool-invocation/
│       └── interactive-table.tsx # Advanced table with search/sort/pagination
├── lib/db/pg/
│   ├── repositories/
│   │   ├── agent-repository.pg.ts # Agent queries with permission filtering
│   │   └── agent-permission-repository.pg.ts # Permission CRUD operations
│   └── schema.pg.ts            # Database schema with AgentUserPermissionSchema
└── app/api/admin/
    ├── agents/route.ts         # Admin agent management API
    ├── users/route.ts          # User listing API
    └── agent-permissions/route.ts # Permission management API
```

### Desired Codebase Structure with New Files
```bash
src/
├── components/admin/
│   ├── admin-agents-table.tsx  # NEW: Tabular agent display with user dropdown
│   ├── agent-permission-dropdown.tsx # NEW: Users dropdown with checkbox interface
│   └── admin-dashboard.tsx     # MODIFY: Replace cards with table
└── app/(chat)/admin/
    └── page.tsx               # MODIFY: Change query to show all admin agents
```

### Known Gotchas of our Codebase & Library Quirks
```typescript
// CRITICAL: Better-Auth session handling
// Pattern: Always use getSession() from @/lib/auth/server for authentication
// Example: const session = await getSession(); if (session?.user?.role !== "admin") return 403;

// CRITICAL: Drizzle ORM query patterns
// Pattern: Use repository pattern, not direct DB access
// Example: pgAgentRepository.selectAgents(userId, ["mine"]) not raw queries

// CRITICAL: Radix UI component patterns
// Pattern: All UI components use data-slot attributes and controlled state
// Example: <DropdownMenuCheckboxItem checked={isSelected} onCheckedChange={handleToggle}>

// CRITICAL: Zustand state management
// Pattern: Use useShallow for multiple state selections to prevent re-renders
// Example: const [state1, state2] = appStore(useShallow((state) => [state.val1, state.val2]));

// CRITICAL: Agent permission filtering
// Pattern: Use exists() clauses for performance with junction tables
// Example: exists(select from AgentUserPermissionSchema where agentId = AgentSchema.id and userId = currentUserId)

// CRITICAL: Vercel AI SDK integration
// Pattern: All AI operations use Vercel AI SDK patterns from CLAUDE.md
// Example: Follow streaming patterns and tool integration guidelines

// CRITICAL: Component imports
// Pattern: Import from ui/ for primitives, from components/ for composed components
// Example: import { Table } from "ui/table"; import { AdminUserSelector } from "components/admin/admin-user-selector";
```

## Implementation Blueprint

### Data Models and Structure

The core permission system already exists with proper TypeScript types:

```typescript
// Existing AgentUserPermission interface (from agent-permission-repository.pg.ts)
interface AgentPermission {
  id: string;
  agentId: string;
  userId: string;
  grantedBy: string;
  grantedAt: Date;
  permissionLevel: 'use' | 'edit';
  userName?: string;     // Joined from UserSchema
  userEmail?: string;    // Joined from UserSchema
  userImage?: string;    // Joined from UserSchema
}

// New interface for table row data
interface AdminAgentTableRow {
  id: string;
  name: string;
  description?: string;
  visibility: AgentVisibility;
  status: 'active' | 'inactive';
  createdAt: Date;
  permissionCount: number;
  permissions: AgentPermission[];
}

// User selection state for dropdown
interface UserSelectionState {
  visibility: 'private' | 'admin-all' | 'admin-selective';
  selectedUserIds: string[];
  searchQuery: string;
  isLoading: boolean;
}
```

### List of Tasks to be Completed in Order

```yaml
Task 1:
MODIFY src/app/(chat)/admin/page.tsx:
  - FIND pattern: "adminAgents.filter(agent => agent.visibility === 'admin-shared')"
  - REPLACE with: "pgAgentRepository.selectAgents(session.user.id, ['mine'])"
  - PRESERVE existing authentication and user fetching patterns
  - ADD permission count fetching for each agent

Task 2:
CREATE src/components/admin/admin-agents-table.tsx:
  - MIRROR pattern from: src/components/tool-invocation/interactive-table.tsx
  - MODIFY to display agent data instead of tool data
  - KEEP search, sorting, and pagination patterns identical
  - ADD Users column with dropdown integration

Task 3:
CREATE src/components/admin/agent-permission-dropdown.tsx:
  - MIRROR pattern from: src/components/admin/admin-user-selector.tsx
  - MODIFY to work within dropdown context instead of standalone
  - KEEP user search, checkbox selection, and visual feedback patterns
  - ADD radio button selection for visibility types

Task 4:
MODIFY src/components/admin/admin-dashboard.tsx:
  - FIND pattern: Current card-based agent display
  - REPLACE with: AdminAgentsTable component
  - PRESERVE existing statistics cards and layout structure
  - MAINTAIN responsive design and navigation patterns

Task 5:
MODIFY src/app/api/admin/agent-permissions/route.ts:
  - FIND pattern: Existing POST handler for permission updates
  - ENHANCE with: Bulk permission replacement operations
  - PRESERVE existing authentication and validation patterns
  - ADD support for admin-all vs admin-selective visibility updates

Task 6:
MODIFY src/lib/db/pg/repositories/agent-repository.pg.ts:
  - FIND pattern: selectAgents method with visibility filtering
  - ENHANCE with: Permission count aggregation in query
  - PRESERVE existing performance optimizations and joins
  - ADD efficient counting for permission display

Task 7:
CREATE src/components/admin/user-permission-summary.tsx:
  - MIRROR pattern from: src/components/ui/badge.tsx usage patterns
  - CREATE component to display permission summary (e.g., "3 Users", "All Users")
  - KEEP consistent styling with existing badge components
  - ADD click handler to open permission dropdown
```

### Per Task Pseudocode

```typescript
// Task 1: Fix admin page query
// Current: adminAgents.filter(agent => agent.visibility === 'admin-shared')
// Fixed: pgAgentRepository.selectAgents(session.user.id, ['mine'])

async function getAdminDashboardData(session: Session) {
  // PATTERN: Admin auth check first (see existing admin APIs)
  if (session?.user?.role !== "admin") throw new Error("Forbidden");

  // GOTCHA: selectAgents with 'mine' filter shows all admin-owned agents
  const allAdminAgents = await pgAgentRepository.selectAgents(session.user.id, ["mine"]);

  // PATTERN: Efficient permission counting (avoid N+1 queries)
  const agentsWithPermissions = await Promise.all(
    allAdminAgents.map(async (agent) => ({
      ...agent,
      permissionCount: await agentPermissionRepository.countPermissions(agent.id),
      permissions: await agentPermissionRepository.getAgentPermissions(agent.id)
    }))
  );

  return agentsWithPermissions;
}

// Task 2: Table component with dropdown integration
// PATTERN: Use Table primitives with state management from interactive-table.tsx
function AdminAgentsTable({ agents }: { agents: AdminAgentTableRow[] }) {
  // PATTERN: Search and sort state (mirror interactive-table.tsx)
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt'>('name');

  // CRITICAL: Permission state management per agent
  const [permissionStates, setPermissionStates] = useState<Record<string, UserSelectionState>>({});

  // PATTERN: Optimistic updates with error rollback
  const updatePermissions = async (agentId: string, state: UserSelectionState) => {
    // Optimistic update
    setPermissionStates(prev => ({ ...prev, [agentId]: state }));

    try {
      await fetch('/api/admin/agent-permissions', {
        method: 'POST',
        body: JSON.stringify({ agentId, ...state })
      });
    } catch (error) {
      // Rollback on error
      setPermissionStates(prev => ({ ...prev, [agentId]: previousState }));
      toast.error("Failed to update permissions");
    }
  };
}

// Task 3: Permission dropdown component
// PATTERN: Dropdown with checkbox items (mirror admin-user-selector.tsx within dropdown)
function AgentPermissionDropdown({ agent, users, onUpdate }: Props) {
  // PATTERN: Radio button selection for visibility type
  const [visibility, setVisibility] = useState(agent.visibility);
  const [selectedUserIds, setSelectedUserIds] = useState(agent.permissionUserIds);

  // PATTERN: Search within dropdown (from admin-user-selector.tsx)
  const [searchQuery, setSearchQuery] = useState("");
  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ), [users, searchQuery]
  );

  // CRITICAL: Handle radio button + checkbox coordination
  const handleVisibilityChange = (newVisibility: string) => {
    setVisibility(newVisibility);
    if (newVisibility !== 'admin-selective') {
      setSelectedUserIds([]); // Clear selections for non-selective modes
    }
  };
}
```

### Integration Points
```yaml
DATABASE:
  - junction table: AgentUserPermissionSchema already exists with proper indices
  - query enhancement: Add permission counting to agent repository
  - performance: Use EXISTS clauses for large permission sets

API:
  - enhance: /api/admin/agent-permissions with bulk replacement operations
  - maintain: Existing authentication patterns from admin APIs
  - add: Permission count aggregation endpoints

FRONTEND:
  - component: AdminAgentsTable using Table primitives
  - component: AgentPermissionDropdown using DropdownMenu + Checkbox
  - integration: Replace card layout in admin-dashboard.tsx
  - styling: Consistent with existing admin UI patterns

AUTHENTICATION:
  - pattern: getSession() with admin role check (from existing admin APIs)
  - validation: Proper error boundaries and access control
  - security: Input validation and CSRF protection
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
pnpm lint                                    # Biome linting and formatting
pnpm check-types                            # TypeScript type checking

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```typescript
// CREATE tests/admin-agents-table.test.tsx with these test cases:
describe('AdminAgentsTable', () => {
  test('displays all admin agents correctly', () => {
    const agents = [
      { id: '1', name: 'Test Agent', visibility: 'private', permissionCount: 0 }
    ];
    render(<AdminAgentsTable agents={agents} />);
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  test('opens permission dropdown on Users column click', () => {
    // Test dropdown opening and checkbox interaction
  });

  test('updates permissions optimistically', async () => {
    // Test permission updates with API mock
  });

  test('handles permission update errors gracefully', () => {
    // Test error rollback and user feedback
  });
});

// CREATE tests/agent-permission-dropdown.test.tsx
describe('AgentPermissionDropdown', () => {
  test('shows correct permission summary', () => {
    // Test "3 Users", "All Users", "Private" display
  });

  test('filters users based on search query', () => {
    // Test search functionality within dropdown
  });

  test('handles select all and clear all operations', () => {
    // Test bulk selection operations
  });
});
```

```bash
# Run and iterate until passing:
pnpm test                                   # Run all tests
pnpm test src/components/admin/            # Run admin component tests specifically
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start the development server
pnpm dev

# Test the admin dashboard
# Navigate to: http://localhost:3000/admin
# Expected: Table showing all admin agents with Users dropdowns

# Test permission management
# 1. Click Users dropdown for any agent
# 2. Select "Selected Users" radio button
# 3. Use checkboxes to select/deselect users
# 4. Verify permission updates save correctly
# 5. Test search functionality within dropdown

# Test error handling
# 1. Disconnect internet during permission update
# 2. Verify optimistic UI rolls back on error
# 3. Check error toast appears

# Browser console should show no errors
# Network tab should show successful API calls
```

### Level 4: Database Validation
```bash
# Connect to database and verify data integrity
psql $POSTGRES_URL

# Verify agent permissions are created correctly
SELECT a.name, u.name as user_name, aup.permission_level, aup.granted_at
FROM agent_user_permission aup
JOIN agent a ON aup.agent_id = a.id
JOIN "user" u ON aup.user_id = u.id
ORDER BY a.name, u.name;

# Expected: Proper agent-user relationships with correct permission levels
```

## Final Validation Checklist
- [ ] All tests pass: `pnpm test`
- [ ] No linting errors: `pnpm lint`
- [ ] No type errors: `pnpm check-types`
- [ ] Manual test successful: Navigate to /admin and verify table functionality
- [ ] Permission updates work: Select users and verify database changes
- [ ] Error cases handled: Test network failures and invalid inputs
- [ ] Search functionality works: Filter users in dropdown
- [ ] Responsive design: Test on different screen sizes
- [ ] Accessibility: Tab navigation and screen reader support

## Anti-Patterns to Avoid

- ❌ Don't create new table patterns when interactive-table.tsx exists
- ❌ Don't bypass admin authentication checks - use existing session patterns
- ❌ Don't create modal interfaces when dropdown pattern is more efficient
- ❌ Don't use direct database queries - use repository pattern consistently
- ❌ Don't ignore existing checkbox/dropdown patterns from admin-user-selector.tsx
- ❌ Don't hardcode user lists - fetch dynamically with proper error handling
- ❌ Don't skip optimistic updates - users expect immediate visual feedback
- ❌ Don't forget to handle large user lists - implement search and pagination
- ❌ Don't break existing admin dashboard navigation and statistics
- ❌ Don't ignore existing design system - use consistent spacing, colors, and typography

## Context Integration Notes

**Voice Agent Compatibility**: This admin permission system directly affects voice agent access. When implementing:
- Voice agents will automatically respect these permission settings through existing `rememberAgentAction()`
- Agent instructions and tool restrictions will be preserved in voice mode
- Admin-provisioned agents will maintain their configured capabilities in voice interactions

**Existing Infrastructure**: The codebase already has comprehensive permission infrastructure:
- Database schema with proper relationships and cascade deletes
- Repository pattern with optimized queries and bulk operations
- API endpoints with proper authentication and validation
- UI components following established Radix patterns

**Implementation Confidence**: 9/10 - All necessary patterns exist in the codebase, comprehensive reference implementations available, and clear integration points identified. The main risk is properly handling the transition from card to table layout while maintaining existing functionality.