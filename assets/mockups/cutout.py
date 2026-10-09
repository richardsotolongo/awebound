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
from skimage.segmentation import watershed

HERE = Path(__file__).parent
SOURCE = HERE / "source"
CUTOUTS = HERE / "cutouts"

# Each source sheet holds two or three views side by side. Boxes are (left, top, right, bottom)
# around one garment inside its panel, below the sheet title and above the FRONT/BACK labels.
# `light` marks garments close to the backdrop's lightness (bone, sand), found by warmth instead.
SHEETS: dict[str, dict] = {
    "holy-ground": {
        "light": False,
        "views": [("front", (40, 80, 768, 950)), ("back", (768, 80, 1500, 950))],
    },
    "still-the-storm": {
        "light": False,
        "views": [("front", (20, 80, 768, 960)), ("back", (768, 80, 1520, 960))],
    },
    "thorns-to-lilies": {
        "light": True,
        # The two sleeves touch in this sheet, so the garments are split along the narrowest
        # point between them instead of at the panel line.
        "touching": True,
        "views": [("front", (10, 80, 768, 975)), ("back", (768, 80, 1530, 975))],
    },
    "stone-in-motion": {
        "light": True,
        "views": [("front", (30, 80, 768, 950)), ("back", (768, 80, 1510, 950))],
    },
    "to-live-is-christ": {
        "light": False,
        "views": [("front", (0, 70, 768, 985)), ("back", (768, 70, 1536, 985))],
    },
    "lambs-mark": {
        "light": False,
        "views": [
            ("front", (0, 90, 648, 655)),
            ("side", (648, 90, 1422, 655)),
            ("rear", (1422, 90, 2039, 655)),
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


def garment_mask(rgb8: np.ndarray, light: bool, everything: bool = False) -> np.ndarray:
    lab = cv2.cvtColor(rgb8, cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[..., 0] *= 100 / 255
    lab[..., 1:] -= 128
    d = lab - backdrop(lab)
    if light:
        # Bone and sand are as light as the backdrop and its shadows, but warm; the backdrop is neutral.
        dist = np.sqrt((0.15 * d[..., 0]) ** 2 + d[..., 1] ** 2 + (1.25 * d[..., 2]) ** 2)
        threshold = 4.2
    else:
        dist = np.sqrt((0.45 * d[..., 0]) ** 2 + d[..., 1] ** 2 + d[..., 2] ** 2)
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
    mask = ndimage.binary_closing(mask, iterations=6)
    return ndimage.binary_fill_holes(mask)


def split_garments(slug: str, sheet: dict) -> dict[str, np.ndarray]:
    """Separates garments that touch: a watershed on the distance to the background, seeded in
    each view's box, so the cut falls at the narrowest point between them. Returns, per view,
    the other garments' pixels in that view's crop."""
    image = Image.open(SOURCE / f"{slug}.png").convert("RGB")
    boxes = [box for _, box in sheet["views"]]
    x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
    x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    rgb8 = np.ascontiguousarray(np.asarray(image.crop((x0, y0, x1, y1))))
    mask = garment_mask(rgb8, sheet["light"], everything=True)
    dist = ndimage.distance_transform_edt(mask)
    markers = np.zeros(mask.shape, np.int32)
    for i, (l, t, r, b) in enumerate(boxes, start=1):
        inside = np.zeros_like(mask)
        inside[t - y0 : b - y0, l - x0 : r - x0] = True
        y, x = np.unravel_index(np.argmax(np.where(inside, dist, 0)), dist.shape)
        markers[y, x] = i
    labels = watershed(-dist, markers, mask=mask)
    others = {}
    for i, (view, (l, t, r, b)) in enumerate(sheet["views"], start=1):
        other = (labels > 0) & (labels != i)
        others[view] = ndimage.binary_dilation(other, iterations=2)[t - y0 : b - y0, l - x0 : r - x0]
    return others


def refine(rgb8: np.ndarray, mask: np.ndarray, exclude: np.ndarray | None = None) -> np.ndarray:
    """GrabCut tidies the rough mask's edge, then matting gives a soft, clean alpha.
    `exclude` marks pixels that belong to another garment and must stay out."""
    if exclude is not None:
        mask = largest_component(mask & ~exclude)
    gc = np.where(mask, cv2.GC_PR_FGD, cv2.GC_PR_BGD).astype(np.uint8)
    gc[ndimage.binary_erosion(mask, iterations=14)] = cv2.GC_FGD
    gc[~ndimage.binary_dilation(mask, iterations=14)] = cv2.GC_BGD
    if exclude is not None:
        gc[exclude] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
    bgr = cv2.cvtColor(rgb8, cv2.COLOR_RGB2BGR)
    cv2.grabCut(bgr, gc, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    hard = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD))
    hard = ndimage.binary_fill_holes(largest_component(hard))

    trimap = np.full(hard.shape, 0.5)
    trimap[ndimage.binary_erosion(hard, iterations=3)] = 1.0
    trimap[~ndimage.binary_dilation(hard, iterations=3)] = 0.0
    if exclude is not None:
        trimap[exclude] = 0.0
    return estimate_alpha_cf(rgb8 / 255.0, trimap)


def cut(
    slug: str,
    view: str,
    box: tuple[int, int, int, int],
    light: bool,
    exclude: np.ndarray | None = None,
) -> Image.Image:
    sheet = Image.open(SOURCE / f"{slug}.png").convert("RGB")
    rgb8 = np.ascontiguousarray(np.asarray(sheet.crop(box)))
    mask = garment_mask(rgb8, light, everything=exclude is not None)
    alpha = np.clip(refine(rgb8, mask, exclude), 0, 1)
    fg = estimate_foreground_ml(rgb8 / 255.0, alpha)
    out = np.dstack([np.clip(fg, 0, 1), alpha])
    img = Image.fromarray((out * 255).round().astype(np.uint8), "RGBA")
    return img.crop(img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def main() -> None:
    CUTOUTS.mkdir(exist_ok=True)
    for slug, sheet in SHEETS.items():
        others = split_garments(slug, sheet) if sheet.get("touching") else {}
        for view, box in sheet["views"]:
            img = cut(slug, view, box, sheet["light"], others.get(view))
            path = CUTOUTS / f"{slug}-{view}.webp"
            img.save(path, "WEBP", lossless=True, method=6)
            print(path.relative_to(HERE), img.size, flush=True)


if __name__ == "__main__":
    main()
