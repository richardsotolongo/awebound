# Awebound brand

> This is the repo copy of the `awebound-brand` skill's guide. Keep the two in step.

Awebound is an independent Christian apparel brand, founded by Richard, for believers aged 18 to 30 who are not ashamed to express their faith and want to wear it boldly. Awebound makes clothing rooted in Scripture and reverence for Jesus Christ: every piece tells part of His story in bold art and lettering. The range covers tees, oversized tees, hoodies, tank tops and hats, with more to come.

Tagline: **Bound in awe. Worn without shame.** (Romans 1:16 is behind the second half.)

The look is a dark coal shop with a hint of dark metal: layered near-blacks, sharp edges, thorn rules and gothic display type, broken by warm-bone panels that carry the oxblood wordmark. The test for every piece of work is that a pastor and a metalhead should both find it beautiful.

**This file is the current guide (October 2026).** Where anything in `references/` or `assets/` disagrees with it, this file wins: those files still describe the earlier plan (three pillars and collection families, NLT quotations, Cinzel and Archivo, "the only cross"). The living implementation is `packages/brand` and `apps/web` in the `richardsotolongo/awebound` repo (rules mirrored in `docs/BRAND.md`); match it when building for the site.

## Non-negotiables

Break one and the work is off-brand no matter how good it looks.

1. **The wordmark is artwork, never type.** Use the wordmark SVG (`assets/logos/awebound-wordmark.svg`, single path, `currentColor`) or the `Wordmark` component. Never set AWEBOUND in a font, never split the lettering from its thorn branches, and never claim a website font is its typeface. Minimum 120px wide on screen; smaller than that, use the small Thorn Cross.
2. **Signature lockup = oxblood `#782B35` on warm bone `#E8DDC9`** for brand moments (hang tags, labels, packaging, About page, email headers, avatar). On the dark site the header uses bone on coal.
3. **Crosses stay upright and whole.** The Thorn Cross (a two-plank wooden cross with a thorn wreath orbiting at 45°) is the brand mark. Release artwork may carry its own simple cross (the cross on the horizon in Still the Storm, inside the wreath in Thorns to Lilies, in the hourglass in To Live Is Christ). Never tilted, broken or underfoot; no budded crosses, no four-point stars, no crucifix figure.
4. **Symbols only.** A stilled sea, the edge of His cloak, thorns and lilies, the torn veil, the empty tomb and rolled stone, the hourglass, the Lamb, broken chains, arches. The Lamb is a biblical symbol, not a portrait. The hand in By His Hem is the woman's, reaching for His cloak; never draw His. Never depict Jesus (face, silhouette, hands), God the Father or the Spirit as a person; no gore, skulls or occult symbols.
5. **Scripture is quoted exactly.** See "Scripture" below: full references, NIV wording on the website, labels that say when a quote is an excerpt, and printed garment lettering left as approved.
6. **Internal design codes stay internal.** IDs such as A3-B01 or A3-H01 live in records, SKUs, assets and orders. Never show them to customers: not on cards, product headings, badges, related pieces, search results, bag lines or metadata. Customers know a piece by its name, artwork and Scripture.
7. **Say "Christian apparel", never "streetwear".** Use Christian apparel, clothing, pieces or Awebound, in headings, descriptions, About, FAQ and page metadata. Fit words such as "oversized" belong in product details and sizing.
8. **Oxblood is a fill, not text on dark** (1.9:1 on coal). Accent text on dark is Copper 300 `#C47A55`; Scripture references are gold `#B89651`.
9. **Tokens, not hex.** In code, style through the CSS variables (`packages/brand/src/styles/tokens.css`, or `assets/tokens.css` outside the repo). Hex values appear only in token files.

## Scripture

