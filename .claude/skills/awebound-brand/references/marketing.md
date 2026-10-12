# Marketing formats

Every post uses one product or symbol, one line of copy and one Scripture reference. Sizes follow Instagram's guidance as of January 2026.

| Format | Size (px) | Layout rule |
| --- | --- | --- |
| Feed post | 1080 × 1350 (4:5) | Keep product and headline inside the center 1080 × 1080 so the 3:4 grid preview never crops them |
| Story and Reel | 1080 × 1920 (9:16) | Keep text out of the top 250 and bottom 340px; end card = wordmark on coal |
| Square post or ad | 1080 × 1080 | Signature lockup or product, never both at full size |
| Profile avatar | 1080 × 1080 | Signature lockup, or the Thorn Cross for tight crops |
| Email | 600 wide | Altar header with the signature lockup, coal body, one product block, one button |
| Lookbook page | US Letter portrait | Paper ground, product pair, family label, front/back notes, Scripture line |

## Drop posts

A three-post rhythm per release: a detail teaser (print texture, no name), the reveal (back print, name, family), then "out now" (front and back, Shop CTA). Captions lead with the product name, then one line of story, then the reference.

## The drop-post template

`assets/templates/social-post.html` is a 1080 × 1350 feed post. Edit the `POST` object at the top of its script:

| Field | What goes in it |
| --- | --- |
| `eyebrow` | Label line, for example "New drop · Broken Bond" |
| `name` | Product name (Cinzel caps) |
| `line` | One line of copy in the brand voice |
| `scripture` | Full reference, for example "Romans 6:9" |
| `image` | Path or URL of the product shot (back print first) |
| `theme` | `"coal"` (default) or `"altar"` for the warm-bone signature version |

Render with `python scripts/render.py assets/templates/social-post.html out.png --width 1080 --height 1350`. The template is 4:5 only. For a 9:16 story, copy it, set the `body` and `.post` height to 1920px, set `.eyebrow` `margin-top` to 300px and `.mark` `bottom` to 360px so text clears the top 250px and bottom 340px, then render with `--height 1920`.

## Captions

Lead with the product name, then one line of story, then the reference. At most one emoji, never in place of a word. No exclamation marks, no countdown pressure.

> Shattered Dominion. A diagonal chain breaks around an empty cross, the fear of death undone. Hebrews 2:14–15.
