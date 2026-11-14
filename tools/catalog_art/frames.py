from __future__ import annotations

import numpy as np
from PIL import Image

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
    icon_layer,
    intersect,
    lighten,
    mask_of,
    mix,
    place_print,
    radial,
    ramp,
    stroke_mask,
    text_layer,
    tint,
    union,
)

FRAME_COLOURS = {"black": "#1A1A1A", "white": "#F2F0EA", "wood": "#B98B58"}
MM = {"A5": (148, 210), "A4": (210, 297), "A3": (297, 420)}


def wall_bg(tone="warm"):
    top = np.array((236, 228, 214) if tone == "warm" else (221, 226, 220), np.float32)
    bot = np.array((214, 203, 183) if tone == "warm" else (196, 204, 196), np.float32)
    t = ramp("y", [(0, 0.0), (H, 1.0)])[..., None]
    arr = top * (1 - t) + bot * t
    glow = radial(W * 0.5, H * 0.42, W * 0.7, H * 0.6, 1.04, 0.9)[..., None]
    arr = arr * glow
    arr += np.random.default_rng(5).normal(0, 1.6, arr.shape[:2])[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def draw_art(kind, w, h, lines, reference, icon, ink):
    """The print inside the frame, drawn on its own transparent layer sized to the opening."""
    layer = Image.new("RGBA", (int(w * S), int(h * S)), (0, 0, 0, 0))
    return layer


def frame_geometry(size, scale):
    mw, mh = MM[size]
    fw, fh = mw * scale, mh * scale
    return fw, fh


def render_frame(path, size, colour, art, lines, reference, icon, view="wall", seed=8, scale=None, crop=None):
    """One frame on a wall. `art` is 'verse' (a printed verse) or 'photo' (a sample landscape)."""
    scale = scale or {"A5": 2.8, "A4": 2.45, "A3": 2.0}[size]
    fw, fh = frame_geometry(size, scale)
    cx, cy = 500, 560
    x0, y0, x1, y1 = cx - fw / 2, cy - fh / 2, cx + fw / 2, cy + fh / 2
    border = max(22, fw * 0.075)
    mat = max(26, fw * 0.1)
    frame_col = hex_rgb(FRAME_COLOURS[colour])

    out = wall_bg()
    # cast shadow on the wall
    sh = Image.new("L", out.size, 0)
    from PIL import ImageDraw

    ImageDraw.Draw(sh).rectangle([(x0 + 14) * S, (y0 + 22) * S, (x1 + 14) * S, (y1 + 22) * S], fill=255)
    tint(out, blur(sh, 20), (40, 30, 20), 0.38)
    tint(out, blur(sh.crop((0, 0, *sh.size)), 6), (0, 0, 0), 0.0)

    layer = blank()
    outer = mask_of([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
    # mitred frame: four bevelled sides
    sides = {
        "top": [(x0, y0), (x1, y0), (x1 - border, y0 + border), (x0 + border, y0 + border)],
        "right": [(x1, y0), (x1, y1), (x1 - border, y1 - border), (x1 - border, y0 + border)],
        "bottom": [(x0, y1), (x1, y1), (x1 - border, y1 - border), (x0 + border, y1 - border)],
        "left": [(x0, y0), (x0, y1), (x0 + border, y1 - border), (x0 + border, y0 + border)],
    }
    tone = {"top": 1.14, "left": 1.04, "right": 0.88, "bottom": 0.78}
    for name, pts in sides.items():
        m = mask_of(pts)
        fill(layer, m, frame_col, np.full((H * S, W * S), tone[name], np.float32))
        if colour == "wood":
            rng = np.random.default_rng(seed + len(name))
            horizontal = name in ("top", "bottom")
            for _ in range(26):
                if horizontal:
                    yy = rng.uniform(min(p[1] for p in pts), max(p[1] for p in pts))
                    seg = [(x0, yy), (x1, yy + rng.uniform(-2, 2))]
                else:
                    xx = rng.uniform(min(p[0] for p in pts), max(p[0] for p in pts))
                    seg = [(xx, y0), (xx + rng.uniform(-2, 2), y1)]
                clip_tint(layer, m, stroke_mask(seg, rng.uniform(0.8, 2.2)), darken(frame_col, 0.45), rng.uniform(0.1, 0.3), 0.6)
        if colour == "black":
            clip_tint(layer, m, stroke_mask([pts[0], pts[1]], 3), (255, 255, 255), 0.12, 1)
    # inner lip shadow, then the mat and the print
    inner = [(x0 + border, y0 + border), (x1 - border, y0 + border), (x1 - border, y1 - border), (x0 + border, y1 - border)]
    inner_mask = mask_of(inner)
    fill(layer, inner_mask, (250, 247, 240), np.full((H * S, W * S), 1.0, np.float32))
    clip_tint(layer, inner_mask, stroke_mask(inner, 14, closed=True), (0, 0, 0), 0.22, 7)
    ax0, ay0, ax1, ay1 = x0 + border + mat, y0 + border + mat, x1 - border - mat, y1 - border - mat
    art_mask = mask_of([(ax0, ay0), (ax1, ay0), (ax1, ay1), (ax0, ay1)])
    clip_tint(layer, inner_mask, stroke_mask([(ax0 - 2, ay0 - 2), (ax1 + 2, ay0 - 2), (ax1 + 2, ay1 + 2), (ax0 - 2, ay1 + 2)], 5, closed=True), (0, 0, 0), 0.14, 2)

    aw, ah = ax1 - ax0, ay1 - ay0
    if art == "photo":
        sky = np.zeros((H * S, W * S, 3), np.float32)
        t = ramp("y", [(ay0, 0.0), (ay0 + ah * 0.62, 1.0), (ay1, 1.0)])[..., None]
        sky[:] = np.array((120, 160, 205), np.float32) * (1 - t) + np.array((247, 196, 150), np.float32) * t
        sky_img = Image.fromarray(np.clip(sky, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
        layer.paste(sky_img, (0, 0), art_mask)
        sun = mask_of(ellipse_pts(ax0 + aw * 0.68, ay0 + ah * 0.55, aw * 0.1, aw * 0.1))
        tint(layer, intersect(blur(sun, 10), art_mask), (255, 236, 190), 0.9, 0)
        tint(layer, intersect(sun, art_mask), (255, 248, 226), 1.0, 0)
        hills = [
            (bezier((ax0, ay0 + ah * 0.72), (ax0 + aw * 0.3, ay0 + ah * 0.58), (ax0 + aw * 0.6, ay0 + ah * 0.78), (ax1, ay0 + ah * 0.66), 60) + [(ax1, ay1), (ax0, ay1)], (88, 118, 98)),
            (bezier((ax0, ay0 + ah * 0.82), (ax0 + aw * 0.4, ay0 + ah * 0.7), (ax0 + aw * 0.7, ay0 + ah * 0.9), (ax1, ay0 + ah * 0.8), 60) + [(ax1, ay1), (ax0, ay1)], (46, 78, 64)),
        ]
        for pts, col in hills:
            fill(layer, intersect(mask_of(pts), art_mask), col, ramp("y", [(ay0, 1.06), (ay1, 0.86)]))
    else:
        paper = (248, 243, 232)
        fill(layer, art_mask, paper, ramp("y", [(ay0, 1.02), (ay1, 0.97)]))
        ink = (27, 58, 47)
        n = len(lines)
        base_size = aw * 0.105
        pl = icon_layer(icon, 500, ay0 + ah * 0.3, aw * 0.2, ink, max(2.5, aw * 0.012))
        pl.alpha_composite(text_layer(lines, font("bodoni-i", base_size, 500), ink, (500, ay0 + ah * 0.58 + (n - 2) * base_size * 0.3), 1.12))
        pl.alpha_composite(text_layer([reference], font("manrope", max(11, aw * 0.036), 700), ink, (500, ay1 - ah * 0.1), 1.0, tracking=max(2.5, aw * 0.012), alpha=0.9))
        place_print(layer, pl, art_mask)
    # a soft sheen across the glass
    sheen = mask_of([(x0 + border, y0 + border), (x0 + border + (x1 - x0) * 0.45, y0 + border), (x0 + border, y0 + border + (y1 - y0) * 0.45)])
    clip_tint(layer, inner_mask, sheen, (255, 255, 255), 0.07, 14)
    grain(layer, outer, 3.0, seed)

    out.alpha_composite(layer)
    if crop:
        out = out.crop(tuple(int(v * S) for v in crop)).resize((W * S, H * S), Image.LANCZOS)
    finish(out, path)


def render_sizes(path, colour, lines, reference, icon, seed=9):
    """The three sizes side by side, to show how they compare."""
    out = wall_bg()
    from PIL import ImageDraw

    scale = 1.22
    gap = 36
    sizes = ["A5", "A4", "A3"]
    widths = [MM[s][0] * scale for s in sizes]
    total = sum(widths) + gap * 2
    x = 500 - total / 2
    base_y = 880
    for size in sizes:
        fw, fh = MM[size][0] * scale, MM[size][1] * scale
        x0, y0, x1, y1 = x, base_y - fh, x + fw, base_y
        sh = Image.new("L", out.size, 0)
        ImageDraw.Draw(sh).rectangle([(x0 + 8) * S, (y0 + 14) * S, (x1 + 8) * S, (y1 + 14) * S], fill=255)
        tint(out, blur(sh, 14), (40, 30, 20), 0.35)
        layer = blank()
        border = max(12, fw * 0.07)
        col = hex_rgb(FRAME_COLOURS[colour])
        tone = {"top": 1.14, "left": 1.04, "right": 0.88, "bottom": 0.78}
        for name, pts in {
            "top": [(x0, y0), (x1, y0), (x1 - border, y0 + border), (x0 + border, y0 + border)],
            "right": [(x1, y0), (x1, y1), (x1 - border, y1 - border), (x1 - border, y0 + border)],
            "bottom": [(x0, y1), (x1, y1), (x1 - border, y1 - border), (x0 + border, y1 - border)],
            "left": [(x0, y0), (x0, y1), (x0 + border, y1 - border), (x0 + border, y0 + border)],
        }.items():
            fill(layer, mask_of(pts), col, np.full((H * S, W * S), tone[name], np.float32))
        inner = mask_of([(x0 + border, y0 + border), (x1 - border, y0 + border), (x1 - border, y1 - border), (x0 + border, y1 - border)])
        fill(layer, inner, (250, 247, 240))
        pad = fw * 0.12
        art = mask_of([(x0 + border + pad, y0 + border + pad), (x1 - border - pad, y0 + border + pad), (x1 - border - pad, y1 - border - pad), (x0 + border + pad, y1 - border - pad)])
        fill(layer, art, (248, 243, 232))
        ink = (27, 58, 47)
        aw = fw - 2 * (border + pad)
        pl = icon_layer(icon, x + fw / 2, y0 + fh * 0.36, aw * 0.26, ink, max(1.8, aw * 0.014))
        pl.alpha_composite(text_layer(lines, font("bodoni-i", aw * 0.13, 500), ink, (x + fw / 2, y0 + fh * 0.58), 1.1))
        place_print(layer, pl, art)
        out.alpha_composite(layer)
        label = text_layer([size], font("manrope", 24, 700), (60, 56, 48), (x + fw / 2, base_y + 46), 1.0, tracking=5.0)
        out.alpha_composite(label)
        mmtxt = text_layer([f"{MM[size][0]} × {MM[size][1]} mm"], font("manrope", 16, 600), (110, 104, 92), (x + fw / 2, base_y + 80), 1.0, tracking=1.5)
        out.alpha_composite(mmtxt)
        x += fw + gap
    finish(out, path)
