"""
Writes the site's product images to apps/web/public/products/<slug>/.

A product listed in fourthwall.json gets one image per entry in its Fourthwall image list, in the
same order (1.webp, 2.webp, ...; the first is the listing image): finished photos are cropped to
the site's 4:5 frame, and Fourthwall's cut-out renders are placed on the piece's own surface. A
product not listed there falls back to its approved mockup (cutouts/, made by cutout.py) in the
views below. Every product also gets detail.webp, a close-up of its artwork (not part of the
product gallery), and its plate: the surface alone as a wide and a tall field (plate-wide.webp,
plate-tall.webp) and the listing view cut out with its shadow (piece.webp). The site sets the
cut-out and large lettering on the plate; `python3 assets/mockups/compose.py plates` prints the
contrast each plate gives bone and coal lettering.

Every piece shares the canvas, margins, garment scale and a soft cast shadow, so the shop grid
reads as one set. Each piece gets its own surface: a color drawn from its artwork, a texture
(plaster, cloud, linen, speckled stone, paper) and a light (from the upper left, from above, a
spotlight, or a shaft of light). The garments, prints and colors are left exactly as they are in
the renders and mockups.

    python3 assets/mockups/compose.py

When a product's images change in Fourthwall, update fourthwall.json and run fourthwall.py first.
"""

from pathlib import Path

import json

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
CUTOUTS = HERE / "cutouts"
RENDERS = HERE / "fourthwall"
MANIFEST = json.loads((HERE / "fourthwall.json").read_text())["products"]
OUT = HERE.parent.parent / "apps" / "web" / "public" / "products"

W, H = 1000, 1250  # 4:5, the shop's image ratio
DETAIL_W, DETAIL_H = 640, 800  # smaller than every crop below, so a close-up is never enlarged
PIECE_W, PIECE_H = 960, 1200  # the cut-out garment, 4:5 like the listing image
# A plate is the surface alone: (size, where the garment sits, where the lettering sits as
# left, top, right, bottom). Positions are fractions of the plate.
PLATES = {
    "wide": ((1600, 900), (0.72, 0.5), (0.04, 0.1, 0.52, 0.9)),
    "tall": ((900, 1400), (0.5, 0.7), (0.05, 0.03, 0.95, 0.44)),
}

# Surface per piece: color (sRGB), texture and light. `accent` adds a narrow band along the base.
STYLE = {
    # Black tee, storm at sea: deep storm slate, cloud-soft, light breaking from above.
    "still-the-storm": {"color": (70, 84, 92), "texture": "cloud", "light": "top"},
    # Bone tee with rust splatter: muted sage plaster, the rust's complement.
    "by-his-hem": {"color": (122, 131, 109), "texture": "plaster", "light": "upper-left"},
    # White tee, red thorns and lilies: deep oxblood plaster under a spotlight.
    "thorns-to-lilies": {"color": (96, 37, 43), "texture": "plaster", "light": "spot"},
    # Black hoodie, the torn veil: warm parchment crossed by a shaft of light.
    "torn-veil": {"color": (201, 186, 154), "texture": "paper", "light": "shaft"},
    # Sand tee with a cobalt swirl: dusty cornflower stone with a fine speckle.
    "stone-in-motion": {"color": (104, 125, 152), "texture": "speckle", "light": "upper-left"},
    # Navy tee, bone lettering: warm ochre plaster lit from above.
    "to-live-is-christ": {"color": (190, 154, 106), "texture": "plaster", "light": "top"},
    # Olive hoodie, the valley at night: burnt terracotta plaster under a spotlight, the print's ember glow.
    "the-passage": {"color": (150, 98, 70), "texture": "plaster", "light": "spot"},
    # Dusty blue hoodie, roses: soft dusty rose paper lit from above.
    "wonderfully-made": {"color": (190, 154, 150), "texture": "paper", "light": "top"},
    # Charcoal cap, white lamb: cool bone linen with an oxblood band at the base.
    "lambs-mark": {"color": (208, 202, 191), "texture": "linen", "light": "upper-left", "accent": (96, 37, 43)},
    # Black cap, red-edged wordmark: warm concrete with a fine speckle, lit from above.
    "signature-cap": {"color": (150, 146, 140), "texture": "speckle", "light": "top"},
}

