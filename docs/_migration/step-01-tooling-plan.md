# Step 1: Tooling. Implementation plan

> Finish the tooling to 100 percent so that steps 2 to 5 are measurable. No application code moves. The only code edits are lint hygiene fixes required to get `pnpm lint` green.

Reference: `docs/architecture/migration-kit/01-tooling.md` (end state) and `docs/architecture/target-architecture.md`.

## Decisions taken during planning

| #   | Decision                                                                                                                                                                                                  | Why                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scope is tooling only. Step 2 (domain folders) gets its own plan and session.                                                                                                                             | Tooling makes the later steps verifiable. A pure tooling change is reviewable in minutes.                                                    |
| 2   | Architecture docs and the kit are open to amendment. Amendments land in this step.                                                                                                                        | Every later step reads these docs. A defect found now costs less than the same defect rediscovered in step 3.                                |
| 3   | Work happens on `dev`, one Commitizen commit per concern.                                                                                                                                                 | Owner's choice. No long-lived migration branch.                                                                                              |
| 4   | Fix `pnpm lint`: ignore `.next/**`, `.source/**`, `next-env.d.ts` in the shared config and drop `eslint-plugin-only-warn`. Fix the remaining base hygiene errors in `src/` in a dedicated commit.         | `only-warn` makes the always-on `error` rules impossible. The shared definition of done requires `pnpm lint` green.                          |
| 5   | `lint:agent-rules` drops `--max-warnings 0` for the duration of the migration. Errors fail the command, warnings are the progress metric. `--max-warnings 0` returns at the end of step 4.                | A command that is always red is never read. The signal must be "error means a regression on a locked scope".                                 |
| 6   | The 13 rules and their tests are copied from Tobalgo. The 5 rules already present are overwritten by the Tobalgo versions.                                                                                | Proven and tested there. The local `require-trpc-output-type` is a pre-migration variant keyed on `*.trpc.query.ts`.                         |
| 7   | Transition globs: `no-default-export` and `require-use-client-suffix` run on both `_features/**` and `_domains/**` until step 2 removes the first. `require-use-client-suffix` extends to all of `src/`.  | Keeps the existing signal (11 warnings). A naming convention that only holds in one folder is half a convention.                             |
| 8   | Test harness stays `environment: node`, no testing-library, `TZ=UTC` pinned, `vitest.config.ts` kept, native `resolve.tsconfigPaths` kept. Docs amended to match.                                         | The target says components and hooks are out of scope for tests. jsdom lands the day a component test exists.                                |
| 9   | lint-staged runs plain `eslint --max-warnings 0` on staged `ts,tsx,js,jsx`, not the agent-gated set.                                                                                                      | The agent set would force a full migration of any legacy file touched by a hotfix and push people to bypass the hook.                        |
| 10  | `SKILL.md` gains a "Migration in progress" section pointing at `docs/_migration/`, removed when the migration ends.                                                                                       | The rule files describe the target as if it existed. Without the note, an agent mixes conventions inside a scope that has not been migrated. |
| 11  | `target-architecture.md` becomes the Faster Fixes architecture doc: `[Tobalgo]` markers and section become `[Faster Fixes]`. The kit stays committed as working input; the owner deletes it at the end.   | The doc every agent reads must describe this repo.                                                                                           |
| 12  | Glossary terms for the future domains (Organization, User, Member, Invitation, Subscription, Plan, Auth) are added at the start of step 2, not now.                                                       | Naming domains is the heart of step 2.                                                                                                       |
| 13  | Small fixes bundled: `pnpm test` added to required checks, dead glossary link fixed, Vitest in `packages/eslint-config`, `no-throw-literal` on, ADR links repointed to the kit, ramp constants per group. | Kit requirements or plain defects.                                                                                                           |

## Prerequisites (owner)

1. Paste the Tobalgo files into the repo, uncommitted, under `_incoming/` at the repo root:
   - `packages/eslint-config/local-rules/` (every `*.js`, `*.test.js`, `index.js`)
   - `packages/eslint-config/next.js` and `package.json`
   - `apps/web/vitest.config.mts` and its setup file, for comparison only
