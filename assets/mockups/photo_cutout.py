"""
Cuts a garment out of a Fourthwall photo, with the shadow the photo gives it.

The home page sets each piece's listing photo on its plate, so the garment there must be the one
in the shop's first image, not an older render. `cutout` returns the garment from the photo
(alpha-matted along its edge) and its real shadow as darkness only, so it sits on any surface:

- the garment is found by its distance from the background color (lightness counts for half, so
  a shadow, which keeps the background's hue, stays background), refined with GrabCut;
- the shadow is how much darker the photo is than its own background light just around the
  garment, smoothed so the background's texture doesn't print into it;
- a tee's sleeves cut off by the photo's left or right edge are completed: in a flat lay a sleeve
  ends in a point where its shoulder edge meets its hem, so the missing tip is the wedge between
  those two edges, filled with the sleeve's own fabric mirrored across the cut. A long sleeve (a
  hoodie's) can't be completed that way, so it fades out toward the edge instead.

`texture_like` makes more of a photo's background grain (image quilting from its garment-free
patches), for zooming a tightly framed photo out (widen.py).

    python3 assets/mockups/photo_cutout.py <photo> <out.png> [complete|fade]   # to look at one
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def _lab(a: np.ndarray) -> np.ndarray:
    return cv2.cvtColor((a / 255).astype(np.float32), cv2.COLOR_RGB2Lab)


def _smooth_fill(values: np.ndarray, known: np.ndarray, sigma: float) -> np.ndarray:
    """Values carried smoothly into the unknown parts (normalized convolution, computed small)."""
    k = 8
    h, w = known.shape
    small = cv2.resize(values * known[..., None], (w // k, h // k), interpolation=cv2.INTER_AREA)
    wt = cv2.resize(known.astype(np.float32), (w // k, h // k), interpolation=cv2.INTER_AREA)
    out, weight = None, None
    for s in (sigma, sigma * 2.5, sigma * 6, sigma * 15):
        num = cv2.GaussianBlur(small, (0, 0), s / k)
        den = cv2.GaussianBlur(wt, (0, 0), s / k)
        est = num / np.maximum(den, 1e-6)[..., None]
        if out is None:
            out, weight = est, den
        else:
            weak = (weight < 0.05)[..., None]
            out = np.where(weak, est, out)
            weight = np.maximum(weight, den)
    return cv2.resize(out, (w, h), interpolation=cv2.INTER_CUBIC)


def garment_matte(a: np.ndarray) -> np.ndarray:
    """The garment's alpha (0..1): rough mask by color distance, refined by GrabCut, edge softened."""
    h, w = a.shape[:2]
    lab = _lab(a)
    bands = np.concatenate([lab[: h // 25].reshape(-1, 3), lab[-h // 25 :].reshape(-1, 3)])
    bg = np.median(bands, 0)
    rough = None
    for _ in range(2):
        if rough is None:
            ref = np.broadcast_to(bg, lab.shape)
        else:
            ref = _smooth_fill(lab, ~ndi.binary_dilation(rough, iterations=40), 60)
        d = lab - ref
        dist = np.sqrt((0.5 * d[..., 0]) ** 2 + d[..., 1] ** 2 + d[..., 2] ** 2)
        t, _ = cv2.threshold(np.clip(dist * 4, 0, 255).astype(np.uint8), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        m = dist * 4 > max(t, 40)
        m = ndi.binary_opening(m, iterations=2)
        lab_ids, n = ndi.label(m)
        m = lab_ids == (np.argmax(ndi.sum(m, lab_ids, range(1, n + 1))) + 1)
        rough = ndi.binary_fill_holes(m)
    gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gc[rough] = cv2.GC_PR_FGD
    gc[ndi.binary_erosion(rough, iterations=14)] = cv2.GC_FGD
    gc[~ndi.binary_dilation(rough, iterations=22)] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    img = np.clip(a, 0, 255).astype(np.uint8)
    cv2.grabCut(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    m = (gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)
    m &= ~_shaded_background(img, m)
    # Smooth the outline: no specks off it, no nicks into it.
    m = ndi.binary_opening(m, iterations=1)
    m = ndi.binary_closing(m, iterations=3)
    lab_ids, n = ndi.label(m)
    m = lab_ids == (np.argmax(ndi.sum(m, lab_ids, range(1, n + 1))) + 1)
    m = ndi.binary_fill_holes(m)
    return np.clip(cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8), 0, 1)


def _shaded_background(img: np.ndarray, m: np.ndarray) -> np.ndarray:
    """Background in deep shade that was taken for garment: near the garment's edge, the
    background's own hue, still saturated, and darker than the open background (the gap between
    a hoodie's arm and its body, say). Only for a colored background; a neutral one has no hue."""
    h, w = m.shape
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    bands = np.concatenate([hsv[: h // 25].reshape(-1, 3), hsv[-h // 25 :].reshape(-1, 3)])
    hue_bg, sat_bg, val_bg = (np.median(bands[:, i]) for i in range(3))
    if sat_bg < 40:
        return np.zeros_like(m)
    dh = np.abs(((hsv[..., 0] - hue_bg) + 128) % 256 - 128)
    near_edge = ndi.distance_transform_edt(m) < 70
    # A dark garment of a warm black can share the hue, but not the saturation.
    return m & near_edge & (dh < 12) & (hsv[..., 1] > max(0.55 * sat_bg, 60)) & (hsv[..., 2] < val_bg)


def background_light(a: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """The photo's background light and color everywhere, from the garment-free background."""
    clean = ~ndi.binary_dilation(alpha > 0.02, iterations=70)
    return _smooth_fill(a, clean, 50)


def shadow_of(a: np.ndarray, alpha: np.ndarray, light: np.ndarray) -> np.ndarray:
    """The shadow (0..1 darkness) the garment casts in the photo, smoothed, near the garment."""
    lum = cv2.GaussianBlur(a.mean(2), (0, 0), 6)
    base = np.maximum(light.mean(2), 1)
    dark = np.clip(1 - lum / base - 0.025, 0, None) / 0.975
    inside = alpha > 0.02
    dist = ndi.distance_transform_edt(~inside)
    reach = np.clip(1 - (dist - 60) / 50, 0, 1)
    s = np.clip(dark * reach, 0, 0.85)
    s[inside] = np.maximum(s[inside], 0)
    return cv2.GaussianBlur(s.astype(np.float32), (0, 0), 3)


def _run(m: np.ndarray, x: int) -> tuple[int, int]:
    ys = np.where(m[:, x])[0]
    run = np.split(ys, np.where(np.diff(ys) > 1)[0] + 1)[0]
    return int(run[0]), int(run[-1])


def complete_sleeves(rgb: np.ndarray, alpha: np.ndarray, shadow: np.ndarray, margin: int = 160):
    """Widens the arrays by `margin` on each side and fills in any sleeve cut off by an edge."""
    h, w = alpha.shape
    m = alpha > 0.5
    W2 = w + 2 * margin
    rgb2 = np.zeros((h, W2, 3), np.float32)
    a2 = np.zeros((h, W2), np.float32)
    s2 = np.zeros((h, W2), np.float32)
    rgb2[:, margin : margin + w] = rgb
    a2[:, margin : margin + w] = alpha
    s2[:, margin : margin + w] = shadow
    tip = np.zeros((h, W2), np.float32)
    for side in ("left", "right"):
        edge = 0 if side == "left" else w - 1
        out = -1 if side == "left" else 1
        if not m[:, edge].any():
            continue
        cols = [edge - out * d for d in range(4, 64, 4)]
        runs = np.array([_run(m, x) for x in cols], np.float64)
        top = np.polyfit(cols, runs[:, 0], 1)
        bottom = np.polyfit(cols, runs[:, 1], 1)
        for u in range(1, margin):
            t0 = float(np.polyval(top, edge + out * u))
            b0 = float(np.polyval(bottom, edge + out * u))
            if b0 <= t0:
                break
            sx = edge - out * min(u, 60)
            st, sb = _run(m, sx)
            x = margin + edge + out * u
            for y in range(max(0, int(np.floor(t0))), min(h, int(np.ceil(b0)) + 1)):
                cover = float(np.clip(min(y + 0.5 - t0, b0 - (y - 0.5)), 0, 1))
                if cover <= 0:
                    continue
                t = float(np.clip((y - t0) / max(b0 - t0, 1), 0, 1))
                sy = st + t * (sb - st)
                y0 = int(np.floor(sy))
                y1 = min(y0 + 1, h - 1)
                f = sy - y0
                rgb2[y, x] = rgb[y0, sx] * (1 - f) + rgb[y1, sx] * f
                a2[y, x] = cover
                tip[y, x] = cover
    # The tips cast a shadow like the photo's own: soft, down and a little to the right.
    cast = np.zeros_like(tip)
    cast[14:, 6:] = tip[:-14, :-6]
    s2 = np.maximum(s2, cv2.GaussianBlur(cast, (0, 0), 16) * 0.3)
    return rgb2, a2, s2, margin


def fade_edges(alpha: np.ndarray, shadow: np.ndarray, width: int = 24):
    """A garment (and its shadow) fading out toward the photo's left and right edges."""
    w = alpha.shape[1]
    x = np.arange(w, dtype=np.float32)
    t = np.clip(np.minimum(x, w - 1 - x) / width, 0, 1)
    ramp = (t * t * (3 - 2 * t))[None, :]
    return alpha * ramp, shadow * ramp


def cutout(path: Path, sleeves: str = "complete"):
    """(rgb, alpha, shadow, light, margin) for a photo: the garment, its shadow and the background
    light. A garment that runs off the left or right edge has its sleeves completed (`complete`,
    for tees: the arrays are widened by `margin` on each side) or faded out (`fade`)."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    alpha = garment_matte(a)
    light = background_light(a, alpha)
    shadow = shadow_of(a, alpha, light) * (1 - alpha)
    m = alpha > 0.5
    if (m[:, 0].any() or m[:, -1].any()) and sleeves == "fade":
        alpha, shadow = fade_edges(alpha, shadow)
        return a, alpha, shadow, light, 0
    if m[:, 0].any() or m[:, -1].any():
        rgb, alpha, shadow, margin = complete_sleeves(a, alpha, shadow)
        shadow *= 1 - alpha
        pad = np.pad(light, ((0, 0), (margin, margin), (0, 0)), mode="edge")
        return rgb, alpha, shadow, pad, margin
    return a, alpha, shadow, light, 0


def to_rgba(rgb: np.ndarray, alpha: np.ndarray, shadow: np.ndarray) -> Image.Image:
    """The garment over its shadow (black), transparent elsewhere."""
    a = alpha + (1 - alpha) * shadow
    color = np.where(alpha[..., None] > 0, rgb, 0)
    # Straight alpha: where only shadow shows, the color is black.
    out = np.dstack([np.clip(color, 0, 255), np.clip(a * 255, 0, 255)]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def _min_cut(err: np.ndarray) -> np.ndarray:
    """For an overlap error (rows x overlap columns), the column of the cheapest top-to-bottom
    seam in each row (dynamic programming)."""
    h, w = err.shape
    cost = err.copy()
    for y in range(1, h):
        prev = cost[y - 1]
        left = np.concatenate([[np.inf], prev[:-1]])
        right = np.concatenate([prev[1:], [np.inf]])
        cost[y] += np.minimum(np.minimum(left, prev), right)
    seam = np.zeros(h, int)
    seam[-1] = int(np.argmin(cost[-1]))
    for y in range(h - 2, -1, -1):
        x = seam[y + 1]
        lo, hi = max(0, x - 1), min(w, x + 2)
        seam[y] = lo + int(np.argmin(cost[y, lo:hi]))
    return seam


def texture_like(a: np.ndarray, alpha: np.ndarray, shape: tuple[int, int], seed: int, patch: int = 72, overlap: int = 18) -> np.ndarray:
    """Fresh background with the photo's own grain: image quilting (patches of the garment-free
    background stitched along their cheapest seams), with its slow light taken out (zero mean), so
    it is even wherever it is laid and the light can be set separately."""
    clean = ~ndi.binary_dilation(alpha > 0.02, iterations=40)
    clean[:4] = clean[-4:] = False
    clean[:, :4] = clean[:, -4:] = False
    # The background with its slow light removed, so patches from anywhere match each other.
    known = clean.astype(np.float32)
    slow = cv2.GaussianBlur(a * known[..., None], (0, 0), 45) / np.maximum(cv2.GaussianBlur(known, (0, 0), 45), 1e-4)[..., None]
    detail = a - slow
    ok = cv2.erode(clean.astype(np.uint8), np.ones((patch, patch), np.uint8), anchor=(0, 0)) > 0
    ys, xs = np.where(ok[: a.shape[0] - patch, : a.shape[1] - patch])
    if len(ys) == 0:
        return np.zeros((*shape, 3), np.float32)
    rng = np.random.default_rng(seed)
    pick = rng.choice(len(ys), size=min(len(ys), 600), replace=False)
    cands = np.stack([detail[y : y + patch, x : x + patch] for y, x in zip(ys[pick], xs[pick])])
    step = patch - overlap
    H, W = shape
    ny, nx = (H - overlap) // step + 1, (W - overlap) // step + 1
    out = np.zeros((ny * step + overlap, nx * step + overlap, 3), np.float32)
    for i in range(ny):
        for j in range(nx):
            y, x = i * step, j * step
            region = out[y : y + patch, x : x + patch]
            err = np.zeros(len(cands), np.float32)
            if j > 0:
                err += ((cands[:, :, :overlap] - region[None, :, :overlap]) ** 2).sum((1, 2, 3))
            if i > 0:
                err += ((cands[:, :overlap, :] - region[None, :overlap, :]) ** 2).sum((1, 2, 3))
            if i == 0 and j == 0:
                best = int(rng.integers(len(cands)))
            else:
                k = np.argsort(err)[: max(3, len(cands) // 40)]
                best = int(rng.choice(k))
            tile = cands[best].copy()
            mask = np.ones((patch, patch), bool)
            if j > 0:
                e = ((tile[:, :overlap] - region[:, :overlap]) ** 2).sum(2)
                seam = _min_cut(e)
                for r in range(patch):
                    mask[r, : seam[r]] = False
            if i > 0:
                e = ((tile[:overlap, :] - region[:overlap, :]) ** 2).sum(2).T
                seam = _min_cut(e)
                for c in range(patch):
                    mask[: seam[c], c] = False
            region[mask] = tile[mask]
    return out[:H, :W] - out[:H, :W].mean((0, 1))


if __name__ == "__main__":
    import sys

    rgb, alpha, shadow, _, _ = cutout(Path(sys.argv[1]), sys.argv[3] if len(sys.argv) > 3 else "complete")
    to_rgba(rgb, alpha, shadow).save(sys.argv[2])
