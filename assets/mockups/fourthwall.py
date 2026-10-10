"""
Downloads the product renders from the Fourthwall shop listed in fourthwall.json into
fourthwall/<slug>-<view>.webp. They are already cut out (transparent background), so compose.py
places them on each piece's surface directly; these are the item-accurate images the site shows.
Pieces marked `hold` are skipped and keep their mockup cutouts. A piece's `print` (its back print
file) is saved as fourthwall/<slug>-print.webp for compose.py's close-up.

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
    for slug, spec in manifest["products"].items():
        if spec.get("hold"):
            for view in spec["views"]:
                (OUT / f"{slug}-{view}.webp").unlink(missing_ok=True)
            print(f"{slug}: held ({spec['hold']})")
            continue
        for view, name in spec["views"].items():
            data = fetch(manifest["base"] + name)
            (OUT / f"{slug}-{view}.webp").write_bytes(data)
            print(f"{slug}-{view}: {len(data) // 1024} KB")
        if "print" in spec:
            # Print files are large PNGs; a 1400px-tall copy is plenty for an 800x1000 close-up.
            art = Image.open(io.BytesIO(fetch(manifest["base"] + spec["print"]))).convert("RGBA")
            art.thumbnail((1400, 1400), Image.LANCZOS)
            art.save(OUT / f"{slug}-print.webp", "WEBP", quality=92, method=6)
            print(f"{slug}-print: {art.size}")


if __name__ == "__main__":
    main()
