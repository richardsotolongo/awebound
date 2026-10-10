"""
Cuts each garment view out of the approved mockups in source/ and saves it with a transparent
background in cutouts/. The source files are never modified.

The mockups sit on a plain light-grey studio backdrop, so the garment is found by how far each
pixel's color is from that backdrop (light garments differ in warmth, dark ones in lightness),
then the edge is refined with closed-form alpha matting, which also strips the grey backdrop out
of soft edge pixels so no pale outline shows on a darker background.

    pip install pymatting opencv-python-headless scikit-image scipy pillow numpy
    python3 assets/mockups/cutout.py

Then run compose.py to place the cutouts on their styled backgrounds.
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from scipy import ndimage
from skimage.morphology import convex_hull_image
from skimage.segmentation import watershed

HERE = Path(__file__).parent
SOURCE = HERE / "source"
CUTOUTS = HERE / "cutouts"

# Each source sheet holds two or three views side by side. Boxes are (left, top, right, bottom)
# around one garment inside its panel, below the sheet title and above the FRONT/BACK labels.
# `mode` says how a garment differs from the grey backdrop: "dark" garments by lightness,
# "light" ones (bone, sand) by warmth, "white" ones by being brighter than the backdrop.
# `touching` sheets have views that touch, so they are split along the narrowest point between
# them (see split_garments). `gaps` reopens backdrop showing between a sleeve and the body;
# `trim_shadow` removes a contact shadow under a dark hem; `fill_neck` fills a white tee's
# inner collar (see the functions of the same names). `mirror_sleeve` rebuilds the sleeve that
# touched the neighbouring garment from a mirror image of the far one (see mirror_sleeve).
SHEETS: dict[str, dict] = {
    "still-the-storm": {
        "mirror_sleeve": {"front": "right", "back": "left"},
        "mode": "dark",
        "touching": True,
        "views": [("front", (20, 95, 768, 945)), ("back", (768, 95, 1520, 945))],
    },
    "by-his-hem": {
        "mirror_sleeve": {"front": "right", "back": "left"},
        "mode": "light",
        "touching": True,
        "views": [("front", (15, 75, 768, 945)), ("back", (768, 75, 1515, 945))],
    },
    "thorns-to-lilies": {
        "mirror_sleeve": {"front": "right", "back": "left"},
        "mode": "white",
        "touching": True,
        "fill_neck": ("front",),
        "views": [("front", (15, 80, 768, 945)), ("back", (768, 80, 1520, 945))],
    },
    "torn-veil": {
        "mode": "dark",
        "touching": True,
        "gaps": True,
        "views": [("front", (15, 70, 768, 945)), ("back", (768, 70, 1520, 945))],
    },
    "stone-in-motion": {
        "mirror_sleeve": {"front": "right", "back": "left"},
        "trim_shadow": True,
        "mode": "light",
        "touching": True,
        "views": [("front", (30, 95, 768, 935)), ("back", (768, 95, 1510, 935))],
    },
    "to-live-is-christ": {
        "mirror_sleeve": {"front": "right", "back": "left"},
        "mode": "dark",
        "touching": True,
        "trim_shadow": True,
        "views": [("front", (10, 75, 768, 945)), ("back", (768, 75, 1526, 945))],
    },
    "lambs-mark": {
        "mode": "dark",
        "touching": True,
        "views": [
            ("front", (20, 140, 604, 700)),
            ("side", (604, 140, 1305, 700)),
            ("back", (1305, 140, 1975, 700)),
        ],
    },
}


def backdrop(lab: np.ndarray) -> np.ndarray:
    """Fits a smooth (quadratic) backdrop to the crop's border pixels, per Lab channel."""
    h, w, _ = lab.shape
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.zeros((h, w), bool)
    b = 8
    edge[:b], edge[-b:], edge[:, :b], edge[:, -b:] = True, True, True, True

    def terms(x, y):
        return np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], -1)

    fit = np.empty_like(lab)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(terms(xx[edge] / w, yy[edge] / h), lab[..., c][edge], rcond=None)
        fit[..., c] = terms(xx / w, yy / h) @ coef
    return fit


def largest_component(mask: np.ndarray) -> np.ndarray:
    labels, count = ndimage.label(mask)
    if count <= 1:
        return mask
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    return labels == 1 + int(np.argmax(sizes))


