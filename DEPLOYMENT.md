# Deployment Safety Guide

## What Went Wrong (October 2025 Incident)

**The Bug:**
- Commit `d48c3fc` deployed with `return {};` in MCP tool filter
- Worked locally during testing (explicit MCP selection in UI)
- Broke production immediately (users with empty allowedMcpServers)
- Broke local after pulling same code

**Root Cause:**
- **Happy path testing only** - tested with populated MCP selections
- **No edge case tests** - empty `allowedMcpServers` never tested
- **No pre-deploy validation** - pushed without running full test suite

## Pre-Deployment Checklist

### Before EVERY deployment:

```bash
# 1. Run full validation
pnpm pre-deploy

# This runs:
#  ✓ pnpm lint:fix        # Fix code style
#  ✓ pnpm check-types     # TypeScript validation
#  ✓ pnpm test           # Unit tests
#  ✓ pnpm build:local     # Production build test
```

### Critical Test Scenarios

**When modifying tool loading:**
- [ ] Test with empty `allowedMcpServers: {}`
- [ ] Test with undefined `allowedMcpServers`
- [ ] Test with agent mentions
- [ ] Test without agent mentions

**When modifying streaming:**
- [ ] Test with undefined callback parameters
- [ ] Test error conditions
- [ ] Test tool execution failures

### Vercel Deployment Workflow

**Option 1: Preview First (Recommended)**
```bash
# 1. Push to feature branch
git checkout -b fix/mcp-tool-loading
git push origin fix/mcp-tool-loading

# 2. Vercel automatically creates preview deployment
#    Test thoroughly on preview URL

# 3. Merge to main only after preview validation
gh pr create --fill
# Wait for approvals + preview testing
gh pr merge
```

**Option 2: Direct to Production (Use Caution)**
```bash
# 1. Run pre-deploy validation
pnpm pre-deploy

# 2. Commit and push
git push origin main

# 3. Monitor Vercel deployment
# 4. Check production logs immediately
# 5. Ready to rollback if issues
```

## Rollback Strategy

**If production breaks after deploy:**

```bash
# Option 1: Revert on Vercel dashboard
# - Go to vercel.com/your-project/deployments
# - Click "..." on previous working deployment
# - Click "Promote to Production"

# Option 2: Git revert
git revert HEAD
git push origin main
# Vercel auto-deploys the revert

# Option 3: Rollback specific commit
git reset --hard <previous-good-commit>
git push --force origin main
# ⚠️ Only use if coordinated with team
```

## Monitoring Post-Deploy

### Immediate (First 15 minutes):
```bash
# Check Vercel deployment logs
# Look for:
#  ❌ Build failures
#  ❌ Runtime errors
#  ❌ "No tools found" in logs
#  ❌ "Cannot read undefined" errors
```

### First Hour:
- Monitor error rates in Langfuse
- Check user reports
- Verify tool loading success
- Test critical user journeys

### Metrics to Watch:
- Tool loading success rate: Should be 100%
- Streaming completion rate: Should be 100%
- Error rate: Should be zero or baseline
- Response times: Should be unchanged

## Future Prevention

### 1. Add Integration Tests
```typescript
// tests/integration/mcp-tool-loading.test.ts
describe("MCP Tool Loading Integration", () => {
  it("loads tools with empty permissions (default state)", async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        allowedMcpServers: {}, // Empty = production bug condition
        message: { role: "user", parts: [{ type: "text", text: "test" }] },
      }),
    });
    // Should not crash, should have MCP tools available
  });
});
```

### 2. GitHub Actions CI
- ✅ Created `.github/workflows/ci.yml`
- Runs on all PRs and pushes to main
- Blocks merge if tests fail

### 3. Husky Pre-Push Hook
```bash
# Add to .husky/pre-push
pnpm check
```

## Quick Reference

| Command | When to Use |
|---------|-------------|
| `pnpm pre-deploy` | Before EVERY git push to main |
| `pnpm check` | Quick validation (lint + types + tests) |
| `pnpm build:local` | Test production build locally |
| `pnpm test agent-tool-loading.test.ts` | Verify MCP tool tests |

## Red Flags (Stop and Review)

- 🚨 Modifying tool loading functions
- 🚨 Adding new streaming callbacks
- 🚨 Changing state management
- 🚨 Massive refactors (86+ files like d48c3fc)
- 🚨 Tests passing but manual testing only happy paths

**Action:** Add specific edge case tests, get peer review, use preview deployment
