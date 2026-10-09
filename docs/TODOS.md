# TODOS

What's left before launch, grouped by who has to act. Check items off as they land and keep this file current.

## Next: finish the move to one app (in this order)

The separate Express API (`apps/api`) was folded into the Next.js app. Vercel and Supabase still need to catch up:

1. [ ] **Vercel `awebound-web` project → Settings → Environment Variables** (Production and Preview):
   - add `FOURTHWALL_STOREFRONT_TOKEN`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` (`Awebound <noreply@awebound.store>`) and `CONTACT_INBOX` (`contact@awebound.store`); add `FOURTHWALL_CHECKOUT_DOMAIN` only for a custom shop domain.
   - delete `NEXT_PUBLIC_API_URL` and `API_URL`.
2. [x] **Push to `main`.** Without the token every Behold piece shows as a preview (content prices and mockups, checkout opens soon), so the build no longer depends on it.
3. [ ] **Remove the old API**: delete the `awebound-api` Vercel project (its builds fail now that `apps/api` is gone), remove the `api.awebound.store` domain, and delete its DNS record at the registrar.
4. [ ] **Reset the Supabase database** to the current migrations (the catalog tables were removed): `supabase db reset --linked`, then `supabase migration list --linked` shows helpers, profiles and inbox only. Delete leftover test users under Authentication → Users for a clean slate.

## Decisions for the owner

- [x] **Commerce and fulfillment provider**: Fourthwall (hosted checkout, payments and fulfillment; no separate payment processor). Built and always on; setup is under "Fourthwall" below.
- [x] **First release**: Behold, five tees and a cap, one release instead of pillar collections; the Lamb’s Mark cap closes it.
- [x] **Bible translation**: King James Version, on the pieces and the site. Public domain in the US.
- [ ] **Prices in Fourthwall**: tees $40, Holy Ground $35, the cap $30 (the site shows these from the content file until the products are live in Fourthwall, then Fourthwall's prices).
- [ ] **Shipping**: destinations, rates, production and delivery times (then update the FAQ "Shipping" answers).
- [ ] **Blank supplier and fabric**: fill `story.material` per product and replace the approximate size charts in `apps/web/src/features/product/size-guide.tsx`.
- [ ] **Legal details**: business entity name and the state whose law governs (`LEGAL` in `apps/web/src/lib/site.ts`).
- [ ] **Social links** (Instagram, TikTok) for the footer.

## Setup (accounts and keys)

All variables go in `apps/web/.env.local` locally and in the Vercel project; `apps/web/.env.example` lists them. Never commit real values.

- [x] **GitHub push access.**
- [ ] **Supabase project**
  - [x] Create the project; `supabase link`, then `supabase db push` to apply `supabase/migrations`.
  - [ ] Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
  - [ ] Authentication → URL configuration: Site URL `https://awebound.store`; redirect URLs `https://awebound.store/auth/callback` and `https://awebound.store/auth/confirm` (plus localhost for development).
  - [ ] Authentication → Emails: paste `supabase/templates/magic-link.html` and `confirmation.html`; subjects as in `supabase/config.toml`.
- [ ] **Google sign-in**
  - [ ] Google Cloud: OAuth consent screen (app name Awebound, logo, privacy and terms URLs), then an OAuth client (Web).
  - [ ] Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
  - [ ] Supabase → Authentication → Providers → Google: paste client id and secret.
- [ ] **Resend**
  - [ ] Verify the `awebound.store` domain (SPF, DKIM, DMARC DNS records).
  - [ ] API key → `RESEND_API_KEY`; `EMAIL_FROM` defaults to `Awebound <noreply@awebound.store>`.
  - [ ] Supabase → Authentication → SMTP: host `smtp.resend.com`, port 465, user `resend`, password = API key, sender `no-reply@awebound.store`.