def garment_mask(rgb8: np.ndarray, mode: str, everything: bool = False, fill: bool = True) -> np.ndarray:
    _, d = lab_and_delta(rgb8)
    if mode == "light":
        # Bone and sand are as light as the backdrop and its shadows, but warm; the backdrop is
        # neutral and its cast shadows are darker and cooler, so only lighter and warmer count.
        dist = np.sqrt(
            (0.15 * np.maximum(d[..., 0], 0)) ** 2 + d[..., 1] ** 2 + (1.25 * np.maximum(d[..., 2], 0)) ** 2
        )
        threshold = 4.2
    elif mode == "white":
        # White fabric is brighter than the backdrop; prints and folds differ in color or lightness.
        dist = np.maximum(d[..., 0], 0) * 1.4 + np.sqrt(d[..., 1] ** 2 + d[..., 2] ** 2) * 0.8
        threshold = 4.5
    else:
        # Dark garments are darker than the backdrop; a brighter patch of backdrop never counts.
        dist = np.sqrt((0.45 * np.minimum(d[..., 0], 0)) ** 2 + d[..., 1] ** 2 + d[..., 2] ** 2)
        threshold = 11
    mask = dist > threshold
    mask = ndimage.binary_opening(mask, iterations=2)
    if everything:
        # Every garment in the crop: drop only specks and label text.
        labels, count = ndimage.label(mask)
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        mask = np.isin(labels, 1 + np.flatnonzero(sizes > 0.05 * sizes.max()))
    else:
        mask = largest_component(mask)
    # White fabric folds can be as dark as the backdrop and leave bites in the outline; close them.
    mask = ndimage.binary_closing(mask, iterations=16 if mode == "white" else 6)
    return ndimage.binary_fill_holes(mask) if fill else mask


