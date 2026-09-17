import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noRawTailwindColorsRule } from "./no-raw-tailwind-colors.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// The options the shared config passes to the rule.
const configuredOptions = [
  {
    allowPatterns: [
      "^fill-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}$",
    ],
    ignorePathPatterns: ["\\.stories\\.", "/emails/"],
  },
];

ruleTester.run("no-raw-tailwind-colors", noRawTailwindColorsRule, {
  valid: [
    {
      name: "semantic token classes",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="bg-destructive text-muted-foreground" />;\n`,
    },
    {
      name: "a chart fill class allowed by allowPatterns",
      filename: "/repo/apps/web/src/components/chart.tsx",
      code: `const Chart = () => <path className="fill-blue-500" />;\n`,
      options: configuredOptions,
    },
    {
      name: "a raw color in a file matched by ignorePathPatterns",
      filename: "/repo/apps/web/src/components/badge.stories.tsx",
      code: `const Badge = () => <span className="text-red-500" />;\n`,
      options: configuredOptions,
    },
    {
      name: "a raw color in an email template matched by ignorePathPatterns",
      filename: "/repo/apps/web/src/emails/welcome.tsx",
      code: `const Welcome = () => <span className="text-red-500" />;\n`,
      options: configuredOptions,
    },
    {
      name: "a cn() call with semantic tokens only",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const classes = cn("bg-card", "text-foreground");\n`,
    },
    {
      name: "a raw color string passed to a call that is not a class helper",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const label = translate("text-red-500");\n`,
    },
    {
      name: "a utility class that is not a palette color",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="border-2 p-4 text-sm" />;\n`,
    },
  ],
  invalid: [
    {
      name: "a raw palette class in a className string",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="text-red-500" />;\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a raw palette class behind a variant prefix",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="hover:bg-blue-600" />;\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a raw palette class with an opacity modifier",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const Badge = () => <span className="bg-slate-900/50" />;\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a raw palette class inside a cn() argument",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const classes = cn("bg-card", "border-emerald-400");\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a raw palette class as a conditional object key in cn()",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: `const classes = cn({ "text-rose-600": isError });\n`,
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a raw palette class in a template literal className",
      filename: "/repo/apps/web/src/components/badge.tsx",
      code: "const Badge = () => <span className={`ring-amber-300 ${extra}`} />;\n",
      errors: [{ messageId: "avoidRawColor" }],
    },
    {
      name: "a fill class outside the allowed palette range",
      filename: "/repo/apps/web/src/components/chart.tsx",
      code: `const Chart = () => <path className="fill-gray-500" />;\n`,
      options: configuredOptions,
      errors: [{ messageId: "avoidRawColor" }],
    },
  ],
});
