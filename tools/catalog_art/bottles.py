from __future__ import annotations

import numpy as np
from PIL import Image

from art import (
    H,
    S,
    W,
    Path,
    bezier,
    blank,
    blur,
    clip_tint,
    compose,
    darken,
    ellipse_pts,
    fill,
    finish,
    font,
    grain,
    hex_rgb,
    icon_layer,
    intersect,
    lighten,
    luma,
    mask_of,
    mix,
    place_print,
    ramp,
    rounded_rect_pts,
    stroke_mask,
    studio_bg,
    text_layer,
    tint,
    union,
)
from garments import print_colour


def profile_pts(cx, rows, smooth=True, k=15):
    """Left and right edges from (y, half-width) rows, smoothed so shoulders and bases are rounded."""
    ys = np.array([r[0] for r in rows], float)
    hw = np.array([r[1] for r in rows], float)
    yy = np.arange(ys[0], ys[-1] + 1, 1.0)
    w = np.interp(yy, ys, hw)
    if smooth:
        pad = np.pad(w, k, mode="edge")
        w = np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), mode="valid")
    left = [(cx - a, y) for a, y in zip(w, yy)]
    right = [(cx + a, y) for a, y in zip(w, yy)]
    return left + right[::-1]


def cyl(cx, hw, strength=1.0, gloss=0.0):
    """Light across a round object: dark edges, a bright band left of centre, a soft rim on the right."""
    left, right = cx - hw, cx + hw
    stops = [(left, 0.62), (left + hw * 0.22, 0.9), (left + hw * 0.55, 1.16 + gloss), (left + hw * 0.8, 1.02), (left + hw * 1.35, 0.9), (right - hw * 0.1, 0.96), (right, 0.66)]
    base = ramp("x", stops)
    return 1 + (base - 1) * strength


def shine(layer, mask, x, y0, y1, width=14, alpha=0.5, soften=5):
    clip_tint(layer, mask, stroke_mask([(x, y0), (x, y1)], width), (255, 255, 255), alpha, soften)


def cap_part(layer, pts, colour, cx, hw, strength=1.0, gloss=0.0, y_shade=None):
    m = mask_of(pts)
    sh = cyl(cx, hw, strength, gloss)
    if y_shade:
        sh = sh * ramp("y", y_shade)
    fill(layer, m, colour, sh)
    return m


