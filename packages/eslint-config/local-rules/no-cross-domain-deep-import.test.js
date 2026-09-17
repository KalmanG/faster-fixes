import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { noCrossDomainDeepImportRule } from "./no-cross-domain-deep-import.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-cross-domain-deep-import", noCrossDomainDeepImportRule, {
  valid: [
    {
      name: "another domain imported through its public index",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "@/app/_domains/project";\n`,
    },
    {
      name: "a deep import inside the importer's own domain",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getPlan } from "@/app/_domains/billing/_services/get-plan";\n`,
    },
    {
      name: "a deep cross-domain import from outside any domain",
      filename: "/repo/apps/web/src/app/(authenticated)/page.tsx",
      code: `import { getPlan } from "@/app/_domains/billing/_services/get-plan";\n`,
    },
    {
      name: "a relative import inside the domain",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getPlan } from "./_services/get-plan";\n`,
    },
    {
      name: "a package whose name only starts like the domains alias",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { x } from "@/app/_domains-legacy/project/thing";\n`,
    },
  ],
  invalid: [
    {
      name: "a deep import into another domain's services",
      filename: "/repo/apps/web/src/app/_domains/billing/use-plan.ts",
      code: `import { getProject } from "@/app/_domains/project/_services/get-project";\n`,
      errors: [{ messageId: "crossDomainDeep" }],
    },
    {
      name: "a deep import into another domain's one-level child",
      filename: "/repo/apps/web/src/app/_domains/billing/_services/get-plan.ts",
      code: `import { projectSchema } from "@/app/_domains/project/project.schema";\n`,
      errors: [{ messageId: "crossDomainDeep" }],
    },
  ],
});
