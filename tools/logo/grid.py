"""Debug helper: draw a labelled coordinate grid over a crop of the logo."""
import sys
from PIL import Image, ImageDraw
src, out, x0, y0, x1, y1, scale = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7]), float(sys.argv[7])
im = Image.open(src).convert("RGB").crop((x0, y0, x1, y1))
im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
d = ImageDraw.Draw(im)
step = 50
for x in range((x0 // step + 1) * step, x1, step):
    X = (x - x0) * scale
    d.line([(X, 0), (X, im.height)], fill=(0, 120, 255) if x % 100 == 0 else (150, 200, 255), width=1)
    if x % 100 == 0: d.text((X + 2, 2), str(x), fill=(0, 0, 200))
for y in range((y0 // step + 1) * step, y1, step):
    Y = (y - y0) * scale
    d.line([(0, Y), (im.width, Y)], fill=(0, 120, 255) if y % 100 == 0 else (150, 200, 255), width=1)
    if y % 100 == 0: d.text((2, Y + 2), str(y), fill=(0, 0, 200))
im.save(out)
