name: "Canvas Critical Fixes Implementation - Context-Rich PRP"
description: |

## Purpose
Comprehensive PRP for fixing 4 critical Canvas system issues that block functionality, introduce security vulnerabilities, and cause performance problems. This PRP provides complete context for one-pass implementation success.

## Core Principles
1. **Security First**: XSS prevention and input validation are non-negotiable
2. **Backwards Compatibility**: All existing Canvas functionality must continue working
3. **Performance Focused**: Memory management and chart limits prevent crashes
4. **Developer Experience**: Clean TypeScript compilation enables efficient development

---

## Goal
Fix 4 critical Canvas system issues that prevent users from accessing 13 specialized chart types, introduce XSS vulnerabilities, cause app crashes with excessive charts, and block clean development due to TypeScript compilation errors.

## Why
- **User Impact**: Users currently can only access 4/17 available chart tools due to incomplete exports
- **Security Risk**: No XSS prevention for user-generated chart data creates vulnerability
- **Performance Issues**: Apps crash when users create 20+ charts due to memory leaks
- **Development Blocker**: TypeScript compilation errors prevent clean builds and CI/CD pipeline execution
- **Foundation for Growth**: These fixes are prerequisites for implementing 37 additional Canvas enhancements

## What
Complete implementation of chart tools export system, comprehensive data validation with XSS prevention, intelligent memory management with chart count limits, and TypeScript path resolution fixes.

### Success Criteria
- [ ] All 17 chart tools are accessible in Canvas (currently only 4 work)
- [ ] Zero XSS vulnerabilities in chart data handling (tested with malicious input)
- [ ] App remains stable with 25+ charts without memory leaks or crashes
- [ ] Clean TypeScript compilation across all environments (no import path errors)
- [ ] No performance regression in existing Canvas functionality
- [ ] All existing Canvas configurations continue working (backwards compatibility)
- [x] **COMPLETED: Gauge Chart SubArc Validation Fix** - Fixed react-gauge-component subArc validation errors by explicitly setting `subArcs: []` and adding comprehensive data validation

## All Needed Context

### Documentation & References
```yaml
# CRITICAL READING - TypeScript Configuration and Module Resolution
- url: https://www.typescriptlang.org/tsconfig/moduleResolution.html
  why: Understanding moduleResolution bundler vs node for Next.js compatibility
  section: Bundle-aware module resolution for modern bundlers

- url: https://nextjs.org/docs/app/api-reference/config/typescript
  why: Next.js TypeScript configuration best practices and path resolution
  critical: Next.js automatically resets moduleResolution from bundler to node

# SECURITY - XSS Prevention and Data Validation
- url: https://github.com/cure53/DOMPurify
  why: Latest DOMPurify v3.2.7 for XSS prevention in chart data
  section: TypeScript integration and React patterns
  critical: Use whitelist-based filtering, not blacklist approach

- url: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
  why: OWASP XSS prevention guidelines for user-generated content
  section: HTML sanitization for dynamic chart titles and labels

# PERFORMANCE - Memory Management Modern APIs
- url: https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory
  why: Modern replacement for deprecated window.performance.memory
  critical: Requires cross-origin isolation and secure context

- url: https://medium.com/@90mandalchandan/understanding-and-managing-memory-leaks-in-react-applications-bcfcc353e7a5
  why: React memory management patterns for 2024
  section: Component cleanup and useEffect patterns

# BARREL EXPORTS - Performance and Organization
- url: https://tkdodo.eu/blog/please-stop-using-barrel-files
  why: 2024 criticism of barrel files and performance impact
  critical: Balance between organization and bundle size/startup performance

# EXISTING CODEBASE PATTERNS TO MIRROR
- file: src/lib/ai/workflow/node-validate.ts
  why: Existing Zod validation patterns and error handling
  pattern: validateSchema function and cleanVariableName usage

- file: src/components/canvas-panel.tsx
  why: Current memory tracking and useCanvas hook patterns
  pattern: isMountedRef, memoryTracker, and debugLog implementations
  critical: Line 512-519 shows existing memory monitoring approach

- file: src/lib/ai/tools/chart-tool.ts
  why: Main chart tool integration point and tool registration
  pattern: How chart tools are loaded and integrated with Canvas

- file: src/components/tool-invocation/shared.tool-invocation.ts
  why: Existing validation and safe rendering patterns
  pattern: Error boundaries and content sanitization approaches
```

