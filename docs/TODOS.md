# TODOS

What's left before launch, grouped by who has to act. Check items off as they land and keep this file current.

## Decisions for the owner
- [ ] **Legal details**: business entity name and the state whose law governs (`LEGAL` in `apps/web/src/lib/site.ts`).
- [ ] **Social links** (Instagram, TikTok) for the footer.

## Search and AI discovery

- [ ] **Bing Webmaster Tools**: import the site from Search Console and submit the sitemap. Bing's index feeds ChatGPT search and Copilot.
- [ ] **Social profiles**: once Instagram and TikTok exist, add them to the footer and as `sameAs` in the home page's store data (`apps/web/src/app/page.tsx`).
- [ ] **Shipping and returns in product data**: after delivery times and the refund policy are confirmed, add them to the product structured data (`apps/web/src/app/shop/[slug]/page.tsx`).
- [ ] **After the products are published in Fourthwall**: check a product page in Google's Rich Results Test, and consider Google Merchant Center free listings. Until then Search Console reports "missing offers" on product pages, which is expected: a preview carries no offer.

## Fourthwall

Use a Fourthwall shop that belongs to Awebound (not another brand's shop).

- [ ] **Publish the products.** All ten Behold products are in the shop but hidden, so the Storefront API doesn't return them and the site lists them as previews. Publishing them (public access, available) turns on live prices, sizes and checkout.
- [ ] **Signature Cap print method**: its Fourthwall design is a printed transfer on the front (the blank's only area is `front_dtf_hat`), so the site now says the wordmark is printed, not embroidered. If you want it embroidered, switch it to an embroidery blank in Fourthwall and set `process` back to `embroidered` with thread wording in the content file.
- [ ] **Thorns to Lilies description in Fourthwall** says “a larger oversized silhouette”, but it uses the same AS Colour blank as By His Hem and Stone in Motion (the larger cut is the Stanley/Stella on To Live Is Christ and Still the Storm). The site now calls it a regular oversized fit; consider matching the Fourthwall description.
- [ ] **Lamb’s Mark side**: the Fourthwall design has no John 1:29 embroidery on the side (its description mentions it). Add it in the designer if it's meant to be there; the site's copy currently matches the design.
- [ ] Name colors like the brand garments (`Washed coal`, `Faded black`, `Warm bone`, …) so the site shows the brand swatches. Other names fall back to Fourthwall's swatch color.
- [ ] Shipping, taxes, order and shipping emails: configure in Fourthwall (it sends them).
- [ ] Place a test order end to end, then refund it in Fourthwall.
- [x] Copy reads as live everywhere (no preview or “ordering isn’t open” wording) and never names the supplier: customers see “our print and fulfillment partner” or “our checkout partner”.
- [x] Order history on `/account` from Fourthwall's order webhooks: built as My Archive (`docs/ARCHIVE.md`).

## Content

- [ ] **Photos of the clothes being worn.** The site has none yet: the portrait (`apps/web/public/about/richard-*.webp`) is captioned with Richard's name only and isn't a product photo. When samples arrive, photograph them worn (Richard and people he knows, with their consent; daylight; whole garment, back print and close-ups of the print), then replace the portrait and, if wanted, the home page's opening image.
- [ ] **Product photography** of real samples, uploaded to each Fourthwall product. Whenever a product's images change in Fourthwall, update its list in `assets/mockups/fourthwall.json` (same order as Fourthwall) and run `fourthwall.py` and `compose.py`; the site follows that order, the first as the listing image.
- [ ] **Legal review** of `/privacy`, `/terms` and `/refunds`. They are drafts written for this setup, not legal advice. Update `LEGAL.lastUpdated` when they change.
- [ ] **Wordmark cleanup** by a designer before large back prints; physical test of the proposed minimum print (1.75 in) and embroidery (2.25 in) sizes.
- [ ] **Unsubscribe link** in drop-note emails before the first marketing send (today people unsubscribe by replying).

## Engineering follow-ups

- [ ] **Internal design codes in page source.** Nothing visible shows them, and titles, descriptions, structured data, the sitemap and `llms.txt` are clean, but the data Next sends with the shop and product pages still carries `code` (and preview SKUs built from it) inside client-component props; the home page no longer does. Strip `code` before a product reaches a Client Component (`ProductGrid`, `ProductPurchase`) and give previews SKUs that don't contain it.
- [ ] **When Fourthwall is unreachable** the home page falls back to the headline, the founder's note and the sign-up, but a product page shows the error page titled “Not found”, `/collections/behold` returns 404, and a page regenerated during the outage can be cached for a minute. Consider a content-only fallback.
- [ ] **After a purchase** the bag isn't cleared and there's no return page from Fourthwall's checkout. Notify sign-ups don't record whether someone asked about “ordering opens” or “back in stock”, and nothing sends either email yet.
- [ ] **Latest Drop follows the content's release date**, so adding a Release 02 that is still in preview would replace a Release 01 that can be ordered on the home page. Decide the rule before the second release.
- [ ] Vercel Firewall rate-limit rule on Server Action POSTs (contact, subscribe, checkout). The in-app limits are per server instance.
- [ ] `next/image` with `remotePatterns` for Fourthwall's image CDN (product photos are plain `<img>` tags today), and smaller sources for tiles and thumbnails (every size shows the 1000×1250 file).
- [ ] **View transitions in Safari and Firefox.** The morph and the neighbour slide were checked in Chrome only. Both browsers support same-document view transitions (Safari 18, Firefox 144); without support navigation is simply instant.
- [ ] **Shared JavaScript.** The Supabase browser client (about 66 KB gzip) loads on every page through the header and the bag; load it only where an account is used. The wordmark's path is also inlined two or three times per page.
- [ ] **Lamb's Mark cut-out** (`piece.webp`) is 154 KB: its distressed twill doesn't compress. It only loads if that cap leads the home page.
- [ ] Error monitoring (for example Sentry).
- [ ] Privacy-friendly analytics, and a matching update to the privacy policy.
- [ ] Accessibility pass with real screen readers (VoiceOver, NVDA) on the journey, filters and bag.
