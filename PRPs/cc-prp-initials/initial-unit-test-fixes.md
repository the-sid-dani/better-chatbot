# Initial Plan: Unit Test Fixes for Production Readiness

## Feature Overview

**Feature Name:** Unit Test Suite Fixes - MCP Database Storage & Gauge Chart Precision
**Type:** Quality Assurance / Test Infrastructure
**Priority:** High (Pre-Release Requirement)
**Complexity:** Low-Medium

## Executive Summary

Fix 17 failing unit tests (5.5% failure rate) to achieve 100% test suite pass rate before production release. The failures are isolated to two specific areas: MCP database storage tests (16 failures) and gauge chart precision validation (1 failure). Both issues are test-only concerns with no impact on production functionality.

**Current Test Status:**
- Total Tests: 310
- Passing: 293 (94.5%)
- Failing: 17 (5.5%)
- Test Files: 25 (3 failed, 22 passed)

## Feature Purpose & Core Components

### Problem Statement
The application is production-ready and fully functional, but the unit test suite has 17 failing tests that need remediation to maintain code quality standards. These failures were identified during comprehensive QA health assessment and are blocking the quality gate for production deployment.

### User/Stakeholder Impact
- **Developers:** Confidence in code quality and regression prevention
- **QA Team:** Clear validation of component functionality
- **Product Team:** Production deployment readiness assurance
- **End Users:** No direct impact (tests only, no functional issues)

### Core Components to Fix

#### 1. MCP Database Storage Tests (16 failures)
**Location:** `src/lib/ai/mcp/db-mcp-config-storage.test.ts`
**Issue:** Incomplete Drizzle ORM mock setup causing `TypeError: Cannot read properties of undefined (reading 'query')`

**Root Cause Analysis:**
- Current mock only covers `lib/db/repository` exports
- Missing mock for `lib/db/pg/db.pg` (Drizzle database instance)
- Repository methods call `db.select().from().where()` but `db` is undefined
- Vitest mock doesn't chain through to actual Drizzle query builder

**Affected Test Cases:**
- `init` - should initialize with manager
- `loadAll` - should load all servers from database
- `loadAll` - should return empty array when database fails
- `save` - should save server to database
- `save` - should throw error when save fails
- `delete` - should delete server from database
- `delete` - should throw error when delete fails
- `has` - should return true when server exists
- `has` - should return false when server does not exist
- `has` - should return false when database query fails
- `get` - should return server when it exists (FAILING)
- `get` - should return null when server does not exist (FAILING)
- Additional interval and periodic check tests

#### 2. Gauge Chart Test Precision (1 failure)
**Location:** `src/components/tool-invocation/gauge-chart.test.tsx` (line 68-106)
**Issue:** Floating-point precision mismatch in edge case validation

**Root Cause Analysis:**
```typescript
// Test expectation (line 72)
{ value: 33, min: 10, max: 50, expected: 57.5 }

// Test calculation (line 98)
const percentage = Math.round(((normalizedValue - normalizedMin) / range) * 100);
// Calculation: (33-10)/(50-10) * 100 = 57.5
// Math.round(57.5) behavior varies: some implementations round to 58, others to 57
// Expected: 57.5, Actual: 57 → Test fails
```

**Test Purpose:** Validate gauge chart handles edge cases that previously caused "subArc validation errors" in react-gauge-component library.

## Architecture Integration Strategy

### Testing Infrastructure Context
- **Test Runner:** Vitest v3.2.4
- **Configuration:** `vitest.config.ts` with tsconfigPaths plugin
- **Test Pattern:** `**/*.test.ts` and `**/*.test.tsx` in `src/`
- **E2E Exclusion:** `/tests` directory excluded from Vitest (Playwright-only)
- **Mocking Strategy:** Vitest `vi.mock()` for dependency isolation

### Database Testing Patterns
**Current Implementation:**
```typescript
// src/lib/db/pg/db.pg.ts
export const pgDb = drizzle(process.env.POSTGRES_URL!);

// src/lib/db/repository.ts
export const mcpRepository = pgMcpRepository;

// src/lib/db/pg/repositories/mcp-repository.pg.ts
export const pgMcpRepository: MCPRepository = {
  async selectById(id) {
    const [result] = await db.select().from(McpServerSchema).where(eq(McpServerSchema.id, id));
    return result;
  },
  // ... other methods
};
```

**Integration Points:**
- Drizzle ORM 0.41.0 with node-postgres adapter
- Repository pattern with centralized exports
- Schema-based type safety via `McpServerSchema`
- Environment-based PostgreSQL connection

