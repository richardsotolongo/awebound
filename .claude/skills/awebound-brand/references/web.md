# Website

The site is one Next.js app (`apps/web`) on the brand package (`packages/brand`): a dark coal shop with a hint of dark metal. In the repo, build with `@awebound/brand` directly. This file covers setup outside the repo, the page recipes, and every component's props as the site has them.

## Setup

**In the repo:** import `@awebound/brand/tokens.css`, `components.css` and `theme.css` (Tailwind v4) once in `globals.css`; the root layout self-hosts the three fonts with `next/font/local` and sets `--font-grenze`, `--font-manrope`, `--font-cormorant` on `<html data-theme="dark">`. Wrap the app in `BrandLinkProvider link={NextLink}` so brand components render `next/link` for internal hrefs.

**Outside the repo:**

1. Copy `assets/tokens.css`, `assets/components/awebound.css` and `assets/components/awebound-components.jsx` (with `index.d.ts`) into the project, for example under `src/awebound/`. The bundle is ESM, starts with `"use client"`, and needs React 18 or later (`react` and `react/jsx-runtime` stay external).
2. Import `tokens.css` once at the app root, then `awebound.css`. `tokens.css` pulls Grenze Gotisch, Manrope and Cormorant Garamond Italic 500 from Google Fonts. To self-host instead (as the site does), load them yourself and set `--font-grenze`, `--font-manrope` and `--font-cormorant`, then drop the `@import`.
3. Tailwind v4: import `assets/tailwind-theme.css` after `tailwindcss` and `tokens.css`. It removes the default palette and radii, so only brand values exist (`bg-surface`, `text-ink`, `text-accent-text`, `border-line`, `rounded-sm`, `shadow-lift`). Tailwind v3: use `assets/tailwind-preset.js` in `presets`.
4. Keep the dark theme for the shop. Put `data-theme="light"` (bone paper) on editorial sections only, such as the founder story and About.
5. Copy the SVGs you need from `assets/logos/` and `assets/marks/`. `awebound-wordmark.svg`, `thorn-cross.svg` and `thorn-cross-small.svg` use `currentColor`; inline them (or use the components) so CSS `color` sets their ink.

Plain HTML pages (no build step) can load React 18 UMD (React 19 ships no UMD build) and then `assets/components/awebound.umd.js`, which puts every export on `window.Awebound`.

All component files are generated from `packages/brand`. After the site's brand code changes, run `node .claude/skills/awebound-brand/scripts/sync-from-site.mjs` from the repo instead of editing them.

## Page recipes (as built)

