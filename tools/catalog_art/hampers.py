from __future__ import annotations

import numpy as np
from PIL import Image, ImageDraw

from art import (
    H,
    S,
    W,
    bezier,
    blank,
    blur,
    clip_tint,
    darken,
    ellipse_pts,
    fill,
    finish,
    font,
    grain,
    hex_rgb,
    lighten,
    mask_of,
    mix,
    radial,
    ramp,
    rounded_rect_pts,
    stroke_mask,
    studio_bg,
    text_layer,
    tint,
    union,
)


def paste_item(out: Image.Image, item_layer: Image.Image, item_mask: Image.Image, scale: float, target: tuple[float, float], anchor: tuple[float, float] = (500, 620)):
    """Place a product drawing, shrunk, so that its `anchor` point lands on `target`."""
    k = scale
    size = (int(W * S * k), int(H * S * k))
    layer = item_layer.resize(size, Image.LANCZOS)
    mask = item_mask.resize(size, Image.LANCZOS)
    dx = int(target[0] * S - anchor[0] * S * k)
    dy = int(target[1] * S - anchor[1] * S * k)
    shadow = Image.new("L", out.size, 0)
    shadow.paste(blur(mask, 8), (dx + int(6 * S), dy + int(10 * S)))
    tint(out, shadow, (0, 0, 0), 0.3)
    out.paste(layer, (dx, dy), layer)


def draw_item(kind: str, spec: dict):
    import bottles
    import garments
    import more_garments as mg

    if kind == "tee":
        return garments.draw_tee(spec["colour"], spec["lines"], spec["ref"], spec["icon"])
    if kind == "hoodie":
        return mg.draw_hoodie(spec["colour"], spec["lines"], spec["ref"], spec["icon"])
    if kind == "tote":
        return mg.draw_tote(spec["colour"], spec["lines"], spec["ref"], spec["icon"])
    if kind == "cap":
        return mg.draw_cap(spec["colour"], spec["icon"], spec["accent"])
    if kind == "keychain":
        return mg.draw_keychain(spec.get("finish", "brass"))
    return bottles.draw_bottle(spec["shape"], spec["colour"], spec["lines"], spec["ref"], spec["icon"])


def box_colours(name: str):
    return {"berry": (163, 40, 42), "pine": (27, 68, 54), "kraft": (176, 138, 88)}[name]


def render_hamper_closed(path, box="berry", ribbon="gold", label="Joy", seed=11):
    box_col = box_colours(box)
    rib = (215, 178, 105) if ribbon == "gold" else (243, 236, 223)
    out = studio_bg(box_col, dark=True)
    layer = blank()
    # ground shadow
    sh = Image.new("L", out.size, 0)
    ImageDraw.Draw(sh).ellipse([(190) * S, (950) * S, (810) * S, (1010) * S], fill=255)
    tint(out, blur(sh, 24), (0, 0, 0), 0.5)

    base = mask_of(rounded_rect_pts(250, 560, 750, 980, 14))
    lid = mask_of(rounded_rect_pts(228, 440, 772, 590, 16))
    fill(layer, base, box_col, ramp("x", [(250, 0.8), (400, 1.0), (520, 1.07), (750, 0.78)]) * ramp("y", [(560, 1.0), (980, 0.88)]))
    clip_tint(layer, base, stroke_mask([(250, 580), (750, 580)], 30), (0, 0, 0), 0.35, 14)
    fill(layer, lid, mix(box_col, (255, 255, 255), 0.06), ramp("x", [(228, 0.82), (400, 1.0), (520, 1.1), (772, 0.8)]) * ramp("y", [(440, 1.1), (590, 0.92)]))
    clip_tint(layer, lid, stroke_mask([(236, 446), (764, 446)], 4), (255, 255, 255), 0.3, 1)
    clip_tint(layer, lid, stroke_mask([(236, 584), (764, 584)], 6), (0, 0, 0), 0.3, 3)
    # ribbon
    vert = mask_of([(468, 440), (532, 440), (532, 980), (468, 980)])
    horz = mask_of([(228, 492), (772, 492), (772, 534), (228, 534)])
    fill(layer, union(vert, horz), rib, ramp("x", [(228, 0.85), (468, 1.0), (500, 1.12), (772, 0.85)]))
    fill(layer, vert, rib, ramp("x", [(468, 0.86), (500, 1.12), (532, 0.86)]))
    clip_tint(layer, union(vert, horz), stroke_mask([(470, 440), (470, 980)], 2), (255, 255, 255), 0.3, 1)
    # bow
    for sign in (-1, 1):
        loop = bezier((500, 428), (500 + sign * 60, 330), (500 + sign * 170, 340), (500 + sign * 130, 420), 40) + bezier((500 + sign * 130, 420), (500 + sign * 100, 450), (500 + sign * 40, 450), (500, 436), 40)[1:]
        lm = mask_of(loop)
        fill(layer, lm, rib, ramp("y", [(330, 1.12), (450, 0.82)]))
        clip_tint(layer, lm, stroke_mask(bezier((500, 420), (500 + sign * 70, 372), (500 + sign * 110, 380), (500 + sign * 118, 420), 30), 3), darken(rib, 0.4), 0.4, 1.4)
    knot = mask_of(ellipse_pts(500, 432, 28, 24))
    fill(layer, knot, darken(rib, 0.05), ramp("x", [(470, 0.84), (495, 1.14), (530, 0.84)]))
    for sign in (-1, 1):
        tail = mask_of([(500, 440), (500 + sign * 30, 440), (500 + sign * 94, 560), (500 + sign * 60, 566)])
        fill(layer, tail, rib, ramp("y", [(440, 1.08), (566, 0.84)]))
    # the tag
    tag_pts = [(590, 640), (700, 650), (694, 756), (584, 746)]
    tag = mask_of(tag_pts)
    fill(layer, tag, (246, 240, 228), ramp("y", [(640, 1.03), (756, 0.94)]))
    clip_tint(layer, tag, stroke_mask(tag_pts, 3, closed=True), (0, 0, 0), 0.18, 1)
    hole = mask_of(ellipse_pts(600, 660, 6, 6))
    fill(layer, hole, (60, 50, 40))
    clip_tint(layer, base, stroke_mask(bezier((600, 580), (590, 620), (584, 640), (600, 658), 30), 3), (240, 232, 216), 0.9, 0.5)
    tl = text_layer([label], font("bodoni-i", 40, 500), (27, 58, 47), (642, 702), 1.0)
    layer.alpha_composite(tl)
    grain(layer, union(base, lid), 4.0, seed)
    out.alpha_composite(layer)
    finish(out, path)