def draw_bottle(kind, colour, lines, reference, icon, seed=6):
    base = hex_rgb(colour)
    layer = blank()
    cx = 500
    ink = print_colour(base)
    dark = darken(base, 0.55)
    lid_col = mix(darken(base, 0.35), (30, 30, 30), 0.5) if luma(base) > 0.35 else lighten(base, 0.12)
    lid_col = (38, 40, 42) if luma(base) > 0.5 else mix(base, (255, 255, 255), 0.1)

    if kind == "slim":
        rows = [(372, 96), (412, 120), (700, 122), (960, 118), (1000, 104), (1010, 70)]
        body_pts = profile_pts(cx, rows)
        body = cap_part(layer, body_pts, base, cx, 122, 1.0, 0.0, [(372, 1.06), (1010, 0.88)])
        band = mask_of([p for p in profile_pts(cx, [(948, 118), (1000, 106), (1010, 70)])])
        fill(layer, intersect(band, body), (46, 48, 52), cyl(cx, 120, 0.9))
        lid = cap_part(layer, rounded_rect_pts(cx - 104, 262, cx + 104, 380, 22), lid_col, cx, 104, 1.0, 0.1)
        notch = mask_of(rounded_rect_pts(cx - 34, 292, cx + 34, 320, 10))
        fill(layer, notch, darken(lid_col, 0.35))
        loop = stroke_mask(ellipse_pts(cx, 226, 62, 50, 0, 360, 90), 15, closed=True)
        fill(layer, loop, lid_col, ramp("y", [(176, 1.12), (276, 0.82)]))
        main = union(body, lid, loop)
        shine(layer, body, cx - 62, 430, 930, 16, 0.4)
        art_y = 700
    elif kind == "tumbler":
        rows = [(372, 170), (400, 176), (1000, 118), (1012, 96)]
        body_pts = profile_pts(cx, rows, smooth=False)
        body = cap_part(layer, body_pts, base, cx, 176, 1.0, 0.04, [(372, 1.06), (1012, 0.86)])
        handle = stroke_mask(bezier((cx + 168, 470), (cx + 318, 450), (cx + 318, 700), (cx + 142, 742), 60), 44)
        fill(layer, handle, darken(base, 0.06), ramp("x", [(cx + 140, 0.82), (cx + 250, 1.12), (cx + 330, 0.8)]))
        lid = cap_part(layer, profile_pts(cx, [(318, 120), (372, 186)]), lid_col, cx, 186, 1.0, 0.1)
        rim = cap_part(layer, rounded_rect_pts(cx - 190, 358, cx + 190, 392, 14), lighten(lid_col, 0.05), cx, 190, 1.0, 0.1)
        straw = stroke_mask([(cx + 40, 340), (cx + 96, 120), (cx + 150, 96)], 22)
        fill(layer, straw, (236, 238, 236), ramp("x", [(cx + 20, 0.88), (cx + 90, 1.18), (cx + 160, 0.86)]))
        clip_tint(layer, straw, stroke_mask([(cx + 46, 340), (cx + 100, 124)], 5), (255, 255, 255), 0.7, 1)
        main = union(body, handle, lid, rim, straw)
        shine(layer, body, cx - 100, 430, 960, 20, 0.36, 6)
        art_y = 700
    elif kind == "tank":
        rows = [(440, 60), (468, 68), (498, 104), (540, 146), (600, 156), (940, 156), (984, 142), (1004, 112), (1014, 74)]
        body_pts = profile_pts(cx, rows, k=28)
        body = cap_part(layer, body_pts, base, cx, 156, 1.1, 0.25, [(440, 1.08), (1012, 0.82)])
        steel = (206, 210, 216)
        lid = cap_part(layer, rounded_rect_pts(cx - 78, 350, cx + 78, 456, 18), steel, cx, 78, 1.25, 0.2)
        ring = stroke_mask(ellipse_pts(cx, 304, 50, 40, 0, 360, 90), 13, closed=True)
        fill(layer, ring, steel, ramp("y", [(264, 1.2), (344, 0.8)]))
        for k in range(8):
            clip_tint(layer, lid, stroke_mask([(cx - 76, 372 + k * 11), (cx + 76, 372 + k * 11)], 1.8), (60, 60, 64), 0.18, 0.4)
        main = union(body, lid, ring)
        shine(layer, body, cx - 90, 540, 900, 26, 0.55, 7)
        shine(layer, body, cx + 112, 570, 880, 8, 0.28, 3)
        art_y = 740
    else:  # wellspring: tall, classic
        rows = [(268, 68), (330, 74), (420, 126), (480, 132), (960, 130), (1004, 112), (1014, 76)]
        body_pts = profile_pts(cx, rows)
        body = cap_part(layer, body_pts, base, cx, 132, 1.0, 0.04, [(268, 1.06), (1014, 0.86)])
        lid = cap_part(layer, rounded_rect_pts(cx - 84, 168, cx + 84, 286, 20), lid_col, cx, 84, 1.0, 0.1)
        loop = stroke_mask(bezier((cx - 54, 176), (cx - 60, 96), (cx + 60, 96), (cx + 54, 176), 50), 15)
        fill(layer, loop, lid_col, ramp("y", [(96, 1.15), (180, 0.82)]))
        main = union(body, lid, loop)
        shine(layer, body, cx - 68, 470, 940, 16, 0.4)
        art_y = 700

    grain(layer, main, 3.0, seed)

    # the print: a short verse and a small icon
    n = len(lines)
    size = {"slim": 40, "tumbler": 42, "tank": 40, "wellspring": 36}[kind]
    pl = icon_layer(icon, cx, art_y - 70 - n * 12, 60, ink, 4.0)
    pl.alpha_composite(text_layer(lines, font("bodoni-i", size, 500), ink, (cx, art_y + 16 + (n - 1) * 8), 1.1))
    pl.alpha_composite(text_layer([reference], font("manrope", 14, 700), ink, (cx, art_y + 34 + n * (size * 0.85)), 1.0, tracking=4.0, alpha=0.9))
    place_print(layer, pl, body, ramp("x", [(cx - 160, 0.9), (cx - 60, 1.06), (cx + 160, 0.86)]))
    return layer, main, base


def render_bottle(path, kind, colour, lines, reference, icon, seed=6, crop=None):
    layer, mask, base = draw_bottle(kind, colour, lines, reference, icon, seed)
    floor_y = {"slim": 1022, "tumbler": 1024, "tank": 1024, "wellspring": 1026}[kind]
    scene = compose(studio_bg(base), layer, mask, floor=(500, floor_y, 230, 18), dark_bg=luma(base) > 0.62, lift=14)
    if crop:
        scene = scene.crop(tuple(int(v * S) for v in crop)).resize((W * S, H * S), Image.LANCZOS)
    finish(scene, path)
