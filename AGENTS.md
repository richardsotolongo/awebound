# AGENTS.md — Awebound

Context for coding agents working in this repo. Read this first, then the `AGENTS.md` in the folder you are changing.

## What this is

Awebound is an independent Christian apparel brand (tees, oversized tees, hoodies, caps), founded by Richard out of his faith and reverence for Jesus Christ. The store welcomes everyone: someone who doesn’t share that faith should still find the clothes beautiful, understand where they come from and buy comfortably. This repo is its website: one Next.js app with a home page that opens on the pieces’ own color plates in turn (starting from the release's primary piece), then that piece up close, the founder’s note and the release as a wall of its pieces, a shop with compact collection, category and sort selectors, About, Contact, FAQ and policy pages, and passwordless sign-in with an account area, My Archive.

Releases are the unit (`collection` in code), numbered in order. The first is **Release 01, Behold**: five oversized tees, three hoodies and two caps, in `position` order (Thorns to Lilies, To Live Is Christ, By His Hem, Stone in Motion, Still the Storm, then the Torn Veil, The Passage and Wonderfully Made hoodies, then the Lamb’s Mark and Signature caps). "Latest Drop" is computed from the catalog (the newest release with pieces), so a new release needs content, not code.

Commerce is **Fourthwall**: it supplies live products, prices, stock and photos, and runs checkout, payment and fulfillment (a redirect to its hosted checkout). The brand story for each product (internal code, release, position, Scripture record, design story, preview price and mockups) lives in `apps/web/src/server/content/catalog.json` and is merged with Fourthwall by slug. A piece that isn’t published in Fourthwall yet (or every piece, when `FOURTHWALL_STOREFRONT_TOKEN` is unset) is a **preview** internally, but the site shows it exactly like a piece on sale (the owner wants the site ready to show): Add to bag, Check out, no “ordering isn’t open” wording anywhere. Only checkout differs: it refuses a bag with an unpublished piece in it, with a plain try-again message. Never name the supplier in customer-facing copy (“our print and fulfillment partner”). Do not add a payment processor or another provider unless the owner asks.

There is no separate backend. Pages read data in Server Components; the browser calls Server Actions (`apps/web/src/server/actions.ts`).

## Workspace map

| Path                | What lives there                                                                                                                                | Agent notes                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web`          | The Next.js app: pages, server code, schemas                                                                                                    | `apps/web/AGENTS.md`                                                                |
| `packages/brand`    | Brand tokens, CSS, TSX components, SVG marks, Tailwind theme                                                                                    | `packages/brand/AGENTS.md`                                                          |
| `packages/tsconfig` | Shared tsconfig bases                                                                                                                           |                                                                                     |
| `supabase`          | SQL migrations, auth email templates                                                                                                            | `supabase/AGENTS.md`                                                                |
| `assets/mockups`    | Fourthwall product images (`fourthwall.json`, `fourthwall.py`), source mockups (kept intact), cutout, zoom-out (`widen.py`) and styling scripts | regenerate site images, close-ups and plates with `fourthwall.py` then `compose.py` |
| `docs`              | `ARCHITECTURE.md`, `DEPLOYMENT.md`, `TODOS.md`, `BRAND.md`                                                                                      | keep them current when you change structure                                         |

`packages/brand` is consumed as TypeScript source (no build step); Next transpiles it via `transpilePackages`.

## Commands (run from the repo root)

```bash
pnpm install          # once
pnpm dev              # the site on :3000
pnpm typecheck        # every package
pnpm lint             # every package
pnpm build            # every package
```

Copy `apps/web/.env.example` to `apps/web/.env.local`; it lists every variable. The catalog and checkout need `FOURTHWALL_STOREFRONT_TOKEN`. Without Supabase keys accounts show "open soon" and contact messages and back-in-stock requests aren't stored; without `RESEND_API_KEY` emails print to the terminal in development.

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
   - Type: Grenze Gotisch for display (mixed case, never all caps), Cormorant Garamond Italic for Scripture quotations only, Manrope for everything else.
   - No small label above a heading anywhere (no eyebrows, no status chips) and no decorative numbering: say it in the heading or a plain sentence. Form labels stay.
   - Motion is one idea: the garment image travels between a tile and its product page (view transitions), and pages cross-fade. Nothing animates on load or on scroll; the one exception is the home page's opening plate, where the pieces take turns while it is on screen: the plate cross-fades, and the garment fades out before the next fades in, so two never show at once. It pauses on its buttons, its garment and the lead piece below (which follows it), on focus and with its Pause button, and holds still with reduced motion, where every change is instant. Artwork, Scripture and buttons are whole and readable in every frame: never cropped, wiped or faded in. Reduced motion gets instant navigation.
   - Style through CSS variables / Tailwind theme tokens. Raw hex lives only in `packages/brand` (`tokens.css`, and `hex.ts` for meta tags and images). HTML email templates are the one exception, because email clients ignore CSS variables.
   - Oxblood (`primary`) is a fill, never text on coal. One primary button per screen, and no glows, gradients or blur.
   - Colour comes from the pieces. Each piece owns a **plate**: its own surface as a full-bleed field (`--plate-*` tokens, named by `plate` in the content file). A plate carries only large lettering (24px and up), filled buttons and images; prices, status, captions, references and body copy stay on coal or bone. Plate colours never colour links, borders, text or controls.
   - Copy: reverent, short sentences, sentence case, no exclamation marks, no hype words, no guilt. Never tell visitors who the clothes are “for” or assume they believe: Awebound says what it makes and why, and Richard speaks for himself in the first person.
6. **Env variables:** add every new one to `apps/web/.env.example` (no real values) and its schema: `apps/web/src/lib/env.ts` for public `NEXT_PUBLIC_*` values, `apps/web/src/server/env.ts` for server-only ones.
7. **Prices come from Fourthwall** for live pieces; previews use `priceCents` in the content file (the owner’s prices: oversized tees $40, Lamb’s Mark $30, the Signature Cap $25, hoodies $60; 2XL and 3XL cost $2 and $4 more: pieces list at the base price with no “From”, and the product page notes the upcharge once 2XL or 3XL is chosen). Never hard-code a price in copy.
8. **Only confirmed facts.** Delivery times live in `apps/web/src/lib/delivery.ts` and stay null until confirmed; no launch dates until confirmed; the founder note on the home page and “My story” on About are Richard's own words as he supplied them in October 2026 (see `docs/BRAND.md`, Voice): change them only with him, and never invent a testimony or detail. Captions and alt text for his portrait name him and nothing he is wearing.
9. Keep `docs/ARCHITECTURE.md`, `docs/TODOS.md` and `docs/BRAND.md` in step with structural changes.

## Conventions

- TypeScript strict everywhere, ES modules, `import type` for types.
- File names: kebab-case; React components PascalCase exports.
- Commit messages: imperative summary line (≤ 72 chars), body explains why.
