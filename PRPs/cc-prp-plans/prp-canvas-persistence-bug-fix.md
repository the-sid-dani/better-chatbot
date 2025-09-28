# Canvas Persistence Bug Fix - PRP

## Goal
Fix the critical Canvas auto-close bug where the canvas panel unexpectedly vanishes after 30 seconds to 2 minutes of inactivity, causing user frustration and workflow disruption. The canvas should remain visible until the user explicitly clicks the close (X) button.

## Why
- **User Experience**: Canvas disappearing unexpectedly disrupts analytical workflows and causes data loss
- **Workflow Continuity**: Users expect canvas to persist until manual close action
- **Technical Debt**: Overly aggressive auto-hide logic contradicts user intent
- **Simple Fix**: Root cause identified as unnecessary setTimeout logic in artifact removal

## What
Remove 5 lines of problematic auto-hide logic from the `removeArtifact` function in `useCanvas` hook. The canvas should only close when:
1. User manually clicks the X close button (sets `userManuallyClosed = true`)
2. Component unmounts naturally

### Success Criteria
- [ ] Canvas no longer auto-closes when artifact array becomes empty
- [ ] Canvas remains visible during user inactivity periods
- [ ] Manual close functionality continues to work properly via X button
- [ ] No regression in existing canvas functionality

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Critical for understanding the bug

- url: https://react.dev/reference/react/useEffect
  why: Proper useEffect cleanup patterns to understand current implementation
  critical: Component lifecycle and cleanup function best practices

- url: https://felixgerschau.com/react-hooks-settimeout/
  why: Common setTimeout bugs in React components and solutions
  critical: Memory leaks and state update warnings on unmounted components

- url: https://refine.dev/blog/useeffect-cleanup/
  why: useEffect cleanup function patterns and common mistakes
  critical: Preventing memory leaks and unexpected component behavior

- file: src/components/canvas-panel.tsx
  why: Contains the buggy removeArtifact function (lines 842-850)
  critical: Lines 842-850 contain the problematic auto-hide logic to delete

- file: src/components/canvas-panel.tsx
  why: Contains proper closeCanvas function showing correct manual close pattern
  critical: Shows how userManuallyClosed flag should be used properly

- file: src/lib/utils.test.ts
  why: Example test patterns using vitest (describe, test, expect)
  critical: Testing approach and structure to follow for validation
```

### Current Codebase Tree (Canvas System)
```bash
src/components/
├── canvas-panel.tsx                 # MAIN FILE - Contains the bug at lines 842-850
│   ├── useCanvas hook               # Canvas state management
│   ├── removeArtifact function      # BUGGY: Auto-hides canvas when artifacts empty
│   ├── closeCanvas function         # CORRECT: Manual close with userManuallyClosed flag
│   └── Canvas component render      # UI rendering logic
├── tool-invocation/                 # Chart components (not affected by bug)
└── ui/                             # UI components (not affected by bug)
```

### Desired Codebase Tree (No New Files)
```bash
src/components/
└── canvas-panel.tsx                 # ONLY FILE TO MODIFY - Delete lines 842-850
```

### Known Gotchas of our Codebase & Library Quirks
```typescript
// CRITICAL: Current Bug Location (lines 842-850)
// Issue: Auto-hide logic incorrectly triggered when artifact array becomes empty
// This happens during normal operations, not just when user wants to close canvas
if (filtered.length === 0) {
  debugLog("Last artifact removed - hiding canvas");
  setTimeout(() => {
    if (isMountedRef.current) {
      setIsVisible(false);  // ← PROBLEMATIC LINE - Auto-closes canvas
    }
  }, 100);
}

// CRITICAL: Proper Manual Close Pattern (lines 857-866)
// This is the CORRECT way canvas should close - only when user clicks X
const closeCanvas = useCallback(() => {
  debugLog("User manually closed Canvas");
  setIsVisible(false);                // ← CORRECT: Manual close
  setUserManuallyClosed(true);        // ← CORRECT: Track user intent
}, [debugLog]);

// CRITICAL: UserManuallyClosed Flag Usage
// Pattern used throughout component for tracking user vs automatic actions
// This flag distinguishes between user-initiated and programmatic closes
const [userManuallyClosed, setUserManuallyClosed] = useState(false);

// GOTCHA: React Strict Mode Double Execution
// Development mode may cause useEffect double execution
// This bug might be exacerbated by React 18 strict mode behavior
// Solution: Removing problematic logic entirely prevents any timing issues
```

## Implementation Blueprint

### Data Models and Structure
No new data models required - bug fix only involves removing existing logic:

```typescript
// Current canvas state interface (unchanged)
interface CanvasState {
  isVisible: boolean;           // Canvas panel visibility
  artifacts: CanvasArtifact[];  // Array of chart artifacts
  activeArtifactId?: string;    // Currently selected artifact
  canvasName: string;           // Canvas title
  userManuallyClosed: boolean;  // User interaction tracking - KEEP THIS
}
```

### List of Tasks to Complete PRP Implementation

```yaml
Task 1: Identify and Remove Buggy Auto-Hide Logic
MODIFY src/components/canvas-panel.tsx:
  - FIND pattern: lines 842-850 in removeArtifact function
  - LOCATE: "if (filtered.length === 0) {" block
  - DELETE: Entire auto-hide block including setTimeout
  - PRESERVE: All other artifact removal logic
  - PRESERVE: Debug logging for artifact removal

