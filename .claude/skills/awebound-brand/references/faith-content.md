# Scripture and faith content

Awebound quotes Scripture exactly, labels it honestly and lets the art carry the meaning. Imagery is symbols only, never a figure of Christ.

## References

- Full book name, chapter, colon, verse; an en dash for ranges: Matthew 9:21, 1 Corinthians 3:6, Luke 24:1–6. No abbreviations.
- On screen a bare reference uses `ScriptureRef` (upright Manrope caps in the `scripture` gold, short rules either side). Garment art sets references in its own lettering.

## Quotations on the website

- **The website quotes the NIV**, word for word with its punctuation, from an authorized NIV source. Never paraphrase and present it as a quote; never invent or "tidy" wording. An excerpt ends where the quoted part ends, without added punctuation.
- **Label** every quotation with the reference, then the translation: `Mark 4:41 — NIV`; when only part of the verse is quoted, `Matthew 9:21 — NIV, excerpt`.
- **Presentation**: the words in Cormorant Garamond Italic inside curly double quotes; quotation marks inside the verse become single quotes (“They asked each other, ‘Who is this?’”). The reference sits beneath in upright type. Quotes wrap in full on every screen: never truncate with an ellipsis or shrink them to equalize card heights. `ScriptureQuote` does all of this.
- **One shared Scripture record per piece** (reference, excerpt flag, exact NIV and KJV text) feeds the home page, shop cards and product page, so they always agree: `scripture` in `apps/web/src/server/content/catalog.json`. Site-wide verses live in `verses.json` (Romans 1:16, excerpt; 1 Corinthians 3:6). `SCRIPTURE_TRANSLATION` (NIV by default, or KJV) switches every quotation and translation statement at once.
- About and FAQ state the translation plainly: "Scripture quoted on this website is from the New International Version (NIV)."

## Printed garments

- **Garment artwork keeps its approved lettering.** Some prints use King James wording (Still the Storm's back, Stone in Motion's back); By His Hem's back prints NIV wording. The Passage ("I will fear no evil") and Wonderfully Made ("Fearfully & wonderfully made") print wording the KJV shares.
- Never translate, regenerate or relabel printed art as NIV. Describe printed text accurately ("Mark 4:41 in the King James wording"), and keep image descriptions and alt text true to what the image shows.

## Permission and notice

- Website use of the NIV needs Biblica's written permission (biblica.com/permissions) before launch. Merchandise that prints NIV text (By His Hem) needs its own permission.
- Every page that quotes the NIV carries the notice (the site puts it in the footer, and in the FAQ and Terms): "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide." Use the exact wording Biblica supplies.

## Depiction: symbols only

| Allowed                                                                                                                               | Not allowed                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| The Thorn Cross; a simple, upright, whole cross in release art (on a horizon, in a wreath, in an hourglass, on a hill)                | Any depiction of Jesus: face, silhouette, hands, crucifix figure     |
| A crown of thorns, thorn vines, thorns turning into lilies, roses around a cross                                                      | God the Father or the Holy Spirit as a person                        |
| A stilled sea, storm clouds, the edge of His cloak                                                                                    | Gore, wounds, blood for shock                                        |
| The torn temple veil, light breaking through clouds                                                                                   | Skulls, inverted crosses, occult or satanic symbols                  |
| The empty tomb, the rolled stone, dawn light, an hourglass                                                                            | Broken, tilted or trampled crosses; budded crosses; four-point stars |
| The Lamb of God, as a biblical symbol rather than a portrait                                                                          | Scripture as a joke, pun or unrelated slogan                         |
| Human figures that aren't Christ: the woman's hand reaching for His cloak (By His Hem), the traveler walking the valley (The Passage) | Any figure that could be read as Christ                              |
| Broken chains, arches, olive branches                                                                                                 |                                                                      |

Reverent and confident; never mock other believers or traditions, never sell with fear or guilt.
