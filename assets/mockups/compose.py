"""
Places each garment cutout (cutouts/, made by cutout.py) on its own backdrop and writes the
site's product images to apps/web/public/products/<slug>/.

Every piece shares the canvas, margins, garment scale and a soft cast shadow, so the shop grid
reads as one set. Each piece gets its own surface: a color drawn from its artwork, a texture
(plaster, cloud, linen, speckled stone, paper) and a light (from the upper left, from above, a
spotlight, or a shaft of light). The garments, prints and colors are left exactly as they are in
the approved mockups.

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
    # Charcoal cap, white lamb: cool bone linen with an oxblood band at the base.
    "lambs-mark": {"color": (208, 202, 191), "texture": "linen", "light": "upper-left", "accent": (96, 37, 43)},
}

# Views in display order. The first is the listing image and always shows the whole garment.
# `detail` is a close crop of the main artwork: (view, center x, center y, width), as fractions
# of the cutout.
VIEWS = {
    "still-the-storm": {"views": ["front", "back"], "detail": ("front", 0.5, 0.5, 0.72)},
    "by-his-hem": {"views": ["back", "front"], "detail": ("back", 0.47, 0.42, 0.74)},
    "thorns-to-lilies": {"views": ["back", "front"], "detail": ("back", 0.5, 0.4, 0.72)},
    "torn-veil": {"views": ["back", "front"], "detail": ("back", 0.5, 0.5, 0.66)},
    "stone-in-motion": {"views": ["back", "front"], "detail": ("back", 0.52, 0.45, 0.74)},
    "to-live-is-christ": {"views": ["front", "back"], "detail": ("front", 0.5, 0.48, 0.66)},
    "lambs-mark": {"views": ["front", "side", "back"], "detail": ("front", 0.48, 0.4, 0.56)},
}


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


# The home page's design stories show each piece hanging in a pointed stone niche, lit from
# above, in the piece's own color. Two layers so the page can move the garment a little against
# the niche as it scrolls: story-niche.webp (the niche, transparent outside the arch) and
# story-piece.webp (the garment and the shadow it casts, transparent elsewhere).
STORY_W, STORY_H = 880, 1100
STORY_VIEW = {slug: spec["detail"][0] for slug, spec in VIEWS.items()}


def arch_mask(w: int, h: int, left: float, right: float, top: float, bottom: float, sharp: float = 0.62) -> np.ndarray:
    """A pointed (two-centred) arch over a rectangle. `sharp` is each arc's radius as a fraction
    of the span; 0.5 would be a round arch."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    span = right - left
    r = sharp * span
    rise = np.sqrt(r**2 - (r - span / 2) ** 2)
    spring = top + rise
    inside_rect = (xx >= left) & (xx <= right) & (yy >= spring) & (yy <= bottom)
    # Left half under the arc centred on the right, and the reverse.
    left_arc = np.hypot(xx - (left + r), yy - spring) <= r
    right_arc = np.hypot(xx - (right - r), yy - spring) <= r
    in_arch = (yy < spring) & (yy >= top) & left_arc & right_arc
    return inside_rect | in_arch


def soft(mask: np.ndarray, sigma: float = 0.8) -> np.ndarray:
    from scipy import ndimage

    return ndimage.gaussian_filter(mask.astype(np.float32), sigma)