| Page                                                         | Order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                                                         | Header · the opening: the mixed-case headline “Bound in awe. / Worn without shame.” (no label above it), the brand paragraph, **View [piece]** (primary, to the product page) and **See all 10 pieces** (secondary, to the shop), the release-status sentence when ordering isn’t fully open; beside them one piece shown whole (the release’s first featured piece), a close-up of its print with one sentence on what it shows, and its name, price and ScriptureQuote · Richard’s note on the light theme (portrait, the heading “My faith in God comes first.”, his name, two sentences, **Read my story**) · the release: name, call, reference and every piece (ProductCard grid) · the release sign-up (`#updates`) · Footer without its sign-up. No labels above headings, no glow, no animation on load or scroll. Phones: the words and buttons first, then the piece. |
| Shop                                                         | Header · shop header (title under a `.soft-glow`) · Collection and Category selectors with counts, active filters and reset · ProductCard grid · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Collections                                                  | Header · "Every release, by name": one card per release that exists, linking to the shop filtered to it (**Explore Behold**) · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Product                                                      | Header · breadcrumb (Shop / Behold / name) · two columns: gallery (Fourthwall's images in order, zoom on hover or press-and-hold) / release and garment type label, the name, the ScriptureQuote (`md`), price, Swatches, SizeSelector with the size guide, Save to bag or Add to bag, delivery and returns summary, the design story ("The design · Mercy", the call as an `aw-h2`, the art, the meaning), Product details (garment, fit, color, front, back, inks or thread, fabric) · Previous / Next piece · ThornRule and the other pieces · Footer                                                                                                                                                                                                                                                                                                                         |
| About                                                        | Header · AltarPanel as the page’s `h1` (the tagline and one sentence, no eyebrow) · “My story”: Richard’s portrait and his full story in his own words (light theme) · the name · why it belongs together · how we make it · reverence (ThornRule above) · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Bag, FAQ, Contact, Returns, Privacy, Terms, Account, Sign in | Header · page header (label, `aw-h1`, one paragraph) · content · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

The footer also carries the "Ask AI about Awebound" links (ChatGPT, Claude, Perplexity, Gemini) under the tagline, and the Scripture translation notice in its legal line.

## Rules that are easy to miss

- One primary (oxblood) button per screen. The header's bag and the footer's sign-up button are outlined for that reason.
- `ink-subtle` and small `accent-text` never on `surface-overlay` in the dark theme (under 4.5:1).
- Focus ring: 2px `focus-ring`, 2px offset; inside AltarPanel it becomes `on-altar`, inside a feature banner `on-feature`.
- Corners `radius-0`, buttons and inputs `radius-sm` (2px). Touch targets at least `tap-min` (44px).
- Grain (`.aw-grain`) on backgrounds only, never over product photos or text.
- Motion: short rises on `ease-reverent`; words, Scripture and buttons readable at every frame; respect `prefers-reduced-motion`.
- Product data names the real cut ("Oversized tee", "Hoodie", "Cap") per product. No design codes anywhere a customer can see them, including alt text, metadata and search.
- Release status comes from the catalog: `preview` while no piece of a release is in Fourthwall, `partial` once some are, `open` when all are. Say it in one plain sentence (none when open), and let a piece speak for itself (“Sold out”, “Some sizes sold out”, “Not open for ordering yet”). Never hard-code "Latest Drop", dates or prices in copy.
- On the home page and product cards: no small label above a heading (`.aw-label` over an `h1`–`h3`), no status chips, no middle-dot metadata strings, and nothing animates on load or on scroll. Other pages still carry labels; don’t add new ones.

## Components

Every component is in `packages/brand/src/components/` (and the bundles here). Props are typed in `assets/components/index.d.ts`. The site uses Header, Footer, ProductCard, ScriptureQuote, ScriptureRef, Button, Swatches, SizeSelector, ThornRule, ThornCross and AltarPanel; the home page has its own garment-led hero, so `Hero` and `CollectionBanner` are for other pages and marketing builds.

### Wordmark

The A3 Thornbound wordmark as inline SVG that takes the current CSS color.

- Props: `height` (px, default 48; width follows the shape), `color`, `title` (`""` makes it decorative), `className`, `style`.
- Use `ink` on dark surfaces and `altar-mark` (oxblood) on `altar`. That second pairing is the signature lockup.
- Clear space a quarter of its height. Minimum 120px wide (about 56px tall); below that use `ThornCross size="small"`.

### ThornCross

The Thorn Cross: a wooden cross with a thorn wreath orbiting it at 45 degrees.

- Props: `size` (`"full"` at 96px and up, `"small"` below), `height` (default 120 full, 32 small), `color`, `title` (`""` when decorative).
- Single ink. Upright and whole; never tilted, broken, cropped or placed underfoot. May stand above or below the wordmark; never replaces a letter.

### Mark

Secondary marks: lily, thorn vine, thorn wreath.

- Props: `name` (`"lily" | "thorn-vine" | "thorn-wreath"`), `height` (default 64), `color`, `title`.
- One ink each; never stack more than two marks.

### Button

Buttons for actions: one oxblood primary per screen, outlined secondary, and a copper text link.

- Props: `variant` (`primary` default, `secondary`, `link`, `on-feature` inside feature banners, `on-altar` inside altar panels), `block` (full width), `href` to render a link (through `BrandLink`), otherwise a `<button type="button">` with any button attributes.
- Labels are written in code as they should read, in sentence case; styling sets caps. A label says exactly where the button goes: "View Thorns to Lilies", "See all 10 pieces", "Save to bag", "Add to bag", "Check out", "Notify me", "Read my story". Never "Buy now".

### ScriptureQuote

A Scripture quotation: the words in Cormorant Garamond Italic, the reference beneath in upright type with the translation.

- Props: `text` (exact wording, without surrounding quotes), `reference`, `translation` (`"NIV"` on the site, from the Scripture record), `excerpt` (part of the verse), `size` (`"sm"` in cards, `"md"` beside a product name, `"lg"` for a featured verse), `align` (`"start"` default or `"center"`).
- Wraps the text in curly double quotes and turns inner double quotes into single ones (`quoted()` does the same for plain strings). The label reads "Mark 4:41 — NIV" or "Matthew 9:21 — NIV, excerpt".
- Quotes always wrap in full: never truncate, clamp or shrink them to equalize heights.

### ScriptureRef

A Scripture reference in upright Manrope caps, gold, between short rules.

- Props: `reference` (full book name, chapter and verse: "Galatians 5:1", ranges with an en dash), `translation` (only when its words are quoted beside it), `excerpt`, `align` (`"center"` default, `"start"` drops the leading rule).
- Reference only, never the verse text inside it. No abbreviations.

### ThornRule

The section divider: a hairline with small alternating thorns and the small Thorn Cross at center.

- Props: `cross` (default `true`; `false` for a plain thorn line in dense layouts).
- Use between page sections, not between list items. Inside an altar panel the cross picks up the altar ground (`--rule-bg`).

### Header

The site header: wordmark, links, the account link and the bag, collapsing to a menu button below 900px (the links, account and bag need that much to sit on one line).

- Props: `links` (default Shop, Collections, About, Contact), `current` (the active label), `account` (`{label, href}`, for example Sign in or Account; omit when accounts are off), `bagCount`, `onBag` (opens the bag drawer; without it the bag links to `bagHref`, default `/bag`), `homeHref`, `onMenu`, `menuOpen`, `menuId`.
- The wordmark is the functional `ink` lockup, 56px tall. The active link gets an oxblood underline. The bag is outlined, not filled. Below 900px the layout is menu | wordmark | account and bag, icons only. The site makes it sticky on a solid `surface`. Keep promo bars out of it.

### Hero

A page opener: eyebrow, display headline, one line of body, up to two buttons, a Scripture reference and an optional image, over the oxblood glow.

- Props: `title` (twelve words at most), `eyebrow`, `body` (one sentence), `primary` and `secondary` (`{label, href}`), `scripture`, `image`, `imageAlt`.
- One per page; it carries that page's only `glow-primary`. The home page uses its own garment-led hero instead (see the recipe).

### ProductCard

A product tile: the whole garment, the name, its type and price on one row, an optional status line, then its Scripture in italic with the reference. The name comes first; nothing sits above it.

- Props: `name`, `type` ("Oversized tee"), `price` (formatted, from Fourthwall or the preview price), `status`, `quote` (`{text, reference, translation, excerpt}`), `image` (the listing image: the whole garment), `imageAlt`, `hoverImage` (usually the other side), `href`, `priority` (eager load above the fold), `as` (`"h3"` default).
- `status` is a plain sentence shown only when it applies ("Sold out", "Some sizes sold out", "Not open for ordering yet"); `price` may read "From $40" when sizes differ. It takes no design code and no color subtitle. The whole card links to the product page. Lay cards out in a grid with `space-8` gaps; on phones each card puts the image beside the words.

### Swatches

Garment color picker: square chips with the chosen color named beside them.

- Props: `colors` (`{name, hex}`, where `hex` is any CSS color, ideally `var(--garment-*)`), `value`, `onChange`, `label` (default "Color").
- Square chips (`radius-0`), 44px targets; the selected chip gets an `ink` frame. Arrow keys move and select.

### SizeSelector

Size picker for apparel, with sold-out sizes struck through.

- Props: `sizes` (default S to 2XL; caps use "One size"), `value`, `unavailable`, `onChange`, `label` (default "Size").
- Pair it with the size guide link. Larger sizes may cost more (2XL and 3XL); the price shown follows the selected size.

### CollectionBanner

A release intro: eyebrow label, name, one line of story and one action, on coal or on washed oxblood for a new drop.

- Props: `family` (the release name), `eyebrow` ("Release 01"), `story` (one sentence), `tone` (`"coal"` default, `"feature"`), `action`, `as` (`"h2"` default or `"h1"`), `children`.
- On `feature` only `on-feature` and `on-feature-muted` text; the button switches to its `on-feature` variant.

### AltarPanel

A warm-bone panel that breaks the dark page and carries the signature oxblood wordmark or the Thorn Cross.

- Props: `mark` (`"wordmark"` default, `"cross"` or `"none"`), `title`, `as` (`"h2"` default; `"h1"` when the panel opens the page), `eyebrow` (avoid: no labels above headings), `body`, `scripture`, `action`, `children` (a sign-up form, for example), `id`.
- One or two per page at most: the About story, a release intro, a sign-up. Inside, text is `on-altar` / `on-altar-muted`, headings and marks `altar-mark`, Scripture `altar-scripture`, and the button is the oxblood `on-altar` variant.

### Footer

The site footer: small Thorn Cross and tagline, the release-updates sign-up, links, the legal line with the Scripture notice, and the wordmark across the full width as the last line.

- Props: `links`, `tagline` (default "Bound in awe. Worn without shame."), `year`, `notice` (the translation notice), `signup` (default `true`; the site turns it off on the home page, which has its own sign-up), `onSubscribe(email)` (resolve to confirm in place, throw to show an error), `children` (shown under the tagline; the site puts the Ask AI links there).
- The form label reads "Get release updates", the button "Notify me" (secondary). The site's footer links: Shop, Collections, About, FAQ, Returns, Privacy, Terms, Account, Contact.

### Helpers

- `BrandLinkProvider` / `BrandLink`: render the host framework's link for internal hrefs; external, `mailto:`, `tel:` and `#` links stay plain anchors.
- `cx(...)`: joins truthy class names. `quoted(text)`: the curly-quote rule from ScriptureQuote. `BRAND_HEX`: the five raw values for `<meta name="theme-color">`, generated images and email. `WORDMARK`, `THORN_CROSS`, `THORN_CROSS_SMALL`, `LILY`, `THORN_VINE`, `THORN_WREATH`: raw SVG geometry (`viewBox`, `d`). `useRadioGroup`: the roving-tabindex keyboard handling behind Swatches and SizeSelector.
