# TypeScript guidelines

Small, near-universal. Read for any `.ts` / `.tsx` work.

## Type definition

- Use `type` over `interface` for object shapes.
- Use `interface` only for extensible contracts.
- Prefer union types over `enum` when possible.
- Use `const` assertions for literal types.

## Type inference

- Omit function return type annotations.
- Omit variable types when obvious.
- Let generics infer from usage.
- Avoid redundant type annotations.

## Language

- Code identifiers, comments, filenames, schemas: English only.
- French is only for user-facing strings.