### Current Codebase Tree (Key Files for This Implementation)
```bash
src/lib/ai/tools/artifacts/
├── index.ts                    # CRITICAL: Only exports 4/17 tools
├── area-chart-tool.ts          # Missing from exports
├── calendar-heatmap-tool.ts    # Missing from exports
├── composed-chart-tool.ts      # Missing from exports
├── dashboard-orchestrator-tool.ts # Missing from exports
├── funnel-chart-tool.ts        # Missing from exports
├── gauge-chart-tool.ts         # Missing from exports
├── geographic-chart-tool.ts    # Missing from exports
├── radar-chart-tool.ts         # Missing from exports
├── radial-bar-tool.ts          # Missing from exports
├── sankey-chart-tool.ts        # Missing from exports
├── scatter-chart-tool.ts       # Missing from exports
├── treemap-chart-tool.ts       # Missing from exports
└── [4 currently exported tools] # bar, line, pie, table

src/components/canvas-panel.tsx  # Memory management and useCanvas hook
src/lib/ai/workflow/node-validate.ts # Existing validation patterns
src/lib/utils.ts                # Utility functions for validation
tsconfig.json                   # TypeScript path configuration
```

### Desired Codebase Tree with Files to be Added
```bash
src/lib/validation/
├── chart-data-validator.ts     # Chart-specific Zod schemas and validation
├── xss-prevention.ts          # DOMPurify integration for chart content
└── validation-schemas.ts       # Reusable validation schemas

src/hooks/
├── use-memory-monitor.ts       # Modern memory monitoring hook
└── use-chart-limits.ts         # Chart count and resource management

src/lib/performance/
├── memory-manager.ts           # Memory management utilities
└── chart-cleanup.ts            # Chart cleanup and garbage collection

# MODIFIED FILES
src/lib/ai/tools/artifacts/index.ts # Complete export registry for all 17 tools
tsconfig.json                       # Fixed path resolution configuration
```

### Known Gotchas of Codebase & Library Quirks
```typescript
// CRITICAL: Next.js resets moduleResolution from "bundler" to "node" during build
// Current tsconfig has "moduleResolution": "bundler" but chart tools use path aliases
// that don't resolve properly during TypeScript compilation

// CRITICAL: Chart tools use "lib/utils" and "logger" imports
// These are path aliases defined in tsconfig.json paths section
// Need to ensure these resolve in all compilation contexts

// CRITICAL: Canvas useCanvas hook already has memory tracking
// Line 512-519 in canvas-panel.tsx shows window.performance.memory usage
// This is deprecated and Chrome-specific - need modern replacement

// CRITICAL: Existing validation uses ts-safe library pattern
// src/lib/ai/workflow/node-validate.ts shows safe() wrapper usage
// Keep consistent with existing error handling patterns

// CRITICAL: Recharts library performance degrades with large datasets
// Need virtual scrolling or chart limits before performance issues arise
// Existing Canvas has no limits - users can create unlimited charts

// CRITICAL: DOMPurify v3.2.7 requires proper TypeScript integration
// Need @types/dompurify package for TypeScript definitions
// Must configure to work with React SSR/hydration patterns
```

## Implementation Blueprint

### Data Models and Validation Structure
Create type-safe validation schemas for all chart data inputs:

```typescript
// Chart data validation with XSS prevention
interface ChartDataValidation {
  title: string;        // Sanitized with DOMPurify
  data: ChartPoint[];   // Validated structure
  metadata: ChartMeta;  // Type-safe configuration
}

// Memory monitoring structure
interface MemoryMonitor {
  chartCount: number;
  memoryUsage: number;
  warningThreshold: number;
  maxCharts: number;
}
```

### List of Tasks (Ordered Implementation Sequence)