- **References**: full book name, chapter, colon, verse: "Matthew 9:21", "1 Corinthians 3:6", ranges with an en dash.
- **Website quotations use the NIV**, word for word with its punctuation, from an authorized NIV source. Never paraphrase and present it as a quote; never invent or "tidy" wording. An excerpt ends where the quoted part ends, without added punctuation.
- **Label** every quotation with the reference, then the translation: `Mark 4:41 — NIV`; when only part of the verse is quoted, `Matthew 9:21 — NIV, excerpt`.
- **Presentation**: the words in Cormorant Garamond Italic inside curly double quotes; quotation marks inside the verse become single quotes (“They asked each other, ‘Who is this?’”). The reference sits beneath in upright type. Quotes wrap in full on every screen: never truncate with an ellipsis or shrink them to equalize card heights.
- **One shared Scripture record per piece** (reference, excerpt flag, exact NIV and KJV text) feeds the home page, shop cards and product page, so they always agree. In the site this is `scripture` in `apps/web/src/server/content/catalog.json`; site-wide verses live in `verses.json`. `SCRIPTURE_TRANSLATION` (NIV by default, or KJV) switches every quotation and translation statement at once.
- **Garment artwork keeps its approved lettering.** Some prints use King James wording (Still the Storm's back, Stone in Motion's back); By His Hem's back prints NIV wording, which needs Biblica's merchandise permission. Never translate, regenerate or relabel printed art as NIV; describe printed text accurately ("Mark 4:41 in the King James wording"), and keep image descriptions true to what the image shows.
- **Permission and notice**: website use of the NIV needs Biblica's written permission (biblica.com/permissions) before launch, and every page that quotes it carries the notice (the site puts it in the footer): "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide." Use the exact wording Biblica supplies. Merchandise that prints NIV text needs its own permission.
- About and FAQ state the website translation plainly: "Scripture quoted on this website is from the New International Version (NIV)."
- In brand prose, pronouns for God are capitalized (His mercy, He is risen). Quotations keep their translation's own casing.

## Typography

Three families, each with one job. Load only the files used, self-hosted, with fallbacks.

| Role               | Family                                                    | Use                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display            | **Grenze Gotisch** (variable, ~600)                       | The hero headline, collection names ("Behold"), selected major headings. Mixed case for headings; the hero headline alone is set in caps (BOUND IN AWE. / WORN WITHOUT SHAME.). Prominent and restrained so it supports the wordmark. |
| Scripture          | **Cormorant Garamond Italic 500** (a genuine italic file) | Quotations only. About 23px beside a product name, 19px in cards, up to 30px for a featured verse; no added letter spacing; line height about 1.4.                                                                                    |
| Body and interface | **Manrope** (variable)                                    | Paragraphs (16–18px, generous line height), navigation, labels, buttons, prices, filters, forms, sizing, shipping, Scripture references, and product names (800 weight, caps, slight tracking).                                       |

Avoid gothic type for paragraphs, sizing, numbers and roman numerals (they turn to blackletter shapes; set numerals in Manrope); stretching or compressing any font to imitate the wordmark; distressed effects; heavy letter spacing in Scripture; a fourth decorative face.

## Releases and the shop

