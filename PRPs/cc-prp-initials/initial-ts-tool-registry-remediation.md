## Feature: TypeScript Tool Registry Remediation & Admin Payload Consistency

### Feature Purpose & Core Components
- Restore a clean TypeScript build by reconciling tool registry exports, chat metadata typings, and observability hooks broken in the recent reset to `origin/main`.
- Ensure voice chat tooling (`src/app/api/chat/openai-realtime/actions.ts`, `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`) and default tool registry (`src/lib/ai/tools/tool-kit.ts`) remain aligned without reintroducing `CreateAIInsights`.
- Deliver consistent admin payloads for agents and users, guaranteeing UI components render `permissionCount`, `permissions`, `status`, and `updatedAt` fields.
- Confirm Langfuse instrumentation changes (`src/lib/observability/langfuse-client.ts`, `src/app/api/chat/route.ts`) comply with the currently installed SDK and retain graceful shutdown flushing.
- Keep Playwright canvas coverage (`tests/canvas/chart-rendering.spec.ts`) in sync with the modern test signature before reapplying timeout wrapper fixes.
### Current State Assessment
- `src/lib/ai/tools/tool-kit.ts` dropped `APP_DEFAULT_TOOL_NAMES` and `isAppDefaultTool`, breaking imports in `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` and risking tool-routing regressions.
- `ChatMetadata` (`src/types/chat.ts`) lacks `source` and `timestamp`, yet `persistVoiceMessageAction` now persists those keys, producing TS errors.
- Admin pages (`src/app/(chat)/admin/**/*.tsx`) and supporting components expect enriched agent/user payloads; repositories must populate `permissionCount`, `permissions`, normalized icons, and `updatedAt` fields reliably.
- Langfuse client refactor removed configuration fields and switched to `langfuse.flush()`. Need to verify SDK compatibility and ensure `after()` flush in chat route remains sufficient without `langfuse` import.
- Playwright spec (`tests/canvas/chart-rendering.spec.ts`) is outdated versus the current test runner signature; timeout wrapper regressions remain unresolved pending a stable baseline.
### Architecture Integration Strategy
- **Tool Registry**: Reintroduce `APP_DEFAULT_TOOL_NAMES`/`isAppDefaultTool` alongside `isValidToolName` so voice chat continues to differentiate default vs MCP tools. Keep helper auto-derived from `DefaultToolName` to minimize drift.
- **Chat Metadata**: Extend `ChatMetadata`/`ChatMessage` typings with optional `source`, `timestamp`, and future-proof voice metadata. Confirm repositories (`pgChatRepository`) and UI consumers tolerate the enriched shape.
- **Admin Data Layer**: Ensure `pgAgentRepository` + `pgAgentPermissionRepository` provide permission arrays and counts to match UI expectations. Verify `UserSchema` queries include `updatedAt` and maintain pagination limits.
- **Observability**: Validate `@langfuse/client` version supports `flush()`; if not, guard with feature detection or revert to `flushAsync`. Confirm `langfuseSpanProcessor.forceFlush()` still triggers despite removing direct `langfuse` import from `route.ts`.
- **Testing**: Align Playwright spec with latest fixtures, then restore tool-timeout wrapper fix to avoid leaking timers in tests or production streaming flows.
### Implementation Blueprint
1. **Baseline Compilation**: Run `pnpm tsc --noEmit` to snapshot current diagnostics; track errors tied to metadata and missing exports.
2. **Tool Helper Restoration**: Recreate helper + export in `src/lib/ai/tools/tool-kit.ts`, update unit tests if present, and ensure tree-shaking safe default export shape.
3. **Voice Chat Validation**: Adjust `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts` to use restored helper; add guard rails for unknown tool names.
4. **Metadata Typing Update**: Expand `ChatMetadata` and downstream types; audit repository/consumer access to confirm optional usage, then rerun TypeScript.
5. **Admin Payload Audit**: Confirm repository methods and UI components handle `permissionCount`, `permissions`, `status`, normalized `icon`, and self-role guard. Add deterministic tests under `tests/admin/*` if missing.
6. **Langfuse Compatibility**: Inspect installed `@langfuse/client` version, adjust client initialization accordingly, and verify `after()` flush path logs success/failure.
7. **Playwright Alignment**: Update `tests/canvas/chart-rendering.spec.ts` to current fixture signature; ensure any TODO for timeout wrapper references latest helper.
8. **Timeout Wrapper Fix**: Once baseline stable, reapply timer cleanup patch with regression coverage (unit or integration) to avoid hanging timers.
9. **Validation Suite**: Execute `pnpm check`, `pnpm test`, and targeted Playwright spec; document outcomes for QA handoff.
### File & Module Inventory
- `src/lib/ai/tools/index.ts`, `src/lib/ai/tools/tool-kit.ts`
- `src/lib/ai/speech/open-ai/use-voice-chat.openai.ts`
- `src/app/api/chat/openai-realtime/actions.ts`
- `src/types/chat.ts`, `src/types/tool-kit.ts`
- `src/app/(chat)/admin/page.tsx`, `src/app/(chat)/admin/agents/page.tsx`
- `src/components/admin/admin-users-table.tsx`, `admin-users-list.tsx`, `agent-permission-dropdown.tsx`
- `src/lib/db/pg/repositories/agent-permission-repository.pg.ts`, `agent-repository.pg.ts`
- `src/lib/observability/langfuse-client.ts`, `src/app/api/chat/route.ts`
- `tests/canvas/chart-rendering.spec.ts`
### Risks & Mitigations
- **Registry Drift**: Enumerated tool list may diverge again; generate helper from `DefaultToolName` enum and add dev-time assertions.
- **Metadata Consumers**: Downstream UI or analytics code might assume `metadata` shape; search for `metadata.source` usages and add null guards.
- **Langfuse API Changes**: If `flush()` unsupported, wrap call in `if (typeof langfuse.flush === "function")` fallback to `flushAsync`.
- **Performance Regression**: Additional permission queries could impact admin load times; consider batching or caching where necessary.
- **Test Instability**: Playwright and timeout wrapper changes can introduce flaky async behavior; use deterministic mocks and ensure timers cleared in `afterEach`.

### Validation Plan
- `pnpm tsc --noEmit`
- `pnpm lint`
- `pnpm format --check`
- `pnpm test`
- `pnpm test:e2e -- --project=canvas` (or targeted spec once updated)
- Manual smoke of `/admin` and voice chat flow in staging after QA sign-off.
### Research Notes & External References
- Network access is restricted in this environment; schedule follow-up research for Langfuse v4+ release notes and Vercel AI SDK streaming best practices.
- Review existing PRPs (`initial-voice-chat-fixes.md`, `initial-typescript-build-performance-crisis.md`) for historical context and previously agreed validation steps.

### Outstanding Questions
- Do we need to re-enable any previously disabled tools (e.g., `CreateAIInsights`) as part of this cycle, or should they remain out of registry?
- Are there admin analytics endpoints consuming the new permission fields that require contract updates?
- Should we add database indexes to support the new permission counting path if load tests flag regressions?

### Confidence Score
- **7/10** – plan covers identified regressions and aligns with existing project patterns; pending confirmation of Langfuse SDK capabilities and any undiscovered downstream consumers.
