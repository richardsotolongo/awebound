# Website

The site is custom code: a dark coal shop with a hint of dark metal. This file covers setup, the components and page recipes.

## Setup

1. Copy `assets/tokens.css`, `assets/components/awebound.css` and `assets/components/awebound-components.jsx` (with `index.d.ts`) into the project, for example under `src/awebound/`.
2. Import `tokens.css` once at the app root, then `awebound.css`. `tokens.css` also imports Cinzel and Archivo from Google Fonts. In Next.js you may instead load them with `next/font/google` and point `--font-display` / `--font-sans` at the generated families.
3. Using Tailwind? Add `assets/tailwind-preset.js` to `presets`. Every color, spacing step and radius maps to the CSS variables, so `bg-surface`, `text-ink`, `text-accent-text` and `font-display` follow the theme.
4. Keep the dark theme on the shop. Put `data-theme="light"` on editorial pages only (lookbook, story, Scripture notes).
5. Copy the SVGs you need from `assets/logos/` and `assets/marks/`. `awebound-wordmark.svg`, `thorn-cross.svg` and `thorn-cross-small.svg` use `currentColor`; inline them (or use the components) so CSS `color` sets their ink.

Plain HTML pages (no build step) can load React 18 UMD and `assets/components/awebound.umd.js`, which puts the components on `window.Awebound`.

## Page recipes