```yaml
Task 1 - Fix TypeScript Path Resolution:
MODIFY tsconfig.json:
  - REVIEW current "moduleResolution": "bundler" setting
  - TEST compilation with current path aliases
  - FIX any resolution issues preventing clean builds
  - PRESERVE existing path aliases functionality

Task 2 - Complete Chart Tools Export System:
MODIFY src/lib/ai/tools/artifacts/index.ts:
  - FIND pattern: Current 4-tool export structure
  - ADD imports for all 13 missing chart tools
  - PRESERVE existing export format and naming conventions
  - UPDATE chartArtifactTools object with all tools
  - UPDATE ChartArtifactToolNames with proper naming

Task 3 - Implement Data Validation Framework:
CREATE src/lib/validation/validation-schemas.ts:
  - MIRROR pattern from: src/lib/ai/workflow/node-validate.ts
  - CREATE Zod schemas for chart data validation
  - INCLUDE input sanitization and length limits

CREATE src/lib/validation/xss-prevention.ts:
  - IMPLEMENT DOMPurify integration for chart content
  - CREATE sanitization functions for titles, labels, tooltips
  - HANDLE React SSR/hydration compatibility

CREATE src/lib/validation/chart-data-validator.ts:
  - COMBINE Zod validation with XSS prevention
  - CREATE validation middleware for chart tools
  - PRESERVE existing error handling patterns

Task 4 - Implement Memory Management System:
CREATE src/hooks/use-memory-monitor.ts:
  - REPLACE deprecated window.performance.memory usage
  - IMPLEMENT modern memory monitoring approaches
  - PROVIDE fallback for unsupported browsers

CREATE src/hooks/use-chart-limits.ts:
  - IMPLEMENT chart count tracking and limits
  - CREATE warning system before reaching limits
  - INTEGRATE with existing useCanvas hook

CREATE src/lib/performance/memory-manager.ts:
  - IMPLEMENT garbage collection optimization
  - CREATE chart cleanup utilities
  - PROVIDE memory pressure detection

CREATE src/lib/performance/chart-cleanup.ts:
  - IMPLEMENT proper component cleanup patterns
  - CREATE chart data cleanup on unmount
  - OPTIMIZE memory usage for large datasets

Task 5 - Integration and Testing:
MODIFY chart tools to use validation:
  - UPDATE all 17 chart tools to use new validation
  - PRESERVE existing chart tool APIs
  - ADD XSS prevention to user input handling

MODIFY src/components/canvas-panel.tsx:
  - INTEGRATE new memory monitoring hooks
  - ADD chart count limits and warnings
  - PRESERVE existing Canvas functionality

TEST complete integration:
  - VERIFY all 17 chart tools work in Canvas
  - TEST XSS prevention with malicious inputs
  - VALIDATE memory management with 25+ charts
  - CONFIRM TypeScript compilation success
```

### Per Task Pseudocode