def story(slug: str) -> None:
    from scipy import ndimage

    w, h = STORY_W, STORY_H
    rng = np.random.default_rng(sum(map(ord, slug)) + 7)
    rows = np.mgrid[0:h, 0:w][0]
    y01 = rows.astype(np.float32) / h
    outer = arch_mask(w, h, 22, w - 22, 18, h - 18)
    step = arch_mask(w, h, 52, w - 52, 54, h - 18)  # the molding steps in once
    inner = arch_mask(w, h, 78, w - 78, 86, h - 18)  # the opening
    sill_top = h - 132

    # Frame: dark stone, a little lighter than the page, in two steps, each face lit from above.
    stone = srgb_to_linear(np.array([46, 43, 40], np.float32) / 255)
    tex = texture("speckle", rng, h, w)

    def band(a: np.ndarray, b: np.ndarray, lift: float) -> np.ndarray:
        d_a = ndimage.distance_transform_edt(a)
        d_b = ndimage.distance_transform_edt(~b)
        t = np.clip(d_a / np.maximum(d_a + d_b, 1), 0, 1)
        return lift + 0.32 * np.sin(np.pi * t) * (1.15 - 0.7 * y01)

    shade = np.where(step, band(step, inner, 0.7), band(outer, step, 0.86))
    frame = stone * (tex * shade)[..., None] ** 2.2

    # Interior: the piece's surface, deeper toward the arch and the sides (the niche has depth),
    # under a pool of light from above.
    wall = backdrop(slug, w, h)
    depth = ndimage.distance_transform_edt(inner)
    occlusion = 1 - 0.6 * np.exp(-depth / 40)
    xs = np.mgrid[0:h, 0:w][1].astype(np.float32) / w
    pool = np.exp(-(((xs - 0.5) / 0.42) ** 2) - (((y01 - 0.2) / 0.5) ** 2))
    light = 0.62 + 0.5 * pool
    wall = wall * ((occlusion * light) ** 2.2)[..., None]

    # Sill: a stone ledge across the base, its top face catching the light, its front in shade.
    top_face = inner & (rows >= sill_top) & (rows < sill_top + 30)
    front_face = inner & (rows >= sill_top + 30)
    k = np.clip((rows - sill_top) / 30, 0, 1).astype(np.float32)
    top_tone = (1.9 - 0.5 * k) * tex
    wall = np.where(top_face[..., None], stone * (top_tone**2.2)[..., None], wall)
    wall = np.where(front_face[..., None], stone * ((0.72 * tex) ** 2.2)[..., None], wall)
    edge = inner & (rows >= sill_top) & (rows < sill_top + 2)
    wall[edge] = srgb_to_linear(np.array([112, 105, 96], np.float32) / 255)
    wall[inner & (rows >= sill_top + 30) & (rows < sill_top + 32)] *= 0.55

    a_inner = soft(inner)
    rgb = wall * a_inner[..., None] + frame * (1 - a_inner)[..., None]
    niche = Image.fromarray(
        np.dstack([(linear_to_srgb(rgb) * 255).round(), soft(outer) * 255]).astype(np.uint8), "RGBA"
    )

    # The garment hangs centred in the opening; its shadow falls on the back wall.
    cutout = Image.open(CUTOUTS / f"{slug}-{STORY_VIEW[slug]}.webp").convert("RGBA")
    hat = slug == "lambs-mark"
    open_w = w - 2 * 78
    box_w, box_h = open_w * (0.74 if hat else 0.74), (sill_top - 200) * (0.6 if hat else 0.88)
    scale = min(box_w / cutout.width, box_h / cutout.height)
    size = (round(cutout.width * scale), round(cutout.height * scale))
    garment = cutout.resize(size, Image.LANCZOS)
    x = (w - size[0]) // 2
    # Caps rest on the sill; tees and hoodies hang a little above the middle of the opening.
    y = sill_top + 6 - size[1] if hat else round(200 + (sill_top - 200 - size[1]) * 0.45)
    a = Image.new("L", (w, h), 0)
    a.paste(garment.getchannel("A"), (x, y + (8 if hat else 26)))
    cast = np.asarray(a.filter(ImageFilter.GaussianBlur(10 if hat else 26)), np.float32) / 255
    cast = cast * 0.6 * (inner & (rows < sill_top + (30 if hat else 0)))
    piece = Image.fromarray(np.dstack([np.zeros((h, w, 3)), cast * 255]).astype(np.uint8), "RGBA")
    piece.alpha_composite(garment, (x, y))

    folder = OUT / slug
    niche.save(folder / "story-niche.webp", "WEBP", quality=86, method=6)
    piece.save(folder / "story-piece.webp", "WEBP", quality=88, method=6)
    print(slug, "story")


def main() -> None:
    for slug, spec in VIEWS.items():
        folder = OUT / slug
        folder.mkdir(parents=True, exist_ok=True)
        hat = slug == "lambs-mark"
        for view in spec["views"]:
            cutout = Image.open(CUTOUTS / f"{slug}-{view}.webp").convert("RGBA")
            # Same margins for every garment; caps are wide, so they get a little more width.
            img = compose(slug, cutout, W, H, 0.84 if hat else 0.76, 0.74, 0.5)
            img.save(folder / f"{view}.webp", "WEBP", quality=86, method=6)
            print(folder.name, view)

        view, cx, cy, frac = spec["detail"]
        cutout = Image.open(CUTOUTS / f"{slug}-{view}.webp").convert("RGBA")
        # Crop the artwork, then lay it on the same surface so any edge that shows matches.
        cw = round(cutout.width * frac)
        ch = round(cw * DETAIL_H / DETAIL_W)
        left = round(cutout.width * cx - cw / 2)
        top = round(cutout.height * cy - ch / 2)
        crop = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        crop.paste(cutout.crop((left, top, left + cw, top + ch)), (0, 0))
        detail = to_image(backdrop(slug, DETAIL_W, DETAIL_H))
        art = crop.resize((DETAIL_W, DETAIL_H), Image.LANCZOS)
        detail.paste(art, (0, 0), art)
        detail.save(folder / "detail.webp", "WEBP", quality=88, method=6)
        print(folder.name, "detail")
        story(slug)


if __name__ == "__main__":
    main()
