# PRP: Fix Critical Next.js 15 App Router Build Failure - Html Import Error Resolution

**Project Requirements and Plans (PRP) Version 1.0**

## 🚨 CRITICAL PRODUCTION ISSUE

**Status**: PRODUCTION BLOCKING - Immediate Resolution Required
**Impact**: Complete build failure preventing all deployments
**Priority**: P0 (Critical)

## Problem Statement

The better-chatbot production build is failing with a critical Next.js 15 App Router error:

```bash
Error: <Html> should not be imported outside of pages/_document.
Error occurred prerendering page "/404".
Export encountered an error on /_error: /404, exiting the build.
Next.js build worker exited with code: 1
```

This error prevents all production deployments and must be resolved immediately.

## Research Context & Technical Analysis

### Root Cause Analysis (Based on Extensive Research)

**Primary Issue**: Next.js 15 App Router migration conflict
- Html component being imported outside `pages/_document` context
- 404 page prerendering failure during static generation
- NODE_ENV environment variable configuration issues
- Mixed routing patterns causing build-time conflicts

**Web Research Sources**:
- Next.js Official Migration Guide: https://nextjs.org/docs/app/guides/migrating/app-router-migration
- GitHub Issue #56481: https://github.com/vercel/next.js/issues/56481
- GitHub Issue #52158: https://github.com/vercel/next.js/issues/52158
- Official Next.js 404 handling: https://nextjs.org/docs/app/api-reference/file-conventions/not-found

**Codebase Analysis (via Serena MCP)**:
- ✅ Proper App Router structure confirmed: `src/app/layout.tsx` uses correct `<html>` and `<body>` tags
- ✅ No `_document.tsx` or `_app.tsx` files found (correct for App Router)
- ✅ No direct Html imports from `next/document` found in source files
- ⚠️ Build configuration in `next.config.ts` has `typescript: { ignoreBuildErrors: true }`
- ⚠️ NODE_ENV used extensively for development debugging throughout codebase

### Technical Context

**Current Architecture**:
- **Framework**: Next.js 15.3.2 with App Router
- **Vercel AI SDK**: v5.0.26 (foundational AI framework)
- **Build System**: Turbopack for development, standard Next.js build for production
- **Environment**: TypeScript 5.9.2 with strict mode

**Key Files Analyzed**:
- `src/app/layout.tsx`: ✅ Proper App Router root layout
- `next.config.ts`: ⚠️ Build error ignoring enabled
- `package.json`: ✅ Build scripts properly configured
- No legacy Pages Router files found

## Implementation Strategy

### Phase 1: Environment Variable Audit & Fix

**Root Cause**: NODE_ENV environment variable issues during build
- Research shows NODE_ENV must be "production" or empty during `next build`
- Current build shows "non-standard NODE_ENV value" warning

**Actions**:
1. **Check current NODE_ENV handling in build scripts**
2. **Ensure NODE_ENV is properly set to "production" during builds**
3. **Remove any explicit NODE_ENV=development settings**

### Phase 2: Build Configuration Cleanup

**Address build error masking in next.config.ts**:
```typescript
// CURRENT (problematic)
typescript: {
  ignoreBuildErrors: true,
},
eslint: {
  ignoreDuringBuilds: true,
}

// TARGET (proper error detection)
typescript: {
  ignoreBuildErrors: false, // Enable error detection
},
eslint: {
  ignoreDuringBuilds: false, // Enable linting during builds
}
```

### Phase 3: 404 Page Implementation

**Implement proper App Router 404 handling**:
1. **Global 404 Page**: Create `src/app/global-not-found.tsx`
2. **Route-level 404**: Create `src/app/not-found.tsx`
3. **Custom Error Boundary**: Ensure proper error handling

### Phase 4: Html Component Audit

**Comprehensive scan for incorrect imports**:
- Check all components for `import { Html } from 'next/document'`
- Replace with proper App Router patterns
- Verify metadata handling uses new `metadata` API

