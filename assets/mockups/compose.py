"""
Writes the site's product images to apps/web/public/products/<slug>/.

A product listed in fourthwall.json gets one image per entry in its Fourthwall image list, in the
same order (1.webp, 2.webp, ...; the first is the listing image): finished photos are cropped to
the site's 4:5 frame (a photo framed tighter than the rest, with `frame` in fourthwall.json, is
zoomed out to the set's scale by widen.py), and Fourthwall's cut-out renders are placed on the
piece's own surface. A
product not listed there falls back to its approved mockup (cutouts/, made by cutout.py) in the
views below. Every product also gets detail.webp, a close-up of its artwork (not part of the
product gallery), and its plate: the surface alone as a wide and a tall field (plate-wide.webp,
plate-tall.webp) and the listing view cut out with its shadow (piece.webp). The site sets the
cut-out and large lettering on the plate; `python3 assets/mockups/compose.py plates` prints the
contrast each plate gives bone and coal lettering.

Every piece shares the canvas, margins, garment scale and a soft cast shadow, so the shop grid
reads as one set. Each piece gets its own surface: a color matched to the background of its
photos in Fourthwall, a texture (plaster, cloud, linen, speckled stone, paper) and a light (from
the upper left, from above, a spotlight, or a shaft of light). The garments, prints and colors are
left exactly as they are in the photos, renders and mockups. The close-up and the cut-out garment
come from Fourthwall's render of the current print (`cutouts` in fourthwall.json), or from
cutouts/ when no render shows it.

    python3 assets/mockups/compose.py [piece ...]

When a product's images change in Fourthwall, refresh them first with
`python3 assets/mockups/fourthwall.py --sync <piece ...>` (see fourthwall.py), then run this with
the same pieces, so only their images are rewritten. A photo whose background is far from its
piece's surface is reported: the gallery would not read as one set, so replace that photo in
Fourthwall or take it out of fourthwall.json.
"""

from pathlib import Path

import json

import numpy as np
from PIL import Image, ImageFilter

from photo_cutout import cutout, to_rgba
from widen import widen

HERE = Path(__file__).parent
CUTOUTS = HERE / "cutouts"
RENDERS = HERE / "fourthwall"
CURRENT_RENDERS = RENDERS / "renders"
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

# Surface per piece: color (sRGB), texture and light. Each color is matched to the background of
# the piece's photos in Fourthwall (October 15, 2026), so the photos, the renders placed on the
# surface and the plates read as one set; check_photo reports a photo that drifts from it.
STYLE = {
    # Black tee, storm at sea: deep storm slate, cloud-soft, light breaking from above.
    "still-the-storm": {"color": (60, 78, 90), "texture": "cloud", "light": "top"},
    # Bone tee with rust splatter: muted sage plaster, the rust's complement.
    "by-his-hem": {"color": (118, 128, 105), "texture": "plaster", "light": "upper-left"},
    # White tee, red thorns and lilies: deep oxblood plaster under a spotlight.
    "thorns-to-lilies": {"color": (100, 35, 40), "texture": "plaster", "light": "spot"},
    # Black hoodie, the torn veil: deep crimson plaster lit from above, the curtain's red.
    "torn-veil": {"color": (121, 52, 52), "texture": "plaster", "light": "top"},
    # Sand tee with a cobalt swirl: dusty cornflower stone with a fine speckle.
    "stone-in-motion": {"color": (102, 123, 152), "texture": "speckle", "light": "upper-left"},
    # Navy tee, bone lettering: warm ochre plaster lit from above.
    "to-live-is-christ": {"color": (191, 152, 101), "texture": "plaster", "light": "top"},
    # Olive hoodie, lettering of cracked stone: pale sandstone plaster from the upper left.
    "the-passage": {"color": (225, 203, 180), "texture": "plaster", "light": "upper-left"},
    # Dusty blue hoodie, roses: warm rose paper lit from above.
    "wonderfully-made": {"color": (214, 152, 141), "texture": "paper", "light": "top"},
    # Black cap, white lamb: warm linen, like the studio the cap's photos were taken in.
    "lambs-mark": {"color": (209, 192, 175), "texture": "linen", "light": "upper-left"},
    # Black cap, red-edged wordmark: warm sand concrete with a fine speckle, lit from above.
    "signature-cap": {"color": (193, 175, 155), "texture": "speckle", "light": "top"},
}

