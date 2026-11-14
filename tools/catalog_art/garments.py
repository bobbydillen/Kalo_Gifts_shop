from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

from art import (
    H,
    S,
    W,
    Path,
    blank,
    blur,
    bezier,
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
    radial,
    ramp,
    rounded_rect_pts,
    stroke_mask,
    studio_bg,
    subtract,
    text_layer,
    tint,
    union,
)


def cloth_shade(centre=500, spread=250, top=210, bottom=1030, strength=1.0):
    """Light from the upper middle: brighter in the centre, darker toward the edges and the hem."""
    hx = ramp("x", [(centre - spread * 1.6, 0.8), (centre - spread * 0.7, 0.98), (centre, 1.05), (centre + spread * 0.7, 0.98), (centre + spread * 1.6, 0.8)])
    vy = ramp("y", [(top, 1.05), ((top + bottom) / 2, 1.0), (bottom, 0.9)])
    return 1 + (hx * vy - 1) * strength


def print_colour(garment: tuple[int, int, int]) -> tuple[int, int, int]:
    return (243, 236, 223) if luma(garment) < 0.5 else (27, 54, 43)


# ------------------------------------------------------------------ T-shirt


def tee_outline(front: bool = True):
    left = (
        Path(412, 190)
        .quad((336, 198), (236, 248))
        .line(64, 452)
        .line(146, 520)
        .quad((232, 480), (300, 472))
        .quad((284, 700), (274, 942))
        .quad((392, 958), (500, 960))
    )
    pts = left.p + left.mirrored()[1:]
    if front:
        neck = bezier((588, 190), (574, 304), (426, 304), (412, 190), 40)
    else:
        neck = bezier((588, 190), (574, 226), (426, 226), (412, 190), 40)
    return pts + neck[1:], left


def draw_tee(colour: str, lines: list[str], reference: str, icon: str, view: str = "front", seed: int = 1) -> tuple[Image.Image, Image.Image, RGBA_MASK]:
    base = hex_rgb(colour)
    pts, left = tee_outline(front=view == "front")
    body = mask_of(pts)
    shade = cloth_shade()
    layer = blank()

    # the inside of the back of the neck, seen through the collar opening
    if view == "front":
        inner = bezier((412, 190), (446, 120), (554, 120), (588, 190), 40) + bezier((588, 190), (574, 304), (426, 304), (412, 190), 40)[1:]
        inside = mask_of(inner)
        fill(layer, inside, darken(base, 0.5), ramp("y", [(120, 0.62), (250, 0.85), (304, 1.0)]) * ramp("x", [(410, 0.8), (500, 1.0), (590, 0.8)]))

    fill(layer, body, base, shade)

    # fabric: soft folds and creases
    dark = darken(base, 0.5)
    light = lighten(base, 0.5)
    folds = [
        ([(318, 490), (352, 610), (336, 760)], 16, 0.14),
        ([(682, 490), (648, 620), (664, 770)], 16, 0.14),
        ([(430, 520), (470, 690), (440, 860)], 26, 0.06),
        ([(580, 540), (545, 700), (585, 880)], 26, 0.06),
        ([(110, 470), (205, 480)], 14, 0.13),
        ([(890, 470), (795, 480)], 14, 0.13),
        ([(150, 330), (230, 420)], 18, 0.06),
        ([(850, 330), (770, 420)], 18, 0.06),
    ]
    for points, w, a in folds:
        clip_tint(layer, body, stroke_mask(points, w), dark, a, 14)
    for points, w, a in [([(380, 330), (410, 520)], 20, 0.07), ([(600, 340), (580, 500)], 20, 0.06), ([(215, 330), (140, 430)], 16, 0.06)]:
        clip_tint(layer, body, stroke_mask(points, w), light, a, 12)

    # seams: armholes, sleeve hems and bottom hem
    seam = darken(base, 0.35)
    stitch = lighten(base, 0.28)
    for side in (1, -1):
        def X(x):
            return 500 + side * (x - 500)
        arm = bezier((X(236), 248), (X(290), 330), (X(298), 410), (X(300), 472), 30)
        clip_tint(layer, body, stroke_mask(arm, 3.2), seam, 0.35, 0.8)
        cuff = [(X(84), 476), (X(150), 534)]
        clip_tint(layer, body, stroke_mask(cuff, 2.6), stitch, 0.5, 0.5)
        clip_tint(layer, body, stroke_mask([(X(74), 462), (X(144), 524)], 2.2), seam, 0.3, 0.5)
    hem = bezier((276, 912), (400, 928), (600, 928), (724, 912), 40)
    clip_tint(layer, body, stroke_mask(hem, 2.6), stitch, 0.5, 0.5)
    clip_tint(layer, body, stroke_mask(bezier((276, 918), (400, 934), (600, 934), (724, 918), 40), 2.0), seam, 0.3, 0.5)

    # collar rib
    if view == "front":
        rib = bezier((414, 194), (430, 292), (570, 292), (586, 194), 40)
        rib_mask = stroke_mask(rib, 30)
        fill(layer, intersect(rib_mask, body), mix(base, darken(base, 0.18), 0.5), ramp("x", [(400, 0.9), (500, 1.06), (600, 0.9)]))
        clip_tint(layer, body, stroke_mask(bezier((418, 206), (434, 300), (566, 300), (582, 206), 40), 2.0), stitch, 0.35, 0.5)
        back_rib = stroke_mask(bezier((412, 190), (446, 128), (554, 128), (588, 190), 40), 22)
        fill(layer, back_rib, mix(base, darken(base, 0.3), 0.55), ramp("y", [(140, 0.95), (220, 1.0)]))
    else:
        rib = stroke_mask(bezier((412, 192), (446, 232), (554, 232), (588, 192), 40), 26)
        fill(layer, intersect(rib, body), mix(base, darken(base, 0.18), 0.5))

    grain(layer, body, 5.0, seed)

    # the print
    ink = print_colour(base)
    if view == "front":
        n = len(lines)
        centre = 512 + n * 38
        layer_print = icon_layer(icon, 500, centre - n * 38 - 58, 76, ink, 4.6)
        layer_print.alpha_composite(text_layer(lines, font("bodoni-i", 44, 500), ink, (500, centre), 1.12))
        layer_print.alpha_composite(text_layer([reference], font("manrope", 17, 700), ink, (500, centre + n * 38 + 22), 1.0, tracking=4.0, alpha=0.9))
    else:
        layer_print = text_layer([w.upper() for w in lines], font("bodoni", 74, 600), ink, (500, 470), 1.06, tracking=3)
        layer_print.alpha_composite(icon_layer(icon, 500, 330, 70, ink, 4.6))
        layer_print.alpha_composite(text_layer([reference], font("manrope", 20, 700), ink, (500, 670), 1.0, tracking=5.0, alpha=0.9))
    place_print(layer, layer_print, body, cloth_shade(strength=0.55))
    return layer, body, base


RGBA_MASK = Image.Image


def render_tee(path, colour, lines, reference, icon, view="front", seed=1, crop=None):
    layer, body, base = draw_tee(colour, lines, reference, icon, view, seed)
    bg = studio_bg(base)
    dark_bg = luma(base) > 0.62
    scene = compose(bg, layer, body, floor=(500, 972, 300, 22), dark_bg=dark_bg, lift=16)
    if crop:
        x0, y0, x1, y1 = [int(v * S) for v in crop]
        scene = scene.crop((x0, y0, x1, y1)).resize((W * S, H * S), Image.LANCZOS)
    finish(scene, path)
