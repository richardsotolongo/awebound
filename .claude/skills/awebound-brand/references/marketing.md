# Marketing formats

Every post uses one piece or symbol, one line of copy and one Scripture reference. A quote is optional; when you use one, it's the piece's exact NIV wording from its Scripture record, labeled like the site ("Isaiah 1:18 — NIV, excerpt"). Type follows the site: Manrope for labels, names and references, Cormorant Garamond Italic for the quote only, Grenze Gotisch only for a release name or the tagline set large. Sizes follow Instagram's guidance as of January 2026.

| Format            | Size (px)          | Layout rule                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feed post         | 1080 × 1350 (4:5)  | Keep product and headline inside the center 1080 × 1080 so the 3:4 grid preview never crops them                                                                                                                                                                                                                                                                  |
| Story and Reel    | 1080 × 1920 (9:16) | Keep text out of the top 250 and bottom 340px; end card = wordmark on coal                                                                                                                                                                                                                                                                                        |
| Square post or ad | 1080 × 1080        | Signature lockup or product, never both at full size                                                                                                                                                                                                                                                                                                              |
| Profile avatar    | 1080 × 1080        | Signature lockup, or the Thorn Cross for tight crops                                                                                                                                                                                                                                                                                                              |
| Email             | 560 content width  | Warm-bone ground, the oxblood wordmark PNG (200px wide) on top, a paper card (`surface-raised` light value with a `line` border) holding the message, the tagline in spaced caps below. Tables only, inline hex, Manrope with system fallbacks, light only, one button. The site's transactional emails (`apps/web/src/server/email-templates.ts`) are the model. |
| Lookbook page     | US Letter portrait | Paper ground, the piece front and back, release label, front/back notes, the Scripture line                                                                                                                                                                                                                                                                       |

## Drop posts

A three-post rhythm per release: a detail teaser (print texture, no name), the reveal (back print, name, release), then the "out now" post (front and back, Shop CTA) once ordering is open. Never post a launch date until it's confirmed. Captions lead with the product name, then one line of story, then the reference.

## The drop-post template

`assets/templates/social-post.html` is a 1080 × 1350 feed post. Edit the `POST` object at the top of its script:

| Field         | What goes in it                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `eyebrow`     | Label line, for example "Release 01 · Behold"                                                    |
| `name`        | Product name (Manrope 800 caps)                                                                  |
| `line`        | One line of copy in the brand voice, usually from the piece's `story.art`                        |
| `quote`       | Optional: exact NIV wording, without surrounding quotes. Leave empty to show the reference alone |
| `scripture`   | Full reference, for example "Isaiah 1:18"                                                        |
| `excerpt`     | `true` when the quote is part of the verse                                                       |
| `translation` | `"NIV"`; shown only beside a quote                                                               |
| `image`       | Path or URL of the listing image (whole garment, back print first for tees and hoodies)          |
| `theme`       | `"coal"` (default) or `"altar"` for the warm-bone signature version                              |

Render with `python scripts/render.py assets/templates/social-post.html out.png --width 1080 --height 1350` (needs `pip install playwright` and `python -m playwright install chromium`; pass `--data '{...}'` to override fields). Without Playwright, headless Chrome works too: `chrome --headless=new --allow-file-access-from-files --window-size=1080,1350 --screenshot=out.png file:///…/social-post.html`.

The template is 4:5 only. For a 9:16 story, copy it, set the `body` and `.post` height to 1920px, set `.eyebrow` `margin-top` to 300px and `.mark` `bottom` to 360px so text clears the top 250px and bottom 340px, then render with `--height 1920`.

## Captions

Lead with the product name, then one line of story, then the reference. At most one emoji, never in place of a word. No exclamation marks, no countdown pressure, no "streetwear", and no design codes.

> Thorns to Lilies. A crown of thorns breaks into lilies around the wordmark, under a cross. Isaiah 1:18.

> Still the Storm. Storm waves break through the wordmark, and the disciples ask who He is. Mark 4:41.
