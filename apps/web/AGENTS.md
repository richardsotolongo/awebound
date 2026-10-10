# AGENTS.md — apps/web

The whole site: Next.js 16 App Router. Server Components read the catalog directly from server code; Client Components handle interaction and call Server Actions. Brand rules live in `packages/brand/AGENTS.md` and the `awebound-brand` skill: read them before visual work.

## Layout

```
src/
├─ app/                    routes (pages, route handlers, sitemap, robots, icons)
│  ├─ page.tsx             home: hero (clothes + release status), latest release intro + grid, two design stories, founder story, release sign-up
│  ├─ shop/                listing (collection selector + category tabs) and product pages
│  ├─ collections/         every release by name; /collections/<slug> opens the shop filtered to it
│  ├─ about, contact, faq, refunds, privacy, terms, bag, sign-in, account
│  └─ auth/                callback (OAuth/PKCE), confirm (email token hash), sign-out (POST)
├─ features/               one folder per feature (UI)
│  ├─ home/                Hero, DesignStory (featured piece in its stone niche)
│  ├─ release/             ReleaseCard (the brand ProductCard fed from a ProductSummary)
│  ├─ catalog/             CatalogView (collection/category selectors), ShopHeader, URL state, toolbar, filters, chips, grid, query helpers
│  ├─ product/             gallery, purchase (color/size, Save to bag or Add to bag), delivery and returns summary, size guide
│  ├─ bag/                 zustand store (persisted), drawer, bag page, checkout + notify form
│  ├─ contact/ auth/ account/ legal/
├─ server/                 server-only code (never import it from a Client Component, except actions.ts)
│  ├─ actions.ts           Server Actions: validateBag, startCheckout, loadMoreProducts, sendContact, subscribe, updateProfile, deleteAccount
│  ├─ catalog.ts           getCatalog (Fourthwall + brand content), searchProducts, getFacets, getProduct, withFallback
│  ├─ catalog-merge.ts     merges Fourthwall products with the brand content by slug; previews for the rest
│  ├─ catalog-search.ts    search, filters, facets and sorting over the merged catalog
│  ├─ fourthwall.ts        Storefront API client (product list cached 60 s, cart creation)
│  ├─ bag.ts               re-pricing the bag, creating the checkout
│  ├─ messages.ts          contact messages and drop-note sign-ups (Supabase + email)
│  ├─ email.ts, email-templates.ts   Resend, or the terminal in development
│  ├─ errors.ts            UserError, Result, run(), parse()
│  ├─ env.ts               server-only env (zod)
│  ├─ scripture.ts         resolves Scripture records to the site's translation (SCRIPTURE_TRANSLATION), site verses, the notice
│  └─ content/             catalog.json (per product: code, release, position, Scripture record, design story, preview price, images), verses.json
├─ shared/                 zod schemas, types and helpers used by both server and browser
├─ components/             site chrome: header, footer, Sheet (native <dialog>), PageHeader, Reveal, icons
├─ lib/                    public env (zod), Supabase clients (browser, server, admin), site config,
│                          delivery.ts (confirmed fulfillment facts; null until confirmed)
├─ styles/                 site.css, sheet.css, shop.css, product.css, home.css, prose.css (all @layer components)
└─ proxy.ts                Next 16 proxy (formerly middleware): refreshes Supabase session, guards /account
```

## Conventions

