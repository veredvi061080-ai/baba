# Builds 360px-wide WebP thumbnails of the card images for the gallery, strips and pager.
#   python3 tools/thumbs.py
from pathlib import Path
from PIL import Image
src, out = Path("assets"), Path("assets/thumbs")
out.mkdir(exist_ok=True)
for f in sorted(src.glob("*.jpg")):
    t = out / (f.stem + ".webp")
    if t.exists() and t.stat().st_mtime > f.stat().st_mtime:
        continue
    im = Image.open(f).convert("RGB")
    im.thumbnail((360, 540), Image.LANCZOS)
    im.save(t, "WEBP", quality=74, method=6)
