# Testing: where tests live and what to test

The harness is **Vitest** in `apps/web` (`vitest.config.mts`, `jsdom`, `@testing-library/react` + `jest-dom`, `@/*` aliases via `vite-tsconfig-paths`). Run with `pnpm test` (`vitest run`) or `pnpm test:watch`; it is wired into Turbo as `turbo run test`. Folder buckets are defined in [architecture.md](architecture.md); the data/IO layer in [backend.md](backend.md).

## Where tests live

- **Colocate.** A test sits **next to the file it tests**, same folder, same basename + `.test.ts`: `get-animal.test.ts` beside `get-animal.ts`, `compute-course-progress.test.ts` beside `compute-course-progress.ts`.
- One test file per unit. If a `_services/` file exports one function, its test file tests that function.

## What to test (current scope)

Keep the surface small and high-value. **Test only pure / dependency-light functions in `_services/` and `_helpers/`.** Nothing else for now.

- **`_helpers/` (pure)** — formatters, label maps, calculators, slug generators, pure predicates. These take inputs and return outputs with no IO, so they are the cheapest and highest-value tests. Prefer testing here.
- **`_services/` (dependency-injected)** — a service that takes its dependencies as explicit parameters (e.g. `prisma`, a content-root path) is testable by passing a fake/fixture. Test it through that seam: `assertCourseAccess(course, orgId, prisma)` with a fake whose `*.findFirst` returns null vs an active row. The DI patterns to mirror are `resolvePlan` / `checkFeatureAccess` under `src/server/auth/subscription/`, which already take `prisma` as a parameter.

**Out of scope for now** (do not write tests for these yet): React components and client components, container hooks (`use-*.ts`), tRPC routers/procedures, and any `_services/` function that reaches a singleton (`prisma` imported directly, `next/headers`, `auth.api.*`) instead of receiving its deps. If a piece of logic is worth testing but is trapped behind one of these, extract it down into a pure `_helpers/` function or a dependency-injected `_services/` function and test it there.

## What makes a good test

- Test **external behavior at the highest seam** — feed data in, assert data out. Never assert on internals or implementation details.
- **No mocking of internals.** Inject dependencies as plain fakes/fixtures through the function's parameters; don't reach for module mocks.
- Cover the meaningful states (empty / partial / full, allowed / denied, present / missing), not just the happy path.