def lab_and_delta(rgb8: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lab = cv2.cvtColor(rgb8, cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[..., 0] *= 100 / 255
    lab[..., 1:] -= 128
    return lab, lab - backdrop(lab)


def gaps(rgb8: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Backdrop showing through a narrow gap between a sleeve and the body, which the mask's
    closing and hole filling take in. Pixels that look like the backdrop (neutral, and no darker
    than it) and connect to the backdrop outside the garment are backdrop. Prints are enclosed by
    garment, so they never connect."""
    _, d = lab_and_delta(rgb8)
    like = (np.abs(d[..., 1]) < 4) & (np.abs(d[..., 2]) < 4) & (d[..., 0] > -12)
    labels, _ = ndimage.label(like | ~mask)
    outside = np.unique(labels[~mask])
    out = np.isin(labels, outside[outside > 0]) & mask
    out = ndimage.binary_opening(out, iterations=1)
    # The gap can pinch shut, leaving a pocket of backdrop just above it.
    pockets, count = ndimage.label(like & mask & ~out)
    near = ndimage.binary_dilation(out, iterations=40)
    touching = np.unique(pockets[near & (pockets > 0)])
    out |= np.isin(pockets, touching[touching > 0])
    return ndimage.binary_dilation(out, iterations=2) & mask


def bottom_shadow(rgb8: np.ndarray, mask: np.ndarray, mode: str = "dark") -> np.ndarray:
    """The contact shadow under a hem can pass as garment: lighter than a dark garment but still
    dark, or a grey band under a light one. Walk up each column from the bottom and drop pixels
    that don't match the garment's lightness."""
    lab, _ = lab_and_delta(rgb8)
    L = lab[..., 0]
    if mode == "dark":
        ref = np.percentile(L[mask], 30)
        garment = L <= ref + 12
    else:
        ref = np.percentile(L[mask], 50)
        garment = L >= ref - 18
    out = np.zeros_like(mask)
    for x in np.flatnonzero(mask.any(0)):
        ys = np.flatnonzero(mask[:, x])
        for y in ys[::-1]:
            if garment[y, x]:
                break
            out[y, x] = True
    return ndimage.binary_opening(out, iterations=1)


def neck_opening(hard: np.ndarray) -> np.ndarray:
    """The inside of a tee's neck seen from the front: the region under a line joining the two
    collar peaks. Light garments' inner collars can match the backdrop and get cut out."""
    h, w = hard.shape
    rows = np.where(hard.any(1))[0]
    top = np.where(hard.any(0), np.argmax(hard, 0), h)
    cx = int(np.mean(np.where(hard.any(0))[0]))
    span = w // 4
    xl = cx - span + int(np.argmin(top[cx - span : cx]))
    xr = cx + int(np.argmin(top[cx : cx + span]))
    yy, xx = np.mgrid[0:h, 0:w]
    line = top[xl] + (top[xr] - top[xl]) * (xx - xl) / max(1, xr - xl)
    region = (xx > xl) & (xx < xr) & (yy >= line) & (yy < rows.min() + h // 4)
    return ndimage.binary_fill_holes(hard | (region & ~hard)) & ~hard


def hem_notches(hard: np.ndarray, width: int = 61) -> np.ndarray:
    """Narrow bites taken out of the bottom edge, where a hem's shadow matched the backdrop. The
    bottom outline is closed over `width` columns, which fills notches but keeps the step between
    body and sleeve."""
    h, w = hard.shape
    cols = hard.any(0)
    bottom = np.where(cols, h - 1 - np.argmax(hard[::-1], 0), 0).astype(np.float64)
    closed = ndimage.grey_closing(bottom, size=width)
    yy = np.arange(h)[:, None]
    fill = cols[None, :] & (yy > bottom[None, :]) & (yy <= closed[None, :])
    return fill & ~hard


def split_garments(slug: str, sheet: dict) -> dict[str, np.ndarray]:
    """Separates garments that touch: a watershed on the distance to the background, seeded in
    each view's box, so the cut falls at the narrowest point between them. Returns, per view,
    the other garments' pixels in that view's crop."""
    image = Image.open(SOURCE / f"{slug}.png").convert("RGB")
    boxes = [box for _, box in sheet["views"]]
    x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
    x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    rgb8 = np.ascontiguousarray(np.asarray(image.crop((x0, y0, x1, y1))))
    mask = garment_mask(rgb8, sheet["mode"], everything=True)
    dist = ndimage.distance_transform_edt(mask)
    markers = np.zeros(mask.shape, np.int32)
    for i, (l, t, r, b) in enumerate(boxes, start=1):
        inside = np.zeros_like(mask)
        inside[t - y0 : b - y0, l - x0 : r - x0] = True
        y, x = np.unravel_index(np.argmax(np.where(inside, dist, 0)), dist.shape)
        markers[y, x] = i
    labels = watershed(-dist, markers, mask=mask)
    if "first_view_area" in sheet:
        # Where one garment overlaps the other the narrowest point is the wrong cut: follow the
        # outline of the garment in front instead, given as a polygon in sheet coordinates.
        area = np.zeros(mask.shape, np.uint8)
        poly = np.array([(x - x0, y - y0) for x, y in sheet["first_view_area"]], np.int32)
        cv2.fillPoly(area, [poly], 1)
        labels = np.where(mask, np.where(area > 0, 1, 2), 0)
    others = {}
    for i, (view, (l, t, r, b)) in enumerate(sheet["views"], start=1):
        other = (labels > 0) & (labels != i)
        others[view] = ndimage.binary_dilation(other, iterations=2)[t - y0 : b - y0, l - x0 : r - x0]
    return others


def refine(
    rgb8: np.ndarray, mask: np.ndarray, exclude: np.ndarray | None = None, background: np.ndarray | None = None
) -> np.ndarray:
    """GrabCut tidies the rough mask's edge, then matting gives a soft, clean alpha.
    `exclude` marks pixels that belong to another garment and must stay out; `background` marks
    backdrop the rough mask took in (gaps, shadows)."""
    if exclude is not None:
        mask = largest_component(mask & ~exclude)
    if background is not None:
        mask = mask & ~background
    gc = np.where(mask, cv2.GC_PR_FGD, cv2.GC_PR_BGD).astype(np.uint8)
    gc[ndimage.binary_erosion(mask, iterations=14)] = cv2.GC_FGD
    gc[~ndimage.binary_dilation(mask, iterations=14)] = cv2.GC_BGD
    if exclude is not None:
        gc[exclude] = cv2.GC_BGD
    if background is not None:
        gc[background] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
    bgr = cv2.cvtColor(rgb8, cv2.COLOR_RGB2BGR)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    hard = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD))
    hard = ndimage.binary_fill_holes(largest_component(hard))
    if background is not None:
        hard &= ~background

    trimap = np.full(hard.shape, 0.5)
    trimap[ndimage.binary_erosion(hard, iterations=3)] = 1.0
    trimap[~ndimage.binary_dilation(hard, iterations=3)] = 0.0
    if exclude is not None:
        trimap[exclude] = 0.0
    if background is not None:
        trimap[ndimage.binary_erosion(background, iterations=1)] = 0.0
    alpha = estimate_alpha_cf(rgb8 / 255.0, trimap)
    if exclude is not None:
        # Where two garments touched there is no backdrop between them to matte against, so the
        # cut edge is drawn clean (lightly anti-aliased) instead of matted into a fuzzy fringe.
        seam = ndimage.binary_dilation(exclude, iterations=8)
        clean = ndimage.gaussian_filter(hard.astype(np.float64), 0.7)
        alpha = np.where(seam, clean, alpha)
    if background is not None and background.any():
        # Gaps and trimmed shadows sit in shade, where matting turns ragged; draw those edges clean.
        near = ndimage.binary_dilation(background, iterations=6)
        alpha = np.where(near, ndimage.gaussian_filter(hard.astype(np.float64), 0.8), alpha)
    return alpha


def heal(alpha: np.ndarray, fg: np.ndarray, exclude: np.ndarray):
    """Where the neighbouring garment overlapped this one (a sleeve tip tucked behind the other
    view's sleeve), the cut leaves a notch. Close it with the outline's convex hull near the seam
    and fill the fabric from the surrounding pixels."""
    hard = alpha > 0.5
    near = ndimage.binary_dilation(exclude, iterations=14)
    hull = convex_hull_image(hard & near) & near
    fill = hull & ~hard
    if not fill.any():
        return alpha, fg
    rgb = (np.clip(fg, 0, 1) * 255).astype(np.uint8)
    rgb = cv2.inpaint(rgb, fill.astype(np.uint8), 4, cv2.INPAINT_TELEA)
    solid = ndimage.gaussian_filter((hard | fill).astype(np.float64), 0.7)
    alpha = np.where(near, solid, alpha)
    return alpha, rgb / 255.0


def cut(
    slug: str,
    view: str,
    box: tuple[int, int, int, int],
    mode: str,
    exclude: np.ndarray | None = None,
    fill_neck: tuple[str, ...] = (),
    find_gaps: bool = False,
    trim_shadow: bool = False,
) -> Image.Image:
    sheet = Image.open(SOURCE / f"{slug}.png").convert("RGB")
    rgb8 = np.ascontiguousarray(np.asarray(sheet.crop(box)))
    mask = garment_mask(rgb8, mode, everything=exclude is not None)
    background = np.zeros_like(mask)
    if find_gaps:
        background |= gaps(rgb8, mask)
    if trim_shadow:
        background |= bottom_shadow(rgb8, mask, mode)
    alpha = np.clip(refine(rgb8, mask, exclude, background), 0, 1)
    if view in fill_neck:
        neck = neck_opening(alpha > 0.5)
        alpha = np.maximum(alpha, ndimage.gaussian_filter(neck.astype(np.float64), 0.7))
    if mode == "white":
        hard = alpha > 0.5
        notch = hem_notches(hard)
        # Redraw the edge around the filled notch so no trace of the old outline shows.
        near = ndimage.binary_dilation(notch, iterations=6)
        solid = ndimage.binary_fill_holes(ndimage.binary_closing(hard | notch, iterations=3))
        alpha = np.where(near, ndimage.gaussian_filter(solid.astype(np.float64), 0.7), alpha)
    fg = estimate_foreground_ml(rgb8 / 255.0, alpha)
    if exclude is not None:
        alpha, fg = heal(alpha, fg, exclude)
    out = np.dstack([np.clip(fg, 0, 1), alpha])
    img = Image.fromarray((out * 255).round().astype(np.uint8), "RGBA")
    return img.crop(img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def mirror_sleeve(img: Image.Image, side: str, band: int = 28) -> Image.Image:
    """Rebuilds the sleeve on `side` ("left" or "right") from a mirror image of the other one.
    Where two garments touched on the sheet, the sleeves between them overlap or meet at the
    cuff, so the cut leaves that sleeve folded, notched or short; the far sleeve is whole. The
    body's side lines (measured below the sleeves) give the garment's centre line, the far
    sleeve is mirrored across it, and only the region beyond that side line is replaced, with a
    short blend so the shoulder runs on without a seam. The body and its print stay untouched."""
    pad = 80
    rgba = np.asarray(img.convert("RGBA")).astype(np.float64) / 255
    rgba = np.pad(rgba, ((0, 0), (pad, pad), (0, 0)))
    alpha = rgba[..., 3]
    hard = alpha > 0.5
    h, w = hard.shape
    rows = np.flatnonzero(hard.any(1))
    top, bottom = rows.min(), rows.max()
    height = bottom - top
    below = range(top + int(0.66 * height), top + int(0.9 * height))
    lefts = [np.flatnonzero(hard[y])[0] for y in below if hard[y].any()]
    rights = [np.flatnonzero(hard[y])[-1] for y in below if hard[y].any()]
    body_l, body_r = float(np.median(lefts)), float(np.median(rights))
    cx = (body_l + body_r) / 2

    # The far sleeve's lowest point sets how far down the rebuilt region reaches.
    far = hard[:, : int(body_l) - 6] if side == "right" else hard[:, int(body_r) + 6 :]
    sleeve_bottom = np.flatnonzero(far.any(1)).max() + 12

    xs = np.arange(w, dtype=np.float64)
    src = np.clip(np.round(2 * cx - xs).astype(int), 0, w - 1)
    mirror = rgba[:, src]
    # The blend is wide across the shoulder, where sleeve and body are one piece of cloth, and
    # narrow lower down, where the sleeve's underside meets the body at a clean edge.
    ys = np.arange(h, dtype=np.float64)[:, None]
    shoulder = np.clip((top + 0.3 * height - ys) / (0.1 * height), 0, 1)
    width = 8 + (band - 8) * shoulder
    if side == "right":
        weight = np.clip((xs[None, :] - (body_r - 4)) / width, 0, 1)
        outside = np.clip((xs - (body_r + 4)) / 8, 0, 1)
    else:
        weight = np.clip(((body_l + 4) - xs[None, :]) / width, 0, 1)
        outside = np.clip(((body_l - 4) - xs) / 8, 0, 1)
    # Below the sleeve only what lies outside the body's side line is taken from the mirror,
    # which clears any scrap of the neighbouring garment left beside the body.
    weight[sleeve_bottom:] = outside

    a0, a1 = alpha.copy(), mirror[..., 3].copy()
    p0 = rgba[..., :3] * alpha[..., None]
    p1 = mirror[..., :3] * mirror[..., 3:4]
    # The two shoulder lines rarely sit at the same height where they meet, and averaging them
    # would leave a see-through ghost or a step. In each column of the shoulder blend, slide both
    # columns up or down so their top edges meet at the blended height, then mix.
    yy = np.arange(sleeve_bottom, dtype=np.float64)
    for x in range(w):
        wt = weight[top + 2, x]
        if not 0 < wt < 1:
            continue
        on0 = np.flatnonzero(a0[:sleeve_bottom, x] > 0.5)
        on1 = np.flatnonzero(a1[:sleeve_bottom, x] > 0.5)
        if not len(on0) or not len(on1):
            continue
        target = (1 - wt) * on0[0] + wt * on1[0]
        for arr_a, arr_p, edge in ((a0, p0, on0[0]), (a1, p1, on1[0])):
            shift = target - edge
            src_y = yy - shift
            arr_a[:sleeve_bottom, x] = np.interp(src_y, yy, arr_a[:sleeve_bottom, x], left=0, right=0)
            for c in range(3):
                arr_p[:sleeve_bottom, x, c] = np.interp(src_y, yy, arr_p[:sleeve_bottom, x, c], left=0, right=0)

    wgt = weight[..., None]
    premult = p0 * (1 - wgt) + p1 * wgt
    a = a0 * (1 - weight) + a1 * weight
    rgb = np.where(a[..., None] > 1e-4, premult / np.maximum(a, 1e-4)[..., None], 0)
    out = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), a]) * 255).round().astype(np.uint8), "RGBA")
    return out.crop(out.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())


def main() -> None:
    CUTOUTS.mkdir(exist_ok=True)
    for slug, sheet in SHEETS.items():
        others = split_garments(slug, sheet) if sheet.get("touching") else {}
        for view, box in sheet["views"]:
            img = cut(
                slug,
                view,
                box,
                sheet["mode"],
                others.get(view),
                sheet.get("fill_neck", ()),
                sheet.get("gaps", False),
                sheet.get("trim_shadow", False),
            )
            if view in sheet.get("mirror_sleeve", {}):
                img = mirror_sleeve(img, sheet["mirror_sleeve"][view])
            path = CUTOUTS / f"{slug}-{view}.webp"
            img.save(path, "WEBP", lossless=True, method=6)
            print(path.relative_to(HERE), img.size, flush=True)


if __name__ == "__main__":
    main()