- A **release** (a collection in code) is a small set of pieces drawn from one call in Scripture, numbered in order: Release 01 is **Behold** (five oversized tees, a hoodie and a cap): "Seven pieces that ask you to look at Jesus, and keep looking." The name comes from John 1:29 (older English Bibles begin John's words with "Behold"; the NIV says "Look").
- **Latest Drop** always means the newest release with pieces on the site, worked out from the catalog, never hard-coded. Say "Latest Drop", not "New Collection".
- The shop has two selectors that combine: **Collection** (Latest Drop, All Collections, then each release by name) and **Category** (All Products, Tees, Oversized Tees, Hoodies, Hats). Show accurate counts and a clear active state, an empty state that says what is missing with a reset, and shareable URLs (`/shop?collection=behold&category=hats`; `/collections/<slug>` opens the shop filtered to it).
- The main navigation is Shop, Collections, About, Contact. **Collections** lists only releases that exist: never fictional or empty "coming soon" collections.
- **Release status**. While a release is in preview (its pieces aren't orderable yet): show "Release 01 — Behold — Coming Soon" by the opening buttons; buttons read **Explore Behold** and **Get Release Updates** (to the email sign-up); product pages say "Ordering isn’t open yet", the button reads **Save to bag**, and the bag explains that it saves selections on this device and doesn't place an order or charge anyone. Never announce a launch date until it is confirmed. Once ordering opens, labels switch (Shop Behold, Add to bag, Check out) and preview messages go.

## Presenting a piece

- **Card** (home grid, shop, related): the whole garment showing its main artwork; garment type and price; the name; the NIV quote and its label. The card links to the product page. No color subtitle ("Tee · Faded black") and no code.
- **Product page**, top to bottom: release and garment type; the name; the quote and its label beside the name (not repeated lower down); price; color (name beside the swatch) and size with a size guide; Save to bag or Add to bag; **delivery and returns** in brief; the design story (theme, the call such as "Behold His mercy", what the art shows and what it means); **Product details** (garment, fit, color, front, back, inks or thread, fabric).
- **Delivery and returns summary** beside the buy button: made to order; production time and shipping time stated separately; how shipping is charged (calculated at checkout for the address, shown before paying); links to the size guide and the return policy; the difference between a problem with an order (misprint, damage or wrong item reported within 30 days with a photo: replaced or refunded) and a size that doesn't fit (made to order, so no returns or exchanges for size). Only confirmed details: until production and shipping times are confirmed, say they will be confirmed before ordering opens.
- Selected size and color always show in the bag and order summary; cut, fit and fabric in Product details; measurements and sizing advice in the size guide.

## Home page order

1. Garment-led hero: the clothes beside the label CHRISTIAN APPAREL, the headline, the brand paragraph ("Awebound makes clothing rooted in Scripture and reverence for Jesus Christ. Every piece tells part of His story in bold art and lettering, from the storm He calmed to the tomb He left empty."), the release status and its two buttons.
2. A short introduction to the latest release: its theme and its connection to Scripture.
3. Every piece in the release, in its order.
4. Two featured design stories: the piece hanging in a pointed stone niche in its own color (the garment drifts slightly against the niche on scroll; still under reduced motion), the moment in Scripture and how the artwork carries it.
5. A concise founder story.
6. The release sign-up: a clear reason to leave an email (hear when the release can be ordered).

Motion is short and never hides words: decoration may draw or move, but artwork, Scripture and buttons stay readable throughout (no long fades, nothing starting near invisible), anchors land below the sticky header, and reduced-motion settings get still, complete pages. Test on phones as well as desktop.

## Imagery and product photos

- Product images are **styled mockups** until real samples are photographed: a clean cutout of the approved mockup on its own surface, with a soft realistic shadow and enough contrast to set the garment apart. The set shares the 4:5 canvas, margins and garment scale (tees about three quarters of the width) so the grid reads as one family; each piece gets its own surface, a color drawn from its artwork with its own texture and light, so every piece looks distinct.
- Behold surfaces: Still the Storm, deep storm slate with cloud-soft texture lit from above; By His Hem, muted sage plaster (the rust print's complement); Thorns to Lilies, deep oxblood plaster under a spotlight; Torn Veil, warm parchment crossed by a shaft of light; Stone in Motion, dusty cornflower stone with a fine speckle; To Live Is Christ, warm ochre plaster lit from above; Lamb's Mark, cool bone linen with a narrow oxblood band at the base.
- Home design stories use a rendered scene per piece: the garment hanging in a pointed stone niche in its surface color (`story-niche.webp` and `story-piece.webp` beside each piece's images). No line art behind the pieces.
- The product stays the focal point: preserve the artwork and garment colors exactly; the listing image always shows the whole garment; artwork crops are secondary images; no props or textures over the print; no fog, dramatic effects, glows or white outlines; clean garment edges. Changing the page color doesn't fix an embedded white background: cut the garment out and composite it.
- Keep the source mockups intact. In the repo, `assets/mockups/source` holds the originals, `cutout.py` makes the cutouts and `compose.py` builds the site images.
- New apparel art: symbols only (above), engraved line work, bone, black, deep red and the occasional single accent ink (Stone in Motion's cobalt).

## Voice

Reverent, weighty, sure of itself: short sentences, concrete images from Scripture, no sermons, no exclamation marks, no hype words ("insane", "fire", "drip"), no fear or guilt ("Don't be lukewarm"). Sentence case in copy (buttons display caps through styling; button and selector labels may be title case, as in Explore Behold, Latest Drop). Emoji only in social captions, at most one.

- **Design and meaning get equal attention.** Talk about the art, lettering and garment plainly, and let the Scripture and its meaning carry the faith.
- **Conversations about Christ are a natural outcome**, not the sales pitch: when someone asks what a piece means, the wearer gets to answer. "We plant the seed; God makes it grow" (1 Corinthians 3:6).
- **Bound in awe**: held by who He is, letting reverence for Jesus Christ shape what we make and wear. **Worn without shame**: not ashamed of the gospel.
- **Founder story**: use only Richard's own stated words. He started Awebound for people who are not ashamed to express their faith and want to wear it boldly; he built it with faith at the forefront of every design; every design tells a story about our Lord and Savior, Jesus Christ; the hope is that each piece starts a conversation about Him. About himself (the first-person note and portrait on About): a Florida native and a Christian; his faith in God comes first; living for Christ is his sole purpose and priority in life; creating Awebound is one branch of hopefully being used by God to start conversations wherever the apparel is bought. Never invent a testimony, background or experience beyond that. Ask Richard for anything more personal.
- **Sound like a person.** Active voice, plain words, contractions where they're natural, short sentences, concrete detail from the passage. Cut filler, stacked hedges, "not X, but Y" turns, colon-led one-liners, lists of three used for rhythm, and summing-up lines at the end of a paragraph. Write for Christians who are curious about Awebound, not for search engines. US English.
- Say the actual cut of each product (tee, oversized tee, tank, cap); never describe the whole brand as one fit.

### Product copy fields

```
[Product name] · [Release name] · [Garment type] · [Price]
Scripture: [NIV quote] — [Reference] — NIV[, excerpt]
Theme and call: [Mercy] · [Behold His mercy]
Art: [one sentence on the main artwork and what it shows]
Meaning: [two to four sentences: the moment in Scripture and how the design carries it]
Front: [placement and mark] · Back: [composition in one line; name printed wording accurately]
Color: [garment color] · Inks or thread: [colors]
Fit: [cut and silhouette] · Fabric: [once confirmed]
```

### Calls to action

Explore [release] · Get Release Updates · Shop [release] (once ordering opens) · View [piece] · Save to bag (preview) or Add to bag · Notify me · Read our story. Avoid "Buy now" and countdown pressure.

## Behold (Release 01)

| Piece                             | Garment, color                                              | Price             | Scripture on the site (NIV)                                                                                      | Theme        |
| --------------------------------- | ----------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------ |
| Still the Storm                   | Oversized tee (larger), Black                               | $40               | “They were terrified and asked each other, ‘Who is this? Even the wind and the waves obey him!’” Mark 4:41 — NIV | Power        |
| By His Hem                        | Oversized tee (regular), Warm bone                          | $40               | “If I only touch his cloak, I will be healed.” Matthew 9:21 — NIV, excerpt                                       | Healing      |
| Thorns to Lilies                  | Oversized tee (larger), White                               | $40               | “Though your sins are like scarlet, they shall be as white as snow” Isaiah 1:18 — NIV, excerpt                   | Mercy        |
| Torn Veil                         | Relaxed hoodie, Black                                       | $60 (placeholder) | “At that moment the curtain of the temple was torn in two from top to bottom.” Matthew 27:51 — NIV, excerpt      | Presence     |
| Stone in Motion                   | Oversized tee (regular), Cream                              | $40               | “He is not here; he has risen, just as he said. Come and see the place where he lay.” Matthew 28:6 — NIV         | Resurrection |
| To Live Is Christ, To Die Is Gain | Oversized tee (larger), Washed navy                         | $40               | “For to me, to live is Christ and to die is gain.” Philippians 1:21 — NIV                                        | Life         |
| Lamb's Mark                       | Distressed cap with adjustable strap, Washed charcoal twill | $30               | “Look, the Lamb of God, who takes away the sin of the world!” John 1:29 — NIV, excerpt                           | Sacrifice    |

Site-wide verses: Romans 1:16 (excerpt, "worn without shame") and 1 Corinthians 3:6 ("I planted the seed, Apollos watered it, but God has been making it grow.").

## How to work

| Task                                             | Start from                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Website page, section or component               | `packages/brand` (tokens, components, type styles) and `apps/web` in the repo; this file for rules. Tokens default to the dark (coal) theme; `[data-theme="light"]` (bone paper) is for editorial sections only, such as the founder story and About. Outside the repo: `assets/tokens.css`, `assets/components/`, `references/web.md` for component props (its font and pillar notes are out of date). |
| Social post, story, banner, email, ad            | `assets/templates/social-post.html` (1080×1350), rendered with `python scripts/render.py <html> <out.png> --width 1080 --height 1350`; sizes and safe areas in `references/marketing.md`. One piece or symbol, one line of copy and one Scripture reference per post; swap the template's fonts for the three above.                                                                                    |
| Copy                                             | The Voice and Scripture sections here.                                                                                                                                                                                                                                                                                                                                                                  |
| New apparel art brief or image prompt            | Non-negotiables 3 and 4, Imagery here, `references/imagery.md` for engraving style.                                                                                                                                                                                                                                                                                                                     |
| Anything touching Scripture or religious imagery | The Scripture section and non-negotiables 3–5.                                                                                                                                                                                                                                                                                                                                                          |

`references/tokens.json` holds the full token set with a usage note on every value (garment swatches, spacing, shadows).

## Before you hand work back

- Wordmark from the file or component, intact, at least 120px wide, with clear space of a quarter of its height; no font imitating it.
- Only brand tokens. Text contrast at least 4.5:1; oxblood never used as text on coal. One primary (oxblood) action and one oxblood glow per screen at most. Corners 0–2px, no pills.
- Grenze Gotisch only for display; Cormorant Garamond Italic only for quotations; Manrope for everything else; body 16–18px.
- No internal codes visible; no "streetwear"; no garment/color subtitles where the Scripture belongs.
- Every quotation is exact NIV with a matching label (and "excerpt" when partial), wraps in full, and agrees across home, shop and product page. Printed art isn't labeled NIV unless it uses NIV wording. The Biblica notice is present wherever NIV is quoted.
- Release status is honest: preview messages while ordering is closed, no unconfirmed dates or delivery times.
- Symbols-only imagery; styled product images with no white backgrounds, whole garment first.
- Copy has no exclamation marks, hype, fear or guilt, and no invented founder details.

## Open items

- Biblica's written permission for NIV on the website, and separately for By His Hem, whose back prints NIV wording, before launch.
- Confirmed production and shipping times and shipping rates (Fourthwall), then fill them on the product pages and FAQ.
- The blank supplier and fabric for each piece, and final size charts.
- Prices set in Fourthwall to match the table above.
- Photographs of real samples to replace the styled mockups.
- A designer's cleanup of the traced wordmark before large back prints; physical tests of the proposed minimum print (1.75in) and embroidery (2.25in) sizes.