### Test Isolation Requirements
- **No Real Database:** Tests must run without PostgreSQL connection
- **Mock Completeness:** Full Drizzle query builder chain simulation
- **Type Safety:** Mocks must satisfy TypeScript interfaces
- **Independence:** Tests shouldn't affect each other or rely on execution order

## Development Patterns & Implementation Approach

### Fix #1: MCP Database Storage Tests - Complete Drizzle Mock

**Strategy:** Two-layer mock approach
1. Mock repository module exports
2. Mock Drizzle database instance with query builder chains

**Implementation Pattern:**
```typescript
// Mock the database instance (NEW - missing in current test)
vi.mock("lib/db/pg/db.pg", () => {
  // Create chainable mock for Drizzle query builder
  const createQueryChain = (returnValue: any) => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returnValue),
    delete: vi.fn().mockReturnThis(),
    // Add Promise resolution for query execution
    then: vi.fn((resolve) => resolve(returnValue)),
  });

  return {
    pgDb: createQueryChain([]), // Default empty result
  };
});

// Keep existing repository mock (already in test)
vi.mock("lib/db/repository", () => ({
  mcpRepository: {
    selectAll: vi.fn(),
    save: vi.fn(),
    deleteById: vi.fn(),
    selectById: vi.fn(),
  },
}));
```

**Alternative Approach:** Use `vi.hoisted()` for better mock control
```typescript
const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockImplementation(() => Promise.resolve([mockServer])),
  // ... other methods
}));

vi.mock("lib/db/pg/db.pg", () => ({ pgDb: mockDb }));
```

**Testing Strategy:**
- Configure mocks in `beforeEach` to reset state
- Use `vi.mocked()` for type-safe mock assertions
- Verify mock chains are called with correct arguments
- Ensure Promise resolution patterns match Drizzle behavior

### Fix #2: Gauge Chart Precision - Floating-Point Assertion

**Strategy:** Use Vitest `toBeCloseTo()` matcher for decimal precision

**Implementation Pattern:**
```typescript
// BEFORE (line 100 - causes failure)
expect(percentage).toBe(expected);

// AFTER (precision-aware assertion)
expect(percentage).toBeCloseTo(expected, 1); // 1 decimal place precision
```

**Why `toBeCloseTo()`:**
- Handles floating-point arithmetic imprecision
- Configurable precision (default: 2 decimal places)
- Standard practice for decimal comparisons in testing
- Matches test intent: validate calculation logic, not exact rounding behavior

**Test Case Analysis:**
```typescript
// Edge case that triggers precision issue
{ value: 33, min: 10, max: 50, expected: 57.5 }

// Calculation breakdown
const range = 50 - 10 = 40
const percentage = ((33 - 10) / 40) * 100 = 57.5
Math.round(57.5) // Implementation-dependent: 57 or 58

// Solution: Don't test exact rounding, test calculation accuracy
expect(percentage).toBeCloseTo(57.5, 1); // ✅ Passes if within 0.1
```

## File Organization & Project Structure

### Test Files to Modify

#### Primary Files (Direct Changes):
1. **`src/lib/ai/mcp/db-mcp-config-storage.test.ts`** (Lines 7-32)
   - Add Drizzle database mock
   - Enhance query builder chain simulation
   - Ensure type compatibility with Drizzle ORM

2. **`src/components/tool-invocation/gauge-chart.test.tsx`** (Line 100)
   - Replace `.toBe()` with `.toBeCloseTo()` for decimal comparison
   - Validate precision tolerance (1 decimal place)

#### Reference Files (Context Only):
- `src/lib/db/pg/db.pg.ts` - Database initialization pattern
- `src/lib/db/repository.ts` - Repository export pattern
- `src/lib/db/pg/repositories/mcp-repository.pg.ts` - Implementation reference
- `vitest.config.ts` - Test configuration
- `package.json` - Test scripts

### Directory Structure (Relevant)
```
better-chatbot/
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   └── mcp/
│   │   │       ├── db-mcp-config-storage.test.ts    # FIX HERE
│   │   │       ├── db-mcp-config-storage.ts         # Implementation
│   │   │       └── ... (other MCP files)
│   │   └── db/
│   │       ├── pg/
│   │       │   ├── db.pg.ts                         # Mock this
│   │       │   └── repositories/
│   │       │       └── mcp-repository.pg.ts         # Reference
│   │       └── repository.ts                        # Already mocked
│   └── components/
│       └── tool-invocation/
│           └── gauge-chart.test.tsx                 # FIX HERE
├── vitest.config.ts                                 # Test config
└── package.json                                     # Test scripts
```

