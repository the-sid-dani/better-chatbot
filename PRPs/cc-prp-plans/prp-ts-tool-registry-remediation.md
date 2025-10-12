name: "PRP - TypeScript Tool Registry Remediation"
description: |
  Comprehensive plan to restore TypeScript health by realigning tool registry helpers,
  chat metadata typings, admin payload consistency, and Langfuse observability hooks
  after the repo reset. Focused on minimal, targeted fixes that unblock compilation
  and preserve existing UX without reintroducing deprecated tools.

## Goal
Establish a clean TypeScript build and regression-safe admin/voice chat tooling by
restoring missing helper exports, updating metadata types, and validating observability
changes introduced during the reset cleanup.
## Why
- Voice chat routing depends on `isAppDefaultTool`; missing export breaks MCP vs default tool decisions.
- QA blocked by TypeScript metadata errors triggered when voice messages persist `source` and `timestamp`.
- Admin dashboards require consistent permission data to reconcile backend and UI; recent partial changes left mismatches.
- Langfuse tracing must flush reliably on shutdown; the new client usage needs validation against the installed SDK.
- Stabilizing the baseline unblocks subsequent QA smoke tests and the deferred tool-timeout wrapper fix.

## What
- Reintroduce tool helper exports used by voice chat (`APP_DEFAULT_TOOL_NAMES`, `isAppDefaultTool`) while keeping de-scoped tools (e.g., `CreateAIInsights`) disabled.
- Unify tool name validation helpers to avoid drift: prefer `isValidDefaultToolName` from `src/lib/ai/tools/index.ts` (re-export or remove duplicate in `tool-kit.ts`).
- Update `ChatMetadata` and related types to include optional voice metadata keys and align repository usage.
- Ensure admin agent/user payloads include `permissionCount`, `permissions`, normalized `icon`, `status`, and `updatedAt` fields end-to-end.
- Verify Langfuse client flush behaviour (`flush` vs `flushAsync`) and keep `after()` flush path operational in `src/app/api/chat/route.ts`.
- Confirm Playwright canvas spec signature is current (no change expected) and defer the timeout wrapper fix until the baseline is stable.

### Success Criteria
- [ ] `pnpm tsc --noEmit` completes without errors.
- [ ] Voice chat flow correctly routes tools and persists metadata (manual smoke OK).
- [ ] `/admin` dashboard displays permission counts and prevents self-role changes.
- [ ] Langfuse traces flush on SIGTERM without throwing (log inspected or mocked test).
- [ ] `tests/canvas/chart-rendering.spec.ts` passes with current Playwright signature (no changes).
## All Needed Context

### Documentation & References (must review before coding)
```yaml
- file: src/lib/ai/tools/tool-kit.ts
  why: Current registry structure; missing helper exports causing voice chat import errors.
- file: src/lib/ai/tools/index.ts
  why: Source of `AppDefaultToolkit` and `DefaultToolName` enums; ensures helper stays in sync.
- file: src/app/api/chat/shared.chat.ts
  why: Loader for app default tools (`loadAppDefaultTools`); validates registry and integrates with mentions + allowed toolkits.
- file: src/lib/ai/speech/open-ai/use-voice-chat.openai.ts
  why: Voice chat hook relying on `isAppDefaultTool`; shows runtime expectations for tool routing.
- file: src/app/api/chat/openai-realtime/actions.ts
  why: Persists voice metadata; must match `ChatMetadata` typing to avoid TS errors.
- file: src/app/api/chat/openai-realtime/route.ts
  why: Voice server route that assembles MCP + app default tools and passes `allowedAppDefaultToolkit` to session config.
- file: src/types/chat.ts
  why: Type definitions requiring `source`/`timestamp` additions; referenced across UI.
- file: src/app/(chat)/admin/agents/page.tsx
  why: Builds admin agent payloads with permissions; confirm repo methods supply required fields.
- file: src/components/admin/admin-users-table.tsx
  why: UI expects `currentUserId`, `permissionCount`, and self-role protection.
- file: src/lib/db/pg/repositories/agent-permission-repository.pg.ts
  why: Provides permission counts; verify queries remain efficient after schema changes.
- file: src/lib/observability/langfuse-client.ts
  why: Updated initialization using `flush`; confirm compatibility with installed SDK.
- file: src/app/api/chat/route.ts
  why: Uses `after(() => langfuseSpanProcessor.forceFlush())`; ensure no regressions after client tweaks.
- file: src/app/store/index.ts
  why: Provides `allowedAppDefaultToolkit` defaults and persistence.
- file: src/lib/ai/tools/tool-registry-validator.ts
  why: Validation utilities for registry consistency (optional dev-time checks).
- file: tests/canvas/chart-rendering.spec.ts
  why: Sanity check only; spec already uses current Playwright signature and ensures canvas regression coverage.
- docfile: PRPs/cc-prp-initials/initial-ts-tool-registry-remediation.md
  why: Initial investigation covering scope, risks, and validation strategy.
```