```typescript
// Task 1 - TypeScript Path Resolution
// CRITICAL: Chart tools currently fail compilation due to path aliases
interface PathResolutionFix {
  // CURRENT ISSUE: "lib/utils" and "logger" imports don't resolve
  // during isolated TypeScript compilation

  // SOLUTION APPROACH:
  // 1. Test current tsconfig with Next.js build
  // 2. If moduleResolution "bundler" causes issues, use "node"
  // 3. Ensure all path aliases resolve correctly
  // 4. Verify import statements work in all contexts
}

// Task 2 - Chart Tools Export System
// PATTERN: Follow existing export structure in index.ts
const completeExportSystem = {
  // ADD missing imports following existing pattern:
  imports: [
    'areaChartArtifactTool',
    'calendarHeatmapArtifactTool',
    'composedChartArtifactTool',
    // ... all 13 missing tools
  ],

  // UPDATE export object following existing pattern
  chartArtifactTools: {
    createAreaChart: 'areaChartArtifactTool',
    // ... all tools with consistent naming
  },

  // PRESERVE existing tool name constants format
  ChartArtifactToolNames: {
    CreateAreaChart: "create_area_chart_artifact",
    // ... consistent naming convention
  }
};

// Task 3 - Data Validation with XSS Prevention
// MIRROR pattern from: src/lib/ai/workflow/node-validate.ts
async function validateChartData(input: unknown): Promise<ValidatedChartData> {
  // PATTERN: Use Zod for structure validation (existing pattern)
  const schema = z.object({
    title: z.string().max(255).min(1),
    data: z.array(chartDataPointSchema),
    labels: z.array(z.string().max(100))
  });

  // SECURITY: Sanitize all user-provided strings
  const validated = schema.parse(input);

  // CRITICAL: Use DOMPurify for XSS prevention
  const sanitized = {
    ...validated,
    title: DOMPurify.sanitize(validated.title, {
      ALLOWED_TAGS: [], // No HTML allowed in titles
      ALLOWED_ATTR: []
    }),
    labels: validated.labels.map(label =>
      DOMPurify.sanitize(label, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    )
  };

  return sanitized;
}

// Task 4 - Memory Management System
// REPLACE deprecated window.performance.memory with modern APIs
function useMemoryMonitor() {
  // MODERN APPROACH: Use measureUserAgentSpecificMemory when available
  const getMemoryInfo = useCallback(async () => {
    if ('measureUserAgentSpecificMemory' in performance) {
      try {
        // REQUIRES: Cross-origin isolation and secure context
        const memoryInfo = await performance.measureUserAgentSpecificMemory();
        return memoryInfo.bytes;
      } catch (error) {
        // FALLBACK: Estimate based on chart count and data size
        return estimateMemoryUsage();
      }
    }

    // LEGACY FALLBACK: For browsers without modern API
    return estimateMemoryUsage();
  }, []);

  // PATTERN: Follow existing Canvas memory tracking approach
  // but with modern APIs and proper cleanup
}
```

### Integration Points
```yaml
CHART TOOLS:
  - modify: src/lib/ai/tools/artifacts/*.ts
  - pattern: "Add validation call before chart processing"
  - preserve: "Existing tool execution patterns and return types"

CANVAS SYSTEM:
  - modify: src/components/canvas-panel.tsx
  - pattern: "Integrate new memory monitoring without breaking useCanvas hook"
  - preserve: "All existing Canvas state management and user interactions"

BUILD SYSTEM:
  - modify: tsconfig.json
  - pattern: "Ensure path resolution works in all compilation contexts"
  - preserve: "All existing path aliases and import patterns"

API INTEGRATION:
  - modify: src/app/api/chat/shared.chat.ts
  - pattern: "Ensure all 17 tools are properly loaded in chat pipeline"
  - preserve: "Existing tool loading and registration mechanisms"
```

## Validation Loop

### Level 1: TypeScript Compilation & Path Resolution
```bash
# CRITICAL: Must pass TypeScript compilation across all environments
pnpm check-types  # Full project type check

# Test individual chart tool compilation
npx tsc --noEmit --skipLibCheck src/lib/ai/tools/artifacts/area-chart-tool.ts
npx tsc --noEmit --skipLibCheck src/lib/ai/tools/artifacts/geographic-chart-tool.ts

# Verify path resolution works
npx tsc --showConfig  # Confirm path aliases are resolved correctly

# Expected: No compilation errors, all imports resolve correctly
```

### Level 2: Security Testing - XSS Prevention
```typescript
// CREATE test_xss_prevention.test.ts with malicious inputs:
describe('XSS Prevention', () => {
  test('blocks script injection in chart titles', async () => {
    const maliciousInput = {
      title: '<script>alert("XSS")</script>Malicious Chart',
      data: [{ label: '<img src=x onerror=alert("XSS")>', value: 100 }]
    };

    const validated = await validateChartData(maliciousInput);

    // ASSERT: All HTML/JS is stripped, only safe text remains
    expect(validated.title).toBe('Malicious Chart');
    expect(validated.data[0].label).not.toContain('<');
    expect(validated.data[0].label).not.toContain('onerror');
  });

  test('preserves safe chart data', async () => {
    const safeInput = {
      title: 'Q4 Sales Performance',
      data: [{ label: 'Revenue', value: 100000 }]
    };

    const validated = await validateChartData(safeInput);

    // ASSERT: Safe data passes through unchanged
    expect(validated.title).toBe('Q4 Sales Performance');
    expect(validated.data[0].label).toBe('Revenue');
  });
});
```

