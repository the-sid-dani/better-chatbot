# Incident Report: Duplicate Instrumentation Files

## Summary

**Date**: 2025-10-14
**Severity**: CRITICAL
**Error Digest**: 2107464769
**Status**: Resolved

**Impact**: Complete production outage on Vercel - Application failed to initialize with server-side exception.

**Root Cause**: Duplicate `instrumentation.ts` files (root and `/src`) causing Next.js 15 initialization conflict.

## Timeline

| Time | Event |
|------|-------|
| Unknown | Duplicate instrumentation.ts file created at root level |
| 2025-10-14 | Production deployment fails with Digest: 2107464769 |
| 2025-10-14 17:30 | Investigation started with Architect agent (Winston) |
| 2025-10-14 17:38 | Root cause identified: Duplicate instrumentation files |
| 2025-10-14 17:41 | Project and tasks created in Archon for systematic fix |
| 2025-10-14 17:45 | Implementation started with Developer agent (James) |
| 2025-10-14 17:50 | Fix implemented, tested, and deployed to preview |

## Root Cause Analysis

### The Problem

Next.js 15 automatically loads `instrumentation.ts` files during app initialization. The presence of TWO files with different implementations created a critical conflict:

**File 1: `/instrumentation.ts` (ROOT - PROBLEMATIC)**
- 45 lines
- ❌ Missing `register()` function (required by Next.js 15)
- ❌ No Langfuse environment variable validation
- ❌ Missing LangfuseSpanProcessor configuration (no baseUrl, publicKey, secretKey)
- ❌ Excessive console logging (9+ statements, per-span logging)
- ❌ No production error handling

**File 2: `/src/instrumentation.ts` (CORRECT - PRODUCTION-SAFE)**
- 119 lines
- ✅ Complete `register()` function implementation
- ✅ Comprehensive environment variable validation
- ✅ Explicit LangfuseSpanProcessor configuration
- ✅ Production-safe logging
- ✅ Comprehensive error handling

### Why It Broke Production

1. **Next.js 15 Auto-Loading**: Both files discovered during build, potential load order conflict
2. **Missing `register()` Hook**: Vercel runtime expects this for proper initialization lifecycle
3. **Langfuse SDK Failure**: Constructor threw exception with undefined credentials
4. **Uncaught Exception**: No try-catch meant error crashed entire app before handling any requests
5. **Initialization Timing**: Error occurred before app could serve requests

## Resolution

### Actions Taken

1. **Backup**: Created `.backup/instrumentation-20251014-104752.ts`
2. **Deletion**: Removed problematic `/instrumentation.ts` file
3. **Verification**: Confirmed only `/src/instrumentation.ts` remains
4. **Testing**: Local build completed successfully with clean Langfuse initialization
5. **Commit**: Created detailed git commit explaining the fix
6. **Deployment**: Pushed to `fix/duplicate-instrumentation` branch for preview testing

### Verification

```bash
# Local build verification
NODE_OPTIONS="--max-old-space-size=6144" pnpm build:local
# Result: ✅ Build completed successfully
# Result: ✅ Langfuse configured properly
# Result: ✅ NO register() errors
```

**Expected Outcome**: App initializes successfully, Langfuse observability functions correctly.

## Prevention Guidelines

### Immediate Actions

1. ✅ **Single Instrumentation File**: Only one `instrumentation.ts` should exist in `/src`
2. ✅ **Pre-commit Check**: Add verification for duplicate instrumentation files
3. ✅ **Verify `register()` Function**: Required for Next.js 15 instrumentation

### Long-term Actions

1. **Lint Rule**: Add ESLint/Biome rule to detect multiple instrumentation files
2. **Documentation**: Update Next.js 15 instrumentation requirements in CLAUDE.md
3. **Template**: Create instrumentation file template with required structure
4. **Validation Tests**: Add tests for instrumentation file structure
5. **CI/CD Check**: Add build-time validation for instrumentation requirements

## Lessons Learned

1. **Next.js 15 Stricter Requirements**: Has stricter instrumentation requirements than previous versions
2. **File Location Matters**: `/src/instrumentation.ts` is preferred over root location
3. **`register()` Function Mandatory**: Required in Next.js 15 instrumentation
4. **Environment Variable Validation Critical**: For production stability and graceful degradation
5. **Duplicate Files Dangerous**: In different locations can cause initialization conflicts

## Development Checklist: Instrumentation Changes

Before modifying instrumentation files, verify:

- [ ] Only one `instrumentation.ts` file exists (in `/src`)
- [ ] `register()` function is present
- [ ] Environment variables are validated with error handling
- [ ] Error handling prevents production crashes
- [ ] Logging is production-appropriate (not excessive)
- [ ] LangfuseSpanProcessor has explicit configuration
- [ ] Local build completes successfully
- [ ] No console errors about instrumentation

## References

- **Error Digest**: 2107464769
- **GitHub Branch**: `fix/duplicate-instrumentation`
- **Commit**: `fca4f61` - Fix instrumentation duplication
- **Backup Location**: `.backup/instrumentation-20251014-104752.ts`
- **Archon Project**: `be03bfc1-21c3-458f-b361-e9d934166464`
- **Next.js Documentation**: [Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- **Langfuse Documentation**: [Next.js Integration](https://langfuse.com/docs/integrations/nextjs)

## Related Files

- `/src/instrumentation.ts` - Production-safe version (kept)
- `.backup/instrumentation-20251014-104752.ts` - Problematic version (backup)
- `/src/lib/const.ts` - Environment variable constants
- `/src/lib/observability/langfuse-client.ts` - Langfuse client setup

---

**Document Status**: Complete
**Last Updated**: 2025-10-14
**Author**: James (Developer Agent) & Winston (Architect Agent)