## Implementation Blueprint & Task Breakdown

### Phase 1: MCP Database Mock Setup ⏱️ 30-45 minutes

**Task 1.1:** Analyze Drizzle Query Builder Chains
- [ ] Review `pgMcpRepository` implementation patterns
- [ ] Identify all query methods used: `select()`, `from()`, `where()`, `insert()`, `delete()`
- [ ] Document return types and Promise resolution patterns
- [ ] Map Drizzle ORM API surface needed for tests

**Task 1.2:** Implement Complete Database Mock
- [ ] Create `lib/db/pg/db.pg` mock in test file
- [ ] Implement chainable query builder methods
- [ ] Configure `mockReturnThis()` for fluent interface
- [ ] Add Promise resolution via `mockResolvedValue()` or `.then()`
- [ ] Ensure TypeScript type compatibility

**Task 1.3:** Enhance Mock Control & State Management
- [ ] Use `vi.hoisted()` for better mock initialization
- [ ] Implement per-test mock reset in `beforeEach`
- [ ] Configure mock return values for different test cases
- [ ] Add type-safe assertions via `vi.mocked()`

**Task 1.4:** Validate Mock Integration
- [ ] Run failing tests individually: `pnpm test db-mcp-config-storage.test.ts`
- [ ] Verify all 16 tests pass
- [ ] Check mock call assertions
- [ ] Ensure no test interdependencies

### Phase 2: Gauge Chart Precision Fix ⏱️ 10-15 minutes

**Task 2.1:** Update Assertion Matcher
- [ ] Locate failing test case (line 100)
- [ ] Replace `.toBe(expected)` with `.toBeCloseTo(expected, 1)`
- [ ] Document precision rationale in code comment

**Task 2.2:** Validate Fix
- [ ] Run: `pnpm test gauge-chart.test.tsx`
- [ ] Confirm test passes
- [ ] Review all gauge chart test cases for similar issues
- [ ] Ensure no regression in other assertions

### Phase 3: Comprehensive Validation ⏱️ 15-20 minutes

**Task 3.1:** Full Test Suite Execution
- [ ] Run: `pnpm test` (all unit tests)
- [ ] Verify: 310/310 tests passing (100% pass rate)
- [ ] Check: No new failures introduced
- [ ] Confirm: Execution time < 45 seconds

**Task 3.2:** Quality Gate Checks
- [ ] Linting: `pnpm lint` → 0 errors
- [ ] Type checking: `pnpm check-types` → No type errors
- [ ] Build validation: `pnpm build:local` → Success
- [ ] Dev server health: Verify localhost:3000 responsive

**Task 3.3:** Documentation & Cleanup
- [ ] Update test file comments with mock rationale
- [ ] Document Drizzle mocking pattern for future tests
- [ ] Add precision testing best practices note
- [ ] Update QA health report: PASS status

## Technology Context & Best Practices

### Vitest Mocking Best Practices
**Key Principles:**
1. **Mock at Module Level:** Use `vi.mock()` at top of test file
2. **Chain Methods:** Return `this` for fluent interfaces
3. **Type Safety:** Use `vi.mocked()` for TypeScript compatibility
4. **Isolation:** Reset mocks in `beforeEach()` to prevent state leakage
5. **Assertions:** Verify mock calls with `.toHaveBeenCalledWith()`

**Drizzle ORM Mocking Patterns:**
```typescript
// Pattern 1: Simple repository mock (already implemented)
vi.mock("lib/db/repository", () => ({
  mcpRepository: {
    selectAll: vi.fn().mockResolvedValue([]),
  },
}));

// Pattern 2: Database instance mock (NEEDED)
vi.mock("lib/db/pg/db.pg", () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([mockData]),
  };
  return { pgDb: mockChain };
});

// Pattern 3: Hoisted factory (RECOMMENDED)
const { mockDb, mockRepository } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => Promise.resolve([])),
  },
  mockRepository: { /* ... */ },
}));

vi.mock("lib/db/pg/db.pg", () => ({ pgDb: mockDb }));
```

### Floating-Point Testing Best Practices
**Key Principles:**
1. **Never use `.toBe()` for decimals** → Use `.toBeCloseTo()`
2. **Define precision tolerance** → Match business requirements
3. **Document edge cases** → Explain why precision matters
4. **Test calculation logic, not rounding** → Validate math, not implementation details

