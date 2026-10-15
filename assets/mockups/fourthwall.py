"""
Downloads each product's images from the Fourthwall shop, as listed (in the shop's order) in
fourthwall.json, into fourthwall/<slug>-<n>.webp. Photos are finished images with a background;
renders are already cut out. compose.py turns them into the site's product images.

    python3 assets/mockups/fourthwall.py [piece ...]

When a product's images change in Fourthwall (a design edited, photos replaced), refresh its list
from the shop, then rebuild its site images (on Windows, `py` instead of `python3`). The
Storefront API returns public products only: for a hidden one, copy its image list from the shop
into fourthwall.json by hand and run `fourthwall.py <piece>`.

    python3 assets/mockups/fourthwall.py --sync stone-in-motion the-passage
    python3 assets/mockups/compose.py stone-in-motion the-passage

--sync reads FOURTHWALL_STOREFRONT_TOKEN from the environment or apps/web/.env.local, lists the
shop's public products through the Storefront API, writes each named piece's images into
fourthwall.json in the shop's order and downloads them. An image with transparent corners is a
render (a cut-out); anything else is a photo. Views (front, back, side) carry over from the old list
by kind and order; when a piece's list changed shape it says so, and its views need a look.
Without piece names, both commands cover every piece in fourthwall.json. Each piece's `cutouts`
(Fourthwall renders of its current print, by view) are downloaded too, into fourthwall/renders/;
compose.py cuts the home page's garment and the close-up from them. --sync leaves them as they are:
after a print changes, remove that view from `cutouts` until a render of the new print is listed.
"""

import io
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
OUT = HERE / "fourthwall"
MANIFEST = HERE / "fourthwall.json"
ENV_FILE = HERE.parent.parent / "apps" / "web" / ".env.local"
API = "https://storefront-api.fourthwall.com/v1"
KINDS = ("photo", "render")


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "awebound-mockups"})
    with urllib.request.urlopen(request, timeout=60) as res:
        return res.read()


def source(manifest: dict, item: dict) -> tuple[str, str]:
    """The entry's kind and full address (entries hold a name under the shop's base, or a URL)."""
    kind = "photo" if "photo" in item else "render"
    name = item[kind]
    return kind, name if name.startswith("http") else manifest[kind + "s"] + name


def is_cutout(data: bytes) -> bool:
    alpha = Image.open(io.BytesIO(data)).convert("RGBA").getchannel("A")
    w, h = alpha.size
    return max(alpha.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))) < 16


def save(path: Path, data: bytes, kind: str) -> None:
    img = Image.open(io.BytesIO(data))
    if kind == "photo":
        # Photos arrive as large PNGs; a lossless-looking WebP at full size is a tenth of it.
        img.convert("RGB").save(path, "WEBP", quality=92, method=6)
    elif img.format == "WEBP":
        path.write_bytes(data)
    else:
        img.convert("RGBA").save(path, "WEBP", lossless=True, method=6)


def write(slug: str, images: list[tuple[bytes, str, str]]) -> None:
    """Replaces a piece's downloads with these (bytes, kind, view), in order."""
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob(f"{slug}-*.webp"):
        old.unlink()
    for n, (data, kind, view) in enumerate(images, start=1):
        save(OUT / f"{slug}-{n}.webp", data, kind)
        print(f"{slug}-{n}: {kind}, {view}")


def download_cutouts(manifest: dict, slug: str) -> None:
    """The piece's renders of the current print, by view, into fourthwall/renders/<slug>-<view>.webp."""
    folder = OUT / "renders"
    folder.mkdir(parents=True, exist_ok=True)
    for old in folder.glob(f"{slug}-*.webp"):
        old.unlink()
    for view, name in manifest["products"][slug].get("cutouts", {}).items():
        url = name if name.startswith("http") else manifest["renders"] + name
        save(folder / f"{slug}-{view}.webp", fetch(url), "render")
        print(f"{slug}: {view} render")


def download(manifest: dict, slugs: list[str]) -> None:
    for slug in slugs:
        images = []
        for item in manifest["products"][slug]["gallery"]:
            kind, url = source(manifest, item)
            images.append((fetch(url), kind, item["view"]))
        write(slug, images)
        download_cutouts(manifest, slug)


def read_token() -> str:
    token = os.environ.get("FOURTHWALL_STOREFRONT_TOKEN", "").strip()
    if not token and ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            key, _, value = line.partition("=")
            if key.strip() == "FOURTHWALL_STOREFRONT_TOKEN":
                token = value.strip().strip("\"'")
    if not token:
        sys.exit(
            "Set FOURTHWALL_STOREFRONT_TOKEN in apps/web/.env.local "
            "(Fourthwall admin > Settings > For developers)."
        )
    return token


def shop_products(token: str) -> dict[str, dict]:
    """The shop's public products by slug."""
    products: dict[str, dict] = {}
    for page in range(40):
        query = urllib.parse.urlencode(
            {"storefront_token": token, "currency": "USD", "page": page, "size": 50}
        )
        body = json.loads(fetch(f"{API}/collections/all/products?{query}"))
        for item in body.get("results", []):
            if item.get("type") == "PRODUCT" and item.get("slug"):
                products[item["slug"]] = item
        if not body.get("paging", {}).get("hasNextPage"):
            break
    return products


def carry_views(old: list[dict], kinds: list[str]) -> tuple[list[str], bool]:
    """The k-th new photo (render) takes the view of the k-th old photo (render). Also says whether
    the list changed shape, when the views need checking by eye."""
    previous = {k: [item["view"] for item in old if k in item] for k in KINDS}
    used = {k: 0 for k in KINDS}
    views = []
    for kind in kinds:
        options = previous[kind]
        views.append(options[used[kind]] if used[kind] < len(options) else "front")
        used[kind] += 1
    return views, kinds != ["photo" if "photo" in item else "render" for item in old]


def sync(manifest: dict, slugs: list[str]) -> None:
    """Rewrites the named pieces' galleries from the shop and downloads them."""
    shop = shop_products(read_token())
    for slug in slugs:
        spec = manifest["products"][slug]
        product = shop.get(spec["fourthwallSlug"])
        urls = [img["url"] for img in (product or {}).get("images", []) if img.get("url")]
        if not urls:
            print(f"{slug}: {spec['fourthwallSlug']} isn't public in the shop; its images stay as they are")
            continue
        data = [fetch(url) for url in urls]
        kinds = ["render" if is_cutout(d) else "photo" for d in data]
        views, reshaped = carry_views(spec["gallery"], kinds)
        gallery = []
        for url, kind, view in zip(urls, kinds, views):
            base = manifest[kind + "s"]
            gallery.append({kind: url[len(base) :] if url.startswith(base) else url, "view": view})
        spec["gallery"] = gallery
        write(slug, list(zip(data, kinds, views)))
        if reshaped:
            print(f"  {slug}'s image list changed shape: check each `view` in fourthwall.json")
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main(args: list[str]) -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    syncing = "--sync" in args
    slugs = [a for a in args if a != "--sync"] or list(manifest["products"])
    unknown = [s for s in slugs if s not in manifest["products"]]
    if unknown:
        sys.exit(f"Not in fourthwall.json: {', '.join(unknown)}")
    if syncing:
        sync(manifest, slugs)
    else:
        download(manifest, slugs)


if __name__ == "__main__":
    main(sys.argv[1:])
