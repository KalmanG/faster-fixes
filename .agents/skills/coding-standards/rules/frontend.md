# Frontend: React components, client components, styling, query status

Everything for building UI in `apps/web`. For where files go, see [architecture.md](architecture.md). For surfacing errors, see [errors.md](errors.md).

## Component creation

Export pattern:

- Always use `export function` syntax.
- Never use default exports.
- Use named exports consistently.

Props pattern:

- Pass a props object as the first parameter.
- Define a separate props type, destructure in the parameter list, type it inline.

```tsx
type MyComponentProps = {
  prop1: string;
  prop2: number;
};

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  return <div>{prop1}</div>;
}
```

## Client components

- Start the file with the `'use client'` directive.
- Name the file `*.client.tsx` (see [architecture.md](architecture.md)).
- Use `useState` and React hooks as normal.
- Handle browser APIs with hydration safety: guard browser-only code with `typeof window`, or use the `use-is-client` hook pattern.
- Prevent hydration mismatches with proper client checks.
- A client file must **not** import from a `_services/` path (except `*.schema.ts`); use a tRPC hook or a server component instead.

## TailwindCSS

Spacing and layout:

- Use `flex gap-n` over `space-y-n` / `space-x-n`.
- Combine with `flex-col` for vertical spacing.

Opacity:

- Use `bg-white/50` over `bg-white bg-opacity-50`.

Theme variables:

- Use semantic theme tokens over hardcoded colors.
- Prefer `text-muted-foreground` over `text-gray-500`.
- Follow design-system color tokens (`muted-foreground`, `destructive`, `success`, `primary`, `warning`, `info`, `secondary`).

## TanStack Query status handling

- Use the `matchQueryStatus` utility for query states; do not write imperative `isLoading`/`isError` branches.
- Handle all four states: `Loading`, `Errored`, `Empty`, `Success`.
- Keep components declarative: no multiple return statements for status, no repeated layout wrappers, no cluttered conditional rendering.

Each state has a required component, so the four branches look the same everywhere:

- **`Loading` must render `<Skeleton>`** from `@repo/ui/components/skeleton`, shaped like the content it replaces. Never a spinner, plain text, or `null`.
- **`Errored` and `Empty` must render `<Empty>`** and its sub-components (`<EmptyHeader>`, `<EmptyMedia>`, `<EmptyTitle>`, `<EmptyDescription>`, `<EmptyContent>`) from `@repo/ui/components/empty`. Never a raw string, a bare `<div>`, or `null`.
- `Errored` renders `error.message` inside the `<Empty>` (see [errors.md](errors.md)), never a stack or a digest.

```tsx
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/ui/components/empty";

export function PostsList() {
  const postsQuery = usePostsListQuery();

  return (
    <PostsListLayout>
      {matchQueryStatus(postsQuery, {
        Loading: (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ),
        Errored: (error) => (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Impossible de charger les articles</EmptyTitle>
              <EmptyDescription>{error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Empty: (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aucun article</EmptyTitle>
              <EmptyDescription>
                Tu n'as pas encore publié d'article.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Success: ({ data }) => (
          <ul>
            {data.map((post) => (
              <li key={post.id}>{post.title}</li>
            ))}
          </ul>
        ),
      })}
    </PostsListLayout>
  );
}
```

## Forms (create/edit)

- Build on the project `Form` component with `react-hook-form` + `zodResolver`. No hand-rolled form state.
- **Never drive form state with `useEffect`.** `react-hook-form` owns it: use `defaultValues`, `values`, `reset()`, or `useFormContext()`. An effect that syncs props into the form is a bug waiting to happen.
- When a form is used for both create and edit: split into a dialog wrapper (fetches data, `matchQueryStatus`) and a pure form component (receives loaded data as props).
- Form validation uses a Zod schema from `_services/` (see [schemas.md](schemas.md)); validation failures surface as per-field errors, not a toast (see [errors.md](errors.md)).
- The container hook (`use-*.ts`) owns form state + mutation + optimistic update + toast + invalidation.
- An action button that owns its own mutation lives in its own file and reads form state via `useFormContext()` (see [code-shape.md](code-shape.md)).

## User-facing copy

- English only. Professional, clear, and concise: match the tone of serious developer tools
  (Vercel, Linear, Stripe).
- No marketing fluff, no casual language, no exclamation marks. Prefer precise, understated
  wording.
- Never use the em dash character; use a comma, colon, or period.
