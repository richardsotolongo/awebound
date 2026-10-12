# Visual identity

The A3 wordmark, the Thorn Cross, color, type and layout. Token names refer to `assets/tokens.css` (CSS variables) and `tokens.json`.

## Logo

- The A3 Thornbound wordmark is the only logo. Use the `Wordmark` component (inline SVG, inherits `color`) or the files in **Logos**. Never retype AWEBOUND in any font.
- **Signature lockup:** `brand-oxblood` on `brand-warm-bone`, for brand moments: hang tags, labels, packaging, the About page, email headers, the social avatar. Inside the site it lives in `AltarPanel`.
- **Functional lockups:** `ink` on coal in the site header, footer and video end cards; coal on paper on light pages.
- Clear space: one quarter of the lockup height on all sides. Minimum width 120px on screen; below that use the small Thorn Cross. Print 1.75in, embroidery 2.25in (proposed).
- Never separate the lettering from its thorns; never stretch, outline, shadow, gradient or place it on a busy photo without a solid backing.


## The Thorn Cross and marks

- The Thorn Cross is the only cross: a two-plank wooden cross with a braided thorn wreath tilted 45° around it, in front of the upper upright and right arm, behind the lower upright and left arm. Use `ThornCross` (`size="full"` at 96px+, `size="small"` below).
- It stays upright and whole, never broken, tilted or placed underfoot. It may sit above the wordmark; it never replaces a letter.
- Secondary marks: thorn wreath, thorn vine, lily. One ink each. Never stack more than two marks.


## Color

- Website: four coal surfaces (`surface-page` → `surface-overlay`) give depth like stacked stone. Text is `ink`, `ink-muted`, `ink-subtle`.
- Oxblood (`primary`) is a fill, never text on coal. One `glow-primary` per screen.
- Broken Bond is the secondary palette: `bb-copper` for illustration and rules, `panel-feature` (washed oxblood) for drop banners with `on-feature` text, `bb-faded-burgundy` for text on bone.
- Royal Heritage (`rh-*`) and Rolled Away (`ra-*`) colors appear only in their own product art, never in site chrome. Garment swatches use the `garment-*` and `cap-*` tokens.


## Type

- Cinzel (`display` family) for headlines, product names and Scripture, always caps, never more than about twelve words. Archivo (`sans`) for everything else.
- Labels, buttons, product IDs and prices: Archivo 600, `font-stretch: 75%`, caps, tracked (`label`, `button`, `meta`).
- No italics, no faux bold, no outlined type. Body lines 50 to 70 characters.


## Layout and the metal hint

- Container `container-max`; gutters `gutter-mobile` / `gutter-desktop`; sections `space-16` (mobile) / `space-24` (desktop) apart.
- Corners `radius-0`; buttons and inputs `radius-sm` at most. No pills.
- Faint film grain on backgrounds (`.aw-grain`), never over text or product photos.
- Divide sections with `ThornRule`. Set Scripture with `ScriptureRef`, spaced caps between short rules.
- Motion: 200–300ms fades and short rises; image cross-fade on product hover. No flames, embers, glitch or shake. Honor reduced motion.
- Off limits: skulls, gore, inverted or occult symbols, flames as decoration, illegible display type, blackletter fonts. A pastor and a metalhead should both find the page beautiful.


## Accessibility

- Body text meets 4.5:1 on its surfaces in both themes; control borders use `line-strong` (3:1).
- Focus: 2px solid `focus-ring` with 2px offset; `on-altar` inside altar panels, `on-feature` inside feature panels.
- Touch targets at least `tap-min`.


## Key color tokens

