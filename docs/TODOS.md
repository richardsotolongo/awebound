# TODOS

Open work, grouped by who has to act. Delete an item when it's done.

## Stage environment

- [ ] **One-time setup**: `docs/DEPLOYMENT.md` → Setting up stage (the stage Supabase project, the Vercel Deploy Hook and Preview variables, the GitHub secrets, the `stage` branch and the `stage.awebound.store` domain). Until it's done, previews use production's database.

## Decisions for the owner

- [ ] **Legal details**: business entity name and the state whose law governs (`LEGAL` in `apps/web/src/lib/site.ts`; `businessName` is the brand name and `governingLaw` is unset).

## Fourthwall

- [ ] **Publish the products.** All ten Behold products are in the shop but hidden, so the Storefront API doesn't return them and the site lists them as previews. Publishing them (public access, available) turns on live prices, sizes and checkout.
- [ ] Place a test order end to end, then refund it in Fourthwall.
- [ ] **Webhook events**: add `PRODUCT_CREATED`, `PRODUCT_UPDATED` and `COLLECTION_UPDATED` to the existing webhook (Settings → For developers → Webhooks), so price, stock and product changes show at once.

## Catalog

- [ ] **Run the catalog migration** (`supabase/migrations/20261018000000_catalog.sql`) on stage, then production (the workflows do it). It copies Behold from `catalog.json`; after it, catalog changes are made in Admin, not in the file.
- [ ] **New plate tokens**: a piece imported with a plate token the brand tokens lack shows its surface from the color read off its plate image. Add the token to `packages/brand/src/styles/tokens.css` and `PLATE_HEX` (`packages/brand/src/hex.ts`) when convenient, and new garment colors to `colors` in `catalog.json` and `tokens.css`.

## Search and AI discovery

- [ ] **Bing Webmaster Tools**: import the site from Search Console and submit the sitemap. Bing's index feeds ChatGPT search and Copilot.
- [ ] **Guides**: the unlisted pages under `/christian-apparel` name pieces in their copy (`apps/web/src/features/guides/guides.ts`). Review them when a release adds or retires a piece, and add symbol labels for new pieces.
- [ ] **Shipping and returns in product data**: delivery times (`apps/web/src/lib/delivery.ts`) and the 30-day refund policy (`/refunds`) are set; add them to the product structured data as `shippingDetails` and `hasMerchantReturnPolicy` (`apps/web/src/app/shop/[slug]/page.tsx`).
- [ ] **After the products are published in Fourthwall**: check a product page in Google's Rich Results Test, and consider Google Merchant Center free listings. Until then Search Console reports "missing offers" on product pages, which is expected: a preview carries no offer.

## Content

- [ ] **Photos of the clothes being worn.** The site has none: the portrait (`apps/web/public/about/richard-*.webp`) is captioned with Richard's name only and isn't a product photo. When samples arrive, photograph them worn (Richard and people he knows, with their consent; daylight; whole garment, back print and close-ups of the print), then replace the portrait and, if wanted, the home page's opening image.
- [ ] **Product photography** of real samples, uploaded to each Fourthwall product. When a product's images change in Fourthwall, run `fourthwall.py --sync <piece>` (public products; for hidden ones, edit its list in `assets/mockups/fourthwall.json` by hand), then `fourthwall.py <piece>` and `compose.py <piece>`. The site follows Fourthwall's order, the first as the listing image.
- [ ] **Wallpaper masters**: the two wallpapers in `assets/wallpapers/` (`brand-phone.jpg`, `brand-desktop.jpg`) are JPEG previews (472 × 1024 and 1024 × 640), assigned to no design. PNG masters at full resolution go on the My Archive Assets page or through `archive:intake` (`docs/ARCHIVE.md`).
- [ ] **Legal review** of `/privacy`, `/terms` and `/refunds`, including the analytics paragraph in `/privacy`. They are drafts written for this setup, not legal advice. Update `LEGAL.lastUpdated` when they change.
- [ ] **Wordmark cleanup** by a designer before large back prints; physical test of the proposed minimum print (1.75 in) and embroidery (2.25 in) sizes.
- [ ] **Unsubscribe link** in drop-note emails before the first marketing send (today people unsubscribe by replying).

