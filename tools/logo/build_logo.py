"""Split the KALO Gifts logo into animatable layers.

Input : assets/logo/kalo-gifts-logo-original.jpg (1280 x 1280)
Output: tools/logo/out/
          lid.webp, base.webp   painted box artwork, transparent background
          layers.json           vector paths per group, in 1280-unit coordinates
          preview.svg           everything reassembled, for a visual check

Flat-coloured parts (lettering, sprigs, stars, swirls) are traced to vector paths,
one path per connected shape, so each can be animated on its own. The painted box
and lid keep their texture as image layers. Run: python tools/logo/build_logo.py
"""
import json
import sys
from pathlib import Path

import numpy as np
import potrace
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets" / "logo" / "kalo-gifts-logo-original.jpg"
OUT = Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)

SIZE = 1280
CENTRE = (640, 640)
UP = 2  # tracing happens on a 2x upscaled mask for smoother curves

# --- geometry measured from the artwork (image pixels) ---------------------
RING_OUTER = {"r": 605, "w": 14}
RING_INNER = {"r": 581, "w": 5}
CONTENT_R = 570  # everything inside this radius is logo content

LID_POLY = [(255, 235), (705, 235), (705, 330), (650, 385), (627, 400), (553, 506),
            (527, 542), (500, 556), (449, 579), (444, 592), (335, 626), (255, 626)]
BASE_POLY = [(440, 572), (449, 579), (500, 556), (527, 542), (553, 506), (627, 400),
             (634, 406), (888, 458), (888, 648), (690, 724), (440, 658)]
OPENING = [(553, 505), (634, 414), (878, 465), (686, 540)]  # box mouth: always opaque
# dark patch under the lid so small lid movements never show a hole
PATCH = [(449, 579), (500, 556), (527, 542), (553, 506), (627, 400), (600, 400),
         (520, 500), (449, 545)]
SWIRL_ZONE = [(745, 240), (1005, 240), (1005, 410), (905, 475), (700, 475), (700, 405), (770, 330)]

BG = np.array([253.0, 245.0, 230.0])


def poly_mask(poly, grow=0):
    im = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(im).polygon(poly, fill=255)
    m = np.asarray(im) > 0
    if grow:
        m = ndi.binary_dilation(m, iterations=grow)
    return m


def trace(mask):
    """Trace a boolean mask (already upscaled) and return an SVG path in 1280 units."""
    padded = ~np.pad(mask, 2)  # potracer treats False as ink
    curves = potrace.Bitmap(padded).trace(turdsize=2, alphamax=1.0, opttolerance=0.25)
    f = lambda p: f"{(p.x - 2) / UP:.1f} {(p.y - 2) / UP:.1f}"
    d = []
    for c in curves:
        d.append("M" + f(c.start_point))
        for s in c.segments:
            if s.is_corner:
                d.append("L" + f(s.c) + "L" + f(s.end_point))
            else:
                d.append("C" + f(s.c1) + " " + f(s.c2) + " " + f(s.end_point))
        d.append("Z")
    return "".join(d)


