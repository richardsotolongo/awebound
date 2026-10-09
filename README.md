# Awebound

The website and store for **Awebound**, an independent Christian apparel brand for people who are not ashamed to express their faith. Every design tells a story about Jesus Christ and carries a full Scripture reference; the pillars are **Royal heritage. Freedom. Resurrection.**

![The Awebound home page: light from above reveals the Thorn Cross](docs/images/home.jpg)

## What's here

| Area                    | What it does                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home**                | A scroll journey. Light descends and reveals the Thorn Cross; then three pinned scenes drawn as engraved line art, one per pillar: an arch rises (Royal Heritage), a chain's center link opens (Broken Bond), the stone rolls away at dawn (Rolled Away). Each leads into that family's pieces. Visitors who prefer reduced motion get the finished frames, unpinned. |
| **Shop**                | Search (designs, verses, colors), category tabs, collection / color / size-in-stock / price filters with live counts, five sort orders, removable filter chips, "Show more". All state lives in the URL, so every view is shareable.                                                                                                                                  |
| **Product pages**       | Back print first, color and size pickers (sold-out sizes struck through), size guide, add to bag, the design story, Scripture reference and specs.                                                                                                                                                                                                                    |
| **Bag and checkout**    | A persisted bag drawer that re-prices on the server. Checkout hands the bag to Fourthwall's hosted checkout, which takes payment, prints and ships; the site holds no payment code.                                                                                                                                                                                   |
| **About, Contact, FAQ** | Brand story and pillars; a contact form that is stored and emailed to `contact@awebound.store`; answers to common questions.                                                                                                                                                                                                                                          |
| **Policies**            | Refund policy (made to order: misprints, damage and wrong items within 30 days), privacy policy and terms of service, drafted for review.                                                                                                                                                                                                                             |
| **Accounts**            | Passwordless only: Google, or a one-time email link or code. Guest checkout stays open to everyone.                                                                                                                                                                                                                                                                   |

![The arch scene completed, with the Thorn Cross lit inside it](docs/images/journey-royal-heritage.jpg)

## Stack

| Layer             | Choice                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| App               | One Next.js 16 app (App Router, Turbopack, Server Components and Server Actions), React 19, Tailwind CSS 4, Motion, zustand for the bag |
| Commerce          | Fourthwall: live catalog (Storefront API), hosted checkout, payment and fulfillment                                                     |
| Database and auth | Supabase: Postgres with row-level security (profiles, contact messages, sign-ups), Supabase Auth (Google OAuth + email OTP)             |
| Email             | Resend: transactional mail from the server, and SMTP for Supabase Auth emails                                                           |
| Brand             | `packages/brand`, a typed port of the `awebound-brand` skill (tokens, components, the wordmark and Thorn Cross as SVG)                  |

```
awebound/
├─ apps/web          the site: pages, server code (src/server), schemas (src/shared)
├─ packages/brand    tokens, CSS, React components, SVG marks
├─ packages/tsconfig shared compiler settings
├─ supabase          migrations, auth email templates, CLI config
└─ docs              ARCHITECTURE.md, DEPLOYMENT.md, TODOS.md
```

## Run it locally

Requirements: Node 22 and pnpm 10 (`corepack enable` picks up the pinned version).

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # then fill in the values
pnpm dev
```

Open http://localhost:3000. `apps/web/.env.example` lists every variable with a comment.

The catalog and checkout always come from the Fourthwall shop, so set `FOURTHWALL_STOREFRONT_TOKEN` (Fourthwall admin → Settings → For developers). The shop lists the public Fourthwall products that match the brand content in `apps/web/src/server/content/catalog.json` by slug, and checkout hands off to Fourthwall's hosted checkout. Setup steps are in [docs/TODOS.md](docs/TODOS.md#fourthwall).

Without Supabase keys accounts show "open soon" and contact messages and sign-ups aren't stored; without `RESEND_API_KEY` emails print to the terminal in development.

### With a local Supabase

```bash
supabase start          # local Postgres, Auth and a mail catcher (needs Docker)
supabase db reset       # applies supabase/migrations
```

Then point `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` in `apps/web/.env.local` at it. Sign-in emails land in the local mail catcher at http://localhost:54324.

## Scripts

| Command                           | What it does                                     |
| --------------------------------- | ------------------------------------------------ |
| `pnpm dev`                        | The site in watch mode                           |
| `pnpm build`                      | Production build of every package                |
| `pnpm start`                      | Run the built site                               |
| `pnpm typecheck`                  | Type-check every package                         |
| `pnpm lint`                       | ESLint everywhere (Next's rules for the web app) |
| `pnpm format`                     | Prettier                                         |
| `pnpm --filter @awebound/web art` | Regenerate the fallback product art              |

There are no automated tests in this repo, by design. Changes are verified with `typecheck`, `lint`, `build` and by running the flows in a browser.

## Deploy

One Vercel project with Root Directory `apps/web`. Steps, variables and DNS: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Status

Built: every page, the shop and its filters, product pages, bag, contact, sign-up, sign-in screens.

Commerce: Fourthwall (live catalog and hosted checkout), always on. Next steps are at the top of [docs/TODOS.md](docs/TODOS.md): Vercel variables, retiring the old API project, resetting the Supabase database, and publishing the products in Fourthwall. Still waiting on prices and photography, Google / Resend setup and a legal review of the policies.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the app is put together, data flow, auth and email, schema, and the Fourthwall integration
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): the Vercel project, environment variables, domains
- [docs/TODOS.md](docs/TODOS.md): decisions, setup steps and remaining work
- [AGENTS.md](AGENTS.md) and the `AGENTS.md` in each app and package: context and rules for coding agents
