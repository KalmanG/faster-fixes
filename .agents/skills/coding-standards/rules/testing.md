# Testing: where tests live and what to test

The harness is **Vitest** in `apps/web`. The config is a `.ts` file (`vitest.config.ts`) and stays deliberately small:

- `environment: "node"`. There is no browser environment, in line with the scope below.
- `resolve.tsconfigPaths: true`, so `@/*` imports resolve through Vite's native tsconfig paths support. No extra resolver plugin.
- `process.env.TZ = "UTC"`, set at the top of the config module so date assertions resolve the same way on every machine and in CI.
- `include: ["src/**/*.test.{ts,tsx}"]` with `passWithNoTests: true`.

Run with `pnpm test` (`vitest run`) or `pnpm test:watch`; it is wired into Turbo as `turbo run test`. Folder buckets are defined in [architecture.md](architecture.md); the data/IO layer in [backend.md](backend.md).

The reference test to copy the shape of is `src/utils/crypto/token-cipher.test.ts`: named cases, one behavior per `it`, environment read through `vi.stubEnv` and cleaned up in `afterEach`.

## Where tests live

- **Colocate.** A test sits **next to the file it tests**, same folder, same basename + `.test.ts`: `token-cipher.test.ts` beside `token-cipher.ts`.
- One test file per unit. If a `_services/` file exports one function, its test file tests that function.

## What to test (current scope)

Keep the surface small and high-value. **Test only pure `_helpers/` functions and dependency-injected `_services/` functions.** Nothing else for now.

- **`_helpers/` (pure)**: formatters, label maps, calculators, slug generators, pure predicates. These take inputs and return outputs with no IO, so they are the cheapest and highest-value tests. Prefer testing here.
- **`_services/` (dependency-injected)**: a service that takes its dependencies as explicit parameters (for example `prisma`) is testable by passing a fake or fixture. Test it through that seam. The DI pattern to mirror is `checkFeatureAccess(organizationId, feature, prisma)` under `src/server/auth/subscription/`, which takes `prisma` as a parameter and can be driven with a fake whose `*.findFirst` returns null or an active row.

**Out of scope for now** (do not write tests for these yet): React components and client components, container hooks (`use-*.ts`), tRPC routers and procedures, and any `_services/` function that reaches a singleton (`prisma` imported directly, `next/headers`, `auth.api.*`) instead of receiving its deps. If a piece of logic is worth testing but is trapped behind one of these, extract it down into a pure `_helpers/` function or a dependency-injected `_services/` function and test it there.

Because component tests are out of scope, the harness carries no DOM tooling. `jsdom` and `@testing-library/react` are added the day the first component test exists, not before.

## What makes a good test

- Test **external behavior at the highest seam**, feed data in, assert data out. Never assert on internals or implementation details.
- **No mocking of internals.** Inject dependencies as plain fakes or fixtures through the function's parameters; don't reach for module mocks.
- Cover the meaningful states (empty / partial / full, allowed / denied, present / missing), not just the happy path.