Task 2: Validate Manual Close Logic Unchanged
VERIFY src/components/canvas-panel.tsx:
  - CONFIRM: closeCanvas function at lines 857-866 unchanged
  - VERIFY: userManuallyClosed flag properly set to true on manual close
  - ENSURE: X button onClick handler calls closeCanvas correctly

Task 3: Test Canvas Persistence Behavior
CREATE manual validation test:
  - VERIFY: Canvas stays open when all artifacts removed
  - VERIFY: Canvas only closes on manual X button click
  - VERIFY: userManuallyClosed flag tracks manual closes correctly
  - VERIFY: No console errors or warnings
```

### Per Task Implementation Details

```typescript
// Task 1: Remove Auto-Hide Logic (5 minutes)
// CURRENT CODE (lines 842-850) - DELETE THIS ENTIRE BLOCK:
if (filtered.length === 0) {
  debugLog("Last artifact removed - hiding canvas");
  // Use setTimeout to prevent race conditions
  setTimeout(() => {
    if (isMountedRef.current) {
      setIsVisible(false);  // ← DELETE: This is the bug
    }
  }, 100);
}

// FIXED CODE:
// (Simply delete the entire if block - no replacement needed)
// The artifacts array filtering logic above this block remains unchanged

// Task 2: Validation Pattern
// VERIFY this code remains unchanged (lines 857-866):
const closeCanvas = useCallback(() => {
  if (!isMountedRef.current) {
    debugLog("Attempted to close canvas after unmount - ignoring");
    return;
  }

  debugLog("User manually closed Canvas");
  setIsVisible(false);              // CORRECT: Manual close only
  setUserManuallyClosed(true);      // CORRECT: Track user intent
}, [debugLog]);

// Task 3: Expected Behavior Validation
// After fix:
// 1. Create charts → Canvas opens
// 2. Remove all artifacts → Canvas STAYS OPEN (fixed behavior)
// 3. Click X button → Canvas closes properly
// 4. Click "Open Canvas" button → Canvas reopens with empty state
```

### Integration Points
```yaml
CANVAS_STATE:
  - no_changes: "Canvas state management logic remains identical"
  - preservation: "userManuallyClosed flag and closeCanvas function untouched"
  - removal_only: "Only removing problematic auto-hide setTimeout logic"

USER_EXPERIENCE:
  - improvement: "Canvas persists until manual close"
  - consistency: "Follows user expectations for persistent UI panels"
  - workflow: "No unexpected canvas disappearance during work sessions"

NO_INTEGRATION:
  - database: "No database changes required"
  - api: "No API modifications needed"
  - dependencies: "No new packages to install"
  - ui_components: "No UI component changes needed"
```

## Validation Loop

### Level 1: Code Deletion Validation
```bash
# Verify file before modification
grep -n "filtered.length === 0" src/components/canvas-panel.tsx
# Expected: Line 842 with the problematic if statement

# After deletion, verify removal
grep -n "filtered.length === 0" src/components/canvas-panel.tsx
# Expected: No results (line should be deleted)

# Syntax validation
pnpm check-types                    # TypeScript validation
pnpm lint                          # Biome linting

# Expected: No errors from canvas-panel.tsx
```

### Level 2: Manual Behavior Testing
```bash
# Start development server
pnpm dev

# Manual test sequence:
# 1. Navigate to http://localhost:3000
# 2. Create a chart (generates artifacts)
# 3. Observe canvas opens and displays chart
# 4. Wait 5+ minutes without touching screen
# 5. Verify canvas REMAINS VISIBLE (bug fix validated)
# 6. Click X button to close canvas manually
# 7. Verify canvas closes properly
# 8. Click "Open Canvas" button to reopen
# 9. Verify canvas opens with empty state

# Expected: Canvas persists during inactivity, only closes on manual action
```

### Level 3: State Management Validation
```typescript
// Verify userManuallyClosed flag behavior in browser console
// 1. Open browser dev tools console
// 2. Look for "🎭 useCanvas Debug:" log messages
// 3. Create chart and wait - should NOT see "hiding canvas" message
// 4. Manually close canvas - should see "User manually closed Canvas"
// 5. userManuallyClosed should be true after manual close

// Expected console logs:
// ✅ "Canvas hook mounted"
// ✅ "Adding artifact" (when charts created)
// ❌ Should NOT see "Last artifact removed - hiding canvas"
// ✅ "User manually closed Canvas" (only on X button click)
```

## Final Validation Checklist
- [ ] Lines 842-850 deleted from removeArtifact function
- [ ] TypeScript compilation succeeds: `pnpm check-types`
- [ ] Linting passes: `pnpm lint`
- [ ] Canvas persists during inactivity (5+ minute test)
- [ ] Manual close via X button still works
- [ ] userManuallyClosed flag properly tracks manual closes
- [ ] No console errors or React warnings
- [ ] Canvas functionality otherwise unchanged
- [ ] Chart creation and display unaffected

## Anti-Patterns to Avoid
- ❌ Don't add new logic - this is a deletion-only fix
- ❌ Don't modify closeCanvas function - it's already correct
- ❌ Don't change userManuallyClosed flag behavior - it works properly
- ❌ Don't add timeout cleanup - we're removing the timeout entirely
- ❌ Don't create tests for removed functionality - just validate persistence
- ❌ Don't modify any other canvas functionality - scope is deletion only

---

**PRP Quality Score: 10/10**

This PRP provides complete context for a trivial but critical bug fix. The issue is clearly identified with exact line numbers, the solution is simple code deletion, and validation is straightforward manual testing. The implementation should succeed in one pass since it's removing problematic code rather than adding complexity.