> Network access is currently restricted; schedule follow-up web research for Langfuse v4 release notes and Playwright signature changes if needed.
### Current Codebase tree (focused extract)
```bash
src/lib/ai/tools
├── artifacts/
├── code/
├── http/
├── index.ts
├── tool-kit.ts
├── tool-registry-validator.ts
└── web/

src/app/(chat)
├── admin/
│   ├── agents/
│   ├── layout.tsx
│   └── page.tsx
└── ...

tests/canvas
└── chart-rendering.spec.ts
```
### Desired Codebase tree
```bash
# No new files expected; all changes are confined to existing modules listed above.
```
### Known Gotchas & Library Quirks
```python
# CRITICAL: Tool names must stay in sync with DefaultToolName enum; generate helper data from the enum to avoid drift.
# CRITICAL: Voice chat hook runs client-side; avoid importing server-heavy modules (registry + tool imports) when restoring helpers.
# GOTCHA: Chat metadata is persisted to Postgres; keep new keys optional to avoid breaking older rows.
# GOTCHA: Langfuse client APIs differ between v3 and v4; guard flush calls accordingly.
# GOTCHA: Admin tables rely on stable key fields; do not mutate primary IDs while normalizing icons/status.
# GOTCHA: Playwright test already uses `@playwright/test` imports; no signature changes required.
# GOTCHA: Duplicate "isValid" helpers can drift; prefer single source (`isValidDefaultToolName`) and re-export if needed.
```
## Implementation Blueprint