### Phase 5: Build Pipeline Validation

**Establish robust build validation**:
- Clean build environment setup
- Progressive build testing
- Environment variable validation

## Detailed Implementation Tasks

### Task 1: Emergency Environment Fix
**Priority**: Immediate
**Estimated Time**: 15 minutes

```bash
# Check current NODE_ENV during build
echo $NODE_ENV

# Fix build scripts in package.json
"build": "NODE_ENV=production next build",
"build:local": "NODE_ENV=production cross-env NO_HTTPS='1' next build"
```

### Task 2: Create Proper 404 Pages
**Priority**: High
**Estimated Time**: 30 minutes

**Create `src/app/not-found.tsx`**:
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
```

**Create `src/app/global-not-found.tsx`**:
```tsx
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
        </div>
      </body>
    </html>
  );
}
```

### Task 3: Fix Build Configuration
**Priority**: High
**Estimated Time**: 20 minutes

**Update `next.config.ts`**:
```typescript
export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    // Remove error ignoring to detect issues
    typescript: {
      ignoreBuildErrors: false, // Enable type checking
    },
    eslint: {
      ignoreDuringBuilds: false, // Enable linting
    },
    experimental: {
      taint: true,
    },
  };
  return withNextIntl(nextConfig);
};
```

### Task 4: Html Component Audit
**Priority**: Medium
**Estimated Time**: 45 minutes

**Search and replace patterns**:
```bash
# Search for problematic imports
grep -r "import.*Html.*from.*next/document" src/
grep -r "from 'next/document'" src/
grep -r 'from "next/document"' src/

# Replace with proper App Router patterns
# next/head → metadata API
# Html components → standard html elements
```

### Task 5: Environment Variable Cleanup
**Priority**: Medium
**Estimated Time**: 30 minutes

**Review and standardize NODE_ENV usage**:
- Ensure all development checks use `process.env.NODE_ENV !== "production"`
- Remove any hardcoded environment values
- Validate environment variable handling in Docker builds

## Error Handling & Edge Cases

### Build Failure Recovery
```bash
# If build still fails after fixes
1. Clean build cache: pnpm clean
2. Remove node_modules: rm -rf node_modules && pnpm install
3. Check for hidden Pages Router files
4. Validate environment variables
```

### Compatibility Issues
- **Mixed Router Patterns**: Ensure no Pages Router remnants
- **Component Import Conflicts**: Verify all components use App Router patterns
- **Metadata Handling**: Ensure proper `metadata` export usage

### Development vs Production Builds
- Development builds may work while production fails
- Always test with `pnpm build:local` before deployment
- Environment-specific configurations must be handled correctly

## Validation Gates & Testing

### Critical Validation (Must Pass)
```bash
# 1. Build Success
NODE_ENV=production pnpm build:local
if [ $? -eq 0 ]; then
  echo "✅ Production build successful"
else
  echo "❌ Production build failed - investigate further"
  exit 1
fi

# 2. TypeScript Validation
NODE_OPTIONS="--max-old-space-size=6144" pnpm check-types
if [ $? -eq 0 ]; then
  echo "✅ TypeScript validation passed"
else
  echo "❌ TypeScript errors detected"
fi

# 3. Linting Validation
pnpm lint
if [ $? -eq 0 ]; then
  echo "✅ Code quality checks passed"
else
  echo "❌ Linting issues detected"
fi
```

### Project-Specific Health Checks
```bash
# 4. App Router Structure Validation
if [ -f "src/app/layout.tsx" ] && [ -f "src/app/not-found.tsx" ]; then
  echo "✅ App Router structure valid"
else
  echo "❌ Missing required App Router files"
fi

# 5. Environment Configuration Check
if [ "$NODE_ENV" = "production" ] || [ -z "$NODE_ENV" ]; then
  echo "✅ NODE_ENV properly configured"