def main():
    rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(float)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    radius = np.hypot(xx - CENTRE[0], yy - CENTRE[1])
    inside = radius < CONTENT_R

    lid_m, base_m = poly_mask(LID_POLY), poly_mask(BASE_POLY)
    base_m &= ~lid_m
    box_zone = poly_mask(LID_POLY, 3) | poly_mask(BASE_POLY, 3)

    # ---- ink coverage and ink colour -------------------------------------
    dist = np.sqrt(((rgb - BG) ** 2).sum(2))
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    ink = np.zeros((SIZE, SIZE), np.uint8)  # 1 red, 2 gold, 3 sage
    core = dist > 70
    ratio = G / np.maximum(R, 1)
    ink[core & (ratio < 0.58)] = 1
    ink[core & (ratio >= 0.58) & (R - B > 55) & (R > 165)] = 2
    ink[core & (ink == 0)] = 3
    # give soft edge pixels the colour of the nearest solid pixel
    _, (iy, ix) = ndi.distance_transform_edt(ink == 0, return_indices=True)
    ink_full = ink[iy, ix]

    # coverage: how far each pixel is from the cream background, relative to its ink
    ref = np.array([0, 150.0, 75.0, 150.0])[ink_full]  # typical distance of solid ink from cream
    cover = np.clip(dist / ref, 0, 1)
    cover[~inside | box_zone] = 0

    big = lambda a, mode: np.asarray(
        Image.fromarray(a).resize((SIZE * UP, SIZE * UP), mode))
    cover_up = big((cover * 255).astype(np.uint8), Image.BICUBIC) > 118
    ink_up = big(ink_full, Image.NEAREST)

    # Edge pixels of one ink are often mis-read as another ink. Any small speck that
    # touches a different ink is folded into that neighbour.
    for code in (1, 2, 3):
        labels, n = ndi.label(cover_up & (ink_up == code), structure=np.ones((3, 3)))
        if not n:
            continue
        sizes = ndi.sum(np.ones_like(labels), labels, range(1, n + 1)) / UP ** 2
        small = np.isin(labels, [j + 1 for j, a in enumerate(sizes) if a < 90])
        other = cover_up & (ink_up != code) & ~small
        _, (oy, ox) = ndi.distance_transform_edt(~other, return_indices=True)
        near = small & (np.hypot(oy - np.indices(small.shape)[0], ox - np.indices(small.shape)[1]) <= 3)
        slabels, sn = ndi.label(small, structure=np.ones((3, 3)))
        touching = np.unique(slabels[near])
        fold = np.isin(slabels, touching[touching > 0])
        ink_up = np.where(fold, ink_up[oy, ox], ink_up)

    shadow_zone = big(poly_mask([(280, 606), (930, 606), (930, 740), (280, 740)]).astype(np.uint8), Image.NEAREST) > 0
    cover_up &= ~(shadow_zone & (ink_up != 1))  # painted floor shadow is replaced by a soft one

    groups = {k: [] for k in ["word", "gifts", "tagline", "divider", "flourish_l", "flourish_r",
                              "sprig_l", "sprig_r", "stars", "swirls", "dots"]}
    swirl_zone = poly_mask(SWIRL_ZONE)
    colours = {}
    for code, name in [(1, "red"), (2, "gold"), (3, "sage")]:
        mask = cover_up & (ink_up == code)
        solid = (ink == code)
        colours[name] = "#%02X%02X%02X" % tuple(int(v) for v in np.median(rgb[solid & inside & ~box_zone], axis=0))
        labels, n = ndi.label(mask, structure=np.ones((3, 3)))
        for i, sl in enumerate(ndi.find_objects(labels), start=1):
            comp = labels[sl] == i
            area = comp.sum() / UP ** 2
            if area < 9:
                continue
            y0, x0 = sl[0].start / UP, sl[1].start / UP
            y1, x1 = sl[0].stop / UP, sl[1].stop / UP
            cx, cy, w, h = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
            # trace on the crop, then shift back into place
            crop_d = trace(comp)
            d = shift(crop_d, x0, y0)
            item = {"d": d, "fill": name, "cx": round(cx, 1), "cy": round(cy, 1),
                    "w": round(w, 1), "h": round(h, 1), "area": round(area)}
            group = classify(name, cx, cy, w, h, area, swirl_zone)
            if group is None:
                continue
            if group == "swirls":
                item["fill"] = "gold"
            if group in ("stars", "dots") and name == "sage" and cy < 520:
                item["fill"] = "red"  # the dark accent stars read as sage after colour sorting"
            groups[group].append(item)

    for g in groups.values():
        g.sort(key=lambda it: (it["cx"], it["cy"]))

    # ---- painted layers ----------------------------------------------------
    bg_like = dist < 30
    seeds = np.zeros_like(bg_like)
    seeds[160, 640] = True
    background = ndi.binary_propagation(seeds, mask=bg_like)
    opaque = ~background | poly_mask(OPENING)
    images = {}
    for name, m in [("lid", lid_m), ("base", base_m)]:
        a = (opaque & m)
        a = ndi.binary_opening(a, iterations=1)
        lab, n = ndi.label(a)
        if n > 1:  # keep the main body, drop specks
            sizes = ndi.sum(a, lab, range(1, n + 1))
            a = np.isin(lab, [j + 1 for j, s in enumerate(sizes) if s > 400])
        ys, xs = np.where(a)
        x0, x1, y0, y1 = xs.min() - 2, xs.max() + 3, ys.min() - 2, ys.max() + 3
        alpha = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        rgba = Image.fromarray(rgb.astype(np.uint8)).convert("RGBA")
        rgba.putalpha(alpha)
        rgba.crop((x0, y0, x1, y1)).save(OUT / f"{name}.webp", quality=90, method=6)
        images[name] = {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}

    data = {"size": SIZE, "colours": colours, "cream": "#FDF5E6",
            "rings": {"outer": RING_OUTER, "inner": RING_INNER},
            "patch": PATCH, "images": images, "groups": groups}
    (OUT / "layers.json").write_text(json.dumps(data, separators=(",", ":")))
    (OUT / "preview.svg").write_text(preview(data))
    print({k: len(v) for k, v in groups.items()}, colours, images)
    print({k: round(sum(len(i["d"]) for i in v) / 1024) for k, v in groups.items()})
    print("json kB", round((OUT / "layers.json").stat().st_size / 1024),
          "lid kB", round((OUT / "lid.webp").stat().st_size / 1024),
          "base kB", round((OUT / "base.webp").stat().st_size / 1024))


