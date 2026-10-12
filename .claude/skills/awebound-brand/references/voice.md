# Brand and voice

Awebound is an independent Christian apparel brand, founded by Richard out of his faith and reverence for Jesus Christ. It makes clothing rooted in Scripture: every piece tells part of His story in bold art and lettering. The range covers tees, oversized tees, hoodies, tank tops and hats, with more to come. Never describe the whole brand as one cut or garment type.

The store welcomes everyone. Write so that someone who doesn’t share Richard’s faith still understands where the clothes come from and feels free to buy them: say what Awebound makes and why, and never tell the reader what to believe, assume they believe, or say who the clothes are “for”.

Tagline: **Bound in awe. Worn without shame.** Bound in awe: held by who He is, letting reverence for Jesus Christ shape what we make and wear. Worn without shame: not ashamed of the gospel (Romans 1:16).

Awebound sounds reverent, weighty and sure of itself: short sentences, concrete images from Scripture, no sermons.

## Releases

A release (`collection` in code) is a small set of pieces drawn from one call in Scripture, numbered in order. Release 01 is **Behold**: "Clothes that ask you to look at Jesus, and keep looking." Each piece has a theme and a call that begins with Behold: Mercy · Behold His mercy; Power · Behold His power; Healing · Behold the One who heals.

"Latest Drop" is the newest release with pieces on the site, worked out from the catalog. Say "Latest Drop", not "New Collection". Collections lists only releases that exist.

## What to say

- **Design and meaning get equal attention.** Talk about the art, lettering and garment plainly, and let the Scripture and its meaning carry the faith.
- **Three voices, kept apart.** What Awebound makes (plain statements about the clothes and their source), what the passage says (the exact quotation and one sentence on what the art shows), and what Richard intends (his own first person, under his name).
- **Conversations about Jesus are Richard’s hope**, not the sales pitch. Say it as his intention; don’t tell wearers what they will say, and don’t assume the reader believes.
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

Active voice, plain words, contractions where they're natural, short sentences, concrete detail from the passage. Cut filler, stacked hedges, "not X, but Y" turns, colon-led one-liners, lists of three used for rhythm, and summing-up lines at the end of a paragraph. Write for anyone curious about Awebound, Christian or not, and not for search engines. US English.

## Mechanics

- Sentence case in copy and in button labels (buttons display caps through styling). Selector labels may be title case (Latest Drop, All Collections).
- No exclamation marks. Emoji only in social captions, at most one, never in place of a word.
- Never hard-code a price in copy; prices come from Fourthwall (or the content file until a piece is published). List the base price with no “From”; a 2XL or 3XL upcharge is said under the sizes once chosen.
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

Richard’s own words, as he supplied them in October 2026, and nothing invented beyond them.

- **Home page note.** Heading: “My faith in God comes first.” Body: “I started Awebound with a desire to serve Christ and others through clothing rooted in Scripture. I want to create pieces people love wearing, with artwork that reflects biblical stories and opens the door to conversations about Jesus Christ.” Link: **Read my story**.
- **About, “My story”.** His full text lives in `STORY` in `apps/web/src/app/about/page.tsx`: he is the founder; his faith in God comes first; he serves his community in law enforcement and leads a men’s Bible study; he believes we are saved by grace through faith in Jesus Christ, and his desire to serve Him comes from gratitude for that grace; he is drawn to expressive lettering, oversized fits and artwork that tells a story; Behold is the beginning of the work; whoever comes for the artwork, the meaning behind it or simply to learn more is welcome.
- Keep his beliefs in his first person. Never add a testimony, struggle, rank, place, congregation or quotation; never turn his convictions into claims about the visitor; never tie a spiritual promise to buying; don’t wrap his story in quotation marks or set it like Scripture.
- Captions and alt text for his portrait name Richard and nothing he is wearing.
- Ask Richard for anything more.

## Naming

- Releases: one word or short call from Scripture, numbered (Release 01 — Behold).
- Product names: two to four words from the art or the verse (Thorns to Lilies, By His Hem, Still the Storm, The Passage).
- Internal design codes (A3-B01 for apparel, A3-H01 for hats) live in records, SKUs, assets and orders only. Never show them to customers: not on cards, headings, badges, related pieces, search, bag lines, alt text or metadata.

## Calls to action

View [piece] · See all [n] pieces · Shop [release] (on Collections) · Add to bag · Check out · Notify me · Read my story (under Richard’s note). A button says exactly where it goes. Avoid "Buy now" and countdown pressure.

The site always reads as open for ordering: no release-status sentences, no “coming soon”, no preview notices and no “ordering isn’t open”. A piece says only “Sold out” or “Some sizes sold out”. A piece not yet published in Fourthwall looks like one on sale (Add to bag, Check out); only checkout can’t start, and the bag says “Checkout isn’t available right now. Your bag is saved, so please try again a little later.” Never name the supplier to customers: “our print and fulfillment partner”.