CAPS = ("lambs-mark", "signature-cap")

# `views`, for mockup-only products: views in display order (the first is the listing image and
# always shows the whole garment). `detail`, for every product: a close crop of the main artwork,
# (view, center x, center y, width) as fractions of the garment.
VIEWS = {
    "still-the-storm": {"views": ["front", "back"], "detail": ("front", 0.5, 0.47, 0.5)},
    "by-his-hem": {"views": ["back", "front"], "detail": ("back", 0.5, 0.45, 0.5)},
    # Every close-up frames the whole print and nothing else.
    "thorns-to-lilies": {"views": ["back", "front"], "detail": ("back", 0.5, 0.41, 0.48)},
    "torn-veil": {"views": ["back", "front"], "detail": ("back", 0.5, 0.51, 0.5)},
    "stone-in-motion": {"views": ["back", "front"], "detail": ("back", 0.51, 0.445, 0.53)},
    "to-live-is-christ": {"views": ["front", "back"], "detail": ("front", 0.5, 0.47, 0.5)},
    "the-passage": {"views": ["back", "front"], "detail": ("back", 0.5, 0.51, 0.5)},
    "wonderfully-made": {"views": ["back", "front"], "detail": ("back", 0.5, 0.51, 0.5)},
    "lambs-mark": {"views": ["front", "side", "back"], "detail": ("front", 0.5, 0.4, 0.56)},
    "signature-cap": {"views": ["front", "side", "back"], "detail": ("front", 0.5, 0.42, 0.52)},
}


