# Brand and voice

Awebound is an independent Christian apparel brand, founded by Richard, for believers aged 18 to 30 who are not ashamed to express their faith and want to wear it boldly. It makes clothing rooted in Scripture and reverence for Jesus Christ: every piece tells part of His story in bold art and lettering. The range covers tees, oversized tees, hoodies, tank tops and hats, with more to come. Never describe the whole brand as one cut or garment type.

Tagline: **Bound in awe. Worn without shame.** Bound in awe: held by who He is, letting reverence for Jesus Christ shape what we make and wear. Worn without shame: not ashamed of the gospel (Romans 1:16).

Awebound sounds reverent, weighty and sure of itself: short sentences, concrete images from Scripture, no sermons.

## Releases

A release (`collection` in code) is a small set of pieces drawn from one call in Scripture, numbered in order. Release 01 is **Behold**: "Clothes that ask you to look at Jesus, and keep looking." Each piece has a theme and a call that begins with Behold: Mercy · Behold His mercy; Power · Behold His power; Healing · Behold the One who heals.

"Latest Drop" is the newest release with pieces on the site, worked out from the catalog. Say "Latest Drop", not "New Collection". Collections lists only releases that exist.

## What to say

- **Design and meaning get equal attention.** Talk about the art, lettering and garment plainly, and let the Scripture and its meaning carry the faith.
- **Conversations about Christ are a natural outcome**, not the sales pitch: when someone asks what a piece means, the wearer gets to answer. "We plant the seed; God makes it grow" (1 Corinthians 3:6).
- Say "Christian apparel", "clothing", "pieces" or "Awebound". Never "streetwear". Fit words such as "oversized" belong in product details and sizing.
- In brand prose, pronouns for God are capitalized (His mercy, He is risen). Quotations keep their translation's casing.

## Do and don't

| Do                                                                                      | Don't                                     |
| --------------------------------------------------------------------------------------- | ----------------------------------------- |
| "Storm clouds break over a heavy sea, and a cross stands on the horizon."               | "Blessed vibes only!!"                    |
| Name the image: the stilled sea, the edge of His cloak, the rolled stone, the torn veil | Vague uplift: "faith-inspired positivity" |
| Let the quote and reference speak                                                       | Preach or explain the verse at length     |
| Talk about the garment plainly: weight, fabric, fit, print                              | Hype words: "insane", "fire", "drip"      |
| Invite: "Behold His mercy."                                                             | Shame or fear: "Don't be lukewarm."       |

## Sound like a person

Active voice, plain words, contractions where they're natural, short sentences, concrete detail from the passage. Cut filler, stacked hedges, "not X, but Y" turns, colon-led one-liners, lists of three used for rhythm, and summing-up lines at the end of a paragraph. Write for Christians who are curious about Awebound, not for search engines. US English.

## Mechanics

- Sentence case in copy. Buttons display caps through styling; button and selector labels may be title case (Explore Behold, Get Release Updates, Latest Drop).
- No exclamation marks. Emoji only in social captions, at most one, never in place of a word.
- Never hard-code a price in copy; prices come from Fourthwall (or the preview price in the content file).
- Only confirmed facts: no launch dates, delivery times or shipping rates until they're confirmed.

## Product copy fields

Each piece's copy lives in `apps/web/src/server/content/catalog.json` (`scripture` and `story`). Write new pieces in these fields:

```
[Product name] · [Release name] · [Garment type] · [Price]
Scripture: [NIV quote] — [Reference] — NIV[, excerpt]
Theme and call: [Mercy] · [Behold His mercy]
Art: [one sentence on the main artwork and what it shows]
Meaning: [two to four sentences: the moment in Scripture and how the design carries it]
Front: [placement and mark] · Back: [composition in one line; name printed wording accurately]
Color: [garment color] · Inks or thread: [colors]
Fit: [cut and silhouette] · Fabric: [the blank's fabric, from Fourthwall]
```

Example, from the site:

```
Still the Storm · Behold · Oversized tee · $40
Scripture: “They were terrified and asked each other, ‘Who is this? Even the wind and the waves obey him!’” — Mark 4:41 — NIV
Theme and call: Power · Behold His power
Art: Storm clouds break over a heavy sea, and a cross stands on the horizon in the light.
Meaning: The disciples were fishermen. They knew that lake, and the storm still scared them. Jesus got up, spoke to the wind and the waves, and everything went calm. Then they turned to each other and asked who He was.
Front: Awebound wordmark over the storm, the waves and the cross on the horizon · Back: Mark 4:41 in engraved capitals, in the King James wording, above a breaking wave
Color: Black · Inks: Bone
Fit: Larger oversized · dropped shoulder, extra-boxy body · Fabric: 100% organic combed ring-spun cotton (5.9 oz) · GOTS-certified organic
```

## Founder story

Use only Richard's own stated words. He started Awebound for people who are not ashamed to express their faith and want to wear it boldly; he built it with faith at the forefront of every design; every design tells a story about our Lord and Savior, Jesus Christ; the hope is that each piece starts a conversation about Him. About himself (the first-person note and portrait on About): a Florida native and a Christian; his faith in God comes first; living for Christ is his sole purpose and priority in life; creating Awebound is one branch of hopefully being used by God to start conversations wherever the apparel is bought. Never invent a testimony, background or experience beyond that. Ask Richard for anything more personal.

## Naming

- Releases: one word or short call from Scripture, numbered (Release 01 — Behold).
- Product names: two to four words from the art or the verse (Thorns to Lilies, By His Hem, Still the Storm, The Passage).
- Internal design codes (A3-B01 for apparel, A3-H01 for hats) live in records, SKUs, assets and orders only. Never show them to customers: not on cards, headings, badges, related pieces, search, bag lines, alt text or metadata.

## Calls to action

Explore [release] · Get Release Updates · Shop [release] (once ordering opens) · View [piece] · Save to bag (preview) or Add to bag · Check out · Notify me · Read our story. Avoid "Buy now" and countdown pressure.

While a release is in preview: "Release 01 — Behold — Coming Soon" by the opening buttons; product pages say "Ordering isn’t open yet" and offer Save to bag; the bag says it saves selections on this device and doesn't place an order or charge anyone. Once ordering opens, the labels switch on their own.
