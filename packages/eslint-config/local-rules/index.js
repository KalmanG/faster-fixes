import { noDefaultExportRule } from "./no-default-export.js";
import { noRawTailwindColorsRule } from "./no-raw-tailwind-colors.js";
import { requireSchemaConventionsRule } from "./require-schema-conventions.js";
import { requireServerActionSuffixRule } from "./require-server-action-suffix.js";
import { requireTrpcOutputTypeRule } from "./require-trpc-output-type.js";
import { requireUseClientSuffixRule } from "./require-use-client-suffix.js";

export const localRulesPlugin = {
  rules: {
    "no-default-export": noDefaultExportRule,
    "no-raw-tailwind-colors": noRawTailwindColorsRule,
    "require-schema-conventions": requireSchemaConventionsRule,
    "require-server-action-suffix": requireServerActionSuffixRule,
    "require-trpc-output-type": requireTrpcOutputTypeRule,
    "require-use-client-suffix": requireUseClientSuffixRule,
  },
};
