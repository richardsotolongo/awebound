"""
Places each garment cutout (cutouts/, made by cutout.py) on its styled backdrop and writes the
site's product images to apps/web/public/products/<slug>/.

One visual system for every piece: a matte stone surface with a fine grain, light from the upper
left, a soft shadow falling down and to the right, the same canvas, margins and garment scale.
Only the stone's color changes from piece to piece. The garments, prints and colors are left
exactly as they are in the approved mockups.

    python3 assets/mockups/compose.py

These are styled mockups. Replace them with photographs once real samples exist.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
CUTOUTS = HERE / "cutouts"
OUT = HERE.parent.parent / "apps" / "web" / "public" / "products"

W, H = 1000, 1250  # 4:5, the shop's image ratio
DETAIL_W, DETAIL_H = 800, 1000

# Stone color (sRGB) per piece, chosen to sit with the garment and keep it distinct.
# `accent` adds a narrow matte band along the base (Lamb's Mark only).
STYLE = {
    "holy-ground": {"stone": (168, 156, 140)},  # muted warm stone behind the faded black tee
    "still-the-storm": {"stone": (124, 135, 143)},  # blue-grey stone, storm tones
    "thorns-to-lilies": {"stone": (48, 46, 45)},  # smoked charcoal behind the bone tee
    "stone-in-motion": {"stone": (118, 110, 99)},  # darker limestone behind the sand tee
    "to-live-is-christ": {"stone": (146, 129, 117)},  # warm taupe behind the forest tee
    "torn-veil": {"stone": (170, 167, 161)},  # pale ash stone behind the black hoodie
    "lambs-mark": {"stone": (214, 205, 189), "accent": (92, 36, 42)},  # bone stone, burgundy
}

# Views in display order. The first is the listing image and always shows the whole garment.
# `detail` is a close crop of the main artwork: (view, center x, center y, width), as fractions
# of the cutout.
VIEWS = {
    "holy-ground": {"views": ["back", "front"], "detail": ("back", 0.5, 0.42, 0.74)},
    "still-the-storm": {"views": ["front", "back"], "detail": ("front", 0.5, 0.52, 0.74)},
    "thorns-to-lilies": {"views": ["back", "front"], "detail": ("back", 0.5, 0.47, 0.72)},
    "stone-in-motion": {"views": ["back", "front"], "detail": ("back", 0.56, 0.5, 0.74)},
    "to-live-is-christ": {"views": ["front", "back"], "detail": ("front", 0.5, 0.52, 0.72)},
    "torn-veil": {"views": ["back", "front"], "detail": ("back", 0.5, 0.55, 0.74)},
    "lambs-mark": {"views": ["front", "rear", "side"], "detail": ("front", 0.4, 0.36, 0.56)},
}


def blurred_noise(rng: np.random.Generator, h: int, w: int, sigma: float) -> np.ndarray:
    small = max(1, int(round(sigma)))
    n = rng.standard_normal((h // small + 2, w // small + 2)).astype(np.float32)
    img = Image.fromarray(n).resize((w + 2 * small, h + 2 * small), Image.BICUBIC)
    arr = np.asarray(img)[small : small + h, small : small + w]
    return arr / (arr.std() + 1e-6)


def backdrop(slug: str, w: int, h: int) -> np.ndarray:
    """Matte stone: the base color, a soft mottle and fine grain, lit from the upper left."""
    style = STYLE[slug]
    rng = np.random.default_rng(sum(map(ord, slug)))
    base = np.ones((h, w, 3), np.float32) * (np.array(style["stone"], np.float32) / 255)

    if "accent" in style:
        band = int(h * 0.075)
        base[h - band :] = np.array(style["accent"], np.float32) / 255

    mottle = 0.016 * blurred_noise(rng, h, w, 120) + 0.012 * blurred_noise(rng, h, w, 14) + 0.008 * blurred_noise(rng, h, w, 3)
    grain = 0.014 * rng.standard_normal((h, w)).astype(np.float32)
    texture = 1 + mottle + grain

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # Light from beyond the upper-left corner, falling off gently across the surface.
    d = np.hypot(xx / w + 0.25, yy / h + 0.2) / np.hypot(1.25, 1.2)
    light = 1.07 - 0.2 * d**1.4
    # A faint vignette keeps the eye on the garment.
    v = np.hypot(xx / w - 0.5, yy / h - 0.48)
    vignette = 1 - 0.1 * np.clip(v / 0.75, 0, 1) ** 2
    return np.clip(base * (texture * light * vignette)[..., None], 0, 1)


def place(cutout: Image.Image, w: int, h: int, max_w: float, max_h: float, cy: float):
    scale = min(w * max_w / cutout.width, h * max_h / cutout.height)
    size = (round(cutout.width * scale), round(cutout.height * scale))
    garment = cutout.resize(size, Image.LANCZOS)
    x = (w - size[0]) // 2
    y = round(h * cy - size[1] / 2)
    return garment, (x, y)


def shadow(alpha: Image.Image, w: int, h: int, at: tuple[int, int], scale: float) -> np.ndarray:
    """Soft shadow cast down and to the right, plus a tighter one where the garment meets the wall."""
    canvas = Image.new("L", (w, h), 0)
    soft = Image.new("L", (w, h), 0)
    soft.paste(alpha, (at[0] + round(16 * scale), at[1] + round(26 * scale)))
    soft = soft.filter(ImageFilter.GaussianBlur(26 * scale))
    canvas.paste(alpha, (at[0] + round(3 * scale), at[1] + round(6 * scale)))
    tight = canvas.filter(ImageFilter.GaussianBlur(7 * scale))
    return 0.36 * np.asarray(soft, np.float32) / 255 + 0.2 * np.asarray(tight, np.float32) / 255


def compose(slug: str, cutout: Image.Image, w: int, h: int, max_w: float, max_h: float, cy: float):
    bg = backdrop(slug, w, h)
    garment, at = place(cutout, w, h, max_w, max_h, cy)
    a = garment.getchannel("A")
    bg *= 1 - shadow(a, w, h, at, w / W)[..., None]
    img = Image.fromarray((bg * 255).round().astype(np.uint8), "RGB")
    img.paste(garment, at, garment)
    return img


def main() -> None:
    for slug, spec in VIEWS.items():
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        hat = slug == "lambs-mark"
        for view in spec["views"]:
            cutout = Image.open(CUTOUTS / f"{slug}-{view}.webp").convert("RGBA")
            # Same margins for every tee; caps are wide, so they get a little more width.
            img = compose(slug, cutout, W, H, 0.84 if hat else 0.76, 0.74, 0.5)
            img.save(folder / f"{view}.webp", "WEBP", quality=86, method=6)
            print(folder.name, view)

        view, cx, cy, frac = spec["detail"]
        cutout = Image.open(CUTOUTS / f"{slug}-{view}.webp").convert("RGBA")
        # Crop the artwork, then lay it on the same stone so any edge that shows matches.
        cw = round(cutout.width * frac)
        ch = round(cw * DETAIL_H / DETAIL_W)
        left = round(cutout.width * cx - cw / 2)
        top = round(cutout.height * cy - ch / 2)
        crop = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        crop.paste(cutout.crop((left, top, left + cw, top + ch)), (0, 0))
        bg = backdrop(slug, DETAIL_W, DETAIL_H)
        detail = Image.fromarray((bg * 255).round().astype(np.uint8), "RGB")
        art = crop.resize((DETAIL_W, DETAIL_H), Image.LANCZOS)
        detail.paste(art, (0, 0), art)
        detail.save(folder / "detail.webp", "WEBP", quality=88, method=6)
        print(folder.name, "detail")


if __name__ == "__main__":
    main()