- [ ] **A real inbox for `contact@awebound.store`.** Resend sends mail but doesn't receive it: use Google Workspace, Zoho or forwarding.
- [ ] **Vercel** ([DEPLOYMENT.md](DEPLOYMENT.md)): one project, Root Directory `apps/web`, domain `awebound.store`.

## Fourthwall

Use a Fourthwall shop that belongs to Awebound (not another brand's shop).

- [x] Shop created: `awebound-store-shop.fourthwall.com` (Fourthwall shop "awebound.store"), the default checkout domain. Set `FOURTHWALL_CHECKOUT_DOMAIN` only if you connect a custom domain such as `shop.awebound.store`.
- [x] Storefront token created (Fourthwall admin → Settings → For developers) and set in `apps/web/.env.local`. Add it to Vercel too (step 1 above).
- [ ] **Publish the products.** The shop holds 4 products, but the Storefront API returns none yet, so they aren't public. Publish them (public access, available) in Fourthwall.
- [ ] Create the six Behold products and set each one's URL slug to the site slug in `apps/web/src/server/content/catalog.json` (`holy-ground`, `still-the-storm`, `thorns-to-lilies`, `stone-in-motion`, `to-live-is-christ`, `lambs-mark`), or add `"fourthwallSlug": "<fourthwall-slug>"` to that product's entry. Name colors `Faded black`, `Warm bone`, `Washed sand`, `Washed forest`, `Washed black twill` for brand swatches, and upload photos in the site's order (listing image, hover image, print close-up). New designs need an entry in the content file too (ID, collection, category, Scripture, copy). A product shows on the site only when both exist; the server log lists mismatches as "products without a match are hidden".
- [ ] Name colors like the brand garments (`Washed coal`, `Faded black`, `Warm bone`, …) so the site shows the brand swatches. Other names fall back to Fourthwall's swatch color.
- [ ] Shipping, taxes, order and shipping emails: configure in Fourthwall (it sends them).
- [ ] Place a test order end to end, then refund it in Fourthwall.
- [ ] Copy once live: remove "Checkout is opening soon" from the FAQ, "once checkout opens" from `/privacy` and the account page, and "when checkout opens" from the drop-notes welcome email (`apps/web/src/server/email-templates.ts`); state shipping times, and name Fourthwall as the commerce partner in `/privacy`.
- [ ] Optional: order history on `/account` from Fourthwall's order webhooks (needs an `orders` table and a webhook route).

## Content

- [ ] **Product photography**, uploaded to each Fourthwall product (back first, then front and details; flat lays on light warm grey per the brand guide). The sample art in `apps/web/public/products` only shows for products without Fourthwall photos.
- [ ] **Legal review** of `/privacy`, `/terms` and `/refunds`. They are drafts written for this setup, not legal advice. Update `LEGAL.lastUpdated` when they change.
- [ ] **Update the `awebound-brand` guide**: it still says to quote the NLT, lists the three pillars and their collection families, and calls the Thorn Cross the only cross (Still the Storm, Thorns to Lilies and To Live Is Christ use other crosses). Agents read it, so until then they will steer toward the old rules.
- [ ] **Wordmark cleanup** by a designer before large back prints; physical test of the proposed minimum print (1.75 in) and embroidery (2.25 in) sizes.
- [ ] **Lookbook page**, if wanted (the brand's default header link; left out until there's content).
- [ ] **Unsubscribe link** in drop-note emails before the first marketing send (today people unsubscribe by replying).

## Engineering follow-ups

- [ ] Vercel Firewall rate-limit rule on Server Action POSTs (contact, subscribe, checkout). The in-app limits are per server instance.
- [ ] `next/image` with `remotePatterns` for Fourthwall's image CDN (product photos are plain `<img>` tags today).
- [ ] Error monitoring (for example Sentry).
- [ ] Privacy-friendly analytics, and a matching update to the privacy policy.
- [ ] Accessibility pass with real screen readers (VoiceOver, NVDA) on the journey, filters and bag.
