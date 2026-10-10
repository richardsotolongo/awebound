# AGENTS.md — Awebound

Context for coding agents working in this repo. Read this first, then the `AGENTS.md` in the folder you are changing.

## What this is

Awebound is an independent Christian apparel brand (tees, oversized tees, tanks, caps) for believers aged 18–30 who are not ashamed to express their faith. This repo is its website: one Next.js app with a garment-led home page, a shop with collection and category selectors, Collections, About, Contact, FAQ and policy pages, and passwordless sign-in.

Releases are the unit (`collection` in code), numbered in order. The first is **Release 01, Behold**: five oversized tees, a hoodie and a cap, in `position` order (Still the Storm, By His Hem, Thorns to Lilies, the Torn Veil hoodie, Stone in Motion, To Live Is Christ, then the Lamb’s Mark cap). "Latest Drop" is computed from the catalog (the newest release with pieces), so a new release needs content, not code.

Commerce is **Fourthwall**: it supplies live products, prices, stock and photos, and runs checkout, payment and fulfillment (a redirect to its hosted checkout). The brand story for each product (internal code, release, position, Scripture record, design story, preview price and mockups) lives in `apps/web/src/server/content/catalog.json` and is merged with Fourthwall by slug. A piece that isn’t in Fourthwall yet (or every piece, when `FOURTHWALL_STOREFRONT_TOKEN` is unset) shows as a **preview**: the release reads "Coming Soon", the product page says ordering isn’t open and offers "Save to bag", and checkout is refused. Do not add a payment processor or another provider unless the owner asks.

There is no separate backend. Pages read data in Server Components; the browser calls Server Actions (`apps/web/src/server/actions.ts`).

## Workspace map

| Path                | What lives there                                             | Agent notes                                               |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `apps/web`          | The Next.js app: pages, server code, schemas                 | `apps/web/AGENTS.md`                                      |
| `packages/brand`    | Brand tokens, CSS, TSX components, SVG marks, Tailwind theme | `packages/brand/AGENTS.md`                                |
| `packages/tsconfig` | Shared tsconfig bases                                        |                                                           |
| `supabase`          | SQL migrations, auth email templates                         | `supabase/AGENTS.md`                                      |
| `assets/mockups`    | Source mockups (kept intact), cutout and styling scripts     | regenerate site images and story scenes with `compose.py` |
| `docs`              | `ARCHITECTURE.md`, `DEPLOYMENT.md`, `TODOS.md`, `BRAND.md`   | keep them current when you change structure               |

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
   - Crosses stay upright and whole (the Thorn Cross is the brand mark; release art may carry its own simple cross).
   - Symbols only: never depict Jesus, God the Father or the Spirit as a person. No skulls, gore or occult marks.
   - Scripture by full reference ("Exodus 3:5"). Website quotations are exact NIV wording from each piece's shared Scripture record (`scripture` in the content file, `server/content/verses.json` for site-wide verses), labeled "Mark 4:41 — NIV" or "Exodus 3:5 — NIV, excerpt" and never truncated. `SCRIPTURE_TRANSLATION=KJV` switches the site back to KJV. Garment artwork keeps its approved lettering (some prints use KJV wording): never relabel it. The Biblica notice shows in the footer and Terms; website use of the NIV needs Biblica's written permission before launch.
   - Internal design codes (A3-B01…) never appear in customer-facing UI, search or metadata.
   - Say "Christian apparel", "clothing" or "pieces", never "streetwear".
   - Type: Grenze Gotisch for display, Cormorant Garamond Italic for Scripture quotations only, Manrope for everything else.
   - Style through CSS variables / Tailwind theme tokens. Raw hex lives only in `packages/brand` (`tokens.css`, and `hex.ts` for meta tags and images). HTML email templates are the one exception, because email clients ignore CSS variables.
   - Oxblood (`primary`) is a fill, never text on coal. One primary button and one glow per screen.
   - Copy: reverent, short sentences, sentence case, no exclamation marks, no hype words, no guilt.
6. **Env variables:** add every new one to `apps/web/.env.example` (no real values) and its schema: `apps/web/src/lib/env.ts` for public `NEXT_PUBLIC_*` values, `apps/web/src/server/env.ts` for server-only ones.
7. **Prices come from Fourthwall** for live pieces; previews use `priceCents` in the content file (the owner’s prices: oversized tees $40, the cap $30, the hoodie a $60 placeholder). Never hard-code a price in copy.
8. **Only confirmed facts.** Delivery times live in `apps/web/src/lib/delivery.ts` and stay null until confirmed; no launch dates until confirmed; the founder story and About note use only Richard's stated words (see `docs/BRAND.md`, Voice), never an invented testimony.
9. Keep `docs/ARCHITECTURE.md`, `docs/TODOS.md` and `docs/BRAND.md` in step with structural changes.

## Conventions

- TypeScript strict everywhere, ES modules, `import type` for types.
- File names: kebab-case; React components PascalCase exports.
- Commit messages: imperative summary line (≤ 72 chars), body explains why.
