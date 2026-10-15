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

| Page                                                         | Order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                                                         | Header · the opening plate (a piece’s surface, full-bleed, a different piece each visit, the pieces taking turns every seven seconds with a short cross-fade while on screen): the headline “Bound in awe. / Worn without / shame.” in `.aw-poster` with no label above it, **View [piece]** (primary) and **See all 10 pieces** (secondary), the garment cut out beside them (`piece.webp`), small Previous, Pause and Next buttons under the two buttons · on coal: the brand paragraph, the release-status sentence when ordering isn’t fully open, and the lead piece up close (close-up with one sentence on what it shows, name, price, ScriptureQuote) · Richard’s note on the light theme (portrait, the heading “My faith in God comes first.”, his name, two sentences, **Read my story**) · the release: its name filling the width (`.aw-fit`), call and reference, then the wall of its pieces · My Archive (`#archive`): “Wear the piece. Know its story.” (`aw-h1`), one paragraph, up to three short points and an outlined button (**Create your free Archive** or **Open My Archive**), beside a preview of one design's card (the garment on its plate as an image only; name, ScriptureRef and published public preview on raised coal; the parts a purchase opens named with a lock; the caption “A preview of the … card in My Archive.”), or a short form without the card before any story can open · the release sign-up (`#updates`) · Footer without its sign-up. Phones: the words and buttons first, then the garment. |
| Shop                                                         | Header · the release heading (name filling the width, call, reference, status sentence) · search, then one compact row: a Category select (and a Collection select once there is more than one release), sort and filters · active filters and reset · ProductCard grid, each card with its quote and a save heart: three across from 900px, two from 600px, one below with the image edge to edge · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Product                                                      | Header · two columns: the stage (Fourthwall's images in order, filling the left of the page and staying put; thumbnails beneath; zoom on hover or press-and-hold; swipe on phones) / breadcrumb (Shop / Behold / name), the name, garment type and price on one row, the ScriptureQuote (`md`), Swatches, SizeSelector with the size guide (a note under it when a pricier size is chosen), Add to bag, delivery and returns summary, the My Archive note (“Your piece continues in My Archive.”, what buying it opens, with **Join Awebound** signed out and **View this piece in My Archive** for an owner) · the design story: the call in `.aw-poster` on the piece’s plate beside its close-up, then the art and the meaning on coal · Product details (garment, fit, color, front, back, inks or thread, fabric) · the previous and next pieces by image and name · “More from Behold” as a wall · Footer. Phones: a bar with the price and the bag button once the button has scrolled away.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| About                                                        | Header · AltarPanel as the page’s `h1` (the wordmark large, the tagline and one sentence, no eyebrow) · “My story”: Richard’s portrait and his full story in his own words, on the same bone · the name · why it belongs together, with three tiles of the pieces it names · how we make it (I, II, III) · reverence (ThornRule above) · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Bag, FAQ, Contact, Returns, Privacy, Terms, Account, Sign in | Header · page header (`aw-h1`, one paragraph; nothing above the title) · content · Footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Sign in sets the form beside what the account brings, in two groups under rules: “Free with your account” and “With each design you buy”, then small notes (signing up alone opens nothing; Scripture stays open to everyone; the Founding line only while places remain). The Account overview opens with a short welcome until it is dismissed (a new account: save a piece and explore Behold; a buyer: open the design that came in), with an outlined button and a link-style **Dismiss**. Every Archive claim comes from `features/archive/offer.ts`, so it shows only once it works.

The footer also carries the "Ask AI about Awebound" links (ChatGPT, Claude, Perplexity, Gemini) under the tagline, and the Scripture translation notice in its legal line.

## Rules that are easy to miss

- One primary button per screen: oxblood on coal, the plate’s ink on a plate. The header's bag and the footer's sign-up button are outlined for that reason.
- `ink-subtle` and small `accent-text` never on `surface-overlay` in the dark theme (under 4.5:1).
- Focus ring: 2px `focus-ring`, 2px offset; inside AltarPanel it becomes `on-altar`, inside a feature banner `on-feature`.
- Corners `radius-0`, buttons and inputs `radius-sm` (2px). Touch targets at least `tap-min` (44px).
- Grain (`.aw-grain`) on backgrounds only, never over product photos or text.
- Motion is one idea: a piece’s listing image travels between its tile or card and the product stage (`<ViewTransition name={"piece-" + slug}>` on both), neighbour links slide the page in from their side, pages cross-fade. Nothing animates on load or on scroll, except the home page’s opening plate, where the pieces take turns with the cross-fade while it is on screen (paused on its buttons, garment and focus, by its Pause button, and still with reduced motion); artwork, Scripture and buttons are whole in every frame; reduced motion gets instant navigation.
- Product data names the real cut ("Oversized tee", "Hoodie", "Cap") per product. No design codes anywhere a customer can see them, including alt text, metadata and search.
- The site always reads as open for ordering: no release-status sentences or preview notices. A piece speaks only about stock (“Sold out”, “Some sizes sold out”). Never hard-code "Latest Drop", dates or prices in copy.
- No small label above a heading on any page (`.aw-label` over an `h1`–`h3`), no status chips, no middle-dot metadata strings. Form labels stay.
- On a plate (`.aw-plate`): lettering of 24px and up, filled buttons and images only. Small text goes on coal or bone.

## Components

Every component is in `packages/brand/src/components/` (and the bundles here). Props are typed in `assets/components/index.d.ts`. The site uses Header, Footer, ProductCard, Plate, ScriptureQuote, ScriptureRef, Button, Swatches, SizeSelector, ThornRule, ThornCross and AltarPanel; the home page opens on a plate, so `Hero` and `CollectionBanner` are for marketing builds.

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
- Labels are written in code as they should read, in sentence case; styling sets caps. A label says exactly where the button goes: "View Thorns to Lilies", "See all 10 pieces", "Add to bag", "Check out", "Notify me", "Read my story". Never "Buy now".

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
- The site's phone menu opens with the account link as an outlined full-width button: **Join Awebound** with “Free, and never needed to order. Members sign in here too.” when signed out, **Account** when signed in.

### Hero

A page opener: eyebrow, display headline, one line of body, up to two buttons, a Scripture reference and an optional image, over the oxblood glow.

- Props: `title` (twelve words at most), `eyebrow`, `body` (one sentence), `primary` and `secondary` (`{label, href}`), `scripture`, `image`, `imageAlt`.
- For marketing builds: it carries the oxblood `glow-primary`, which the site itself no longer uses. The home page opens on a plate instead (see the recipe).

### ProductCard

A product tile: the whole garment on its plate color, the name, its type and price on one row, an optional status line, then (on shop cards) its Scripture in italic with the reference. The name comes first; nothing sits above it and no panel sits behind the words.

- Props: `name`, `type` ("Oversized tee"), `price` (formatted, from Fourthwall or the preview price), `status`, `quote` (`{text, reference, translation, excerpt}`; leave it off for a wall tile), `image` (the listing image: the whole garment), `imageAlt`, `hoverImage` (usually the other side), `href`, `plate` (the piece’s plate color as a CSS value, behind the image while it loads), `transitionName` and `transitionWhen` (the morph into the product page; `"leaving"` for cards on a product page), `priority` (eager load above the fold), `as` (`"h3"` default), `action` (a small control in the bottom right of the image, outside the card's link: the site's save heart, bone on a translucent coal square, filled once saved).
- `status` is a plain sentence shown only when it applies ("Sold out", "Some sizes sold out"); `price` is the base price, never "From $40". It takes no design code and no color subtitle. The whole card links to the product page. Shop cards sit in a grid with gaps; wall tiles (`.wall`) meet with none.

### Plate

A piece’s own surface as a full-bleed field. The home page opens on one and every product page sets its design story on one.

- Props: `color` (a CSS value, `var(--plate-oxblood)`), `ink` (`"bone"` or `"coal"`: what lettering and buttons take on it), `tall` and `wide` (the surface images, portrait below 900px and landscape above), `priority` (the plate that opens a page), `as` (`"section"` default or `"div"`), `children`.
- Only lettering of 24px and up (`.aw-poster`, `.aw-h1`, `.aw-h2`), filled buttons and images go inside. Buttons take the ink: primary fills with it, secondary takes the opposite fill with an ink border. The focus ring uses the ink too.

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

- Props: `mark` (`"wordmark"` default, `"cross"` or `"none"`), `title`, `as` (`"h2"` default; `"h1"` when the panel opens the page, which sets the wordmark large and the title in `aw-h1`), `eyebrow` (avoid: no labels above headings), `body`, `scripture`, `action`, `children` (a sign-up form, for example), `id`.
- One or two per page at most: the About story, a release intro, a sign-up. Inside, text is `on-altar` / `on-altar-muted`, headings and marks `altar-mark`, Scripture `altar-scripture`, and the button is the oxblood `on-altar` variant.

### Footer

The site footer: small Thorn Cross and tagline, the release-updates sign-up, links, the legal line with the Scripture notice, and the wordmark across the full width as the last line.

- Props: `links`, `tagline` (default "Bound in awe. Worn without shame."), `year`, `notice` (the translation notice), `signup` (default `true`; the site turns it off on the home page, which has its own sign-up), `onSubscribe(email)` (resolve to confirm in place, throw to show an error), `children` (shown under the tagline; the site puts the Ask AI links there).
- The form label reads "Get release updates", the button "Notify me" (secondary). The site's footer links: Shop, About, FAQ, Returns, Privacy, Terms, My Archive (while accounts are on), Contact.

### Helpers

- `BrandLinkProvider` / `BrandLink`: render the host framework's link for internal hrefs; external, `mailto:`, `tel:` and `#` links stay plain anchors.
- `cx(...)`: joins truthy class names. `quoted(text)`: the curly-quote rule from ScriptureQuote. `BRAND_HEX`: the five raw values for `<meta name="theme-color">`, generated images and email. `WORDMARK`, `THORN_CROSS`, `THORN_CROSS_SMALL`, `LILY`, `THORN_VINE`, `THORN_WREATH`: raw SVG geometry (`viewBox`, `d`). `useRadioGroup`: the roving-tabindex keyboard handling behind Swatches and SizeSelector.