| Token | Dark (default) | Light | Use |
| --- | --- | --- | --- |
| `surface-page` | #0D0C0B | #F3EBDC | Page background. Dark theme is the website default; light (bone paper) is for editorial pages. |
| `surface` | #151413 | #EDE3D0 | Sections, header and footer. |
| `surface-raised` | #1D1B19 | #F8F2E7 | Cards, inputs, size and color pickers. |
| `surface-overlay` | #2A2724 | #FBF8F2 | Drawers, menus, the bag panel. |
| `line` | #3A3632 | #CFC4B1 | Hairlines, dividers and thorn rules. Decorative only: never the only border of a control. |
| `line-strong` | #78716A | #85796A | Borders of inputs and secondary buttons. At least 3:1 on every surface in both themes. |
| `ink` | #F0E6D2 | #151413 | Primary text and the wordmark, on every surface token. |
| `ink-muted` | #C9BFAE | #4A443D | Secondary text and body copy under headings, on every surface token. |
| `ink-subtle` | #8C847A | #665F57 | Captions and metadata on surface-page, surface and surface-raised (4.6:1 or better). Dark theme: not on surface-overlay (4.0:1). |
| `accent-text` | #C47A55 | #8E4A55 | Copper 300 (dark) / faded burgundy (light): links, prices, product IDs, bag count. On surface-page, surface, surface-raised. Dark theme: on surface-overlay only at 18px+ (4.4:1). |
| `scripture` | #B89651 | #6E5728 | Scripture references only, on any surface token (5.3:1 or better). |
| `primary` | #782B35 | same | Oxblood. Primary button fill, the one glow per screen, the signature wordmark ink. Never as text on dark surfaces (1.9:1). |
| `primary-hover` | #8A3240 | same | Primary button hover and pressed fill. |
| `on-primary` | #F0E6D2 | same | Text and icons on primary and primary-hover (7.7:1). |
| `focus-ring` | #C47A55 | #782B35 | Keyboard focus: 2px solid ring with a 2px offset. Inside altar panels use on-altar; inside feature panels use on-feature. |
| `panel-feature` | #693A3D | same | Washed oxblood. Drop banners and collection features. Text on it is on-feature or on-feature-muted only. |
| `on-feature` | #F0E6D2 | same | Text, rules and focus on panel-feature (7.5:1). |
| `altar` | #E8DDC9 | same | Warm bone. Altar panels: the About story, collection intros, newsletter. Carries the signature oxblood wordmark. |
| `on-altar` | #151413 | same | Text and focus ring on altar (13.7:1). |
| `altar-mark` | #782B35 | same | Wordmark and Thorn Cross on altar (7.1:1). Also headings there at 24px+. |
| `altar-scripture` | #6E5728 | same | Scripture references on altar (5.1:1). |
| `brand-coal` | #151413 | same | Brand color: coal, sampled from the logo files. Functional dark wordmark ground; signature coal ink on paper. |
| `brand-bone` | #F0E6D2 | same | Brand color: bone, sampled from the logo files. Wordmark ink on coal. |
| `brand-oxblood` | #782B35 | same | Brand color: oxblood, from A3-R01. Signature wordmark ink on warm bone. |
| `brand-warm-bone` | #E8DDC9 | same | Brand color: warm bone. Signature lockup ground, hang tags, labels, packaging. |
| `bb-copper` | #A65D3D | same | Broken Bond secondary: oxidized copper. Illustration, rules, badges, hover borders. As text only at 24px+ (3.7:1 on coal). |
| `bb-faded-burgundy` | #8E4A55 | same | Broken Bond secondary: faded burgundy. Text and accents on bone and paper (4.8:1 or better). |
| `bb-charcoal` | #2F2B29 | same | Broken Bond secondary: charcoal. Garment base, photo backdrops. |

Collection-only colors (`rh-*` Royal Heritage, `ra-*` Rolled Away) and garment swatches (`garment-*`, `cap-*`, `bucket-*`) are in `tokens.json`.

## Type styles

Fonts: Cinzel and Archivo from Google Fonts (imported by `tokens.css`). Display styles are always uppercase; `label`, `button` and `meta` are uppercase with `font-stretch: 75%`.

| Style | Family | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `display` | display | 56px / 58px | 600 | 0.04em | Hero headline, one per page. Mobile 36/40px. |
| `h1` | display | 40px / 44px | 600 | 0.03em | Page titles. Mobile 30/34px. |
| `h2` | display | 28px / 32px | 600 | 0.03em | Section and collection titles. Mobile 24/28px. |
| `product-name` | display | 21px / 26px | 600 | 0.04em | Product names on cards and product pages. Mobile 19/24px. |
| `scripture-ref` | display | 14px / 20px | 400 | 0.32em | Scripture references, in the scripture color, between short rules. |
| `h3` | sans | 20px / 26px | 700 | 0.02em | Sub-headings, caps, font-stretch 78%. Mobile 18/24px. |
| `body` | sans | 17px / 27px | 400 | 0 | Body copy, 50 to 70 characters a line. Mobile 16/26px. Emphasis is weight 600. |
| `small` | sans | 14px / 21px | 400 | 0 | Captions, product subtitles, form help. |
| `label` | sans | 12.5px / 16px | 600 | 0.2em | Eyebrows and labels, caps, font-stretch 75%. |
| `button` | sans | 13px / 13px | 600 | 0.18em | Button text, caps, font-stretch 75%. |
| `meta` | sans | 13px / 16px | 600 | 0.2em | Product IDs and prices in accent-text, caps, font-stretch 75%, tabular figures. |
