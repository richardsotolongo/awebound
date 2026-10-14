# AGENTS.md — packages/brand

The Awebound brand system as code. The rules are in the `awebound-brand` skill and `docs/BRAND.md` (same content); this package is their implementation for the web app. Read one of them before visual work.

## Contents

| Path                        | Purpose                                                                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css`     | Every color, space, radius, font and motion token as CSS variables, and the `--plate-*` colors (one per piece's surface). Dark (coal) default; `[data-theme="light"]` for bone-paper editorial sections. Raw hex lives here and in `src/hex.ts` (for `<meta theme-color>`, generated images, email). |
| `src/styles/components.css` | Brand component classes (`.aw-*`) in `@layer base` / `@layer components`, so Tailwind utilities can override layout.                                                                                                                                                                                 |
| `src/styles/theme.css`      | Tailwind v4 `@theme inline` mapping: brand colors only (`bg-surface`, `text-ink`, `text-accent-text`, `border-line`…), radii `none`/`sm` (2px). Default palette removed on purpose.                                                                                                                  |
| `src/components/*`          | Typed React components: `Wordmark`, `ThornCross`, `Mark`, `Button`, `ScriptureRef`, `ScriptureQuote`, `ThornRule`, `Header`, `Hero`, `ProductCard`, `Plate`, `Swatches`, `SizeSelector`, `CollectionBanner`, `AltarPanel`, `Footer`.                                                                 |
| `src/link.tsx`              | `BrandLinkProvider` lets components render `next/link` for internal hrefs.                                                                                                                                                                                                                           |
| `src/marks/paths.ts`        | Generated SVG path data. Regenerate with `pnpm --filter @awebound/brand paths`; never edit by hand.                                                                                                                                                                                                  |
| `assets/`                   | Original SVG logos and marks, and the lookbook concept mockups.                                                                                                                                                                                                                                      |

## Rules

- Wordmark and Thorn Cross come from `<Wordmark />` / `<ThornCross />` (or the SVGs). Never type AWEBOUND, never split letters from thorns, never stretch, outline, shadow or gradient them. Wordmark ≥ 120px wide; smaller → `ThornCross size="small"`.
- Crosses stay upright and whole. The Thorn Cross is the brand mark.
- Type (fonts are loaded by the app and exposed as `--font-grenze`, `--font-cormorant`, `--font-manrope`):
  - Grenze Gotisch (`--font-display`, weight 600): `.aw-poster` (lettering at poster size; each use sets its size in container units so its longest line fits), `.aw-fit` (a release name filling its line, from `--ems`, the name's width in ems), `.aw-h1`, `.aw-h2`, `.aw-display`. Always mixed case (blackletter capitals are hard to read). Never for paragraphs, sizing, prices or numerals.
  - Cormorant Garamond Italic 500 (`--font-scripture`): `.aw-quote` / `ScriptureQuote`, Scripture quotations only. No letter spacing.
  - Manrope (`--font-sans`): everything else, including `.aw-product-name` and `.aw-card-name` (800, caps), `.aw-label`, `.aw-meta`, buttons, `.aw-scripture` references, body 16–18px. No `font-stretch`, no faux styles.
- `ScriptureQuote` wraps the text in curly quotes (inner double quotes become single) and labels it "Reference — NIV" (", excerpt" when partial). Quotes always wrap in full.
- `ProductCard` shows the whole garment on its plate color, then the name, the garment type and price on one row, an optional plain status line (“Sold out”), and the Scripture quote (left out on wall tiles, which are too narrow to quote it in full). The name comes first, so no small label sits above it, and there is no panel behind the words. It takes no design code: codes are never shown. `transitionName` names the image so it can travel into the product page; `transitionWhen="leaving"` is for cards on a product page. `action` puts a small control (the site's save heart) in the bottom right of the image, outside the card's link.
- `Header` switches to its phone layout (menu, wordmark, account and bag icons) below 900px: the links, account and bag need that much to sit on one line. `AltarPanel` takes `as="h1"` when it opens a page.
- Oxblood (`--primary`) is a fill. Accent text on dark is `--accent-text` (copper); Scripture is `--scripture` (gold).
- One `.aw-btn-primary` per screen (the footer's sign-up button is secondary for that reason). No glows, gradients or blur.
- Plates (`.aw-plate`, `Plate`): a piece's surface as a full-bleed field, `--plate` from a `--plate-*` token and `data-ink` (`bone` or `coal`) for what sits on it. Inside a plate: lettering of 24px and up, filled buttons (they take the ink) and images. Never small text, and never a plate colour on links, borders or controls.
- Corners 0 or 2px. No pills. Touch targets ≥ `--tap-min` (44px).
- Grain (`.aw-grain`) only on backgrounds, never over product photos or text.
- Motion: Motion is one idea: the garment image travels between a tile and its product page (view transitions), and pages cross-fade. Nothing animates on load or on scroll; the one exception is the home page's opening plate, where the pieces take turns with that cross-fade while it is on screen (it pauses on its buttons and garment, on focus and with its Pause button, and holds still with reduced motion). Artwork, Scripture and buttons are whole and readable in every frame: never cropped, wiped or faded in. Reduced motion gets instant navigation. `--ease-reverent` for what does move (sheets, the morph). No flames, embers, glitch or shake.
- Accessibility: text ≥ 4.5:1, control borders `--line-strong`, focus ring 2px `--focus-ring` with 2px offset (`--on-altar` inside altar panels, `--on-feature` inside feature banners).

## Adding a component

Keep it presentational and framework-agnostic (no Next imports). Use tokens, add its CSS to `components.css` inside `@layer components`, export it from `src/index.ts`, and add `"use client"` only if it uses state, effects or context.
