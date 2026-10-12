"""Render an Awebound HTML template (or any local HTML page) to PNG with Playwright.

Usage:
  python scripts/render.py assets/templates/social-post.html out.png --width 1080 --height 1350 \
      --data '{"name": "Stone in Motion", "line": "The stone rolls away in a sweep of blue.", "quote": "", "scripture": "Matthew 28:6", "image": "/abs/path/stone-in-motion-1.webp"}'

--data overrides fields of the template's POST object. Relative image paths resolve from the template's folder.
Needs: pip install playwright && python -m playwright install chromium. Fonts load from Google Fonts, so run online
(offline, the page falls back to Georgia/Arial and the PNG will not match the brand type).
"""
import argparse, asyncio, json, pathlib
from playwright.async_api import async_playwright


async def main(a):
    src = pathlib.Path(a.html).resolve()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": a.width, "height": a.height}, device_scale_factor=a.scale)
        if a.data:
            await pg.add_init_script(f"window.POST_OVERRIDE = {json.dumps(json.loads(a.data))};")
        try:
            await pg.goto(src.as_uri(), wait_until="networkidle", timeout=15000)
        except Exception:
            await pg.goto(src.as_uri(), wait_until="load")  # offline: fonts can't load, keep going
        await pg.evaluate("document.fonts.ready")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=a.out, clip={"x": 0, "y": 0, "width": a.width, "height": a.height})
        await b.close()
    print("wrote", a.out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("html")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1350)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--data", default="")
    asyncio.run(main(ap.parse_args()))