## Security

- [ ] **Rotate keys that were ever committed.** Earlier commits matched a Fourthwall storefront token and a Resend key pattern. Issue new ones, update Vercel, and revoke the old ones.

## Engineering follow-ups

- [ ] Founding Members' 5-day early access to each new release (the owner's choice, October 2026). A database change for the developer: see the brief "Founding Members: 5-day early access". The Founding tab already lists "Early access to collections, to be announced" (`FOUNDING_PERKS`, features/archive/offer.ts); when it ships, reword that line and add it to the FAQ answer and the seal rules.

- [ ] **Internal design codes in page source.** Nothing visible shows them, and titles, descriptions, structured data, the sitemap and `llms.txt` are clean, but the data Next sends with the shop and product pages carries `code` (and preview SKUs built from it) inside client-component props, and `ProductPurchase` copies it into the bag line. Strip `code` before a product reaches a Client Component (`ProductGrid`, `ProductPurchase`) and give previews SKUs that don't contain it.
- [ ] **When Fourthwall is unreachable** the home page falls back to the headline and the founder's note, but a product page shows the error page titled “Not found”, `/collections/behold` returns 404, and a page regenerated during the outage can be cached for a minute. Consider a content-only fallback.
- [ ] **After a purchase** the bag isn't cleared. Fourthwall's checkout never returns the buyer; a guest's browser keeps the cart id and the band under the header thanks them once the order arrives (signed-in buyers get no such note). Notify sign-ups don't record whether someone asked about “ordering opens” or “back in stock”, and nothing sends either email.
- [ ] **Latest Drop follows the content's release date**, so adding a Release 02 that is still in preview would replace a Release 01 that can be ordered on the home page. Decide the rule before the second release.
- [ ] Vercel Firewall rate-limit rule on Server Action POSTs (contact, subscribe, checkout). The in-app limits are per server instance.
- [ ] **Smaller images**: tiles and thumbnails load the full 1000×1250 product file (`/products/<slug>/N.webp`, plain `<img>` tags). Give them smaller sources (`srcset`, or `next/image`).
- [ ] **View transitions in Safari and Firefox.** The morph and the neighbour slide were checked in Chrome only. Both browsers support same-document view transitions (Safari 18, Firefox 144); without support navigation is simply instant.
- [ ] **Shared JavaScript.** The Supabase browser client (about 66 KB gzip) loads on every page through the header, the bag and the root providers (PostHog identify); load it only where an account is used. The wordmark's path is also inlined two or three times per page.
- [ ] **Lamb's Mark cut-out** (`apps/web/public/products/lambs-mark/piece.webp`) is 184 KB: its distressed twill doesn't compress. The home page's opening plate shows every piece in turn, so it loads whenever the rotation reaches that cap.
- [ ] **Session replay** stays off (`disable_session_recording`) until it has had a legal review; turning it on also needs a Privacy page update.
- [ ] **EU and UK visitors**: the analytics cookie is set without a banner. If that traffic matters, ask for consent first (PostHog's `cookieless_mode: "on_reject"` counts the visitors who decline without a cookie).
- [ ] **PostHog person data**: PostHog gets only the Supabase user id. If an email or name is ever added, deleting an account must also delete the PostHog person.
- [ ] **Purchases in analytics**: the funnel ends at `checkout_started` because payment happens on Fourthwall. An `order_placed` event from the Fourthwall webhook (server side) would close it.
- [ ] **Readable production stack traces**: upload source maps to PostHog error tracking.
- [ ] **PostHog data warehouse**: the setup wizard started Supabase and Resend connections and they were left unfinished. Finishing them copies account and email data into PostHog, which the Privacy page would have to say; otherwise delete them.
- [ ] Accessibility pass with real screen readers (VoiceOver, NVDA) on the journey, filters and bag.