| Page | Order |
| --- | --- |
| Home | Header · Hero (with product image, the page's one glow) · ThornRule · product grid (ProductCard, 3-4 across) · CollectionBanner (tone feature for the newest drop) · AltarPanel (story or newsletter) · Footer |
| Collection | Header · CollectionBanner · filters (category: tees, oversized tees, tanks, hats...) · product grid · ThornRule · AltarPanel · Footer |
| Product | Header · two-column: gallery (back first, then front, details) / name, ID, price, Swatches, SizeSelector, Add to bag (primary), size guide link, description from the voice template, ScriptureRef · related products · Footer |
| About | Header · AltarPanel with the signature wordmark · story sections on the light theme or coal · pillars (Royal heritage, Freedom, Resurrection) · Footer |

## Rules that are easy to miss

- One primary (oxblood) button and one `glow-primary` per screen.
- `ink-subtle` and small `accent-text` never on `surface-overlay` in the dark theme (under 4.5:1).
- Focus ring: 2px `focus-ring`, 2px offset; inside AltarPanel it becomes `on-altar`, inside a feature banner `on-feature`.
- Corners `radius-0`, buttons and inputs `radius-sm` (2px). Touch targets at least `tap-min` (44px).
- Grain (`.aw-grain`) on backgrounds only, never over product photos or text.
- Motion: 200-300ms fades and short rises; respect `prefers-reduced-motion`.
- Product data names the real cut ("Tee", "Oversized tee", "Tank", "Cap") per product.

## Components

Props are typed in `assets/components/index.d.ts`.

### Wordmark

The A3 Thornbound wordmark as inline SVG that takes the current CSS color.

- Provide: `height` in px (width follows the 2.16:1 shape) and, if needed, `color`; otherwise it uses the parent's `color`.
- Use `ink` on dark surfaces and `altar-mark` (oxblood) on `altar`. That second pairing is the signature lockup.
- Keep clear space of a quarter of its height. Minimum 120px wide; below that use `ThornCross size="small"`.
- Don't recolor it with gradients, outline it or put it on a photo without a solid backing.

### ThornCross

The Thorn Cross, Awebound's only cross: a wooden cross with a thorn wreath orbiting it at 45 degrees.

- Provide: `size` (`full` at 96px and up, `small` below), `height`, optional `color`. Pass `title=""` when it is decorative.
- Single ink. Upright and whole; never tilted, broken, cropped or placed underfoot.
- May stand above the wordmark; never replaces a letter.

### Button

Buttons for actions: one oxblood primary per view, outlined secondary, and a copper text link.

- Provide: `variant` (`primary`, `secondary`, `link`; `on-feature` inside feature banners, `on-altar` inside altar panels), children as sentence-case text (styling sets caps), and `href` to render a link.
- One `primary` per screen. Labels from the brand voice: "Shop the collection", "Read the lookbook", "Notify me", "Add to bag". Never "Buy now".
- Height is at least `tap-min`; corners `radius-sm`.

### ScriptureRef

A Scripture reference set like a tour-poster credit: spaced Cinzel caps in gold between short rules.

- Provide: `reference` as full book name, chapter and verse ("Galatians 5:1"; ranges with an en dash). Add `translation="NLT"` only when a full verse is quoted nearby.
- `align="start"` drops the leading rule for left-aligned blocks.
- Reference only, never the verse text inside it. No abbreviations.

### ThornRule

The section divider: a hairline with small alternating thorns and the small Thorn Cross at center.

- Provide: nothing, or `cross={false}` for a plain thorn line inside dense layouts.
- Use between page sections, not between list items. Sits on `surface-page`; inside an altar panel it picks up the altar ground.

### Header

The site header: wordmark, four links and the bag count, collapsing to a menu button on phones.

- Provide: `links` (default Shop, Collections, Lookbook, About), `current` (the active label), `bagCount`, `bagHref`, `homeHref`, `onMenu` for the phone menu.
- The wordmark here is the functional `ink` lockup on `surface`. Keep the header plain: no promo bars inside it.

### Hero

The page opener: eyebrow, Cinzel headline, one line of body, up to two buttons, a Scripture reference and an optional product image, over the one oxblood glow.

- Provide: `title` (twelve words at most), `eyebrow`, `body` (one sentence), `primary` and `secondary` actions, `scripture`, `image` and `imageAlt`.
- One hero per page; it carries the page's only `glow-primary`. Use a low-key product shot or the Thorn Cross on coal.

### ProductCard

A product tile: 4:5 back-print image, product ID, Cinzel name, base color, color chips and the Scripture reference.

- Provide: `id` (A3-B01), `name`, `base` ("Tee · Faded black"), `swatches` as `garment-*` values, `scripture`, `image` (back view first), `imageAlt`, `href`, and `price` once pricing is set.
- Lay cards out in a grid with `space-8` gaps; three or four across on desktop, two on phones.

### Swatches

Garment color picker: square chips with the chosen color named beside them.

- Provide: `colors` as `{name, hex}` using `garment-*` / `cap-*` values, `value`, `onChange`.
- Square chips only (`radius-0`); the selected chip gets an `ink` frame. Each chip is a 44px target.

### SizeSelector

Size picker for apparel, with sold-out sizes struck through.

- Provide: `sizes` (default S to 2XL), `value`, `unavailable`, `onChange`.
- Pair with a "Size guide" `Button variant="link"`; state each product's cut (regular, oversized, tank) on its product page.

### CollectionBanner

A collection intro: pillar label, family name, one line of story and one action, on coal or on washed oxblood for drops.

- Provide: `family`, `pillar`, `story` (one sentence), `tone` (`coal` default; `feature` for a new drop), `action`.
- On `feature` only `on-feature` and `on-feature-muted` text; the button switches to its `on-feature` variant.

### AltarPanel

A warm-bone panel that breaks the dark page and carries the signature oxblood wordmark or the Thorn Cross.

- Provide: `mark` (`wordmark` default or `cross`), `eyebrow`, `title`, `body`, `scripture`, `action`, or children such as a sign-up form.
- One or two per page at most: the About story, a collection intro, the newsletter.
- Inside, text is `on-altar` / `on-altar-muted`, headings and marks `altar-mark`, Scripture `altar-scripture`.

### Footer

The site footer: small Thorn Cross and tagline, a drop-notes sign-up and policy links.

- Provide: `links`, `tagline`, `onSubscribe(email)`; the form validates the email and confirms in place.
- Keep it to these three groups; the legal line takes the current year.
