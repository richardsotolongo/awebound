# Visual identity

The A3 wordmark, the Thorn Cross, color, type and layout, as the live site uses them. Token names refer to `assets/tokens.css` (CSS variables, copied from `packages/brand/src/styles/tokens.css`) and `tokens.json`.

## Logo

- The A3 Thornbound wordmark is the only logo. Use the `Wordmark` component (inline SVG, inherits `color`) or the files in `assets/logos/`. Never retype AWEBOUND in any font, and never claim a website font is its typeface.
- **Signature lockup:** `brand-oxblood` on `brand-warm-bone`, for brand moments: hang tags, labels, packaging, the About page, email headers, the social avatar. Inside the site it lives in `AltarPanel`; emails use `apps/web/public/email/wordmark-oxblood.png`.
- **Functional lockups:** `ink` on coal in the site header (56px tall) and across the full width of the footer's last line (`ink` mixed 80% into `surface`); coal on paper on light pages.
- Clear space: one quarter of the lockup height on all sides. Minimum width 120px on screen (about 56px tall); below that use the small Thorn Cross. Print 1.75in, embroidery 2.25in (proposed, not yet tested).
- Never separate the lettering from its thorns; never stretch, outline, shadow, gradient or place it on a busy photo without a solid backing.

## The Thorn Cross and marks