def shift(d, dx, dy):
    """Offset every coordinate pair in a path string."""
    out, num, nums = [], "", []

    def flush():
        nonlocal num
        if num:
            nums.append(float(num))
            num = ""

    def emit():
        for i in range(0, len(nums) - 1, 2):
            out.append(f"{nums[i] + dx:.1f} {nums[i + 1] + dy:.1f} ")
        nums.clear()

    for ch in d:
        if ch.isalpha():
            flush(); emit(); out.append(ch)
        elif ch == " ":
            flush()
        else:
            num += ch
    flush(); emit()
    return "".join(out).replace(" Z", "Z").replace(" L", "L").replace(" C", "C").replace(" M", "M").strip()


def classify(ink, cx, cy, w, h, area, swirl_zone):
    side = cx < 310 or cx > 990
    if cy < 520 and not (side and cy > 290):
        in_swirl = swirl_zone[int(min(cy, 1279)), int(min(cx, 1279))]
        starlike = 0.7 < w / max(h, 1) < 1.43 and area / max(w * h, 1) > 0.2 and area > 120
        if in_swirl and not starlike: return "swirls"
        return "stars" if area > 25 else "dots"
    if ink != "red" and 650 < cy < 950 and 170 < cx < 1130 and area < 3000:
        return None  # colour fringe along the lettering
    if ink == "red":
        if 640 < cy < 1010 and area > 600: return "word"
        if cy > 1050 and 600 < cx < 690: return "divider" if cy < 1130 else "tagline"
        if cx < 310 and cy < 800: return "sprig_l"
        if cx > 990 and cy < 800: return "sprig_r"
        if cy < 520: return "stars" if area > 25 else "dots"
        return "word" if 640 < cy < 1010 and area > 60 else "dots"
    if ink == "sage":
        if cx < 310 and cy < 800: return "sprig_l"
        if cx > 990 and cy < 800: return "sprig_r"
        if 955 < cy < 1070 and 500 < cx < 850 and area > 40: return "gifts"
        if cy > 1040: return "tagline"
        return "dots"
    # gold
    if cy > 960:
        if 1070 < cy < 1115 and 500 < cx < 800: return "divider"
        if 350 < cx < 500 and cy < 1060: return "flourish_l"
        if 830 < cx < 970 and cy < 1060: return "flourish_r"
        return "dots"
    if cy < 520:
        in_swirl = swirl_zone[int(min(cy, 1279)), int(min(cx, 1279))]
        squarish = 0.7 < w / max(h, 1) < 1.43
        solid = area / max(w * h, 1) > 0.2
        if in_swirl and not (squarish and solid and area > 120): return "swirls"
        return "stars" if area > 60 else "dots"
    return "dots"


def preview(data):
    c = data["colours"]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280">',
         f'<circle cx="640" cy="640" r="640" fill="{data["cream"]}"/>',
         f'<circle cx="640" cy="640" r="{data["rings"]["outer"]["r"]}" fill="none" stroke="{c["red"]}" stroke-width="{data["rings"]["outer"]["w"]}"/>',
         f'<circle cx="640" cy="640" r="{data["rings"]["inner"]["r"]}" fill="none" stroke="{c["gold"]}" stroke-width="{data["rings"]["inner"]["w"]}"/>']
    tint = {"swirls": "#00A0FF", "dots": "#FF00FF"} if "--debug" in sys.argv else {}
    for name, items in data["groups"].items():
        s.append(f'<g id="{name}">')
        for it in items:
            s.append(f'<path d="{it["d"]}" fill="{tint.get(name, c[it["fill"]])}" fill-rule="evenodd"/>')
        s.append("</g>")
    pts = " ".join(f"{x},{y}" for x, y in data["patch"])
    s.append(f'<polygon points="{pts}" fill="#6E1D15"/>')
    for name in ["base", "lid"]:
        im = data["images"][name]
        s.append(f'<image href="{name}.webp" x="{im["x"]}" y="{im["y"]}" width="{im["w"]}" height="{im["h"]}"/>')
    s.append("</svg>")
    return "\n".join(s)


if __name__ == "__main__":
    main()