2. Delete `/.eslintrc.js` (root). It extends `@workspace/eslint-config/library.js`, which does not exist. Agents do not delete files.

## Commits, in order

Each commit is one concern and must leave `pnpm typecheck`, `pnpm lint`, `pnpm test` green from its own point on, except commit 1 which is green only together with commit 2.

### 1. `chore(lint): ignore generated folders and make severities explicit`

`packages/eslint-config/`:

- `next.js`: add `{ ignores: [".next/**", ".source/**", "next-env.d.ts"] }`. Keep `dist/**` from `base.js`.
- `base.js`: remove the `onlyWarn` plugin block and the `eslint-plugin-only-warn` dependency in `package.json`.
- Verify with `cd apps/web && npx eslint . --format json` that the problem count drops from ~107k to the `src/` count and that severities now reflect the presets.

### 2. `fix(web): resolve base lint errors`

The only application code edits in this step. Current inventory on `src/` (after commit 1 these become errors):

| Rule                                 | Count | Fix                                                                                    |
| ------------------------------------ | ----- | -------------------------------------------------------------------------------------- |
| `turbo/no-undeclared-env-vars`       | 20    | Declare the variables in `turbo.json` (`globalEnv` or per-task `env`). No code change. |
| `@typescript-eslint/no-unused-vars`  | 14    | Remove the unused binding, or prefix with `_` if the preset allows it.                 |
| `@typescript-eslint/no-explicit-any` | 11    | Type the value. Use `unknown` plus narrowing when the shape is genuinely open.         |
| `@next/next/no-img-element`          | 2     | Keep `<img>` only with an inline eslint-disable and a one-line reason, or use `Image`. |
| `react/no-unescaped-entities`        | 1     | Escape the character.                                                                  |
| `react-hooks/exhaustive-deps`        | 1     | Fix the dependency list or extract the value.                                          |
| `@next/next/no-html-link-for-pages`  | 1     | Use `Link`.                                                                            |

Run `cd apps/web && npx eslint src --format json | jq` to get the exact file list before editing. Behaviour must not change.

### 3. `chore(lint): adopt the convention rules at warn behind the agent gate`

`packages/eslint-config/local-rules/`:

- Copy the Tobalgo `*.js` and `*.test.js` for all 13 rules, overwriting the 5 present. Drop `no-deprecated-error-imports.js` if it comes along. Keep `no-raw-tailwind-colors.js` with the current `allowPatterns` and `ignorePathPatterns` options.
- `index.js` exports the 13 rules under `local/`.

`packages/eslint-config/package.json`:

- Add `vitest` to `devDependencies` and scripts `"test": "vitest run"`, `"test:watch": "vitest"`.
- The Turbo `test` task already exists, so `pnpm test` at the root picks the rule tests up.

`packages/eslint-config/next.js` wiring. One constant per ramp:

```js
const enableAgentRules = process.env.ESLINT_AGENT_RULES === "1";
const agent = enableAgentRules ? "warn" : "off";
const servicesRulesSeverity = agent; // step 3 flips to "error" per migrated scope
const domainRulesSeverity = agent; // step 2 flips to "error" per migrated domain
```