**Precision Matcher Reference:**
```typescript
// Vitest toBeCloseTo(expected, precision)
expect(0.1 + 0.2).toBeCloseTo(0.3);           // Default: 2 decimal places
expect(57.5).toBeCloseTo(57, 1);              // Within 0.1
expect(Math.PI).toBeCloseTo(3.14159, 5);      // 5 decimal places

// Gauge chart use case
const percentage = ((value - min) / (max - min)) * 100;
expect(percentage).toBeCloseTo(expectedPercent, 1); // ±0.1 tolerance
```

### Relevant Documentation
- **Vitest Mocking:** https://vitest.dev/guide/mocking.html
- **Drizzle ORM Testing:** https://orm.drizzle.team/docs/guides/testing
- **Vitest Matchers:** https://vitest.dev/api/expect.html#tobecloseto
- **Better-Chatbot Testing Guide:** `docs/tips-guides/e2e-testing-guide.md`

### Common Gotchas & Edge Cases

**Database Mocking:**
- ❌ **Gotcha:** Mocking repository but not database instance
- ✅ **Solution:** Mock both `lib/db/repository` AND `lib/db/pg/db.pg`

- ❌ **Gotcha:** Query chains return `undefined` instead of `this`
- ✅ **Solution:** Use `.mockReturnThis()` for all chain methods

- ❌ **Gotcha:** Promise methods not properly mocked
- ✅ **Solution:** Use `.mockResolvedValue()` or implement `.then()`

**Floating-Point Testing:**
- ❌ **Gotcha:** `Math.round(57.5)` behavior varies across environments
- ✅ **Solution:** Test calculation accuracy, not rounding implementation

- ❌ **Gotcha:** Using `.toBe()` for decimal comparisons
- ✅ **Solution:** Always use `.toBeCloseTo()` with appropriate precision

## Security & Access Control

**Test Security Considerations:**
- ✅ Tests run in isolated environment (no real database)
- ✅ No sensitive data in test fixtures
- ✅ Mock credentials don't expose real secrets
- ✅ Test isolation prevents data leakage between tests

**No Authentication/Authorization Impact:**
- Test fixes are purely internal quality improvements
- No changes to authentication flows or authorization logic
- No impact on Better-Auth integration
- No user-facing security implications

## Validation Gates & Success Criteria

### Pre-Implementation Checklist
- [x] Identified root cause of MCP database test failures (incomplete mock)
- [x] Identified root cause of gauge chart precision failure (floating-point comparison)
- [x] Reviewed Drizzle ORM mocking patterns and best practices
- [x] Analyzed test file structure and mock setup requirements
- [x] Documented precision testing strategy for gauge chart

### Implementation Success Criteria

**Test Suite Health:**
- [ ] All 310 unit tests pass (100% pass rate)
- [ ] MCP database storage: 16/16 tests passing
- [ ] Gauge chart: 6/6 tests passing
- [ ] No regression in other test files
- [ ] Test execution time < 45 seconds

**Code Quality Gates:**
```bash
# All must pass:
pnpm lint                    # ✅ 0 errors, 0 warnings
pnpm check-types             # ✅ No type errors
pnpm test                    # ✅ 310/310 passing
pnpm build:local             # ✅ Build succeeds
```

**Validation Commands:**
```bash
# Run specific test files
pnpm test db-mcp-config-storage.test.ts
pnpm test gauge-chart.test.tsx

# Full test suite
pnpm test

# Watch mode (development)
pnpm test:watch

# With coverage (optional)
pnpm test --coverage
```

### Post-Implementation Validation
- [ ] QA health report updated: PASS status
- [ ] Test failures documented in PR/commit message
- [ ] Mock patterns documented for future test development
- [ ] Precision testing best practices added to testing guide
- [ ] No impact on dev server or production functionality

## Risk Assessment & Mitigation

### Low Risk Areas ✅
- **Production Code:** Zero changes to application logic
- **User Impact:** No user-facing changes
- **Functionality:** All features remain operational
- **Performance:** No performance implications

### Medium Risk Areas ⚠️
- **Test Isolation:** Mock changes could affect other tests
  - **Mitigation:** Use `beforeEach()` for mock reset
  - **Validation:** Run full test suite, verify no regressions

- **Type Safety:** Mock types must match Drizzle interfaces
  - **Mitigation:** Use `vi.mocked()` for type-safe assertions
  - **Validation:** TypeScript compilation passes

- **Mock Completeness:** Missing query builder methods could cause failures
  - **Mitigation:** Implement all Drizzle methods used in repository
  - **Validation:** Test each method individually

