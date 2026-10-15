"""
Zooms a flat-lay photo out so its garment sits at the same scale as the rest of the set.

Some Fourthwall photos frame a tee tighter than the others, with the sleeve tips running off the
left and right edges. `widen` grows the canvas around the photo until the garment's height and
top match the given fractions of a 4:5 frame, then:

- extends the background from the photo's own: its light and color carried outward (normalized
  convolution of the garment-free background) and its fine texture tiled from the garment-free
  bands above and below the garment;
- completes each cut-off sleeve: in a flat lay the sleeve ends in a point where its shoulder edge
  meets its hem, so the missing tip is the wedge between those two edges, continued from the
  photo. It is filled with the sleeve's own fabric mirrored across the cut and sheared so the hem
  and shoulder follow the new edges, and casts a soft shadow like the rest of the garment.

The garment and its print are the photo's own pixels, never retouched or recolored.

    python3 assets/mockups/widen.py <photo> <height> <top> <out.png>   # to look at one
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def garment_mask(a: np.ndarray) -> np.ndarray:
    """The garment: the largest region far from the background color in the top corners."""
    bg = np.median(np.concatenate([a[:30, :30].reshape(-1, 3), a[:30, -30:].reshape(-1, 3)]), 0)
    m = (np.linalg.norm(a - bg, axis=2) > 60) & (a.mean(2) > 110)
    m = ndi.binary_opening(m, iterations=2)
    lab, n = ndi.label(m)
    m = lab == (np.argmax(ndi.sum(m, lab, range(1, n + 1))) + 1)
    return ndi.binary_fill_holes(m)


def _run(m: np.ndarray, x: int) -> tuple[int, int]:
    """Top and bottom of the garment's first run in column x (the sleeve, near the edge)."""
    ys = np.where(m[:, x])[0]
    run = np.split(ys, np.where(np.diff(ys) > 1)[0] + 1)[0]
    return int(run[0]), int(run[-1])


def _extend_light(bg: np.ndarray, known: np.ndarray, sigma: float) -> np.ndarray:
    """The background's light and color carried into the unknown parts (computed small)."""
    k = 8
    small = cv2.resize(bg * known[..., None], None, fx=1 / k, fy=1 / k, interpolation=cv2.INTER_AREA)
    w = cv2.resize(known.astype(np.float32), None, fx=1 / k, fy=1 / k, interpolation=cv2.INTER_AREA)
    out = None
    weight = None
    for s in (sigma, sigma * 2.5, sigma * 6):
        num = cv2.GaussianBlur(small, (0, 0), s / k)
        den = cv2.GaussianBlur(w, (0, 0), s / k)
        est = num / np.maximum(den, 1e-5)[..., None]
        if out is None:
            out, weight = est, den
        else:
            weak = (weight < 0.04)[..., None]
            out = np.where(weak, est, out)
            weight = np.maximum(weight, den)
    return cv2.resize(out, (bg.shape[1], bg.shape[0]), interpolation=cv2.INTER_CUBIC)


