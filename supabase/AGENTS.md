# AGENTS.md — supabase

Postgres schema, seed and auth email templates for the Awebound store. Used by the Supabase CLI locally and applied to the hosted project with `supabase db push`.

## Layout

| Path | Purpose |
| --- | --- |
| `migrations/*.sql` | Ordered, append-only migrations. Never edit one that has been applied to a shared database; add a new file. |
| `seed.sql` | **Generated** by `pnpm db:seed` from `packages/shared/src/seed/catalog.json`. Don't hand-edit. |
| `templates/*.html` | Supabase Auth email templates (magic link + code, confirmation). |
| `config.toml` | Local CLI config: auth, Google provider, Resend SMTP (off locally; Inbucket catches mail). |

## Schema in one glance

- `categories`, `collections` — lookup tables keyed by slug.
- `products` — one row per design (`code` like `A3-B01`), copy fields from the brand voice template, `price_cents`, `provider` + `provider_product_id` for a future fulfillment sync, generated `search` tsvector.
- `product_variants` — color × size, keyed by `sku` (format `A3-B01-FADED-BLACK-XL`, same as the seed). `price_cents` null means "product price".
- `product_images` — back first, then front and details.
- `profiles` — 1:1 with `auth.users`, created by the `on_auth_user_created` trigger.
- `contact_messages`, `subscribers` — written only by the API's secret key; RLS on with no policies.

Functions called by the API via `rpc()`:
- `search_products(p_q, p_categories, p_collections, p_colors, p_sizes, p_min_cents, p_max_cents, p_sort, p_limit, p_offset)` → `(product_id, total_count)`
- `catalog_facets(...same filters)` → jsonb `{categories, collections, colors, sizes, price}`; each facet ignores its own filter.

Their semantics must match `apps/api/src/infrastructure/catalog/in-memory-catalog.ts` (the offline seed adapter). Change both together.

## Rules

- Every table has RLS enabled. Public catalog reads are allowed only for published rows.
- Functions use `set search_path = ''` and fully qualified names.
- Email templates use inline hex from `packages/brand/src/styles/tokens.css` (email clients can't read CSS variables) and the hosted PNG wordmark at `/email/wordmark-oxblood.png`. Keep copy in brand voice: sentence case, no exclamation marks.
- Validate SQL changes on a real Postgres before committing (a stub `auth` schema and the `anon`/`authenticated`/`service_role` roles are enough).
