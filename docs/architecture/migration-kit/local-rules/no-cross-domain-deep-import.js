const DOMAIN_PATH = /\/src\/app\/_domains\/([^/]+)(?:\/|$)/;
const IMPORT_PATTERN = /^@\/app\/_domains\/([^/]+)(\/.+)?$/;

export const noCrossDomainDeepImportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Cross-domain imports must go through the domain's public index.ts. Forbid `@/app/_domains/<other>/<deep-path>` from inside another domain.",
    },
    schema: [],
    messages: {
      crossDomainDeep:
        "Cross-domain imports must go through the public index.ts. Use `@/app/_domains/{{domain}}` instead of `@/app/_domains/{{domain}}{{deepPath}}`. If the symbol isn't exported yet, add it to `_domains/{{domain}}/index.ts`.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const domainMatch = filename.match(DOMAIN_PATH);
    if (!domainMatch) return {};
    const currentDomain = domainMatch[1];

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        const importMatch = source.match(IMPORT_PATTERN);
        if (!importMatch) return;
        const [, targetDomain, deepPath] = importMatch;
        if (targetDomain === currentDomain) return;
        if (!deepPath) return;
        context.report({
          node: node.source,
          messageId: "crossDomainDeep",
          data: { domain: targetDomain, deepPath },
        });
      },
    };
  },
};