| Rule                                | Files                                                     | Severity                                        |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| `services-verb-prefix`              | `**/_services/**/*.{ts,tsx}`                              | `servicesRulesSeverity`                         |
| `services-no-trpc-import`           | `**/_services/**/*.{ts,tsx}`                              | `servicesRulesSeverity`                         |
| `require-trpc-output-type`          | `**/_services/**/*.{ts,tsx}`                              | `servicesRulesSeverity`                         |
| `services-no-bare-error`            | `**/_services/**/*.{ts,tsx}`                              | `servicesRulesSeverity` (always-on in step 4)   |
| `no-client-import-of-services`      | `**/*.{ts,tsx}`                                           | `agent`                                         |
| `no-client-import-of-server-errors` | `**/*.{ts,tsx}`                                           | `off` until step 3 creates `src/server/errors/` |
| `no-feature-nesting`                | `**/_features/**/*.{ts,tsx}`                              | `agent`                                         |
| `schema-must-be-pure-zod`           | `**/*.schema.ts`                                          | `agent`                                         |
| `require-schema-conventions`        | `**/*.schema.ts`                                          | `agent`                                         |
| `no-cross-domain-deep-import`       | `**/src/app/_domains/**/*.{ts,tsx}`                       | `error`, always on                              |
| `no-default-export`                 | `**/src/app/_domains/**`, `**/src/app/_features/**`       | `domainRulesSeverity`                           |
| `require-use-client-suffix`         | `**/src/**/*.{ts,tsx}` with the Next special-file ignores | `agent`                                         |
| `require-server-action-suffix`      | `**/*.{ts,tsx}`                                           | `error`, always on                              |
| `no-throw-literal` (built-in)       | all                                                       | `error`, always on                              |
| `no-raw-tailwind-colors`            | all, current options                                      | `agent`                                         |

The `_features/**` glob on `no-default-export` is a transition entry, removed in step 2. Note it with a comment.

Verify: `pnpm --filter @workspace/eslint-config test` passes. `pnpm lint` still green (agent rules off). `ESLINT_AGENT_RULES=1 npx eslint src --format json` runs without a rule crashing.

### 4. `chore(tooling): lint staged files and report agent rules as warnings`

- `apps/web/package.json`: `"lint:agent-rules": "ESLINT_AGENT_RULES=1 eslint ."` (no `--max-warnings 0` during the migration; a comment in `docs/_migration/README.md` records when it returns).
- `.lintstagedrc`: add `"*.{ts,tsx,js,jsx}": "eslint --max-warnings 0"` next to the Prettier entry. The hook keeps `pnpm typecheck` and `pnpm test`.

### 5. `test(web): pin TZ to UTC in the vitest config`

- `apps/web/vitest.config.ts`: `process.env.TZ = "UTC"` at the top of the config module. Nothing else changes.

### 6. `docs(skills): adapt coding-standards to Faster Fixes`

`.agents/skills/coding-standards/`:

