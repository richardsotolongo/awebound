# AGENTS.md — packages/brand

The Awebound brand system as code. Source of truth is the `awebound-brand` skill; this package is its port for the web app. If you have the skill, read it before visual work.

## Contents

| Path | Purpose |
| --- | --- |
| `src/styles/tokens.css` | Every color, space, radius, font and motion token as CSS variables. Dark (coal) default; `[data-theme="light"]` for bone-paper editorial sections. **The only file allowed to hold raw hex.** |
| `src/styles/components.css` | Brand component classes (`.aw-*`) in `@layer base` / `@layer components`, so Tailwind utilities can override layout. |
| `src/styles/theme.css` | Tailwind v4 `@theme inline` mapping: brand colors only (`bg-surface`, `text-ink`, `text-accent-text`, `border-line`…), radii `none`/`sm` (2px). Default palette removed on purpose. |
| `src/components/*` | Typed React ports of the skill's components: `Wordmark`, `ThornCross`, `Mark`, `Button`, `ScriptureRef`, `ThornRule`, `Header`, `Hero`, `ProductCard`, `Swatches`, `SizeSelector`, `CollectionBanner`, `AltarPanel`, `Footer`. |
| `src/link.tsx` | `BrandLinkProvider` lets components render `next/link` for internal hrefs. |
| `src/marks/paths.ts` | Generated SVG path data. Regenerate with `pnpm --filter @awebound/brand paths`; never edit by hand. |
| `assets/` | Original SVG logos and marks, and the lookbook concept mockups. |

## Rules

- Wordmark and Thorn Cross come from `<Wordmark />` / `<ThornCross />` (or the SVGs). Never type AWEBOUND, never split letters from thorns, never stretch, outline, shadow or gradient them. Wordmark ≥ 120px wide; smaller → `ThornCross size="small"`.
- The Thorn Cross stays upright and whole. It is the only cross.
- Type: Cinzel (`.aw-display`, `.aw-h1`, `.aw-h2`, `.aw-product-name`, `.aw-scripture`) for headlines, product names and Scripture only, caps, ~12 words max. Archivo for everything else (`.aw-label`, `.aw-meta`, `.aw-body`, `.aw-small`, `.aw-h3`). No italics, no faux bold.
- Oxblood (`--primary`) is a fill. Accent text on dark is `--accent-text` (copper); Scripture is `--scripture` (gold).
- One `.aw-btn-primary` and one `--glow-primary` per screen. The footer's sign-up button is secondary for that reason.
- Corners 0 or 2px. No pills. Touch targets ≥ `--tap-min` (44px).
- Grain (`.aw-grain`) only on backgrounds, never over product photos or text.
- Motion: 200–300ms fades and short rises, `--ease-reverent`; respect `prefers-reduced-motion`. The home page journey is the one approved exception (slow scroll scenes), and still: no flames, embers, glitch or shake.
- Accessibility: text ≥ 4.5:1, control borders `--line-strong`, focus ring 2px `--focus-ring` with 2px offset (`--on-altar` inside altar panels, `--on-feature` inside feature banners).

## Adding a component

Keep it presentational and framework-agnostic (no Next imports). Use tokens, add its CSS to `components.css` inside `@layer components`, export it from `src/index.ts`, and add `"use client"` only if it uses state, effects or context.