- The Thorn Cross is the brand mark: a two-plank wooden cross with a braided thorn wreath tilted 45° around it, in front of the upper upright and right arm, behind the lower upright and left arm. Use `ThornCross` (`size="full"` at 96px+, `size="small"` below).
- Crosses stay upright and whole, never broken, tilted or placed underfoot. Release artwork may carry its own simple cross (Still the Storm's horizon, Thorns to Lilies' wreath, the hourglass in To Live Is Christ, the hill in The Passage, Wonderfully Made's wooden cross). The Thorn Cross may sit above or below the wordmark; it never replaces a letter.
- Secondary marks: thorn wreath, thorn vine, lily (`Mark name="lily" | "thorn-vine" | "thorn-wreath"`). One ink each. Never stack more than two marks.

## Color

- Website: four coal surfaces (`surface-page` → `surface-overlay`) give depth like stacked stone. Text is `ink`, `ink-muted`, `ink-subtle`.
- Oxblood (`primary`) is a fill, never text on coal: the primary button, the active nav underline, text selection, and at most one `glow-primary` per screen.
- Light from above: the shop header lights its title with `.soft-glow`, a bone `light-shaft` glow that fades to nothing with no visible edge. The home page uses no glow. The oxblood glow belongs to the brand `Hero` component and to posts.
- Accent text on dark is `accent-text` (Copper 300) for links, hover states, the bag count and form errors. Scripture references are `scripture` (gold).
- `panel-feature` (washed oxblood) carries drop banners, with `on-feature` text. `bb-copper` is for illustration and rules; `bb-faded-burgundy` for text on bone.
- Garment swatches: Behold's colors come from Fourthwall and map to `garment-black`, `garment-ecru`, `garment-french-navy`, `garment-cypress` and `garment-carolina-blue`. The other `garment-*`, `cap-*` and `bucket-*` swatches and the `rh-*` / `ra-*` palettes are legacy values from the pre-Behold lookbook; keep them out of new work unless a new piece uses that color.

## Type

Three families, each with one job. The site self-hosts them (OFL) and exposes `--font-grenze`, `--font-manrope` and `--font-cormorant`; `--font-display`, `--font-sans` and `--font-scripture` point at them with fallbacks.

- **Grenze Gotisch** (`--font-display`, weight 600): the home headline, release names ("Behold") and selected major headings. Always mixed case, the home headline included: blackletter capitals are hard to read. Never paragraphs, sizing, prices or numerals, which turn into blackletter shapes.
- **Cormorant Garamond Italic 500** (`--font-scripture`): Scripture quotations only, in curly double quotes. No added letter spacing; line height about 1.4.
- **Manrope** (`--font-sans`): everything else: body (16–18px), navigation, labels, buttons, prices, filters, forms, sizing, Scripture references, and product names (800, caps, 0.04em tracking).
- No `font-stretch`, no faux bold or italic, no outlined or distressed type, no type stretched to imitate the wordmark, no fourth decorative face. Body lines about 62 characters at most.

## Layout and the metal hint

- Container `container-max` (1200px); gutters `gutter-mobile` (16px) / `gutter-desktop` (48px); sections `space-16` (mobile) / `space-24` (desktop) apart. Header `header-height` (80px, 64px on phones), sticky and solid, with anchors landing below it; it uses its menu layout below 900px.
- Corners `radius-0`; buttons and inputs `radius-sm` (2px) at most. No pills.
- Faint film grain (`.aw-grain`) on backgrounds (the brand Hero, banners, posts), never over text or product photos.
- Divide sections with `ThornRule`. Quote Scripture with `ScriptureQuote`; a bare reference uses `ScriptureRef` (upright Manrope caps in gold between short rules).
- Motion: short rises and fades on `ease-reverent`, 200–300ms; product cards cross-fade to the other side on hover and zoom slightly. Decoration may draw or move, but artwork, Scripture and buttons stay readable at every frame (no long fades, nothing starting near invisible). No flames, embers, glitch or shake. Reduced motion gets still, complete pages.
- Off limits: skulls, gore, inverted or occult symbols, flames as decoration, illegible display type, blackletter for anything but display headings. A pastor and a metalhead should both find the page beautiful.

## Accessibility

- Body text meets 4.5:1 on its surfaces in both themes; control borders use `line-strong` (3:1).
- Focus: 2px solid `focus-ring` with 2px offset; `on-altar` inside altar panels, `on-feature` inside feature panels.
- Touch targets at least `tap-min` (44px). A skip link ("Skip to content") opens every page.

## Key color tokens

| Token                                                             | Dark (default)                        | Light   | Use                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `surface-page`                                                    | #0D0C0B                               | #F3EBDC | Page background. Dark is the website default; light (bone paper) is for editorial sections only.                                             |
| `surface`                                                         | #151413                               | #EDE3D0 | Sections, header and footer.                                                                                                                 |
| `surface-raised`                                                  | #1D1B19                               | #F8F2E7 | Cards, inputs, size and color pickers.                                                                                                       |
| `surface-overlay`                                                 | #2A2724                               | #FBF8F2 | Drawers, menus, the bag panel.                                                                                                               |
| `line`                                                            | #3A3632                               | #CFC4B1 | Hairlines, dividers and thorn rules. Decorative only: never the only border of a control.                                                    |
| `line-strong`                                                     | #78716A                               | #85796A | Borders of inputs, secondary buttons and the bag button. At least 3:1 on every surface.                                                      |
| `ink`                                                             | #F0E6D2                               | #151413 | Primary text and the wordmark.                                                                                                               |
| `ink-muted`                                                       | #C9BFAE                               | #4A443D | Body copy, labels, card quotes, nav links at rest.                                                                                           |
| `ink-subtle`                                                      | #8C847A                               | #665F57 | Captions, placeholders, the legal line. Dark theme: not on `surface-overlay` (4.0:1).                                                        |
| `accent-text`                                                     | #C47A55                               | #8E4A55 | Copper 300 (dark) / faded burgundy (light): links, hover states, the bag count, form errors. Dark theme: on `surface-overlay` only at 18px+. |
| `scripture`                                                       | #B89651                               | #6E5728 | Scripture references only (5.3:1 or better).                                                                                                 |
| `primary`                                                         | #782B35                               | same    | Oxblood. Primary button fill, the one glow per screen, the active nav underline. Never text on dark (1.9:1).                                 |
| `primary-hover`                                                   | #8A3240                               | same    | Primary button hover and pressed fill.                                                                                                       |
| `on-primary`                                                      | #F0E6D2                               | same    | Text and icons on primary (7.7:1).                                                                                                           |
| `focus-ring`                                                      | #C47A55                               | #782B35 | Keyboard focus: 2px solid, 2px offset.                                                                                                       |
| `panel-feature`                                                   | #693A3D                               | same    | Washed oxblood. Drop banners and release features; text on it is `on-feature` / `on-feature-muted`.                                          |
| `altar`                                                           | #E8DDC9                               | same    | Warm bone. Altar panels: the About story, release intros, sign-ups. Carries the signature wordmark.                                          |
| `on-altar`                                                        | #151413                               | same    | Text and focus ring on altar (13.7:1).                                                                                                       |
| `altar-mark`                                                      | #782B35                               | same    | Wordmark, Thorn Cross and headings on altar; the altar button fill.                                                                          |
| `altar-scripture`                                                 | #6E5728                               | same    | Scripture references on altar (5.1:1).                                                                                                       |
| `brand-coal` / `brand-bone` / `brand-oxblood` / `brand-warm-bone` | #151413 / #F0E6D2 / #782B35 / #E8DDC9 | same    | The four brand colors, for lockups, packaging and print.                                                                                     |
| `bb-copper`                                                       | #A65D3D                               | same    | Oxidized copper: illustration, rules, badges. As text only at 24px+ (3.7:1 on coal).                                                         |
| `scrim`                                                           | #0D0C0B at 80%                        | same    | Backdrop behind drawers and sheets.                                                                                                          |
| `light-shaft`                                                     | #F0E6D2 at 12%                        | same    | Light from above (`.soft-glow`) behind the shop title; bone, not a new color.                                                                |

Garment swatches, legacy palettes, spacing, shadows and motion are in `tokens.json`.

## Type styles

Classes come from `assets/components/awebound.css`. Display sizes are fluid.

| Style (class)      | Family                    | Size / line                                      | Weight | Tracking | Use                                                                                                          |
| ------------------ | ------------------------- | ------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| `.aw-display`      | Grenze Gotisch            | clamp(44px, 6vw, 76px) / 1                       | 600    | 0.005em  | Hero headline, one per page.                                                                                 |
| `.aw-h1`           | Grenze Gotisch            | clamp(36px, 4.4vw, 52px) / 1.05                  | 600    | 0.005em  | Page titles.                                                                                                 |
| `.aw-h2`           | Grenze Gotisch            | clamp(30px, 3.2vw, 38px) / 1.1                   | 600    | 0.005em  | Section titles and release names.                                                                            |
| `.aw-quote`        | Cormorant Garamond Italic | 23px / 1.42 (19px in cards, up to 30px featured) | 500    | 0        | Scripture quotations only. Mobile 21px (18 / 23).                                                            |
| `.aw-product-name` | Manrope                   | 20px / 26px                                      | 800    | 0.04em   | Product name on the product page, caps. Mobile 18/24px.                                                      |
| `.aw-card-name`    | Manrope                   | 18px / 24px                                      | 800    | 0.04em   | Product name on cards, caps. Phones 16/21px.                                                                 |
| `.aw-h3`           | Manrope                   | 20px / 27px                                      | 700    | 0        | Sub-headings, sentence case. Mobile 18/25px.                                                                 |
| `.aw-body`         | Manrope                   | 17px / 27px                                      | 400    | 0        | Body copy in `ink-muted`, max 62ch. Mobile 16/26px.                                                          |
| `.aw-small`        | Manrope                   | 14px / 21px                                      | 400    | 0        | Captions, form help, footer text.                                                                            |
| `.aw-label`        | Manrope                   | 12px / 16px                                      | 700    | 0.16em   | Eyebrows and labels, caps.                                                                                   |
| `.aw-btn`          | Manrope                   | 13px / 13px                                      | 700    | 0.12em   | Button text, caps.                                                                                           |
| `.aw-meta`         | Manrope                   | 13px / 16px                                      | 700    | 0.1em    | Prices and small figures in `accent-text`, tabular figures. Never a design code.                             |
| `.aw-scripture`    | Manrope                   | 12.5px / 18px                                    | 700    | 0.12em   | Scripture references in `scripture`, caps, between 32px rules; the translation part is 600. 11.5px in cards. |
