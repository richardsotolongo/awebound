# TODOS

What's left before launch, grouped by who has to act. Check items off as they land and keep this file current.

## Next: finish the move to one app (in this order)

The separate Express API (`apps/api`) was folded into the Next.js app. Vercel and Supabase still need to catch up:

1. [ ] **Vercel `awebound-web` project → Settings → Environment Variables** (Production and Preview):
   - add `FOURTHWALL_STOREFRONT_TOKEN`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` (`Awebound <noreply@awebound.store>`) and `CONTACT_INBOX` (`contact@awebound.store`); add `FOURTHWALL_CHECKOUT_DOMAIN` only for a custom shop domain.
   - delete `NEXT_PUBLIC_API_URL` and `API_URL`.
2. [x] **Push to `main`.** Without the token every Behold piece shows as a preview (content prices and mockups, checkout opens soon), so the build no longer depends on it.
3. [ ] **Remove the old API**: delete the `awebound-api` Vercel project (its builds fail now that `apps/api` is gone), remove the `api.awebound.store` domain, and delete its DNS record at the registrar.
4. [ ] **Reset the Supabase database** to the current migrations (the catalog tables were removed; the migrations now grant table access explicitly): `supabase db reset --linked`, then `supabase migration list --linked` shows helpers, profiles, inbox and account_deletion. Delete leftover test users under Authentication → Users for a clean slate. If you'd rather not reset, at least run `supabase db push` so account deletion can remove drop-notes rows.
5. [ ] **Update the hosted sign-in emails**: the templates in `supabase/templates/` were redesigned to match the site's emails. Run `supabase config push`, or paste `magic-link.html` and `confirmation.html` into Authentication → Emails. Check that the Site URL there is the live site, since the wordmark in these emails loads from `{{ .SiteURL }}/email/wordmark-oxblood.png`.

## Decisions for the owner

- [x] **Commerce and fulfillment provider**: Fourthwall (hosted checkout, payments and fulfillment; no separate payment processor). Built and always on; setup is under "Fourthwall" below.
- [x] **First release**: Behold, ten pieces: five oversized tees, three hoodies (Torn Veil, The Passage, Wonderfully Made) and two caps (Lamb’s Mark, Signature Cap), one release instead of pillar collections. By His Hem replaced Holy Ground (October 2026).
- [x] **Bible translation**: the website quotes the NIV (one Scripture record per piece in the content file; `SCRIPTURE_TRANSLATION=KJV` switches back). The printed designs keep their approved lettering, some of it in King James wording.
- [ ] **NIV permission (before launch)**: submit Biblica's Permission Request Form (biblica.com/permissions) for website use, confirm the exact copyright notice they want (the site shows the standard one in the footer, FAQ and Terms), and ask for merchandise permission for **By His Hem**, whose back prints the NIV wording of Matthew 9:21. Until it's granted you can set `SCRIPTURE_TRANSLATION=KJV` in Vercel to keep NIV text off the public site.
- [x] **Founder story**: About has Richard's portrait and a short first-person note from his own words (Florida native, Christian, living for Christ as his sole purpose, Awebound as one branch of being used by God). Edit it in `apps/web/src/app/about/page.tsx`.
- [x] **Prices in Fourthwall**: oversized tees $40 (2XL $42, 3XL $44), Lamb’s Mark $30, the Signature Cap $25. The content file mirrors them (`priceCents` and `sizePriceCents`) for previews; once the products are live, Fourthwall's prices show.
- [x] **Hoodie prices**: Torn Veil, The Passage and Wonderfully Made are $60 in Fourthwall (2XL $62, 3XL $64), matched in the content file.
- [ ] **Shipping**: destinations, rates, production and delivery times. Once confirmed, set `productionTime` and `shippingTime` in `apps/web/src/lib/delivery.ts` (the product pages show them beside the buy button) and update the FAQ "Shipping" answers.
- [x] **Blank supplier and fabric**: confirmed from Fourthwall's product details. Thorns to Lilies, By His Hem and Stone in Motion are on the AS Colour 5052 Middleweight Oversized T-shirt (S–3XL); To Live Is Christ and Still the Storm on the Stanley/Stella SATU020 Organic Oversized T-shirt (S–2XL; Fourthwall calls it EU sizing, but you wore your usual size, so the site gives no size-up advice and the note is cut from its guide image); the three hoodies on the AS Colour 5161 Premium Relaxed Hoodie (S–3XL); Lamb’s Mark on the Otto 104-1018 Distressed Dad Hat (Low-Profile Adjustable Cap guide); the Signature Cap on the Otto 31-069 Mid-Profile Cap (Mid-Profile Snapback Cap guide). Fabric is in each `story.material`; the size guides are your images, with their measurements in `sizeGuides` in the content file. If a product moves to a different blank, update its `sizeGuide`, `material` and the guide image.
- [ ] **Legal details**: business entity name and the state whose law governs (`LEGAL` in `apps/web/src/lib/site.ts`).
- [ ] **Social links** (Instagram, TikTok) for the footer.

## Setup (accounts and keys)

All variables go in `apps/web/.env.local` locally and in the Vercel project; `apps/web/.env.example` lists them. Never commit real values.

- [x] **GitHub push access.**
- [ ] **Supabase project**
  - [x] Create the project; `supabase link`, then `supabase db push` to apply `supabase/migrations`.
  - [ ] Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
  - [x] Authentication → URL configuration: Site URL `https://www.awebound.store`; redirect URLs `https://www.awebound.store` and `https://www.awebound.store/**` (plus localhost for development).
  - [ ] Authentication → Emails: paste `supabase/templates/magic-link.html` and `confirmation.html` (or `supabase config push`); subjects as in `supabase/config.toml`.