CAPS = ("lambs-mark", "signature-cap")
# Long sleeves that run off a photo's edge fade out in the cut-out; a tee's are completed.
HOODIES = ("torn-veil", "the-passage", "wonderfully-made")

# `views`, for mockup-only products: views in display order (the first is the listing image and
# always shows the whole garment). `detail`, for every product: a close crop of the main artwork,
# (view, center x, center y, width) as fractions of the garment; or ("photo:<n>", ...) as fractions
# of the n-th gallery photo, for a print no render shows yet.
VIEWS = {
    # Its close-up is the back (Mark 4:41 above a breaking wave): the front is now the wordmark.
    "still-the-storm": {"views": ["front", "back"], "detail": ("back", 0.5, 0.45, 0.47)},
    "by-his-hem": {"views": ["back", "front"], "detail": ("back", 0.5, 0.45, 0.5)},
    # Every close-up frames the whole print and nothing else, and stays inside the garment:
    # a crop that reaches past its edge shows the surface beside it (check_details reports any).
    "thorns-to-lilies": {"views": ["back", "front"], "detail": ("back", 0.5, 0.41, 0.48)},
    "torn-veil": {"views": ["back", "front"], "detail": ("back", 0.5, 0.51, 0.5)},
    "stone-in-motion": {"views": ["back", "front"], "detail": ("back", 0.4985, 0.415, 0.48)},
    "to-live-is-christ": {"views": ["front", "back"], "detail": ("front", 0.5, 0.47, 0.5)},
    "the-passage": {"views": ["back", "front"], "detail": ("photo:3", 0.52, 0.6, 0.681)},
    "wonderfully-made": {"views": ["back", "front"], "detail": ("back", 0.5, 0.52, 0.52)},
    "lambs-mark": {"views": ["front", "side", "back"], "detail": ("front", 0.5, 0.43, 0.54)},
    "signature-cap": {"views": ["front", "side", "back"], "detail": ("front", 0.5, 0.42, 0.52)},
}


