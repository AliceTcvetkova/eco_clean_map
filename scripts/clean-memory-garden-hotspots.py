"""Remove baked UI hotspot rectangles from memory garden room art."""
from __future__ import annotations

import shutil
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ImportError:
    raise SystemExit("Pillow required: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "locus-chamber-memory-garden-room.png"
BAK = ROOT / "assets" / "locus-chamber-memory-garden-room.source.png"
OUT = SRC


def luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def is_overlay_pixel(r: int, g: int, b: int) -> bool:
    if max(r, g, b) - min(r, g, b) > 55:
        return False
    lum = luminance(r, g, b)
    if lum < 155:
        return False
    if r > 145 and g > 135 and b > 115 and lum < 245:
        return True
    return False


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")

    if not BAK.exists():
        shutil.copy2(SRC, BAK)

    img = Image.open(BAK).convert("RGB")
    px = img.load()
    w, h = img.size
    mask = [[False] * w for _ in range(h)]

    for y in range(h):
        for x in range(w):
            if is_overlay_pixel(*px[x, y]):
                mask[y][x] = True

    dilated = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if not mask[y][x]:
                continue
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w:
                        dilated[ny][nx] = True

    changed = 0
    for y in range(h):
        for x in range(w):
            if not dilated[y][x]:
                continue
            samples = []
            for dy in range(-4, 5):
                for dx in range(-4, 5):
                    if dx == 0 and dy == 0:
                        continue
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and not dilated[ny][nx]:
                        samples.append(px[nx, ny])
            if samples:
                r = sum(s[0] for s in samples) // len(samples)
                g = sum(s[1] for s in samples) // len(samples)
                b = sum(s[2] for s in samples) // len(samples)
                px[x, y] = (r, g, b)
                changed += 1

    img = img.filter(ImageFilter.GaussianBlur(radius=0.35))
    img.save(OUT, optimize=True)
    print(f"Cleaned {changed} overlay pixels in {OUT}")


if __name__ == "__main__":
    main()
