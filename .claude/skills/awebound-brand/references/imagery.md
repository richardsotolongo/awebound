# Illustration and product images

## Apparel art

- Symbols only (see `faith-content.md`). One central subject, framed by botanicals, architecture, weather or light.
- Engraved line work with crosshatched shading; bold lettering is welcome (engraved capitals, heavy gothic capitals, ornate script). No flat clip art, 3D renders or photo collage.
- Inks: bone, black and deep red, with the occasional single accent ink (Stone in Motion's cobalt, By His Hem's rust, The Passage's ember orange).
- The wordmark stays whole: above, below or inside the scene, never cut by it. The Thorn Cross may sit beside or below it.
- The reference or the verse in approved wording sits at the base or above the scene. Record exactly what's printed, and in which translation, in the piece's `story.back`.

## Product images on the site

- Images show **the item exactly as Fourthwall will make it** and follow each product's image list in Fourthwall, in the same order; the first is the listing image. Tees and hoodies have four images, caps six. Finished photos are shown as they are (cropped to 4:5); Fourthwall's cut-out renders are placed on the piece's own surface. A piece not yet in Fourthwall uses a clean cutout of the approved mockup.
- Each garment sits on its own surface with a soft, realistic shadow and enough contrast to set it apart. The set shares the 4:5 canvas, margins and garment scale (tees about three quarters of the width), so the grid reads as one family; each surface is a color drawn from the piece's artwork, with its own texture and light.
- Behold surfaces: Still the Storm, deep storm slate with cloud-soft texture lit from above; By His Hem, muted sage plaster (the rust print's complement); Thorns to Lilies, deep oxblood plaster under a spotlight; Torn Veil, warm parchment crossed by a shaft of light; Stone in Motion, dusty cornflower stone with a fine speckle; To Live Is Christ, warm ochre plaster lit from above; The Passage, burnt terracotta plaster under a spotlight; Wonderfully Made, dusty rose paper lit from above; Lamb's Mark, cool bone linen with a narrow oxblood band at the base; Signature Cap, warm concrete with a fine speckle lit from above.
- Every piece also has a close-up of its artwork (`detail.webp` beside its images), cropped from its Fourthwall render: the whole print on its fabric, never enlarged, retouched or recolored. The home page shows it beside the piece it opens on. It is not part of the product gallery. Story scenes (a garment hanging in a stone niche) are no longer shown on the site.
- The product stays the focal point: preserve the artwork and garment colors exactly; the listing image always shows the whole garment; artwork crops are secondary; no props or textures over the print; no fog, dramatic effects, glows or white outlines; clean garment edges. Changing the page color doesn't fix an embedded white background: cut the garment out and composite it.
- In the repo: `assets/mockups/fourthwall.json` lists each product's Fourthwall images in order and `fourthwall.py` downloads them; `assets/mockups/source` holds the approved mockups (keep them intact) and `cutout.py` cuts them out; `compose.py` builds the site images (`apps/web/public/products/<slug>/1.webp`, `2.webp`, …) and each piece’s close-up (`detail.webp`; the crop is set per piece in `VIEWS`).

## Photography still to come

Photographs of real samples will replace the Fourthwall renders, and photos of the clothes being worn are still to come. Richard’s portrait is captioned with his name only and is never described as a product photo. Plan them on the same rules: the whole garment first, then the back, details (print texture, stitching, label) and on-body shots on plain coal or concrete in low warm light. Upload them to Fourthwall in the order the site should show them.

## Files in this skill

- `assets/imagery/thorns-to-lilies-back.webp`: a current listing image (Thorns to Lilies, back), used by the post template.
- `assets/imagery/a3-b01-back-mockup.jpg`, `a3-r01-back-mockup.jpg`, `a3-t02-back-mockup.jpg`: pre-Behold lookbook concepts. They approximate the lettering and are style references only, not products.
