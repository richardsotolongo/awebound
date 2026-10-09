# TODOS

What's left before launch, grouped by who has to act. Check items off as they land and keep this file current.

## Decisions for the owner

- [ ] **Commerce and fulfillment provider**: Printful, Printify, Fourthwall or Apliiq. Fourthwall brings its own hosted checkout and payments; the other three need a payment processor as well (see "Commerce" below).
- [ ] **Payment processor**, only if the provider isn't Fourthwall.
- [ ] **Prices.** Seed prices are placeholders: tee $38, oversized tee $44, tank $34, cap $32 (`packages/shared/src/seed/catalog.json`).
- [ ] **Shipping**: destinations, rates, production and delivery times (then update the FAQ "Shipping" answers).
- [ ] **Blank supplier and fabric**: fill `story.material` per product and replace the approximate size charts in `apps/web/src/features/product/size-guide.tsx`.
- [ ] **Legal details**: business entity name and the state whose law governs (`LEGAL` in `apps/web/src/lib/site.ts`).
- [ ] **Social links** (Instagram, TikTok) for the footer.

## Setup (accounts and keys)

- [ ] **GitHub push access.** This session couldn't push: install the Claude GitHub App on `richardsotolongo/awebound`, or push the local `main` yourself.
- [ ] **Supabase project**
  - [ ] Create the project; `supabase link`, then `supabase db push` to apply `supabase/migrations`.
  - [ ] Load products: run `supabase/seed.sql` for the sample catalog, or insert real ones.
  - [ ] API env: `CATALOG_SOURCE=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Web env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - [ ] Authentication → URL configuration: Site URL `https://awebound.store`; redirect URLs `https://awebound.store/auth/callback` and `https://awebound.store/auth/confirm` (plus localhost for development).
  - [ ] Authentication → Emails: paste `supabase/templates/magic-link.html` and `confirmation.html`; subjects as in `supabase/config.toml`.
- [ ] **Google sign-in**
  - [ ] Google Cloud: OAuth consent screen (app name Awebound, logo, privacy and terms URLs), then an OAuth client (Web).
  - [ ] Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
  - [ ] Supabase → Authentication → Providers → Google: paste client id and secret.
- [ ] **Resend**
  - [ ] Verify the `awebound.store` domain (SPF, DKIM, DMARC DNS records).
  - [ ] API key → `RESEND_API_KEY` in the API; set `EMAIL_FROM` (for example `Awebound <hello@awebound.store>`).
  - [ ] Supabase → Authentication → SMTP: host `smtp.resend.com`, port 465, user `resend`, password = API key, sender `no-reply@awebound.store`.
- [ ] **A real inbox for `contact@awebound.store`.** Resend sends mail but doesn't receive it: use Google Workspace, Zoho or forwarding.
- [ ] **Deploy**: web (Vercel or similar) and API (Render, Railway or Fly). Set `WEB_ORIGIN`, `PUBLIC_SITE_URL`, `TRUST_PROXY=1`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`. Point DNS.

## Commerce (after the provider decision)

- [ ] Implement `CheckoutGateway` for the chosen provider in `apps/api/src/infrastructure/commerce/` and select it in `container.ts` from `COMMERCE_PROVIDER`.
- [ ] Printful / Printify / Apliiq only: payment hosted checkout, payment webhook endpoint, and a `FulfillmentGateway` adapter that creates the production order.
- [ ] Migration for `orders` and `order_items` (status, totals, shipping address, provider ids, `user_id` nullable for guests) with RLS so shoppers see only their own orders.
- [ ] Sync provider product and variant ids into `products.provider_product_id` and `product_variants.provider_variant_id` (and availability).
- [ ] Order confirmation and shipping emails; order history on `/account`.
- [ ] Remove the "Checkout opens soon" copy from the FAQ once live.

## Content

- [ ] **Product photography** to replace the sample art in `apps/web/public/products` (back first, then front and details; flat lays on light warm grey per the brand guide).
- [ ] **Legal review** of `/privacy`, `/terms` and `/refunds`. They are drafts written for this setup, not legal advice. Update `LEGAL.lastUpdated` when they change.
- [ ] **NLT permission check** with Tyndale before printing verse text on garments. The site quotes Romans 1:16 (NLT) with the required credit line.
- [ ] **Wordmark cleanup** by a designer before large back prints; physical test of the proposed minimum print (1.75 in) and embroidery (2.25 in) sizes.
- [ ] **Lookbook page**, if wanted (the brand's default header link; left out until there's content).
- [ ] **Unsubscribe link** in drop-note emails before the first marketing send (today people unsubscribe by replying).

## Engineering follow-ups

- [ ] Shared rate-limit store (for example Redis) if the API runs more than one instance.
- [ ] `next/image` with `remotePatterns` once product images come from a provider CDN.
- [ ] Error monitoring (for example Sentry) for web and API.
- [ ] Privacy-friendly analytics, and a matching update to the privacy policy.
- [ ] Accessibility pass with real screen readers (VoiceOver, NVDA) on the journey, filters and bag.
