# AGENTS.md — Awebound

Context for coding agents working in this repo. Read this first, then the `AGENTS.md` in the folder you are changing.

## What this is

Awebound is an independent Christian apparel brand (tees, oversized tees, tanks, caps) for believers aged 18–30 who wear their faith boldly. This repo is its website: one Next.js app with a scroll-driven home page, a searchable shop, About, Contact, FAQ and policy pages, and passwordless sign-in.

The site launches with one release, **Behold** (five tees and a cap). There are no pillars or collection families: a release is the unit (`collection` in code), and its pieces are numbered I–VI by `position` (Holy Ground, Still the Storm, Thorns to Lilies, Stone in Motion, To Live Is Christ, then the Lamb’s Mark cap last).

Commerce is **Fourthwall**: it supplies live products, prices, stock and photos, and runs checkout, payment and fulfillment (a redirect to its hosted checkout). The brand story for each product (ID, release, position, Scripture, copy, preview price and mockups) lives in `apps/web/src/server/content/catalog.json` and is merged with Fourthwall by slug. A piece that isn’t in Fourthwall yet (or every piece, when `FOURTHWALL_STOREFRONT_TOKEN` is unset) shows as a **preview**: the content price and mockups, add to bag works, and checkout says it opens soon. Do not add a payment processor or another provider unless the owner asks.

There is no separate backend. Pages read data in Server Components; the browser calls Server Actions (`apps/web/src/server/actions.ts`).

## Workspace map

| Path                | What lives there                                             | Agent notes                                 |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| `apps/web`          | The Next.js app: pages, server code, schemas                 | `apps/web/AGENTS.md`                        |
| `packages/brand`    | Brand tokens, CSS, TSX components, SVG marks, Tailwind theme | `packages/brand/AGENTS.md`                  |
| `packages/tsconfig` | Shared tsconfig bases                                        |                                             |
| `supabase`          | SQL migrations, auth email templates                         | `supabase/AGENTS.md`                        |
| `docs`              | `ARCHITECTURE.md`, `DEPLOYMENT.md`, `TODOS.md`               | keep them current when you change structure |

`packages/brand` is consumed as TypeScript source (no build step); Next transpiles it via `transpilePackages`.

## Commands (run from the repo root)

```bash
pnpm install          # once
pnpm dev              # the site on :3000
pnpm typecheck        # every package
pnpm lint             # every package
pnpm build            # every package
```

Copy `apps/web/.env.example` to `apps/web/.env.local`; it lists every variable. The catalog and checkout need `FOURTHWALL_STOREFRONT_TOKEN`. Without Supabase keys accounts show "open soon" and contact messages and sign-ups aren't stored; without `RESEND_API_KEY` emails print to the terminal in development.

Deployment is one Vercel project (Root Directory `apps/web`); see `docs/DEPLOYMENT.md`.

## Rules

1. **No tests.** The owner asked for none. Verify with `pnpm typecheck`, `pnpm lint`, `pnpm build` and by running the site.
2. **Keep it simple.** No bloated code or comments: if 2 lines do what 15 would, write the 2. Comment only what the code can't say. Add layers, abstractions or options only when they are needed now.
3. **Never commit secrets** — not in code, `.env.example`, docs or commit messages. Secrets live in git-ignored `.env.local` files and in Vercel.
4. **Server Actions are public endpoints.** Parse every input with the zod schemas in `apps/web/src/shared`, take the user from the Supabase session (never from the input), and return errors as `Result` values (`server/errors.ts`).
5. **Brand non-negotiables** (full rules in the `awebound-brand` skill and `packages/brand/AGENTS.md`):
   - The wordmark is artwork from `packages/brand` (`<Wordmark />`), never typed in a font. Minimum 120px wide.
   - The Thorn Cross is the only cross; upright and whole.
   - Symbols only: never depict Jesus, God the Father or the Spirit as a person. No skulls, gore or occult marks.
   - Scripture by full reference ("Galatians 5:1", ranges with an en dash). Quote verses only in the King James Version (the wording the designs use), credited "(KJV)". The KJV is public domain in the US, so no permission line is needed.
   - Style through CSS variables / Tailwind theme tokens. Raw hex lives only in `packages/brand` (`tokens.css`, and `hex.ts` for meta tags and images). HTML email templates are the one exception, because email clients ignore CSS variables.
   - Oxblood (`primary`) is a fill, never text on coal. One primary button and one glow per screen.
   - Copy: reverent, short sentences, sentence case, no exclamation marks, no hype words, no guilt.
6. **Env variables:** add every new one to `apps/web/.env.example` (no real values) and its schema: `apps/web/src/lib/env.ts` for public `NEXT_PUBLIC_*` values, `apps/web/src/server/env.ts` for server-only ones.
7. **Prices come from Fourthwall** for live pieces; previews use `priceCents` in the content file (the owner’s prices: tees $40, Holy Ground $35, the cap $30). Never hard-code a price in copy.
8. Keep `docs/ARCHITECTURE.md` and `docs/TODOS.md` in step with structural changes.

## Conventions

- TypeScript strict everywhere, ES modules, `import type` for types.
- File names: kebab-case; React components PascalCase exports.
- Commit messages: imperative summary line (≤ 72 chars), body explains why.
