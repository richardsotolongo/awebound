# AGENTS.md — apps/api

Express 5 + TypeScript API for the Awebound store, organised as clean architecture (ports and adapters).

## Layers (dependencies point inward)

```
src/
├─ domain/            entities (plain types from @awebound/shared), pure rules (priceBag), domain errors
├─ application/
│  ├─ ports/          interfaces: ProductRepository, CheckoutGateway, Mailer, ContactRepository,
│  │                  SubscriberRepository, ProfileRepository, TokenVerifier, Logger
│  └─ use-cases/      SearchProducts, GetCatalogFacets, GetProductBySlug, ListCollections, ValidateBag,
│                     StartCheckout, SubmitContactMessage, SubscribeToDropNotes, GetProfile, UpdateProfile
├─ infrastructure/    adapters: Fourthwall (catalog, checkout), in-memory search engine,
│                     Supabase (inbox, profiles) and in-memory inbox, Resend/console mailers,
│                     Supabase JWT verifier (JWKS or legacy secret), env schema, pino logger
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
cp apps/api/.env.example apps/api/.env   # then set FOURTHWALL_STOREFRONT_TOKEN
pnpm --filter @awebound/api dev          # http://localhost:4000, /health
pnpm --filter @awebound/api build        # tsup bundle → dist/main.js (bundles @awebound/* source)
pnpm --filter @awebound/api build:vercel # Vercel Function → .vercel/output (src/vercel.ts, every dependency bundled)
```

`src/main.ts` (listens on PORT) and `src/vercel.ts` (default-exports a request handler) wire the same app; keep them in step.

`FOURTHWALL_STOREFRONT_TOKEN` is required; the API refuses to start without it. Without Supabase keys the inbox is in memory and accounts return 503; without `RESEND_API_KEY` emails print to the console. Set `SUPABASE_URL` + `SUPABASE_SECRET_KEY` for the real database and `RESEND_API_KEY` for real email.

## Fourthwall

- `infrastructure/fourthwall/storefront-client.ts`: the only code that talks to the Storefront API (zod-parsed responses, timeout, `FourthwallApiError`).
- `fourthwall/merge-catalog.ts`: Fourthwall variants/prices/stock/photos + brand content from `@awebound/shared/content`, matched by slug (`fourthwallSlug` overrides). Site SKU = Fourthwall variant id.
- `fourthwall/fourthwall-product-repository.ts`: 60 s cache over the merge, serves stale on failure, delegates search and facets to `InMemoryProductRepository` (`catalog/in-memory-catalog.ts`).
- `commerce/fourthwall-checkout-gateway.ts`: cart → hosted checkout redirect on `FOURTHWALL_CHECKOUT_DOMAIN`.
- Never touch a Fourthwall shop through other tools on the owner's behalf; the API only reads products and creates carts.

## Rules

- Never log emails or tokens (pino redacts `email` and `authorization`).
- Rate-limit anything that sends email or will take money (`limiter()`).
- No tests (owner's instruction). Verify with `pnpm typecheck`, `pnpm lint`, `pnpm build` and by calling the endpoints.