- `SKILL.md:3, 6`: "Tobalgo" becomes "Faster Fixes". Add the "Migration in progress" section: link to `docs/_migration/README.md`; new code follows the target; inside a scope not yet migrated, follow the folder's existing conventions and do not mix; remove this section when the migration ends.
- `rules/frontend.md:130-132`: replace the French tutoiement and accented-characters lines with the project rule: English, professional, no exclamation marks, no em dash (keep line 131).
- `rules/typescript.md:22`: "French is only for user-facing strings" becomes "user-facing strings are English; identifiers, comments, filenames and schemas are English".
- `rules/errors.md:7`: drop the `safe-action` branch. `rules/errors.md:11, 19`: French copy becomes the English generic message used by the tRPC `errorFormatter` once step 4 lands (write it as "the generic masked message" until then).
- `rules/backend.md:63`: remove the `unstable_cache` and `cacheTags` rule (zero usage in this repo).
- `rules/architecture.md:3`, `rules/backend.md:3`, `rules/errors.md:3`: ADR links point at `docs/architecture/migration-kit/adrs/{app-folder-architecture,server-file-conventions,domain-errors-and-transport-mapping}.md` until steps 2 to 4 commit them under `docs/adr/`.
- `rules/testing.md:3, 12, 15`: describe the real harness (`vitest.config.ts`, `environment: node`, aliases via Vite's `resolve.tsconfigPaths`, `TZ=UTC`, colocated `*.test.ts`); scope stays "pure `_helpers/` and dependency-injected `_services/`"; replace the Tobalgo examples with `src/utils/crypto/token-cipher.test.ts` as the current reference test.
- Grep the folder for `Kilpi`, `safe-action`, `tutoiement`, `unstable_cache`, `Tobalgo`, `docs/adr/00` afterwards: zero hits.

### 7. `docs(agents): list every required check and fix the glossary link`

`AGENTS.md`:

- Required checks: add `pnpm test`.
- Replace `docs/product/ubiquitous-language.md` with `CONTEXT.md`.
- Mention that `pnpm lint:agent-rules` reports warnings and must have zero errors.

### 8. `docs(architecture): make the target architecture the Faster Fixes doc`

`docs/architecture/target-architecture.md`:

- "How to read": the third class becomes **Faster Fixes-specific** `[Faster Fixes]`.
- "Packages": the `[Tobalgo]` line becomes the published `@fasterfixes/*` packages (widget-core, widget-react, mcp) under the published-package amendment.
- "Enforcement" table: drop `no-deprecated-error-imports`; `require-use-client-suffix` scope becomes `src/**`.
- "Testing": describe the node harness; state that jsdom is added only when a component test exists.
- "Tobalgo-specific, not exported" becomes "Faster Fixes-specific": Inngest present, no Kilpi, no `next-safe-action`, no cache tags, English UI copy, `no-throw-literal` and the published packages.
- Any remaining "Tobalgo" mention is rewritten.

`docs/architecture/migration-kit/01-tooling.md`: amend the `lint:agent-rules` script (no `--max-warnings 0` during migration), the harness (node, `.ts` config), and add the transition globs. `README.md` of the kit: leave "Files to copy from Tobalgo" as is; it is provenance.

### 9. `docs(adr): renumber the duplicate 0001 and complete the index`

- `git mv docs/adr/0001-diagnostic-trail-capture.md docs/adr/0009-diagnostic-trail-capture.md`.
- `docs/adr/README.md` index: add 0007, 0008, 0009. Update any link to the old filename (grep `0001-diagnostic`).

### 10. `docs(migration): open the migration log with the lint baseline`

`docs/_migration/README.md`:

- Purpose, deletion at the end of step 5.
- Baseline table: per-rule warning counts from `ESLINT_AGENT_RULES=1 npx eslint src --format json` after commit 3. Expected order of magnitude: 88 `no-raw-tailwind-colors`, 28 `require-schema-conventions`, 11 `require-use-client-suffix`, 0 for the `_services/` and `_domains/` rules, plus whatever `no-client-import-of-services`, `no-feature-nesting`, `schema-must-be-pure-zod`, `require-server-action-suffix` report on the current tree.
- "Locked scopes" table, empty, with columns scope, step, commit, rules locked.
- "Prerequisites for step 2": glossary terms to add (Organization, User, Member, Invitation, Subscription, Plan, Auth); remove the `_features/**` transition glob; decide the home of `core`, `mdx`, `seo`, `c15t` (domain-agnostic candidates) and of the marketing `github` stars feature (route tier candidate).
- "Amendments to the kit made during step 1": items 5, 7, 8 of the decisions table.

This plan file moves into the same folder once the step is done (it already lives there) and is deleted with the folder at the end of the migration.

## Definition of done

- `pnpm typecheck`, `pnpm lint`, `pnpm test` pass.
- `pnpm --filter @workspace/eslint-config test` passes.
- `pnpm lint:agent-rules` exits 0 (zero errors) and reports the baseline warnings.
- `pnpm build` in `apps/web` succeeds.
- Grep for `Tobalgo` returns hits only in `docs/architecture/migration-kit/` and the decisions table of this plan.
- The pre-commit hook runs lint-staged (Prettier + ESLint), typecheck, test.
- `docs/_migration/README.md` holds the baseline.

## Out of scope, deliberately

- Any move of `_features/`, `_utils/`, routers, or Inngest jobs. Step 2 and 3.
- `src/server/errors/`. Step 3.
- Fixing `local/*` warnings. They are the burn-down metric.
- The four stray `.md` files in `.claude/skills/` and the `_incoming/` folder (owner's cleanup).