```bash
# Run security tests and iterate until passing:
pnpm test src/lib/validation/ -v
# If failing: Fix validation logic, never skip security tests
```

### Level 3: Memory Management & Performance Testing
```typescript
// CREATE test_memory_management.test.ts:
describe('Memory Management', () => {
  test('prevents excessive chart creation', async () => {
    const { result } = renderHook(() => useChartLimits());

    // Simulate creating charts up to limit
    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.addChart({ id: `chart-${i}`, type: 'bar' });
      });
    }

    // ASSERT: Warning triggered before crash point
    expect(result.current.warningActive).toBe(true);
    expect(result.current.chartCount).toBe(25);

    // ASSERT: Additional charts are rejected gracefully
    act(() => {
      result.current.addChart({ id: 'chart-overflow', type: 'bar' });
    });
    expect(result.current.chartCount).toBe(25); // Should not exceed limit
  });

  test('cleans up chart data on component unmount', () => {
    const { unmount } = renderComponent(<TestChart />);

    // Verify memory usage before unmount
    const initialMemory = getCurrentMemoryEstimate();

    unmount();

    // ASSERT: Memory is properly released
    const finalMemory = getCurrentMemoryEstimate();
    expect(finalMemory).toBeLessThan(initialMemory);
  });
});
```

```bash
# Run performance tests
pnpm test:performance src/lib/performance/ -v
# Monitor memory usage during tests - should not grow indefinitely
```

### Level 4: End-to-End Canvas Integration Testing
```bash
# Start development server
pnpm dev

# Test all 17 chart tools are accessible (previously only 4 worked)
# Use browser console to verify no compilation errors
# Create multiple charts to test memory management

# Test XSS prevention in browser:
# 1. Attempt to create chart with malicious title: "<script>alert('XSS')</script>Test"
# 2. Verify title is sanitized to "Test" with no script execution
# 3. Check browser console for no XSS-related errors

# Test memory management:
# 1. Create 25 charts in Canvas workspace
# 2. Verify warning appears before system limits
# 3. Verify app remains responsive and stable
# 4. Check browser memory usage remains reasonable

# Expected: All chart types work, no XSS vulnerabilities, stable performance
```

## Final Validation Checklist
- [ ] TypeScript compilation passes: `pnpm check-types` (no errors)
- [ ] All 17 chart tools exported and accessible in Canvas UI
- [ ] Security tests pass: XSS attacks prevented, malicious input sanitized
- [ ] Memory tests pass: Chart limits enforced, cleanup working properly
- [ ] Performance tests pass: No memory leaks, stable with 25+ charts
- [ ] E2E tests pass: Complete Canvas workflow functional
- [ ] Backwards compatibility confirmed: Existing configurations work unchanged
- [ ] No breaking changes to existing chart tool APIs

---

## Anti-Patterns to Avoid
- ❌ Don't skip XSS testing - security vulnerabilities are unacceptable
- ❌ Don't ignore TypeScript compilation errors - they prevent deployment
- ❌ Don't use deprecated window.performance.memory in production code
- ❌ Don't break existing Canvas functionality - maintain backwards compatibility
- ❌ Don't create chart count limits that are too restrictive for power users
- ❌ Don't skip cleanup patterns - memory leaks will cause crashes
- ❌ Don't hardcode chart limits - make them configurable
- ❌ Don't trust client-side validation alone - implement defense in depth

## Confidence Score: 9/10

**Why High Confidence:**
- Complete context provided with specific URLs, code patterns, and gotchas
- Executable validation loops with concrete tests to run and iterate on
- Clear task ordering that addresses dependencies (TypeScript first, then exports, then security, then performance)
- Mirrors existing codebase patterns rather than inventing new approaches
- Security-focused with comprehensive XSS prevention testing
- Performance-focused with modern memory management APIs
- Backwards compatibility preserved throughout

**Risk Mitigation:**
- Multiple validation levels catch issues early
- Specific error scenarios addressed with tests
- Fallback approaches for browser compatibility
- Step-by-step implementation reduces integration complexity
- All changes are additive rather than replacing existing functionality

This PRP provides sufficient context and validation loops for one-pass implementation success while maintaining the security, performance, and reliability standards required for a production Canvas system.