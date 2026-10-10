"""
Downloads the product renders from the Fourthwall shop listed in fourthwall.json into
fourthwall/<slug>-<view>.webp. They are already cut out (transparent background), so compose.py
places them on each piece's surface directly; these are the item-accurate images the site shows.
Pieces marked `hold` are skipped and keep their mockup cutouts.

    python3 assets/mockups/fourthwall.py
"""

import json
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "fourthwall"


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
            with urllib.request.urlopen(manifest["base"] + name, timeout=60) as res:
                data = res.read()
            (OUT / f"{slug}-{view}.webp").write_bytes(data)
            print(f"{slug}-{view}: {len(data) // 1024} KB")


if __name__ == "__main__":
    main()