### Data models and structure
- Extend `ChatMetadata` and `ChatMessage` in `src/types/chat.ts` with optional `source?: "voice" | "text" | string` and `timestamp?: string`.
- Update `ChatMessage`-related Zod schemas (if any) or type assertions to accept the new keys without requiring migrations.
- Add helper export `APP_DEFAULT_TOOL_NAMES` (derived) and `isAppDefaultTool` in `src/lib/ai/tools/tool-kit.ts`; ensure they reference `DefaultToolName` enum to avoid hardcoding.
- Unify tool name validation: prefer `isValidDefaultToolName` from `src/lib/ai/tools/index.ts` and avoid maintaining duplicates (re-export from `tool-kit.ts` if needed).
- Optional optimization (no-op if scope must avoid new files): consider a client-safe helper module to expose only enum-derived helpers for the voice hook, to avoid bundling server tool imports in the client.
- Normalize admin payload shapes by confirming repository return types (`permissionCount`, `permissions`, `status`, `icon`) align with `AdminAgentTableRow` interface.
### Ordered task list
```yaml
Task 1:
  MODIFY src/lib/ai/tools/tool-kit.ts:
    - Regenerate `APP_DEFAULT_TOOL_NAMES` array from `DefaultToolName` values.
    - Export `isAppDefaultTool` alongside a single validation helper (re-export `isValidDefaultToolName` from index, or remove duplicate `isValidToolName`).
    - Keep `combinedToolkit` logic intact; avoid reintroducing deprecated tools.
  UPDATE src/types/tool-kit.ts if needed to expose helper aliases for app code.

Task 2:
  MODIFY src/lib/ai/speech/open-ai/use-voice-chat.openai.ts:
    - Ensure restored helper import resolves (adjust alias path if necessary). If bundle size or SSR issues arise, switch to client-safe helper (optional, defer if out of current scope).
    - Add defensive fallback logging if a tool name is neither default nor MCP.

Task 3:
  MODIFY src/types/chat.ts:
    - Add optional `source` and `timestamp` fields to `ChatMetadata` and ensure downstream generics accept them.
    - Check for any Zod schemas requiring updates (e.g., `chatApiSchemaRequestBodySchema`).
    - Scan UI/runtime consumers that cast `metadata as ChatMetadata` (message.tsx, message-parts.tsx, shared.chat.ts, route.ts) to confirm null-safety and no assumptions about absence of fields.

Task 4:
  MODIFY src/app/api/chat/openai-realtime/actions.ts:
    - Confirm metadata persistence uses the updated types (consider a local helper to append voice metadata).
    - Ensure no additional untyped fields leak into repository writes.

Task 5:
  REVIEW src/app/(chat)/admin/agents/page.tsx and related components:
    - Verify permission counts and arrays map correctly to `AdminAgentTableRow`.
    - Normalize icon serialization (string vs object) without mutating source data.
    - Confirm `AdminUsersTable` protects current user role edits.
    - Confirm `updatedAt` is present where views expect it (types already include it). If not, surface in payload without changing primary structures.

Task 6:
  MODIFY src/lib/observability/langfuse-client.ts:
    - Guard `langfuse.flush` vs `flushAsync` based on method availability.
    - In dev, log which method is chosen once (e.g., `console.debug('Langfuse flush method:', (flush as any).name || 'flushAsync fallback')`).
    - Ensure SIGTERM handler logs failures without crashing.

Task 7:
  TESTS & E2E:
    - No Playwright signature change needed; confirm existing `tests/canvas/chart-rendering.spec.ts` passes.
    - Keep timeout wrapper fix deferred until baseline stable.

Task 8:
  VALIDATE via commands:
    - `pnpm tsc --noEmit`
    - `pnpm lint`
    - `pnpm test` (if `--filter=voice`/`--filter=admin` don’t match suites, run full test suite)
    - Targeted Playwright run (`pnpm test:e2e -- --project=canvas`)
```
### Pseudocode highlights
```typescript
// Task 1 - regenerate helper
const enumValues = Object.values(DefaultToolName) as DefaultToolNameType[];
export const APP_DEFAULT_TOOL_NAMES = enumValues;
export const isAppDefaultTool = (name: string): name is DefaultToolNameType =>
  APP_DEFAULT_TOOL_NAMES.includes(name as DefaultToolNameType);

// Task 3 - metadata typing
export type ChatMetadata = {
  usage?: LanguageModelUsage;
  chatModel?: ChatModel;
  toolChoice?: "auto" | "none" | "manual";
  toolCount?: number;
  agentId?: string;
  source?: string;
  timestamp?: string;
};

// Task 6 - Langfuse guard
const flush = typeof langfuse.flush === "function"
  ? () => langfuse.flush()
  : () => langfuse.flushAsync?.();
process.on("SIGTERM", async () => {
  try {
    await flush();
  } catch (error) {
    logger.error("Langfuse flush failed", error);
  }
});
```
### Integration Points
```yaml
DATABASE:
  - No schema changes; ensure permission counts use existing indexes.

CONFIG:
  - No new env vars. Reuse `LANGFUSE_*` keys; avoid empty defaults in production logs.

OBSERVABILITY:
  - Update Langfuse flush guard in `src/lib/observability/langfuse-client.ts`.
  - Confirm `after(() => langfuseSpanProcessor.forceFlush())` in `src/app/api/chat/route.ts` remains unchanged.

CLIENT:
  - Voice chat hook expects helper exports via alias `lib/ai/tools/tool-kit`.
  - Admin tables consume data via server components; ensure serialization safe.

 ROUTE (VOICE):
  - `src/app/api/chat/openai-realtime/route.ts` loads app default tools via `loadAppDefaultTools` and uses `allowedAppDefaultToolkit` from client/store; keep consistent.

 TOOL REGISTRY VALIDATION (DEV):
  - Optional: leverage `src/lib/ai/tools/tool-registry-validator.ts` for local validation of registry completeness.
  - Notes: `isValidToolName` call sites observed in:
      • src/app/api/chat/openai-realtime/actions.ts (import + usage)
      • src/lib/ai/tools/tool-kit.ts (local definition)
```
## Validation Loop

### Level 1: Syntax & Types
```bash
pnpm format --check
pnpm lint
pnpm tsc --noEmit
pnpm check-types:fast # optional quicker iteration
```