- [ ] **Google sign-in**
  - [ ] Google Cloud: OAuth consent screen (app name Awebound, logo, privacy and terms URLs), then an OAuth client (Web).
  - [ ] Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
  - [ ] Supabase → Authentication → Providers → Google: paste client id and secret.
- [ ] **Resend**
  - [ ] Verify the `awebound.store` domain (SPF, DKIM, DMARC DNS records).
  - [ ] API key → `RESEND_API_KEY`; `EMAIL_FROM` defaults to `Awebound <noreply@awebound.store>`.
  - [ ] Supabase → Authentication → SMTP: host `smtp.resend.com`, port 465, user `resend`, password = API key, sender `no-reply@awebound.store`.
- [ ] **A real inbox for `contact@awebound.store`.** Resend sends mail but doesn't receive it: use Google Workspace, Zoho or forwarding.
- [ ] **Vercel** ([DEPLOYMENT.md](DEPLOYMENT.md)): one project, Root Directory `apps/web`, domain `www.awebound.store` (`awebound.store` redirects to it).

## Search and AI discovery

The site publishes `robots.txt`, `sitemap.xml`, `llms.txt`, canonical links and structured data, all built from `NEXT_PUBLIC_SITE_URL`.

- [ ] **Set `NEXT_PUBLIC_SITE_URL=https://www.awebound.store` in Vercel** (Production and Preview) before the next deploy. It was unset, so the live sitemap, canonical links and share images pointed to `localhost`. A production build now fails without it.
- [ ] **Vercel → Firewall → Bot Management**: confirm the AI bots ruleset isn't blocking crawlers. `robots.txt` allows every search and AI crawler.
- [ ] **Google Search Console**: add `awebound.store` as a domain property (a DNS TXT record, no code) and submit `https://www.awebound.store/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: import the site from Search Console and submit the sitemap. Bing's index feeds ChatGPT search and Copilot.
- [ ] **Ask AI links** (footer): click each one now and then. The `?q=` links are not documented by the assistants; remove one from `apps/web/src/components/ask-ai.tsx` if it stops opening with the question written.
- [ ] **Social profiles**: once Instagram and TikTok exist, add them to the footer and as `sameAs` in the home page's store data (`apps/web/src/app/page.tsx`).
- [ ] **Shipping and returns in product data**: after delivery times and the refund policy are confirmed, add them to the product structured data (`apps/web/src/app/shop/[slug]/page.tsx`).
- [ ] **After the products are published in Fourthwall**: check a product page in Google's Rich Results Test, and consider Google Merchant Center free listings. Until then Search Console reports "missing offers" on product pages, which is expected: a preview carries no offer.

## Fourthwall

Use a Fourthwall shop that belongs to Awebound (not another brand's shop).

- [x] Shop created: `awebound-store-shop.fourthwall.com` (Fourthwall shop "awebound.store"), the default checkout domain. Set `FOURTHWALL_CHECKOUT_DOMAIN` only if you connect a custom domain such as `shop.awebound.store`.
- [x] Storefront token created (Fourthwall admin → Settings → For developers) and set in `apps/web/.env.local`. Add it to Vercel too (step 1 above).
- [ ] **Publish the products.** All ten Behold products are in the shop but hidden, so the Storefront API doesn't return them and the site lists them as previews. Publishing them (public access, available) turns on live prices, sizes and checkout.
- [x] The ten Behold products exist in Fourthwall and each content entry carries its `fourthwallSlug` (e.g. `thorns-to-lillies-tee`). Colors use Fourthwall's names (`Ecru`, `French Navy`, `Black`, `Cypress`, `Carolina Blue`), mapped to brand swatch tokens. A new design needs an entry in the content file too (ID, collection, category, Scripture, copy); the server log lists mismatches.
- [x] **Hoodie back prints**: Torn Veil and The Passage now carry their lettering on the lower half of the back, clear of the hood. On Wonderfully Made the hood edge still touches the top of "Fearfully" in Fourthwall's render; worth a look on a sample.
- [ ] **Signature Cap print method**: its Fourthwall design is a printed transfer on the front (the blank's only area is `front_dtf_hat`), so the site now says the wordmark is printed, not embroidered. If you want it embroidered, switch it to an embroidery blank in Fourthwall and set `process` back to `embroidered` with thread wording in the content file.
- [ ] **Thorns to Lilies description in Fourthwall** says “a larger oversized silhouette”, but it uses the same AS Colour blank as By His Hem and Stone in Motion (the larger cut is the Stanley/Stella on To Live Is Christ and Still the Storm). The site now calls it a regular oversized fit; consider matching the Fourthwall description.
- [ ] **Lamb’s Mark side**: the Fourthwall design has no John 1:29 embroidery on the side (its description mentions it). Add it in the designer if it's meant to be there; the site's copy currently matches the design.
- [ ] Name colors like the brand garments (`Washed coal`, `Faded black`, `Warm bone`, …) so the site shows the brand swatches. Other names fall back to Fourthwall's swatch color.
- [ ] Shipping, taxes, order and shipping emails: configure in Fourthwall (it sends them).
- [ ] Place a test order end to end, then refund it in Fourthwall.
- [ ] Copy once live: the release-status labels and preview messages switch on their own when every Behold piece is in Fourthwall. Still by hand: "once checkout opens" in `/privacy` and the account page, "when checkout opens" in the welcome email (`apps/web/src/server/email-templates.ts`), shipping times (`lib/delivery.ts`), and naming Fourthwall as the commerce partner in `/privacy`.
- [ ] Optional: order history on `/account` from Fourthwall's order webhooks (needs an `orders` table and a webhook route).

## Content

- [ ] **Product photography** of real samples, uploaded to each Fourthwall product. Whenever a product's images change in Fourthwall, update its list in `assets/mockups/fourthwall.json` (same order as Fourthwall) and run `fourthwall.py` and `compose.py`; the site follows that order, the first as the listing image.
- [ ] **Legal review** of `/privacy`, `/terms` and `/refunds`. They are drafts written for this setup, not legal advice. Update `LEGAL.lastUpdated` when they change.
- [x] **Save the updated `awebound-brand` guide**: the skill lives in `.claude/skills/awebound-brand` (SKILL.md is the same text as `docs/BRAND.md`), with its references, tokens, components and post template matched to the site. After brand code changes, run its `scripts/sync-from-site.mjs`.
- [ ] **Wordmark cleanup** by a designer before large back prints; physical test of the proposed minimum print (1.75 in) and embroidery (2.25 in) sizes.
- [ ] **Lookbook page**, if wanted (the brand's default header link; left out until there's content).
- [ ] **Unsubscribe link** in drop-note emails before the first marketing send (today people unsubscribe by replying).

## Engineering follow-ups

- [ ] **Internal design codes in page source.** Nothing visible shows them, and titles, descriptions, structured data, the sitemap and `llms.txt` are clean, but the data Next sends with the home page, the shop and product pages still carries `code` (and preview SKUs built from it) inside client-component props. Strip `code` before a product reaches a Client Component (`DesignStory`, `ProductGrid`, `ProductPurchase`) and give previews SKUs that don't contain it.
- [ ] Vercel Firewall rate-limit rule on Server Action POSTs (contact, subscribe, checkout). The in-app limits are per server instance.
- [ ] `next/image` with `remotePatterns` for Fourthwall's image CDN (product photos are plain `<img>` tags today).
- [ ] Error monitoring (for example Sentry).
- [ ] Privacy-friendly analytics, and a matching update to the privacy policy.
- [ ] Accessibility pass with real screen readers (VoiceOver, NVDA) on the journey, filters and bag.
