# Canvas Persistence Bug Fix - CRITICAL Initial Plan

## FEATURE:

**Single Critical Bug Fix** - Canvas auto-close bug elimination

**Core Issue Identified:**
1. **Canvas Auto-Close Bug** (CRITICAL): Canvas vanishes after 30 seconds due to auto-hide logic in `removeArtifact` function

**Scope Reality Check:**
- **Bug Fix**: 5-line code deletion (15 minutes)
- **Total Time**: 30 minutes maximum (investigation + fix + validation)

## TOOLS:

**Bug Fix (No Tools Required):**
- **Root Cause**: Lines 842-850 in `src/components/canvas-panel.tsx`
- **Solution**: Delete auto-hide logic when `filtered.length === 0`
- **Impact**: Canvas stays open until user manually closes it
- **Validation**: Existing `userManuallyClosed` flag already handles manual close properly

## DEPENDENCIES:

**Canvas Bug Fix (Zero Dependencies):**
- **Target File**: `src/components/canvas-panel.tsx` lines 842-850
- **Change Type**: Delete problematic auto-hide logic
- **Validation**: Existing `userManuallyClosed` flag already handles manual close properly

**Project Infrastructure (No Changes Required):**
- **Database**: No schema changes needed
- **Auth System**: No authentication requirements
- **API Routes**: No backend changes needed
- **Build System**: No dependency changes required
- **External Libraries**: No new packages needed

## EXAMPLES:

**Bug Fix Implementation (15 minutes):**
```typescript
// CURRENT BUGGY CODE (lines 842-850):
if (filtered.length === 0) {
  debugLog("Last artifact removed - hiding canvas");
  setTimeout(() => {
    if (isMountedRef.current) {
      setIsVisible(false);  // ← DELETE THIS ENTIRE BLOCK
    }
  }, 100);
}

// FIXED CODE:
// (Just delete the entire if block - that's it!)
```

**Expected Behavior After Fix:**
- Canvas remains visible when all artifacts are removed
- Canvas only closes when user manually clicks the X button
- Existing `userManuallyClosed` flag properly tracks manual close action
- No unexpected auto-hiding after 30 seconds of inactivity

## DOCUMENTATION:

**Bug Fix Resources:**
- **Identified Code**: `src/components/canvas-panel.tsx` lines 842-850
- **React Cleanup Patterns**: https://react.dev/reference/react/useEffect (proper cleanup)
- **Component State Management**: setTimeout cleanup best practices

**Project-Specific Context:**
- **Canvas State Management**: `useCanvas` hook handles visibility with `userManuallyClosed` flag
- **Manual Close Logic**: Existing close button properly sets `userManuallyClosed = true`
- **Expected Behavior**: Canvas should only close when user explicitly clicks X button

## OTHER CONSIDERATIONS:

**Critical Bug Analysis:**
- **Root Cause**: Unnecessary auto-hide logic when artifact array becomes empty
- **User Impact**: Canvas disappears unexpectedly, disrupting workflow
- **Technical Debt**: Overly aggressive cleanup that doesn't respect user intent

**Implementation Simplicity:**
- **Change Type**: Code deletion only (no new functionality)
- **Risk Level**: Zero (removing problematic behavior)
- **Testing**: Simple validation that canvas stays open
- **Files Modified**: Single file (`canvas-panel.tsx`)

**Timeline Reality:**
- **Bug Investigation**: 15 minutes to locate the problematic lines
- **Bug Fix**: 5 minutes to delete auto-hide logic
- **Testing**: 10 minutes to validate canvas persistence
- **Total**: 30 minutes maximum

**Implementation Confidence Score: 10/10**

This is a trivial bug fix requiring simple code deletion. The problematic auto-hide behavior is clearly identified and easily removed without affecting any other functionality.