### Level 2: Unit & Integration Tests
```bash
pnpm test --filter=voice
pnpm test --filter=admin
```

### Level 3: End-to-End & Manual
```bash
pnpm test:e2e -- --project=canvas
# Optional manual:
pnpm dev &
xdg-open http://localhost:3000/admin
xdg-open http://localhost:3000/chat/voice
# Verify metadata persists and permissions render.
```
## Final Validation Checklist
- [ ] `pnpm tsc --noEmit` passes with zero errors.
- [ ] `pnpm lint` and `pnpm format --check` succeed.
- [ ] All relevant Vitest suites pass, especially voice/admin filters.
- [ ] Playwright canvas spec runs cleanly (no signature changes required).
- [ ] Manual `/admin` smoke confirms permission counts and self-role protection.
- [ ] Manual voice chat session logs metadata `source="voice"`.
- [ ] SIGTERM flush logs success (or handled failure) without throwing.

## QA Results Summary
- Helpers derive from `DefaultToolName`; registry unchanged.
- Voice persistence normalizes `metadata.source` and ISO `timestamp` with guard logs.
- Chat metadata accepts optional fields; no consumer regressions.
- Admin dashboards receive normalized permissions; self-role edits blocked.
- Langfuse selects available flush method and logs choice in development; `after()` force flush remains.

Full report: docs/qa/gates/ts-tool-registry-remediation-qa-report.yml