def trimmed(img: Image.Image) -> Image.Image:
    return img.crop(img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def load_garment(slug: str, view: str) -> Image.Image:
    """The first Fourthwall render of this view when there is one, else the mockup cutout;
    cropped to the garment."""
    for n, item in enumerate(MANIFEST.get(slug, {}).get("gallery", []), start=1):
        if "render" in item and item["view"] == view:
            return trimmed(Image.open(RENDERS / f"{slug}-{n}.webp").convert("RGBA"))
    return trimmed(Image.open(CUTOUTS / f"{slug}-{view}.webp").convert("RGBA"))


def photo(path: Path) -> Image.Image:
    """A finished photo, center-cropped to the site's 4:5 frame."""
    img = Image.open(path).convert("RGB")
    target = W / H
    if img.width / img.height > target:
        cw = round(img.height * target)
        img = img.crop(((img.width - cw) // 2, 0, (img.width - cw) // 2 + cw, img.height))
    else:
        ch = round(img.width / target)
        img = img.crop((0, (img.height - ch) // 2, img.width, (img.height - ch) // 2 + ch))
    return img.resize((W, H), Image.LANCZOS)


def noise(rng: np.random.Generator, h: int, w: int, sigma: float, stretch: tuple[float, float] = (1, 1)) -> np.ndarray:
    """Smooth unit-variance noise with features about `sigma` pixels across (scaled by `stretch`
    along y and x)."""
    sy, sx = max(1, round(sigma * stretch[0])), max(1, round(sigma * stretch[1]))
    n = rng.standard_normal((h // sy + 3, w // sx + 3)).astype(np.float32)
    img = Image.fromarray(n).resize(((w // sx + 3) * sx, (h // sy + 3) * sy), Image.BICUBIC)
    arr = np.asarray(img)[sy : sy + h, sx : sx + w]
    return arr / (arr.std() + 1e-6)


def texture(kind: str, rng: np.random.Generator, h: int, w: int) -> np.ndarray:
    """A multiplicative surface texture centred on 1."""
    grain = rng.standard_normal((h, w)).astype(np.float32)
    if kind == "plaster":
        t = 0.022 * noise(rng, h, w, 140) + 0.016 * noise(rng, h, w, 22) + 0.01 * noise(rng, h, w, 4)
        return 1 + t + 0.012 * grain
    if kind == "cloud":
        # Large soft billows, like weather moving across a wall.
        t = 0.06 * noise(rng, h, w, 260) + 0.03 * noise(rng, h, w, 70) + 0.008 * noise(rng, h, w, 5)
        return 1 + t + 0.012 * grain
    if kind == "linen":
        # Threads: fine streaks along both axes, with slubs, over a faint mottle.
        warp = noise(rng, h, w, 1.2, (60, 1))
        weft = noise(rng, h, w, 1.2, (1, 60))
        slub = np.clip(noise(rng, h, w, 3, (1, 14)), 1.6, None) - 1.6
        t = 0.018 * warp + 0.018 * weft + 0.03 * slub + 0.014 * noise(rng, h, w, 120)
        return 1 + t + 0.008 * grain
    if kind == "speckle":
        # Terrazzo-like stone: plaster with scattered dark and light flecks.
        t = 0.016 * noise(rng, h, w, 120) + 0.01 * noise(rng, h, w, 16)
        flecks = np.zeros((h, w), np.float32)
        for sign, density in ((-1, 0.0016), (1, 0.0008)):
            dots = ((rng.random((h, w)) < density) * 255).astype(np.uint8)
            dots = np.asarray(Image.fromarray(dots).filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
            flecks += sign * 0.9 * dots * (0.6 + 0.4 * rng.random((h, w)).astype(np.float32))
        return 1 + t + flecks + 0.012 * grain
    if kind == "paper":
        # Fibres running mostly one way, and a soft cockle.
        fibre = noise(rng, h, w, 2, (1, 18))
        t = 0.024 * noise(rng, h, w, 180) + 0.012 * noise(rng, h, w, 30) + 0.012 * fibre
        return 1 + t + 0.01 * grain
    raise ValueError(kind)


def lighting(kind: str, h: int, w: int) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    x, y = xx / w, yy / h
    if kind == "upper-left":
        d = np.hypot(x + 0.25, y + 0.2) / np.hypot(1.25, 1.2)
        light = 1.08 - 0.22 * d**1.4
    elif kind == "top":
        # A wide pool of light from above the frame, fading toward the base.
        d = np.hypot((x - 0.5) * 0.85, y + 0.25) / 1.3
        light = 1.12 - 0.34 * d**1.3
    elif kind == "spot":
        # A spotlight behind the garment, falling off into deeper color at the edges.
        r = np.hypot((x - 0.5) / 0.62, (y - 0.44) / 0.7)
        light = 0.74 + 0.4 * np.exp(-(r**2))
    elif kind == "shaft":
        # A diagonal beam from the upper right, soft-edged, over a gently lit surface.
        px, py, dx, dy = 0.8, -0.1, -0.42, 1.2
        n = np.hypot(dx, dy)
        dist = np.abs((x - px) * dy / n - (y - py) * dx / n)
        beam = np.exp(-((dist / 0.2) ** 2)) * (1.05 - 0.45 * y)
        light = 0.9 + 0.16 * beam - 0.08 * y
    else:
        raise ValueError(kind)
    v = np.hypot(x - 0.5, y - 0.48)
    vignette = 1 - 0.12 * np.clip(v / 0.75, 0, 1) ** 2
    return light * vignette


def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def backdrop(slug: str, w: int, h: int) -> np.ndarray:
    """The piece's surface, in linear light (so shadows and light fall naturally)."""
    style = STYLE[slug]
    rng = np.random.default_rng(sum(map(ord, slug)))
    base = np.ones((h, w, 3), np.float32) * srgb_to_linear(np.array(style["color"], np.float32) / 255)
    if "accent" in style:
        band = int(h * 0.075)
        base[h - band :] = srgb_to_linear(np.array(style["accent"], np.float32) / 255)
    shade = texture(style["texture"], rng, h, w) * lighting(style["light"], h, w)
    # Texture and light are perceptual multipliers; apply them in a gamma-like space.
    return base * (shade**2.2)[..., None]


def place(cutout: Image.Image, w: int, h: int, max_w: float, max_h: float, cy: float):
    scale = min(w * max_w / cutout.width, h * max_h / cutout.height)
    size = (round(cutout.width * scale), round(cutout.height * scale))
    garment = cutout.resize(size, Image.LANCZOS)
    x = (w - size[0]) // 2
    y = round(h * cy - size[1] / 2)
    return garment, (x, y)


def shadow(alpha: Image.Image, w: int, h: int, at: tuple[int, int], scale: float, dx: float) -> np.ndarray:
    """Soft shadow cast away from the light, plus a tighter one where the garment meets the wall."""
    soft = Image.new("L", (w, h), 0)
    soft.paste(alpha, (at[0] + round(dx * scale), at[1] + round(26 * scale)))
    soft = soft.filter(ImageFilter.GaussianBlur(28 * scale))
    tight = Image.new("L", (w, h), 0)
    tight.paste(alpha, (at[0] + round(dx * 0.2 * scale), at[1] + round(6 * scale)))
    tight = tight.filter(ImageFilter.GaussianBlur(7 * scale))
    return 0.5 * np.asarray(soft, np.float32) / 255 + 0.26 * np.asarray(tight, np.float32) / 255


def to_image(linear: np.ndarray) -> Image.Image:
    return Image.fromarray((linear_to_srgb(linear) * 255).round().astype(np.uint8), "RGB")


def compose(slug: str, cutout: Image.Image, w: int, h: int, max_w: float, max_h: float, cy: float):
    bg = backdrop(slug, w, h)
    garment, at = place(cutout, w, h, max_w, max_h, cy)
    # Shadows fall away from the light: down and right, or straight down under light from above.
    dx = 0 if STYLE[slug]["light"] in ("top", "spot") else 16
    if STYLE[slug]["light"] == "shaft":
        dx = -14
    bg *= 1 - shadow(garment.getchannel("A"), w, h, at, w / W, dx)[..., None]
    img = to_image(bg)
    img.paste(garment, at, garment)
    return img


def detail(slug: str) -> None:
    """detail.webp: a close-up of the main artwork, cropped from the Fourthwall render of its view
    (or the mockup cutout), downscaled and never enlarged, and laid on the piece's surface so any
    edge that shows matches."""
    view, cx, cy, frac = VIEWS[slug]["detail"]
    cutout = load_garment(slug, view)
    cw = round(cutout.width * frac)
    ch = round(cw * DETAIL_H / DETAIL_W)
    left = round(cutout.width * cx - cw / 2)
    top = round(cutout.height * cy - ch / 2)
    crop = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    crop.paste(cutout.crop((left, top, left + cw, top + ch)), (0, 0))
    img = to_image(backdrop(slug, DETAIL_W, DETAIL_H))
    art = crop.resize((DETAIL_W, DETAIL_H), Image.LANCZOS)
    img.paste(art, (0, 0), art)
    img.save(OUT / slug / "detail.webp", "WEBP", quality=82, method=6)


# Lettering sits on the plate, so the surface under it falls into shade for bone lettering and
# is lifted a little for coal lettering. The value is the tone under the lettering relative to
# under the garment; pieces not listed keep an even surface.
PLATE_SHADE = {
    "thorns-to-lilies": 0.86,
    "still-the-storm": 0.84,
    "the-passage": 0.7,
    "by-his-hem": 0.66,
    "stone-in-motion": 0.68,
    "to-live-is-christ": 1.05,
    "wonderfully-made": 1.06,
    "signature-cap": 1.1,
}
BONE, COAL = (240, 230, 210), (21, 20, 19)


def plate(slug: str, kind: str) -> Image.Image:
    """The piece's surface alone, lit where the garment will sit."""
    (w, h), (cx, cy), _ = PLATES[kind]
    style = STYLE[slug]
    rng = np.random.default_rng(sum(map(ord, slug)) + w)
    # The piece's own light, drawn on a larger sheet and cut so its centre lands on the garment.
    # Light from the upper left is mirrored on the wide plate, where the garment sits to the right.
    sheet_w, sheet_h = round(2 * w * max(cx, 1 - cx)), round(2 * h * max(cy, 1 - cy))
    light = lighting(style["light"], sheet_h, sheet_w)
    if cx > 0.5 and style["light"] == "upper-left":
        light = light[:, ::-1]
    x0, y0 = round(sheet_w / 2 - cx * w), round(sheet_h / 2 - cy * h)
    light = light[y0 : y0 + h, x0 : x0 + w]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    near = np.exp(-((np.hypot(xx - cx * w, yy - cy * h) / (0.46 * max(w, h))) ** 2))
    shade = PLATE_SHADE.get(slug, 1.0)
    tone = shade + (1 - shade) * near
    base = srgb_to_linear(np.array(style["color"], np.float32) / 255)
    surface = texture(style["texture"], rng, h, w) * light * tone
    return to_image(np.ones((h, w, 3), np.float32) * base * (surface**2.2)[..., None])


def listing_view(slug: str) -> str:
    gallery = MANIFEST.get(slug, {}).get("gallery")
    return gallery[0]["view"] if gallery else VIEWS[slug]["views"][0]


def piece(slug: str) -> Image.Image:
    """The listing view cut out, with the shadow it casts, transparent elsewhere."""
    w, h = PIECE_W, PIECE_H
    garment, at = place(load_garment(slug, listing_view(slug)), w, h, 0.92, 0.86, 0.49)
    dx = {"top": 0, "spot": 0, "shaft": -14}.get(STYLE[slug]["light"], 16)
    cast = shadow(garment.getchannel("A"), w, h, at, w / W, dx)
    img = Image.fromarray(np.dstack([np.zeros((h, w, 3)), cast * 255]).astype(np.uint8), "RGBA")
    img.alpha_composite(garment, at)
    return img


def luminance(rgb: np.ndarray) -> np.ndarray:
    return srgb_to_linear(rgb.astype(np.float32) / 255) @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def check_plates() -> None:
    """Prints the contrast bone and coal lettering get on each plate where the lettering sits,
    at its worst (against the lightest part for bone, the darkest for coal). 3:1 is the bar for
    large lettering; the better ink is the one to name in catalog.json."""
    bone, coal = float(luminance(np.array(BONE))), float(luminance(np.array(COAL)))
    for slug in VIEWS:
        row = []
        for kind, (_, _, (left, top, right, bottom)) in PLATES.items():
            img = Image.open(OUT / slug / f"plate-{kind}.webp").convert("RGB").filter(ImageFilter.GaussianBlur(4))
            zone = img.crop((round(left * img.width), round(top * img.height), round(right * img.width), round(bottom * img.height)))
            lum = luminance(np.asarray(zone))
            lightest, darkest = np.percentile(lum, 99), np.percentile(lum, 1)
            row.append(f"{kind}: bone {(bone + 0.05) / (lightest + 0.05):.1f}  coal {(darkest + 0.05) / (coal + 0.05):.1f}")
        print(f"{slug:18}", "   ".join(row))


def plates(slug: str) -> None:
    folder = OUT / slug
    plate(slug, "wide").save(folder / "plate-wide.webp", "WEBP", quality=62, method=6)
    plate(slug, "tall").save(folder / "plate-tall.webp", "WEBP", quality=62, method=6)
    piece(slug).save(folder / "piece.webp", "WEBP", quality=80, method=6)


def main() -> None:
    for slug, spec in VIEWS.items():
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        for old in folder.glob("*.webp"):
            old.unlink()
        hat = slug in CAPS
        # Same margins for every garment; caps are wide, so they get a little more width.
        place_garment = lambda cutout: compose(slug, cutout, W, H, 0.84 if hat else 0.76, 0.74, 0.5)

        gallery = MANIFEST.get(slug, {}).get("gallery")
        if gallery:
            for n, item in enumerate(gallery, start=1):
                source = RENDERS / f"{slug}-{n}.webp"
                if "photo" in item:
                    img = photo(source)
                else:
                    img = place_garment(trimmed(Image.open(source).convert("RGBA")))
                img.save(folder / f"{n}.webp", "WEBP", quality=86, method=6)
            print(slug, f"{len(gallery)} images")
        else:
            for view in spec["views"]:
                place_garment(load_garment(slug, view)).save(folder / f"{view}.webp", "WEBP", quality=86, method=6)
            print(slug, "mockup views")
        detail(slug)
        plates(slug)
    check_plates()


if __name__ == "__main__":
    import sys

    check_plates() if sys.argv[1:] == ["plates"] else main()