def _texture(a: np.ndarray, rows: list[slice], shape: tuple[int, int]) -> np.ndarray:
    """Fine background texture (detail above a small blur) from garment-free bands, mirror-tiled."""
    detail = a - cv2.GaussianBlur(a, (0, 0), 6)
    bands = [detail[r] for r in rows if detail[r].shape[0] > 12]
    tile = np.concatenate([b if i % 2 == 0 else b[::-1] for i, b in enumerate(bands)], 0)
    h, w = shape
    col = np.concatenate([tile if i % 2 == 0 else tile[::-1] for i in range(h // tile.shape[0] + 2)], 0)
    sheet = np.concatenate([col if j % 2 == 0 else col[:, ::-1] for j in range(w // tile.shape[1] + 2)], 1)
    return sheet[:h, :w]


def _sleeve_tip(a: np.ndarray, m: np.ndarray, side: str):
    """Pixels and coverage of one missing sleeve tip, in coordinates outside the photo
    (u = 1, 2, ... columns past the cut). None when the garment doesn't reach that edge."""
    h, w = m.shape
    edge = 0 if side == "left" else w - 1
    out = -1 if side == "left" else 1
    if not m[:, edge].any():
        return None
    cols = [edge - out * d for d in range(4, 64, 4)]
    runs = np.array([_run(m, x) for x in cols], np.float64)
    top = np.polyfit(cols, runs[:, 0], 1)
    bottom = np.polyfit(cols, runs[:, 1], 1)
    at = lambda line, u: float(np.polyval(line, edge + out * u))
    pixels: list[tuple[int, int, np.ndarray, float]] = []
    u = 1
    while u < 400:
        t0, b0 = at(top, u), at(bottom, u)
        if b0 <= t0:
            break
        # Source: the sleeve column mirrored across the cut (at most 60 px in), sheared so its
        # shoulder and hem land on the new edges.
        sx = edge - out * min(u, 60)
        st, sb = _run(m, sx)
        for y in range(int(np.floor(t0)), int(np.ceil(b0)) + 1):
            cover = float(np.clip(min(y + 0.5 - t0, b0 - (y - 0.5)), 0, 1))
            if cover <= 0:
                continue
            t = float(np.clip((y - t0) / max(b0 - t0, 1), 0, 1))
            sy = st + t * (sb - st)
            y0 = int(np.floor(sy))
            y1 = min(y0 + 1, h - 1)
            f = sy - y0
            pixels.append((u, y, a[y0, sx] * (1 - f) + a[y1, sx] * f, cover))
        u += 1
    return pixels


def widen(path: Path, height: float, top: float, size: tuple[int, int]) -> Image.Image:
    """The photo zoomed out so the garment is `height` of the frame tall with its top at `top`
    (fractions of a frame of `size`, 4:5), at `size`."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    h, w = a.shape[:2]
    m = garment_mask(a)
    ys = np.where(m)[0]
    g_top, g_bottom = int(ys.min()), int(ys.max())
    ch = round((g_bottom - g_top) / height)
    cw = round(ch * size[0] / size[1])
    ox, oy = (cw - w) // 2, round(top * ch - g_top)
    if ox <= 0 or oy < 0 or oy + h > ch:
        raise ValueError(f"{path.name}: the photo is already framed this loosely or looser")

    # Background: the photo's own, with the garment and its shadow left out.
    known = np.zeros((ch, cw), bool)
    known[oy : oy + h, ox : ox + w] = ~ndi.binary_dilation(m, iterations=45)
    placed = np.zeros((ch, cw, 3), np.float32)
    placed[oy : oy + h, ox : ox + w] = a
    light = _extend_light(placed, known, 70)
    texture = _texture(a, [slice(0, max(40, g_top - 50)), slice(min(h - 40, g_bottom + 60), h)], (ch, cw))
    canvas = light + texture

    # The photo itself, feathered into the extension at its edges (never across the garment).
    yy, xx = np.mgrid[0:h, 0:w]
    ramp = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
    keep = np.maximum(np.clip(ramp / 24, 0, 1), ndi.binary_dilation(m, iterations=3))
    alpha = np.zeros((ch, cw), np.float32)
    alpha[oy : oy + h, ox : ox + w] = keep
    canvas = canvas * (1 - alpha[..., None]) + placed * alpha[..., None]

    # The sleeve tips, with a soft shadow down and to the right like the photo's own.
    tip = np.zeros((ch, cw, 3), np.float32)
    cover = np.zeros((ch, cw), np.float32)
    for side in ("left", "right"):
        for u, y, px, c in _sleeve_tip(a, m, side) or []:
            x = ox + (-u if side == "left" else w - 1 + u)
            if 0 <= x < cw and 0 <= oy + y < ch:
                tip[oy + y, x] = px
                cover[oy + y, x] = c
    shade = cv2.GaussianBlur(np.roll(np.roll(cover, 14, 0), 6, 1), (0, 0), 16) * 0.32
    canvas *= 1 - shade[..., None]
    canvas = canvas * (1 - cover[..., None]) + tip * cover[..., None]

    img = Image.fromarray(np.clip(canvas, 0, 255).round().astype(np.uint8), "RGB")
    return img.resize(size, Image.LANCZOS)


if __name__ == "__main__":
    import sys

    src, height, top, out = sys.argv[1:5]
    widen(Path(src), float(height), float(top), (1000, 1250)).save(out)
