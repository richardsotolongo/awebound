# AGENTS.md — packages/brand

The Awebound brand system as code. The rules are in the `awebound-brand` skill and `docs/BRAND.md` (same content); this package is their implementation for the web app. Read one of them before visual work.

## Contents

| Path                        | Purpose                                                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css`     | Every color, space, radius, font and motion token as CSS variables. Dark (coal) default; `[data-theme="light"]` for bone-paper editorial sections. Raw hex lives here and in `src/hex.ts` (for `<meta theme-color>`, generated images, email). |
| `src/styles/components.css` | Brand component classes (`.aw-*`) in `@layer base` / `@layer components`, so Tailwind utilities can override layout.                                                                                                                           |
| `src/styles/theme.css`      | Tailwind v4 `@theme inline` mapping: brand colors only (`bg-surface`, `text-ink`, `text-accent-text`, `border-line`…), radii `none`/`sm` (2px). Default palette removed on purpose.                                                            |
| `src/components/*`          | Typed React components: `Wordmark`, `ThornCross`, `Mark`, `Button`, `ScriptureRef`, `ScriptureQuote`, `ThornRule`, `Header`, `Hero`, `ProductCard`, `Swatches`, `SizeSelector`, `CollectionBanner`, `AltarPanel`, `Footer`.                    |
| `src/link.tsx`              | `BrandLinkProvider` lets components render `next/link` for internal hrefs.                                                                                                                                                                     |
| `src/marks/paths.ts`        | Generated SVG path data. Regenerate with `pnpm --filter @awebound/brand paths`; never edit by hand.                                                                                                                                            |
| `assets/`                   | Original SVG logos and marks, and the lookbook concept mockups.                                                                                                                                                                                |

## Rules

- Wordmark and Thorn Cross come from `<Wordmark />` / `<ThornCross />` (or the SVGs). Never type AWEBOUND, never split letters from thorns, never stretch, outline, shadow or gradient them. Wordmark ≥ 120px wide; smaller → `ThornCross size="small"`.
- Crosses stay upright and whole. The Thorn Cross is the brand mark.
- Type (fonts are loaded by the app and exposed as `--font-grenze`, `--font-cormorant`, `--font-manrope`):
  - Grenze Gotisch (`--font-display`): `.aw-display`, `.aw-h1`, `.aw-h2`, collection names. Mixed case; only the home hero headline is set in caps. Never for paragraphs, sizing, prices or numerals.
  - Cormorant Garamond Italic 500 (`--font-scripture`): `.aw-quote` / `ScriptureQuote`, Scripture quotations only. No letter spacing.
  - Manrope (`--font-sans`): everything else, including `.aw-product-name` and `.aw-card-name` (800, caps), `.aw-label`, `.aw-meta`, buttons, `.aw-scripture` references, body 16–18px. No `font-stretch`, no faux styles.
- `ScriptureQuote` wraps the text in curly quotes (inner double quotes become single) and labels it "Reference — NIV" (", excerpt" when partial). Quotes always wrap in full.
- `ProductCard` shows the whole garment, garment type and price, the name and the Scripture quote. It takes no design code: codes are never shown.
- Oxblood (`--primary`) is a fill. Accent text on dark is `--accent-text` (copper); Scripture is `--scripture` (gold).
- One `.aw-btn-primary` and one `--glow-primary` per screen. The footer's sign-up button is secondary for that reason.
- Corners 0 or 2px. No pills. Touch targets ≥ `--tap-min` (44px).
- Grain (`.aw-grain`) only on backgrounds, never over product photos or text.
- Motion: short rises, `--ease-reverent`; respect `prefers-reduced-motion`. Words, Scripture and buttons stay readable at every frame; only decoration may draw or move. No flames, embers, glitch or shake.
- Accessibility: text ≥ 4.5:1, control borders `--line-strong`, focus ring 2px `--focus-ring` with 2px offset (`--on-altar` inside altar panels, `--on-feature` inside feature banners).

## Adding a component

Keep it presentational and framework-agnostic (no Next imports). Use tokens, add its CSS to `components.css` inside `@layer components`, export it from `src/index.ts`, and add `"use client"` only if it uses state, effects or context.