def render_hamper_open(path, items: list[tuple[str, dict, float, tuple[float, float]]], box="berry", seed=12):
    """An open gift box with tissue paper and the gifts standing in it."""
    box_col = box_colours(box)
    out = studio_bg(box_col, dark=True)
    sh = Image.new("L", out.size, 0)
    ImageDraw.Draw(sh).ellipse([(170) * S, (1000) * S, (830) * S, (1070) * S], fill=255)
    tint(out, blur(sh, 26), (0, 0, 0), 0.5)

    # inside of the box
    back = blank()
    interior = mask_of([(230, 640), (770, 640), (790, 1010), (210, 1010)])
    fill(back, interior, darken(box_col, 0.5), ramp("y", [(640, 0.8), (1010, 0.6)]))
    out.alpha_composite(back)

    # tissue paper
    tissue = blank()
    for i, (x, y, w, tilt) in enumerate(((250, 700, 260, -0.2), (480, 690, 280, 0.15), (330, 730, 360, 0.05))):
        pts = [(x, y + 20), (x + w * 0.3, y - 10 + tilt * 40), (x + w * 0.6, y + 14), (x + w, y - 6 + tilt * 60), (x + w, y + 120), (x, y + 120)]
        m = mask_of(pts)
        fill(tissue, m, (246, 238, 222) if i % 2 == 0 else (236, 224, 202), ramp("y", [(y - 10, 1.08), (y + 120, 0.9)]))
    out.alpha_composite(tissue)

    for kind, spec, scale, target in items:
        layer, mask, _ = draw_item(kind, spec)
        paste_item(out, layer, mask, scale, target, anchor=spec.get("anchor", (500, 640)))

    # front wall of the box and its top edge
    front = blank()
    wall = mask_of([(214, 800), (786, 800), (796, 1012), (204, 1012)])
    fill(front, wall, box_col, ramp("x", [(204, 0.8), (400, 1.0), (520, 1.07), (796, 0.78)]) * ramp("y", [(800, 1.05), (1012, 0.86)]))
    lipm = mask_of([(206, 786), (794, 786), (796, 822), (204, 822)])
    fill(front, lipm, mix(box_col, (255, 255, 255), 0.07), ramp("x", [(204, 0.84), (500, 1.1), (796, 0.84)]))
    clip_tint(front, lipm, stroke_mask([(210, 790), (790, 790)], 3), (255, 255, 255), 0.3, 1)
    clip_tint(front, wall, stroke_mask([(210, 826), (790, 826)], 12), (0, 0, 0), 0.3, 6)
    grain(front, wall, 4.0, seed)
    out.alpha_composite(front)
    finish(out, path)
