"""
Downloads each product's images from the Fourthwall shop, as listed (in the shop's order) in
fourthwall.json, into fourthwall/<slug>-<n>.webp. Photos are finished images with a background;
renders are already cut out. compose.py turns them into the site's product images.

    python3 assets/mockups/fourthwall.py
"""

import io
import json
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
OUT = HERE / "fourthwall"


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as res:
        return res.read()


def main() -> None:
    manifest = json.loads((HERE / "fourthwall.json").read_text())
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()
    for slug, spec in manifest["products"].items():
        for n, item in enumerate(spec["gallery"], start=1):
            path = OUT / f"{slug}-{n}.webp"
            if "photo" in item:
                # Photos arrive as large PNGs; a lossless-looking WebP at full size is a tenth of it.
                Image.open(io.BytesIO(fetch(manifest["photos"] + item["photo"]))).convert("RGB").save(
                    path, "WEBP", quality=92, method=6
                )
            else:
                path.write_bytes(fetch(manifest["renders"] + item["render"]))
            print(f"{slug}-{n}: {'photo' if 'photo' in item else 'render'}, {item['view']}")


if __name__ == "__main__":
    main()
