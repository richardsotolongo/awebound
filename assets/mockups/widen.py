"""
Zooms a flat-lay photo out so its garment sits at the same scale as the rest of the set.

Some Fourthwall photos frame a tee tighter than the others, with the sleeve tips running off the
left and right edges. `widen` sets the garment, cut from the photo with its own shadow and with
its sleeve tips completed (photo_cutout.py), on a larger frame so the garment's height and top
match the given fractions of a 4:5 frame. The whole background is made fresh, so it is even from
edge to edge: the photo's own background light, carried outward, and a texture with the photo's
own grain, stitched from its garment-free patches.

The garment and its print are the photo's own pixels, never retouched or recolored.

    python3 assets/mockups/widen.py <photo> <height> <top> <out.png>   # to look at one
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from photo_cutout import cutout, garment_matte, texture_like


def widen(path: Path, height: float, top: float, size: tuple[int, int]) -> Image.Image:
    """The photo zoomed out so the garment is `height` of the frame tall with its top at `top`
    (fractions of a frame of `size`, 4:5), at `size`."""
    photo = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    rgb, alpha, shadow, light, margin = cutout(path, "complete")
    h, w = alpha.shape
    ys = np.where((alpha > 0.5).any(1))[0]
    g_top, g_bottom = int(ys.min()), int(ys.max())
    ch = round((g_bottom - g_top) / height)
    cw = round(ch * size[0] / size[1])
    ox, oy = (cw - w) // 2, round(top * ch - g_top)
    if ox < 0 or oy < 0 or oy + h > ch:
        raise ValueError(f"{path.name}: the photo is already framed this loosely or looser")

    # The background light: the photo's own, carried out to the frame's edges.
    canvas_light = cv2.copyMakeBorder(
        light, oy, ch - oy - h, ox, cw - ox - w, cv2.BORDER_REPLICATE
    )
    canvas_light = cv2.GaussianBlur(canvas_light, (0, 0), 40)
    canvas_light[oy : oy + h, ox : ox + w] = light
    canvas_light = cv2.GaussianBlur(canvas_light, (0, 0), 12)
    # Its grain, fresh everywhere.
    texture = texture_like(photo, garment_matte(photo), (ch, cw), seed=sum(map(ord, path.stem)))
    canvas = canvas_light + texture

    place = lambda arr: np.pad(arr, ((oy, ch - oy - h), (ox, cw - ox - w)) + ((0, 0),) * (arr.ndim - 2))
    a, s, g = place(alpha), place(shadow), place(rgb)
    canvas *= 1 - s[..., None]
    canvas = canvas * (1 - a[..., None]) + g * a[..., None]
    img = Image.fromarray(np.clip(canvas, 0, 255).round().astype(np.uint8), "RGB")
    return img.resize(size, Image.LANCZOS)


if __name__ == "__main__":
    import sys

    src, height, top, out = sys.argv[1:5]
    widen(Path(src), float(height), float(top), (1000, 1250)).save(out)
