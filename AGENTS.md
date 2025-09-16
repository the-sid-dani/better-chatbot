# Repository Guidelines

## Project Structure & Module Organization
The Next.js app lives under `src/app` with route handlers and layouts. Reusable UI is in `src/components`, stateful logic in `src/hooks`, shared utilities and data access in `src/lib`, and domain types in `src/types`. The custom MCP integration resides in `custom-mcp-server`. Tests mirror runtime modules under `tests/` with unit specs and scenario suites grouped by domain. Static assets, translations, and environment helpers live in `public/`, `src/i18n/`, and `scripts/` respectively, while container recipes and compose files sit under `docker/`.

## Build, Test, and Development Commands
Use `pnpm dev` (or `pnpm dev:https`) to launch the Turbopack dev server on localhost:3000. Run `pnpm build` followed by `pnpm start` to verify the production bundle. `pnpm lint`, `pnpm format`, and `pnpm check-types` keep the codebase consistent; prefer `pnpm check` before opening a PR. `pnpm test` executes Vitest suites, while `pnpm test:e2e` runs Playwright end-to-end flows—add the `:watch` or `:ui` variants during active development. Database workflows rely on Drizzle scripts such as `pnpm db:generate` (emit migrations) and `pnpm db:migrate` (apply schema updates).

## Coding Style & Naming Conventions
TypeScript + React components should remain functional and hook-driven; keep files under `src/app` server-first unless explicitly marked `"use client"`. Biome enforces two-space indentation, double quotes, 80-character wraps, and sorted imports—always run `pnpm format` when touching JS/TS. Follow project naming conventions: PascalCase for components, camelCase for variables and functions, kebab-case for filenames, and suffix hooks with `use`. Linting forbids `var`, unused variables, and missing const usage; resolve all warnings before pushing.

## Testing Guidelines
Place Vitest specs alongside related folders under `tests/**` using `.spec.ts` filenames (for example, `tests/core/unauthenticated.spec.ts`). Mock external services with the helpers under `tests/utils` to keep suites deterministic. Add regression coverage for every bugfix and ensure new features include both unit coverage and relevant Playwright journeys. Run `pnpm test` and `pnpm test:e2e` locally; note unusual failures or skipped cases in your PR description.

## Commit & Pull Request Guidelines
Adopt the conventional prefixes observed in `git log` (e.g., `fix:`, `feat:`, `chore:`) and keep messages imperative and scoped. Group related changes into coherent commits, referencing issues or modules for clarity. Pull requests must summarize the change set, list validation steps (commands run, screenshots for UI), and link any related tickets. Request review only after `pnpm check` passes and call out migrations, env variables, or other breaking considerations early in the PR body.