- **Data**: Server Components call `server/catalog.ts` directly, wrapped in `withFallback` so a Fourthwall outage renders an empty state instead of crashing. Fourthwall's product list is fetched with `next: { revalidate: 60 }`, so the home page and sitemap stay static and refresh every minute. Don't add `no-store` on the catalog path.
- **Server Actions** (`server/actions.ts`) are the only way the browser reaches the server. Each one parses its input with a schema from `shared/`, reads the user from the Supabase session, and returns `Result<T>`: `{ ok: true, data }` or `{ ok: false, error, fields? }`. Next hides thrown messages in production, so never rely on a thrown error reaching the client; throw `UserError` for messages the shopper should see.
- **Secrets** stay in `server/` and `lib/supabase/admin.ts` (`import "server-only"`). Brand content is server-only too, so the catalog JSON never ships to the browser.
- **Shop state lives in the URL** (`collection`, `category`, `q`, `color`, `size`, `minPrice`, `maxPrice`, `sort`). Collection and category are links (`shopHref`), so they push history: no `collection` means Latest Drop (the newest release, from `CatalogIndex.releases()`), `all` means every collection. The sheet's filters use `useCatalogState()`, which updates optimistically and replaces the URL in a transition.
- **Scripture**: never hard-code a verse in a component. Products carry `scripture` (a `ScriptureQuote` resolved on the server); site verses come from `VERSES` in `server/scripture.ts`. Render with the brand `ScriptureQuote` / `ScriptureRef`, which add the quotation marks and the "— NIV, excerpt" label.
- **Release status**: `Release.status` is `preview` until every piece in it is in Fourthwall. Hero buttons, the shop header, product pages and the bag switch their labels and preview messages from it and from `product.preview`.
- **Internal codes**: `code` stays in data (SKUs, records) but is never rendered, searched or put in metadata.
- **Bag**: `useBag` (zustand, persisted to localStorage, rehydrated after mount). The `validateBag` action re-prices it whenever it's shown; never trust client prices. `startCheckout` answers `{ url }` and the browser goes to Fourthwall's hosted checkout.
- **Auth**: Supabase via `@supabase/ssr`. Passwordless only (Google OAuth, email link or 6-digit code). Everything degrades to "Accounts open soon" when `NEXT_PUBLIC_SUPABASE_*` is unset.
- **Styling**: brand classes (`.aw-*`) for type and components, Tailwind utilities for layout, tokens for every color. No raw hex. Garment swatches go through `colorCss(color)` from `@/shared`: the brand token when the color is known, otherwise Fourthwall's swatch hex (product data, not styling). Fonts are self-hosted from `@fontsource-variable/*` via `next/font/local` (no Google Fonts requests).
- **Motion**: never hide words. `<Reveal>` is CSS only: a short scroll-linked rise that starts at 40% opacity, so text is readable without JavaScript, in browsers without scroll-driven animation and with reduced motion. The hero rises in 420ms; the Behold name opens from the center as it scrolls in; in design stories the garment drifts a few percent against its niche (`motion/react`, still under reduced motion) while the words stay put. Anchors land below the header (`scroll-margin-top` on every `[id]`). Glows use `.soft-glow` (site.css): an ellipse that fades out inside a box larger than the block it lights, so no edge shows as a line.
- **React 19 lint rules**: don't call setState synchronously in effects. Adjust state during render when a prop changes (see `product-grid.tsx`, `site-header.tsx`).
- **Images**: product images are plain `<img>`. `public/products/<slug>/` holds the site's styled product images: Fourthwall's render of the product (or the approved mockup until a render is ready) on each piece's own surface, made by `assets/mockups/fourthwall.py` and `compose.py`. The listing view shows the whole garment, `detail` is the artwork close-up (from the mockup for hoodies, whose renders hide the top of the back print under the hood), and `story-niche.webp` + `story-piece.webp` are the two layers of the home design-story scene (the page builds their URLs from the slug, so every piece needs them). These images are used for previews and live products alike; Fourthwall's own photos are only a fallback (`catalog-merge.ts`). The founder portrait is `public/about/richard-{480,960}.webp`.
- **A new release**: add a collection (slug, name, number, tagline, story, scriptureRef) and its products to `catalog.json`, each with a Scripture record (exact NIV and KJV text) and a design story (theme, call, art, meaning), and run `assets/mockups/compose.py` for its images and story scene. Latest Drop, the home page, Collections and the shop selector pick it up. `featured: true` picks the two home design stories and the hero pieces (the first featured piece in release order is shown largest; the piece carrying the release verse fills the third spot).
- **Previews**: a content entry with no Fourthwall product is listed with `preview: true` (content price, sizes and mockups; SKUs like `A3-B01-FADED-BLACK-M`). The product page says ordering isn't open and offers "Save to bag"; the bag explains it only saves selections and shows a notify form instead of checkout; `startCheckout` refuses preview lines.

## Commands

```bash
pnpm --filter @awebound/web dev        # http://localhost:3000
pnpm --filter @awebound/web typecheck  # next typegen + tsc
pnpm --filter @awebound/web lint
pnpm --filter @awebound/web build
```

No tests (owner's instruction). Verify by building and walking the flows in a browser on desktop and a phone width, with and without reduced motion: hero buttons and anchors → collection + category selectors (e.g. Behold + Hats, an empty combination) → product → Save to bag / Add to bag → checkout (lands on Fourthwall once live); notify; contact; sign-in. Check error messages with `pnpm build && pnpm start` too: `next dev` shows thrown messages that production hides.
