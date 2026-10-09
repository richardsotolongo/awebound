# AGENTS.md — apps/web

The whole site: Next.js 16 App Router. Server Components read the catalog directly from server code; Client Components handle interaction and call Server Actions. Brand rules live in `packages/brand/AGENTS.md` and the `awebound-brand` skill: read them before visual work.

## Layout

```
src/
├─ app/                    routes (pages, route handlers, sitemap, robots, icons)
│  ├─ page.tsx             home: Opening + three pinned pillar scenes + rails + altar panel
│  ├─ shop/                listing (CatalogView) and product pages
│  ├─ collections/         family index and per-family listing (CatalogView with a locked collection)
│  ├─ about, contact, faq, refunds, privacy, terms, bag, sign-in, account
│  └─ auth/                callback (OAuth/PKCE), confirm (email token hash), sign-out (POST)
├─ features/               one folder per feature (UI)
│  ├─ home-journey/        Opening, PillarScene, SVG scenes (ArchScene, ChainScene, TombScene)
│  ├─ catalog/             URL state (catalog-state.tsx), toolbar, filters, chips, grid, query helpers
│  ├─ product/             gallery, purchase (color/size/add to bag), size guide
│  ├─ bag/                 zustand store (persisted), drawer, bag page, checkout + notify form
│  ├─ contact/ auth/ account/ legal/
├─ server/                 server-only code (never import it from a Client Component, except actions.ts)
│  ├─ actions.ts           Server Actions: validateBag, startCheckout, loadMoreProducts, sendContact, subscribe, updateProfile
│  ├─ catalog.ts           getCatalog (Fourthwall + brand content), searchProducts, getFacets, getProduct, withFallback
│  ├─ catalog-merge.ts     merges Fourthwall products with the brand content by slug
│  ├─ catalog-search.ts    search, filters, facets and sorting over the merged catalog
│  ├─ fourthwall.ts        Storefront API client (product list cached 60 s, cart creation)
│  ├─ bag.ts               re-pricing the bag, creating the checkout
│  ├─ messages.ts          contact messages and drop-note sign-ups (Supabase + email)
│  ├─ email.ts, email-templates.ts   Resend, or the terminal in development
│  ├─ errors.ts            UserError, Result, run(), parse()
│  ├─ env.ts               server-only env (zod)
│  └─ content/             catalog.json: the brand story per product (ID, collection, Scripture, copy)
├─ shared/                 zod schemas, types and helpers used by both server and browser
├─ components/             site chrome: header, footer, Sheet (native <dialog>), PageHeader, Reveal, icons
├─ lib/                    public env (zod), Supabase clients (browser, server, admin), site config
├─ styles/                 site.css, sheet.css, shop.css, product.css, journey.css, prose.css (all @layer components)
└─ proxy.ts                Next 16 proxy (formerly middleware): refreshes Supabase session, guards /account
```

## Conventions

- **Data**: Server Components call `server/catalog.ts` directly, wrapped in `withFallback` so a Fourthwall outage renders an empty state instead of crashing. Fourthwall's product list is fetched with `next: { revalidate: 60 }`, so the home page and sitemap stay static and refresh every minute. Don't add `no-store` on the catalog path.
- **Server Actions** (`server/actions.ts`) are the only way the browser reaches the server. Each one parses its input with a schema from `shared/`, reads the user from the Supabase session, and returns `Result<T>`: `{ ok: true, data }` or `{ ok: false, error, fields? }`. Next hides thrown messages in production, so never rely on a thrown error reaching the client; throw `UserError` for messages the shopper should see.
- **Secrets** stay in `server/` and `lib/supabase/admin.ts` (`import "server-only"`). Brand content is server-only too, so the catalog JSON never ships to the browser.
- **Shop state lives in the URL** (`q`, `category`, `collection`, `color`, `size`, `minPrice`, `maxPrice`, `sort`). Use `useCatalogState()`; it updates optimistically and replaces the URL in a transition.
- **Bag**: `useBag` (zustand, persisted to localStorage, rehydrated after mount). The `validateBag` action re-prices it whenever it's shown; never trust client prices. `startCheckout` answers `{ url }` and the browser goes to Fourthwall's hosted checkout.
- **Auth**: Supabase via `@supabase/ssr`. Passwordless only (Google OAuth, email link or 6-digit code). Everything degrades to "Accounts open soon" when `NEXT_PUBLIC_SUPABASE_*` is unset.
- **Styling**: brand classes (`.aw-*`) for type and components, Tailwind utilities for layout, tokens for every color. No raw hex. Garment swatches go through `colorCss(color)` from `@/shared`: the brand token when the color is known, otherwise Fourthwall's swatch hex (product data, not styling). Fonts are self-hosted from `@fontsource-variable/*` via `next/font/local` (no Google Fonts requests).
- **Motion**: `motion/react`. Standard entrances use `<Reveal>` (300ms fade + 12px rise). `MotionConfig reducedMotion="user"` is set globally; the journey also switches to still frames and un-pinned sections in CSS under `prefers-reduced-motion`. Round computed SVG coordinates (`toFixed`) so server and client render the same markup.
- **React 19 lint rules**: don't call setState synchronously in effects. Adjust state during render when a prop changes (see `product-grid.tsx`, `site-header.tsx`).
- **Images**: product images are plain `<img>` (photos come from Fourthwall's CDN). Sample art in `public/products`, generated by `pnpm --filter @awebound/web art`, is the fallback for products without Fourthwall photos.

## Commands

```bash
pnpm --filter @awebound/web dev        # http://localhost:3000
pnpm --filter @awebound/web typecheck  # next typegen + tsc
pnpm --filter @awebound/web lint
pnpm --filter @awebound/web build
```

No tests (owner's instruction). Verify by building and walking the flows in a browser: search → filter → product → add to bag → checkout (lands on Fourthwall); back-in-stock notify; contact; sign-in. Check error messages with `pnpm build && pnpm start` too: `next dev` shows thrown messages that production hides.
