# AGENTS.md — Awebound

Context for coding agents working in this repo. Read this first, then the `AGENTS.md` in the folder you are changing.

## What this is

Awebound is an independent Christian apparel brand (tees, oversized tees, tanks, caps) for believers aged 18–30 who wear their faith boldly. This monorepo is its website: a storefront with a scroll-driven home page, a searchable shop, About, Contact, FAQ and policy pages, and passwordless sign-in.

Payments and fulfillment are **not chosen yet** (Printful, Printify, Fourthwall or Apliiq). Checkout goes through a port whose only adapter is `UnconfiguredCheckoutGateway`. Do not add a payment processor unless the owner asks; see `docs/TODOS.md`.

## Workspace map

| Path                | What lives there                                             | Agent notes                                 |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| `apps/web`          | Next.js App Router storefront                                | `apps/web/AGENTS.md`                        |
| `apps/api`          | Express API, clean architecture                              | `apps/api/AGENTS.md`                        |
| `packages/brand`    | Brand tokens, CSS, TSX components, SVG marks, Tailwind theme | `packages/brand/AGENTS.md`                  |
| `packages/shared`   | zod schemas, DTO types, typed API client, catalog seed data  | contract between web and API                |
| `packages/tsconfig` | Shared tsconfig bases                                        |                                             |
| `supabase`          | SQL migrations, seed, auth email templates                   | `supabase/AGENTS.md`                        |
| `docs`              | `ARCHITECTURE.md`, `TODOS.md`                                | keep them current when you change structure |

Internal packages are consumed as TypeScript source (no build step): Next transpiles them via `transpilePackages`, the API bundles them with tsup.

## Commands (run from the repo root)

```bash
pnpm install          # once
pnpm dev              # web on :3000 and API on :4000
pnpm typecheck        # every package
pnpm lint             # every package
pnpm build            # every package
pnpm db:seed          # regenerate supabase/seed.sql from packages/shared/src/seed
```

The API runs without Supabase when `CATALOG_SOURCE=seed` (the default in `.env.example`), and logs emails to the console when `RESEND_API_KEY` is empty.

## Rules

1. **No tests.** The owner asked for none. Verify with `pnpm typecheck`, `pnpm lint`, `pnpm build` and by running the site.
2. **Clean architecture in the API.** Dependencies point inward: `domain` ← `application` ← `infrastructure` / `interface`. Use cases depend on ports (interfaces), never on Supabase, Resend or Express.
3. **One contract.** Request and response shapes live in `packages/shared` as zod schemas. The API validates with them; the web app's client is typed from them. Change the schema first.
4. **Brand non-negotiables** (full rules in the `awebound-brand` skill and `packages/brand/AGENTS.md`):
   - The wordmark is artwork from `packages/brand` (`<Wordmark />`), never typed in a font. Minimum 120px wide.
   - The Thorn Cross is the only cross; upright and whole.
   - Symbols only: never depict Jesus, God the Father or the Spirit as a person. No skulls, gore or occult marks.
   - Scripture by full reference ("Galatians 5:1", ranges with an en dash). Quote verses only in the NLT, credited "(NLT)".
   - Style through CSS variables / Tailwind theme tokens. Raw hex lives only in `packages/brand` (`tokens.css`, and `hex.ts` for meta tags and images). HTML email templates are the one exception, because email clients ignore CSS variables.
   - Oxblood (`primary`) is a fill, never text on coal. One primary button and one glow per screen.
   - Copy: reverent, short sentences, sentence case, no exclamation marks, no hype words, no guilt.
5. **Secrets** live in `.env` files that are git-ignored. Add every new variable to the matching `.env.example` and to the zod env schema (`apps/api/src/infrastructure/config/env.ts`, `apps/web/src/lib/env.ts`).
6. **Prices are placeholders** until the owner sets them. Don't present seed prices as final in copy.
7. Keep `docs/ARCHITECTURE.md` and `docs/TODOS.md` in step with structural changes.

## Conventions

- TypeScript strict everywhere, ES modules, `import type` for types.
- File names: kebab-case; React components PascalCase exports.
- Commit messages: imperative summary line (≤ 72 chars), body explains why.