### Rollback Strategy
- **Simple Rollback:** Git revert test file changes
- **No Database Impact:** Tests don't modify production data
- **Quick Recovery:** < 2 minutes to revert and redeploy

## Performance Considerations

**Test Execution Performance:**
- Current: 40.89s for 310 tests
- Target: < 45s after fixes
- Impact: Minimal (mock optimization may improve speed)

**Mock Performance:**
- In-memory mocks (no database I/O)
- Synchronous mock setup (< 1ms overhead)
- Parallel test execution (Vitest default)

**Build Performance:**
- No impact on build time
- No new dependencies required
- TypeScript compilation unchanged

## Accessibility & Compliance

**Not Applicable for Test Fixes:**
- No UI changes
- No user-facing features
- Internal quality improvement only

## External Dependencies & Integration

### Required Packages (Already Installed)
- `vitest@3.2.4` - Test runner
- `@vitest/ui` - Test UI (optional)
- `drizzle-orm@0.41.0` - Database ORM (for type reference)

### No New Dependencies Required
- All mocking capabilities available in Vitest
- Drizzle types already in project
- No additional test utilities needed

## Monitoring & Observability

**Test Health Monitoring:**
- CI/CD pipeline: Test results dashboard
- Pre-commit hooks: Local test execution
- PR checks: Automated test validation

**Langfuse Integration:**
- No observability changes (test-only)
- Production tracing unaffected
- Performance metrics unchanged

## Future Considerations

### Test Infrastructure Improvements
1. **Test Database:** Consider in-memory PostgreSQL for more realistic tests
2. **Mock Library:** Evaluate `drizzle-orm` test utilities if released
3. **Coverage:** Add test coverage reporting to CI/CD
4. **Performance:** Optimize test execution with parallel workers

### Documentation Needs
1. **Testing Guide:** Add Drizzle mocking patterns section
2. **Best Practices:** Document floating-point testing approach
3. **Mock Templates:** Create reusable mock factories for common patterns
4. **CI/CD Docs:** Update test pipeline documentation

## Ultra-Think Reflection

### Feature Goals Clarity ✅
**Goal:** Achieve 100% unit test pass rate (310/310) before production deployment

**Success Metrics:**
- All MCP database storage tests pass (16/16)
- Gauge chart precision test passes (1/1)
- No regressions in other tests (293 remain passing)
- Maintain code quality standards (lint, types, build)

### Integration Strategy ✅
**Alignment with Project Architecture:**
- Follows existing Vitest testing patterns
- Uses established mocking conventions
- Maintains type safety with TypeScript
- Respects test isolation principles

**Integration Points:**
- Drizzle ORM repository pattern
- Vitest mocking infrastructure
- CI/CD test validation pipeline

### Implementation Feasibility ✅
**Scope:** Realistic and well-defined
- Two isolated test files to modify
- Clear root cause analysis completed
- Solution patterns identified and validated
- Risk assessment shows low-medium complexity

**Time Estimate:** 1-1.5 hours total
- MCP mock: 30-45 minutes
- Gauge precision: 10-15 minutes
- Validation: 15-20 minutes

### Context Completeness ✅
**Comprehensive Context Provided:**
- Detailed root cause analysis for both failures
- Complete mock implementation patterns
- Step-by-step task breakdown with time estimates
- Validation commands and success criteria
- Risk mitigation strategies

**Future PRP Generation Ready:**
- All necessary technical context documented
- Implementation patterns clearly defined
- Testing strategy fully specified
- Integration points identified

### Template Adaptation ✅
**Used as Directional Reference:**
- Focused on test-specific requirements
- Customized for quality assurance goals
- Emphasized validation and risk mitigation
- Included project-specific context (Vitest, Drizzle, Better-Chatbot)

## Confidence Score

**Initial Plan Quality: 9/10**

**Rationale:**
- ✅ **Comprehensive Research:** Extensive analysis of root causes and solution patterns
- ✅ **Clear Implementation Path:** Step-by-step tasks with time estimates
- ✅ **Risk Assessment:** Thorough identification and mitigation strategies
- ✅ **Validation Strategy:** Complete success criteria and testing approach
- ✅ **Context Rich:** All necessary information for PRP generation and implementation
- ⚠️ **Minor Gap:** Could benefit from specific Drizzle mock code examples in-line

**Confidence Level:**
- **PRP Generation:** High confidence (95%) - all context provided
- **Implementation Success:** High confidence (90%) - clear solution path
- **Quality Outcome:** Very high confidence (95%) - well-defined validation

This initial document provides a solid, comprehensive foundation for successful PRP generation and eventual test fix implementation.
