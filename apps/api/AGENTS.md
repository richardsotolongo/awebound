# AGENTS.md — apps/api

Express 5 + TypeScript API for the Awebound store, organised as clean architecture (ports and adapters).

## Layers (dependencies point inward)

```
src/
├─ domain/            entities (plain types from @awebound/shared), pure rules (priceBag), domain errors
├─ application/
│  ├─ ports/          interfaces: ProductRepository, CheckoutGateway, FulfillmentGateway, Mailer,
│  │                  ContactRepository, SubscriberRepository, ProfileRepository, TokenVerifier, Logger
│  └─ use-cases/      SearchProducts, GetCatalogFacets, GetProductBySlug, ListCollections, ValidateBag,
│                     StartCheckout, SubmitContactMessage, SubscribeToDropNotes, GetProfile, UpdateProfile
├─ infrastructure/    adapters: Supabase (catalog, inbox, profiles), in-memory seed catalog and inbox,
│                     Resend/console mailers, Supabase JWT verifier (JWKS or legacy secret),
│                     UnconfiguredCheckoutGateway, env schema, pino logger
├─ interface/http/    Express app, v1 routes (thin controllers), middleware, zod parsing helpers
├─ container.ts       composition root: the only file that picks adapters (from env)
└─ main.ts            loads .env, builds the container, starts the server
```

- `domain` imports nothing from `application`, `infrastructure` or Express.
- `application` imports only `domain` and its own ports. Never Supabase, Resend, Express or `process.env`.
- Controllers validate with the zod schemas from `@awebound/shared` (`parseBody`, `parseQuery`), call one use case, return JSON. No business rules in routes.
- Errors: throw `ValidationError`, `NotFoundError`, `UnauthorizedError`, `UnavailableError` from the domain; `errorHandler` maps them to `{ error: { code, message, fields? } }`.

## Running

```bash
cp apps/api/.env.example apps/api/.env   # defaults work offline
pnpm --filter @awebound/api dev          # http://localhost:4000, /health
pnpm --filter @awebound/api build        # tsup bundle → dist/main.js (bundles @awebound/* source)
pnpm --filter @awebound/api build:vercel # Vercel Function → .vercel/output (src/vercel.ts, every dependency bundled)
```

`src/main.ts` (listens on PORT) and `src/vercel.ts` (default-exports a request handler) wire the same app; keep them in step.

Offline defaults: `CATALOG_SOURCE=seed` (in-memory catalog from `packages/shared/src/seed`), console mailer, in-memory inbox, accounts return 503. Set `SUPABASE_URL` + `SUPABASE_SECRET_KEY` and `CATALOG_SOURCE=supabase` for the real database; `RESEND_API_KEY` for real email; `FOURTHWALL_STOREFRONT_TOKEN` with `CATALOG_SOURCE=fourthwall` and/or `COMMERCE_PROVIDER=fourthwall` (+ `FOURTHWALL_CHECKOUT_DOMAIN`) for Fourthwall.

## Fourthwall

- `infrastructure/fourthwall/storefront-client.ts`: the only code that talks to the Storefront API (zod-parsed responses, timeout, `FourthwallApiError`).
- `fourthwall/merge-catalog.ts`: Fourthwall variants/prices/stock/photos + brand content from `@awebound/shared/seed`, matched by slug (`fourthwallSlug` overrides). Site SKU = Fourthwall variant id.
- `fourthwall/fourthwall-product-repository.ts`: 60 s cache over the merge, serves stale on failure, delegates search and facets to `InMemoryProductRepository`.
- `commerce/fourthwall-checkout-gateway.ts`: cart → hosted checkout redirect.
- Never touch a Fourthwall shop through other tools on the owner's behalf; the API only reads products and creates carts.

## Adding another commerce provider (only if the owner asks)

1. Implement `CheckoutGateway` in `src/infrastructure/commerce/<provider>-checkout-gateway.ts`.
   - Printful / Printify / Apliiq: take payment first (a payment provider's hosted checkout), then create the order with a `FulfillmentGateway` adapter from the payment webhook. Payments are **not** in scope until the owner asks.
2. Add its env vars to `infrastructure/config/env.ts` and `.env.example`.
3. Select it in `createCheckoutGateway` in `container.ts` from `COMMERCE_PROVIDER`.
4. Map provider product/variant ids into `products.provider_product_id` / `product_variants.provider_variant_id`.
5. Update `docs/ARCHITECTURE.md` and `docs/TODOS.md`.

## Rules

- Keep `InMemoryProductRepository` and the SQL in `supabase/migrations/*_catalog_search.sql` in step (same filters, facet counting and sort order).
- Never log emails or tokens (pino redacts `email` and `authorization`).
- Rate-limit anything that sends email or will take money (`limiter()`).
- No tests (owner's instruction). Verify with `pnpm typecheck`, `pnpm lint`, `pnpm build` and by calling the endpoints.
