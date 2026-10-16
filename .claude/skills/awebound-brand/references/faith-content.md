# Scripture and faith content

Awebound quotes Scripture exactly, labels it honestly and lets the art carry the meaning. Imagery is symbols only, never a figure of Christ.

## References

- Full book name, chapter, colon, verse; an en dash for ranges: Matthew 9:21, 1 Corinthians 3:6, Luke 24:1–6. No abbreviations.
- On screen a bare reference uses `ScriptureRef` (upright Manrope caps in the `scripture` gold, short rules either side). Garment art sets references in its own lettering.

## Quotations on the website

- **The website quotes the King James Version (KJV)**, word for word with its punctuation and spelling (public domain in the United States, so no permission or notice is needed). Never paraphrase and present it as a quote; never modernize, invent or "tidy" wording. An excerpt ends where the quoted part ends, without added punctuation.
- **Label** every quotation with the reference, then the translation: `Mark 4:41 — KJV`; when only part of the verse is quoted, `Matthew 9:21 — KJV, excerpt`.
- **Prose around Scripture uses the KJV's terms** (the veil of the temple, the hem of His garment, the valley of the shadow of death, the wind and the sea); words repeated from a verse are quoted in KJV wording.
- **Presentation**: the words in Cormorant Garamond Italic inside curly double quotes; quotation marks inside the verse become single quotes (“They asked each other, ‘Who is this?’”). The reference sits beneath in upright type. Quotes wrap in full on every screen: never truncate with an ellipsis or shrink them to equalize card heights. `ScriptureQuote` does all of this.
- **One shared Scripture record per piece** (reference, excerpt flag, exact KJV text, plus the NIV text kept for a possible later switch) feeds the home page, shop cards and product page, so they always agree: `scripture` in `apps/web/src/server/content/catalog.json`. Site-wide verses live in `verses.json` (Romans 1:16, excerpt; 1 Corinthians 3:6). `TRANSLATION` in `apps/web/src/server/scripture.ts` (the KJV) sets every quotation, translation statement and Bible link at once; the NIV only ever after Biblica's written permission.
- About and FAQ state the translation plainly: "Scripture quoted on this website is from the King James Version (KJV)." Bible links go to bible.com in the KJV.

## Printed garments

- **Garment artwork keeps its approved lettering.** Every print that carries a verse uses King James wording: Still the Storm's back, Stone in Motion's back and By His Hem's back ("If I may but touch his garment, I shall be whole", since October 2026); Fear Not ("I will fear no evil") and Wonderfully Made ("Fearfully & wonderfully made") print wording the KJV shares.
- Never translate or regenerate printed art. Describe printed text accurately ("Mark 4:41 in the King James wording"), and keep image descriptions and alt text true to what the image shows.

## Notice

- The footer, FAQ and Terms say: "Scripture quotations are from the King James Version, which is in the public domain in the United States."
- Quoting the NIV on the website again would need Biblica's written permission (biblica.com/permissions) and its exact notice first.

## Depiction: symbols only

| Allowed                                                                                                    | Not allowed                                                          |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| The Thorn Cross; a simple, upright, whole cross in release art (in a wreath, in an hourglass, among roses) | Any depiction of Jesus: face, silhouette, hands, crucifix figure     |
| A crown of thorns, thorn vines, thorns turning into lilies, roses around a cross                           | God the Father or the Holy Spirit as a person                        |
| A stilled sea, storm clouds, the hem of His garment                                                        | Gore, wounds, blood for shock                                        |
| The torn temple veil, light breaking through clouds                                                        | Skulls, inverted crosses, occult or satanic symbols                  |
| The empty tomb, the rolled stone, dawn light, an hourglass                                                 | Broken, tilted or trampled crosses; budded crosses; four-point stars |
| The Lamb of God, as a biblical symbol rather than a portrait                                               | Scripture as a joke, pun or unrelated slogan                         |
| Human figures that aren't Christ: the woman's hand reaching for the hem of His garment (By His Hem)        | Any figure that could be read as Christ                              |
| Broken chains, arches, olive branches                                                                      |                                                                      |

Reverent and confident; never mock other believers or traditions, never sell with fear or guilt.