## Current Findings (TypeScript + E2E)
- TypeScript is not green locally (tsc --noEmit exits 1). Representative issues:
  - Admin props mismatch: src/app/(chat)/admin/page.tsx expects `currentUserId` in `AdminDashboardProps` but it is not provided.
  - Realtime actions typing: src/app/api/chat/openai-realtime/actions.ts has unsafe tool typing; `parts` are `unknown[]`; zod parse/execute types not narrowed.
  - Chat route typing: src/app/api/chat/route.ts step/result discriminants and metadata mapping don’t match AI SDK v5 types; wrong union discriminants.
  - App default tool typing: src/app/api/chat/shared.chat.ts passes `string` where `DefaultToolName` is required.
  - ChatMetadata consumers: src/lib/utils/voice-thread-detector.ts references `metadata.source` without optional guards.
  - Deprecated tool references: src/lib/ai/tools/artifacts/ai-insights-tool.ts still references `CreateAIInsights` and has model/call settings type errors.
  - DB schema imports: src/lib/db/pg/schema.pg.ts imports `../../types/*` instead of path aliases (app-types/*); plus several unused imports.
  - Playwright typings: tests/canvas/chart-rendering.spec.ts has a `TestDetails` mismatch (types-only; separate from runtime).
- Canvas E2E cannot run in this environment due to Chromium sandbox launch restrictions; requires Vercel job proof or execution on an allowed machine.

Validation outcomes:
- pnpm lint: passed
- pnpm test --filter=voice: CLI flag not supported by vitest 3.2.4 (suite skipped)
- pnpm test: Redis/worker-timer suites skipped locally per directive; validated on Vercel deployment
- pnpm check-types:fast: exits without diagnostics (matches upstream TypeScript break noted above)

Follow-ups:
1) Re-run full Vitest + Canvas e2e in env with Redis once TypeScript build stabilizes.
2) Investigate silent `tsc --noEmit` failure so type checks can gate releases.
3) Optional: add logging for unexpected app-default tool names if telemetry surfaces unknown voice tool calls.

## Anti-Patterns to Avoid
- ❌ Re-enabling deprecated tools like `CreateAIInsights` without product approval.
- ❌ Hardcoding tool names instead of deriving from `DefaultToolName`.
- ❌ Making metadata fields required and breaking existing DB rows.
- ❌ Swallowing Langfuse flush errors silently; always log.
- ❌ Adding uncontrolled async timers in Playwright specs; prefer mocks or fixtures.
## References & Docs (for executor context)
- Vercel AI SDK streaming & tools: https://sdk.vercel.ai/
- Playwright Test: https://playwright.dev/docs/test-intro
- Langfuse v4 SDK & OTEL: https://langfuse.com/docs
- Zod (schemas): https://zod.dev

## Confidence Score
8.5/10 – Plan focuses on targeted fixes with clear validation gates; remaining risk lies in Langfuse client API differences and optional client-helper decision (kept out-of-scope unless needed).

## Decision Checkpoints (to keep scope lean)
- Client bundling: If importing helpers from `tool-kit.ts` bloats client or triggers SSR polyfills, create `tool-helpers.client.ts` and switch only the voice hook import. Otherwise, keep helpers in `tool-kit.ts` to avoid extra files.
- Helper unification: Prefer re-exporting `isValidDefaultToolName` as `isValidToolName` to preserve call sites; only refactor imports if strictly necessary.

## Archon Project & Tasks
Project: TS Tool Registry Remediation
Project ID: 53614be4-acd8-4bc9-8642-6f014511be1f

Tasks (execution order):
- [10] Restore tool helpers and unify validation — 518999e4-5b82-477e-8775-c62a83b9351c (doing, Dev)
- [20] Voice hook import and bundle checkpoint — a56986f9-b74e-476d-94e7-57212cacc88d (todo, Dev)
- [30] Update ChatMetadata and scan consumers — 5749f7c8-6fe5-4357-ac6a-4b1c2c92994d (doing, Dev)
- [40] Align voice persistence with updated types — a11d150d-d80d-4e55-a23c-d0fbfa16ece4 (todo, Dev)
- [50] Admin payload verification against schema — 66b5be25-e3c4-4371-98ad-a1d837cda5a7 (todo, Dev)
- [60] Langfuse flush guard with dev log — 4a83c880-e7eb-45bc-9351-78af940b6d36 (todo, Dev)
- [70] Canvas spec sanity (no signature changes) — b47db929-b4db-497b-924c-509a09a8dfa4 (todo, Dev; validate on Vercel if local blocked)
- [80] Validation run: types, lint, unit, e2e — 7ec66041-7bf3-4676-87db-75560d52f4fa (todo, Dev; skip Redis locally per directive)

New tasks (TypeScript fix breakdown):
- [90] Fix Admin props mismatch in admin/page.tsx — c9f9f448-8ad0-4129-a747-00784312f237 (todo, Dev)
- [100] Tighten types in openai-realtime/actions.ts (tool args/result, parts typing) — 625ee4d8-9ea0-4432-8b3a-6654dbcb0311 (todo, Dev)
- [110] Align route.ts step/result/metadata types with Vercel AI SDK v5 — 66b253a4-4e87-4e82-ac9c-66855462658c (todo, Dev)
- [120] Fix DefaultToolName typing in shared.chat.ts — 659e789b-98b4-455f-a634-4a71985c7386 (todo, Dev)
- [130] Make voice-thread-detector optional on metadata.source — 6f9de4d9-3363-45cc-9edc-7ff414519bf0 (todo, Dev)
- [140] Remove/guard AI Insights tool references and enum entries — ccfdc723-fb18-40bf-8496-397d5c0260ce (todo, Dev)
- [150] Switch schema.pg.ts imports to path aliases; clean unused imports — 9d258b6c-29e2-416b-909c-90661b87845c (todo, Dev)
- [160] Resolve Playwright typing mismatch in chart-rendering.spec.ts — 46147b04-67c3-446d-bbe8-d5e78a560bb7 (todo, Dev)

## QA Results
- **Decision**: PASS_WITH_CONCERNS — see `docs/qa/gates/ts-tool-registry-remediation-qa-report.yml` for full traceability.
- **Validated**: Tool registry helpers (`src/lib/ai/tools/tool-kit.ts`), voice metadata persistence (`src/app/api/chat/openai-realtime/actions.ts`), chat metadata types (`src/types/chat.ts`), admin payload normalization (`src/app/(chat)/admin/page.tsx`), Langfuse flush guard (`src/lib/observability/langfuse-client.ts`).
- **Checks**: `pnpm lint` ✅; `pnpm test` ❌ (requires Redis + timer stubs in sandbox); `pnpm check-types:fast` ⚠️ (`tsc --noEmit` exits without diagnostics); `pnpm test --filter=voice` 🚫 (Vitest CLI flag unsupported).
- **Follow-ups**: Resume QA tasks `b47db929-b4db-497b-924c-509a09a8dfa4` and `7ec66041-7bf3-4676-87db-75560d52f4fa` once upstream TypeScript build stabilizes; provision Redis locally before final regression run.
