---
name: awebound-brand
description: The Awebound brand system - the A3 Thornbound wordmark, the Thorn Cross, coal/bone/oxblood color tokens, Cinzel + Archivo type, voice, Scripture and depiction rules, website components and marketing formats for the Christian apparel brand Awebound. Use it whenever you build or edit the Awebound website (pages, components, Next.js/React code, CSS, Tailwind), make any Awebound marketing content (Instagram or TikTok posts, stories, drop announcements, emails, banners, ads, lookbook pages), write Awebound copy (product descriptions, captions, taglines, About text) or brief new apparel art - even when the request only says "the site", "a post for the new drop", "our brand" or names a product like Freed in Awe or A3-B01.
---

# Awebound brand

Awebound is an independent Christian apparel brand for believers aged 18 to 30 who want to express their faith boldly. The range covers tees, oversized tees, tank tops and hats, with shorts, bags and more to come. Every piece shares engraved art, Scripture references and the A3 identity. The pillars are **Royal heritage. Freedom. Resurrection.**

The look is a dark coal Christian merch shop with a hint of dark metal: layered near-blacks, sharp edges, thorn rules and engraved type, broken by warm-bone panels that carry the oxblood wordmark. The test for every piece of work is that a pastor and a metalhead should both find it beautiful.

## Non-negotiables

These protect the brand's identity and its faith commitments; break one and the work is off-brand no matter how good it looks.

1. **The wordmark is artwork, never type.** Use `assets/logos/awebound-wordmark.svg` (single path, `currentColor`) or the `Wordmark` component. Never set AWEBOUND in a font, and never split the lettering from its thorn branches. Minimum 120px wide on screen; smaller than that, use the small Thorn Cross.
2. **Signature lockup = oxblood `#782B35` on warm bone `#E8DDC9`.** Use it for brand moments (hang tags, labels, packaging, About page, email headers, avatar). On the dark site the header uses bone on coal.
3. **The Thorn Cross is the only cross.** A two-plank wooden cross with a thorn wreath orbiting it at 45°. It stays upright and whole, never tilted, broken or underfoot. No budded crosses, no four-point stars.
4. **Symbols only.** Empty crosses, thorns, broken chains, the empty tomb and rolled stone, lilies, olive branches, arches. Never depict Jesus (face, silhouette, hands, crucifix figure), God the Father or the Spirit as a person, and no gore, skulls or occult symbols.
5. **Scripture by reference.** Full book name, chapter, colon, verse ("Galatians 5:1", ranges with an en dash). If a full verse is quoted, use the NLT and credit "(NLT)".
6. **Oxblood is a fill, not text on dark.** It measures 1.9:1 on coal. Accent text on dark is Copper 300 `#C47A55`; Scripture is gold `#B89651`.
7. **Tokens, not hex.** In code, style through the CSS variables in `assets/tokens.css`. Hex values appear only in the token files.

## How to work

Identify the task type, then read only the references it needs:

| Task | Read | Use |
| --- | --- | --- |
| Website page, section or component | `references/visual-identity.md`, `references/web.md` | `assets/tokens.css`, `assets/components/`, `assets/tailwind-preset.js` |
| Social post, story, banner, email, ad | `references/visual-identity.md`, `references/marketing.md` | `assets/templates/social-post.html`, `scripts/render.py` |
| Copy: product text, captions, About, CTAs | `references/voice.md`, `references/faith-content.md` | the product description template in `voice.md` |
| New apparel art brief or image prompt | `references/imagery.md`, `references/faith-content.md` | marks in `assets/marks/` |
| Anything touching Scripture or religious imagery | `references/faith-content.md` | - |

`references/tokens.json` is the full token set with a usage note on every value. Open it when you need a value the visual-identity summary doesn't list (garment swatch colors, spacing steps, shadows).

### Building for the website

The site is custom code. Load `assets/tokens.css` once at the root. It defines every token as a CSS variable, uses dark (coal) as the default, and switches to the light theme under `[data-theme="light"]`. Then either:

- use the React components in `assets/components/awebound-components.jsx` (ESM, `"use client"`, React 18+), with `assets/components/awebound.css`; or
- build your own markup with the same tokens and patterns.

`references/web.md` has each component's props, page recipes (home, collection, product, About) and the accessibility rules. Keep the dark theme for the shop; use the light (bone paper) theme only for editorial pages.

### Making marketing content

Start from `assets/templates/social-post.html`, a 1080×1350 drop-post layout already wired to the tokens and fonts. Fill its slots, then render it to PNG with `python scripts/render.py <html> <out.png> --width 1080 --height 1350` (Playwright). Sizes, safe areas and the three-post drop rhythm are in `references/marketing.md`. Each post carries one product or symbol, one line of copy and one Scripture reference.

### Writing copy

Reverent, weighty, sure of itself: short sentences, concrete images from Scripture, no sermons, no exclamation marks, no hype words, no fear or guilt. The clothes come first, so lead with the design and quality and let the reference carry the faith. Product descriptions follow the template in `references/voice.md`. Say the actual cut of each product (tee, oversized tee, tank, cap) and never describe the whole brand as one fit.

## Before you hand work back

Check it against this list:

- Wordmark from the file or component, intact, at least 120px wide, with clear space of a quarter of its height.
- Only brand tokens. Text contrast is at least 4.5:1 (see the usage notes), and oxblood is never used as text on coal.
- One primary (oxblood) action and one oxblood glow per screen at most. Corners 0–2px, no pills.
- Cinzel only for headlines, product names and Scripture (caps, about twelve words max); Archivo for everything else.
- Scripture is a full reference, symbols-only imagery, NLT credited if a verse is quoted.
- Copy has no exclamation marks, hype or guilt, and uses sentence case.

## Open items to respect

- Pricing, the blank supplier and final garment colors aren't set yet. Leave prices out or use a clearly marked placeholder, and treat `garment-*` colors as sampled from the lookbook.
- Minimum print and embroidery sizes (1.75in and 2.25in) are proposed and still need a physical test.
- Large back prints need a designer's cleanup of the traced wordmark before production.