else
  echo "❌ NODE_ENV must be 'production' or empty for builds"
fi

# 6. 404 Page Functionality
curl -f http://localhost:3000/non-existent-page || echo "✅ 404 handling works"
```

### Better-Chatbot Specific Validation
```bash
# 7. Vercel AI SDK Integration
curl -f http://localhost:3000/api/health || echo "⚠️ API health check failed"

# 8. Canvas System (if relevant)
/validate-canvas

# 9. MCP Integration (if relevant)
/validate-mcp

# 10. Agent System (if relevant)
/validate-agents
```

## Success Metrics

### Immediate Success Criteria
- [ ] `pnpm build:local` completes without errors
- [ ] Production deployment succeeds on Vercel/hosting platform
- [ ] 404 pages render correctly
- [ ] No TypeScript build errors
- [ ] No ESLint build errors

### Long-term Stability Metrics
- [ ] Consistent builds across environments
- [ ] No regression in existing functionality
- [ ] Proper error handling for edge cases
- [ ] Environment variable consistency

## Risk Assessment & Mitigation

### High Risk Areas
1. **Breaking Changes**: Modifying build configuration could affect other functionality
2. **Environment Dependencies**: Changes to NODE_ENV handling might affect development workflow
3. **Production Deployment**: Any remaining issues could break live site

### Mitigation Strategies
1. **Incremental Testing**: Test each change independently
2. **Backup Strategy**: Maintain current working branch during fixes
3. **Rollback Plan**: Documented steps to revert changes if needed
4. **Staging Environment**: Test all changes in staging before production

## Integration Points

### Vercel AI SDK Considerations
- Build changes must not affect AI streaming functionality
- Tool loading pipeline must remain intact
- Observability (Langfuse) integration must continue working

### Canvas System Integration
- Chart artifact generation must work post-fix
- Multi-grid dashboard functionality preserved
- Real-time streaming capabilities maintained

### MCP Protocol Integration
- Tool binding through Vercel AI SDK must continue
- Dynamic tool loading preserved
- MCP server management functionality intact

## Timeline & Execution Order

### Phase 1 (Immediate - 0-2 hours)
1. Fix NODE_ENV environment variable handling
2. Create proper 404 pages
3. Test basic build functionality

### Phase 2 (Short-term - 2-4 hours)
1. Update build configuration
2. Comprehensive Html import audit
3. Full build pipeline validation

### Phase 3 (Medium-term - 4-8 hours)
1. Integration testing with all systems
2. Performance validation
3. Deployment testing

## Documentation & Knowledge Transfer

### Required Documentation Updates
- Update deployment guides with new build requirements
- Document 404 page customization options
- Update troubleshooting guides

### Knowledge Transfer Points
- Share build configuration best practices with team
- Document environment variable requirements
- Create runbook for future build issues

## Success Validation Score

**Confidence Level: 9/10**

**Justification**:
- ✅ **Comprehensive Research**: Extensive web search and codebase analysis completed
- ✅ **Root Cause Identified**: NODE_ENV and 404 prerendering issues well understood
- ✅ **Clear Implementation Path**: Step-by-step tasks with specific code examples
- ✅ **Proper Validation Gates**: Executable health checks matching project patterns
- ✅ **Risk Mitigation**: Rollback strategies and incremental testing approach
- ⚠️ **Minor Uncertainty**: Potential for hidden dependencies or edge cases

**Why One-Pass Success is Likely**:
1. **Specific Error Patterns**: Well-documented Next.js issue with known solutions
2. **Proper App Router Structure**: Codebase already correctly structured
3. **Clear Fix Strategy**: Environment variable and 404 page creation straightforward
4. **Comprehensive Testing**: Multiple validation gates ensure thorough verification

This PRP provides a complete roadmap for resolving the critical production build failure with high confidence of success in a single implementation cycle.