def trimmed(img: Image.Image) -> Image.Image:
    return img.crop(img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def load_garment(slug: str, view: str) -> Image.Image:
    """The garment in this view, cut out and cropped to it: Fourthwall's render of the current
    print (`cutouts` in fourthwall.json), else a render in the gallery, else the cutout in cutouts/
    (an approved mockup, or a photo cut out by hand when no render shows the current print)."""
    if view in MANIFEST.get(slug, {}).get("cutouts", {}):
        return trimmed(Image.open(CURRENT_RENDERS / f"{slug}-{view}.webp").convert("RGBA"))
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
    cutout = detail_source(slug, view)
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


def detail_source(slug: str, view: str) -> Image.Image:
    """What a close-up is cropped from: a gallery photo ("photo:<n>") or the cut-out garment."""
    if view.startswith("photo:"):
        return Image.open(RENDERS / f"{slug}-{view.split(':')[1]}.webp").convert("RGBA")
    return load_garment(slug, view)


def check_details() -> None:
    """Prints any close-up whose crop reaches past the garment (the surface would show at its
    edge) or would have to be enlarged. Both should be fixed in VIEWS."""
    for slug, spec in VIEWS.items():
        view, cx, cy, frac = spec["detail"]
        alpha = np.asarray(detail_source(slug, view).getchannel("A"))
        h, w = alpha.shape
        cw = round(w * frac)
        ch = round(cw * DETAIL_H / DETAIL_W)
        left, top = round(w * cx - cw / 2), round(h * cy - ch / 2)
        inside = 0 <= left and 0 <= top and left + cw <= w and top + ch <= h
        edge = int((alpha[max(top, 0) : top + ch, max(left, 0) : left + cw] < 250).sum())
        if not inside or edge > 50 or cw < DETAIL_W:
            print(f"detail {slug}: {edge} px past the garment, crop {cw} px wide (min {DETAIL_W})")


# Lettering sits on the plate, so the surface under it falls into shade for bone lettering and
# is lifted a little for coal lettering. The value is the tone under the lettering relative to
# under the garment; pieces not listed keep an even surface.
PLATE_SHADE = {
    "thorns-to-lilies": 0.86,
    "still-the-storm": 0.84,
    "torn-veil": 0.86,
    "the-passage": 1.06,
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
    """The listing view cut out, with the shadow it casts, transparent elsewhere. When the listing
    image is a photo, the garment is cut from that photo with the photo's own shadow, so the home
    page shows exactly the shop's first image; otherwise from the render or mockup."""
    w, h = PIECE_W, PIECE_H
    gallery = MANIFEST.get(slug, {}).get("gallery")
    if gallery and "photo" in gallery[0]:
        rgb, alpha, shade, _, _ = cutout(RENDERS / f"{slug}-1.webp", "fade" if slug in HOODIES else "complete")
        cut = to_rgba(rgb, alpha, shade)
        ys, xs = np.where(alpha > 0.5)
        box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        scale = min(w * 0.92 / (box[2] - box[0]), h * 0.86 / (box[3] - box[1]))
        cut = cut.resize((round(cut.width * scale), round(cut.height * scale)), Image.LANCZOS)
        cx, cy = (box[0] + box[2]) / 2 * scale, (box[1] + box[3]) / 2 * scale
        x, y = round(w / 2 - cx), round(h * 0.49 - cy)
        # What falls inside the frame (a faded sleeve or a shadow may reach past it).
        src = cut.crop((max(0, -x), max(0, -y), min(cut.width, w - x), min(cut.height, h - y)))
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        img.alpha_composite(src, (max(0, x), max(0, y)))
        return img
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


def check_photo(slug: str, name: str, img: Image.Image) -> None:
    """Prints a full-garment photo whose background differs clearly from the piece's own surface,
    comparing the top and sides (the hem often reaches the bottom edge)."""
    band = 40

    def border(a: np.ndarray) -> np.ndarray:
        return np.median(np.concatenate([a[:band].reshape(-1, 3), a[:, :band].reshape(-1, 3), a[:, -band:].reshape(-1, 3)]), 0)

    photo_edge = border(np.asarray(img, np.float32))
    surface_edge = border(np.asarray(to_image(backdrop(slug, W, H)), np.float32))
    gap = float(np.linalg.norm(photo_edge - surface_edge))
    if gap > 30:
        rgb = lambda c: "(" + ", ".join(str(round(v)) for v in c) + ")"
        print(f"photo {slug}/{name}: background {rgb(photo_edge)} vs surface {rgb(surface_edge)}, off by {gap:.0f}")


def main(slugs: list[str]) -> None:
    for slug in slugs:
        spec = VIEWS[slug]
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        for old in folder.glob("*.webp"):
            old.unlink()
        hat = slug in CAPS
        # Same margins for every garment; caps are wide, so they get a little more width.
        place_garment = lambda cutout: compose(slug, cutout, W, H, 0.84 if hat else 0.76, 0.74, 0.5)

        gallery = MANIFEST.get(slug, {}).get("gallery")
        if gallery:
            # Fourthwall lists a view's full-garment photo before its close-up; only the full
            # views show enough background to compare with the surface.
            first = {}
            for n, item in enumerate(gallery, start=1):
                if "photo" in item:
                    first.setdefault(item["view"], n)
            for n, item in enumerate(gallery, start=1):
                source = RENDERS / f"{slug}-{n}.webp"
                if "photo" in item and "frame" in item:
                    # A photo framed tighter than the rest, zoomed out to the set's scale.
                    img = widen(source, item["frame"]["height"], item["frame"]["top"], (W, H))
                    if first[item["view"]] == n:
                        check_photo(slug, f"{n}.webp", img)
                elif "photo" in item:
                    img = photo(source)
                    if first[item["view"]] == n:
                        check_photo(slug, f"{n}.webp", img)
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
    check_details()


if __name__ == "__main__":
    import sys

    args = sys.argv[1:]
    if args == ["plates"]:
        check_plates()
    else:
        unknown = [a for a in args if a not in VIEWS]
        if unknown:
            sys.exit(f"Unknown piece: {', '.join(unknown)}")
        main(args or list(VIEWS))
