# TODOS

What's left before launch, grouped by who has to act. Check items off as they land and keep this file current.

## Decisions for the owner

- [x] **Commerce and fulfillment provider**: Fourthwall (hosted checkout, payments and fulfillment; no separate payment processor). Adapters are built; setup is under "Fourthwall" below.
- [ ] **Prices.** Set them in Fourthwall: with `CATALOG_SOURCE=fourthwall` the site shows Fourthwall's prices. The seed prices (tee $38, oversized tee $44, tank $34, cap $32) are placeholders for offline mode only.
- [ ] **Shipping**: destinations, rates, production and delivery times (then update the FAQ "Shipping" answers).
- [ ] **Blank supplier and fabric**: fill `story.material` per product and replace the approximate size charts in `apps/web/src/features/product/size-guide.tsx`.
- [ ] **Legal details**: business entity name and the state whose law governs (`LEGAL` in `apps/web/src/lib/site.ts`).
- [ ] **Social links** (Instagram, TikTok) for the footer.

## Setup (accounts and keys)

- [x] **GitHub push access.**
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
- [ ] **Deploy on Vercel** ([DEPLOYMENT.md](DEPLOYMENT.md)): set the existing project's Root Directory to `apps/web`; create a second project with Root Directory `apps/api`; paste the variables from the root `.env.example`; add `awebound.store` to the web project and `api.awebound.store` to the API; point DNS.

## Fourthwall

Use a Fourthwall shop that belongs to Awebound (not another brand's shop).

- [ ] Create the products in Fourthwall. Set each product's URL slug to the site slug in `packages/shared/src/seed/catalog.json` (`third-morning`, `shattered-dominion`, …), or add `"fourthwallSlug": "<fourthwall-slug>"` to that product's entry. New designs need an entry in the content file too (ID, collection, category, Scripture, copy); then run `pnpm db:seed` if you use Supabase.
- [ ] Name colors like the brand garments (`Washed coal`, `Faded black`, `Warm bone`, …) so the site shows the brand swatches. Other names fall back to Fourthwall's swatch color.
- [ ] Fourthwall admin → Settings → For developers: create a **Storefront token** → `FOURTHWALL_STOREFRONT_TOKEN`.
- [ ] Note the shop's domain (`<shop>.fourthwall.com`, or a custom domain such as `shop.awebound.store` connected in Fourthwall) → `FOURTHWALL_CHECKOUT_DOMAIN`.
- [ ] Set `CATALOG_SOURCE=fourthwall` and `COMMERCE_PROVIDER=fourthwall` on the API; redeploy. Check the API log for "products without a match are hidden" and fix any slugs it lists.
- [ ] Shipping, taxes, order and shipping emails: configure in Fourthwall (it sends them).
- [ ] Place a test order end to end, then refund it in Fourthwall.
- [ ] Copy once live: remove "Checkout is opening soon" from the FAQ, state shipping times, and name Fourthwall as the commerce partner in `/privacy`.
- [ ] Optional: order history on `/account` from Fourthwall's order webhooks (needs an `orders` table and a webhook endpoint).

## Other providers (not planned)

- [ ] Printful / Printify / Apliiq would need a payment processor's hosted checkout, a payment webhook and a `FulfillmentGateway` adapter, plus `orders` / `order_items` tables. Not in scope.

## Content

- [ ] **Product photography** to replace the sample art in `apps/web/public/products` (back first, then front and details; flat lays on light warm grey per the brand guide).
- [ ] **Legal review** of `/privacy`, `/terms` and `/refunds`. They are drafts written for this setup, not legal advice. Update `LEGAL.lastUpdated` when they change.
- [ ] **NLT permission check** with Tyndale before printing verse text on garments. The site quotes Romans 1:16 (NLT) with the required credit line.
- [ ] **Wordmark cleanup** by a designer before large back prints; physical test of the proposed minimum print (1.75 in) and embroidery (2.25 in) sizes.
- [ ] **Lookbook page**, if wanted (the brand's default header link; left out until there's content).
- [ ] **Unsubscribe link** in drop-note emails before the first marketing send (today people unsubscribe by replying).

## Engineering follow-ups

- [ ] Shared rate-limit store (for example Redis) if the API runs more than one instance.
- [ ] `next/image` with `remotePatterns` for Fourthwall's image CDN (product photos are plain `<img>` tags today).
- [ ] Error monitoring (for example Sentry) for web and API.
- [ ] Privacy-friendly analytics, and a matching update to the privacy policy.
- [ ] Accessibility pass with real screen readers (VoiceOver, NVDA) on the journey, filters and bag.
