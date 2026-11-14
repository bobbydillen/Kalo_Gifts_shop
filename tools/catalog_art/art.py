"""
Drawing toolkit for the KALO launch catalogue images.

Everything is drawn at 2x and shrunk at the end, so edges are smooth. A "scene" is a background, a
soft floor shadow and the product, built up from shapes (masks) that are filled with shaded colour.
The look is deliberately simple and consistent: studio-style product illustrations in the brand's
colours and fonts. They stand in for real photos until you upload yours.
"""
from __future__ import annotations

import math
import pathlib
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1000, 1250  # final size (4:5)
S = 2  # supersampling
HERE = pathlib.Path(__file__).parent
FONTS = HERE / "fonts"

RGB = tuple[int, int, int]


def hex_rgb(h: str) -> RGB:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def mix(a: RGB, b: RGB, t: float) -> RGB:
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))  # type: ignore[return-value]


def luma(c: RGB) -> float:
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255


def lighten(c: RGB, t: float) -> RGB:
    return mix(c, (255, 255, 255), t)


def darken(c: RGB, t: float) -> RGB:
    return mix(c, (0, 0, 0), t)


# ------------------------------------------------------------------ fonts


def font(name: str, size: float, weight: int | None = None, opsz: int | None = None) -> ImageFont.FreeTypeFont:
    files = {"bodoni": "BodoniModa.ttf", "bodoni-i": "BodoniModa-Italic.ttf", "manrope": "Manrope.ttf", "caveat": "Caveat.ttf"}
    f = ImageFont.truetype(str(FONTS / files[name]), int(size * S))
    try:
        axes = f.get_variation_axes()
        values = []
        for ax in axes:
            n = ax["name"].decode() if isinstance(ax["name"], bytes) else ax["name"]
            if n == "Weight":
                values.append(weight or ax["default"])
            elif n == "Optical size":
                values.append(opsz or min(max(size / 3, ax["minimum"]), ax["maximum"]))
            else:
                values.append(ax["default"])
        f.set_variation_by_axes(values)
    except Exception:
        pass
    return f


# ------------------------------------------------------------------ geometry


def bezier(p0, p1, p2, p3, n=48):
    pts = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t**2, t**3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


class Path:
    """A closed outline built from lines and curves, in 1000 x 1250 coordinates."""

    def __init__(self, x: float, y: float):
        self.p = [(x, y)]

    def line(self, x, y):
        self.p.append((x, y))
        return self

    def curve(self, c1, c2, end):
        self.p += bezier(self.p[-1], c1, c2, end)[1:]
        return self

    def quad(self, c, end):
        s = self.p[-1]
        c1 = (s[0] + 2 / 3 * (c[0] - s[0]), s[1] + 2 / 3 * (c[1] - s[1]))
        c2 = (end[0] + 2 / 3 * (c[0] - end[0]), end[1] + 2 / 3 * (c[1] - end[1]))
        return self.curve(c1, c2, end)

    def mirrored(self, cx=500):
        return [(2 * cx - x, y) for x, y in reversed(self.p)]


def ellipse_pts(cx, cy, rx, ry, a0=0, a1=360, n=96):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def rounded_rect_pts(x0, y0, x1, y1, r, n=14):
    pts = []
    for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        pts += ellipse_pts(cx, cy, r, r, a0, a0 + 90, n)
    return pts


# ------------------------------------------------------------------ layers and masks


def blank() -> Image.Image:
    return Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))


def mask_of(points) -> Image.Image:
    m = Image.new("L", (W * S, H * S), 0)
    ImageDraw.Draw(m).polygon([(x * S, y * S) for x, y in points], fill=255)
    return m


def union(*masks: Image.Image) -> Image.Image:
    out = masks[0]
    for m in masks[1:]:
        out = Image.fromarray(np.maximum(np.asarray(out), np.asarray(m)))
    return out


def subtract(a: Image.Image, b: Image.Image) -> Image.Image:
    return Image.fromarray(np.clip(np.asarray(a).astype(int) - np.asarray(b).astype(int), 0, 255).astype(np.uint8))


def intersect(a: Image.Image, b: Image.Image) -> Image.Image:
    return Image.fromarray(np.minimum(np.asarray(a), np.asarray(b)))


def blur(img: Image.Image, r: float) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(r * S))


def _grid():
    y, x = np.mgrid[0 : H * S, 0 : W * S].astype(np.float32)
    return x / S, y / S


_GX, _GY = _grid()


def ramp(axis: str, stops: list[tuple[float, float]]) -> np.ndarray:
    """A brightness multiplier that changes along x or y, from (position, value) stops."""
    coord = _GX if axis == "x" else _GY
    xs, ys = zip(*stops)
    return np.interp(coord, xs, ys).astype(np.float32)


def radial(cx, cy, rx, ry, inner: float, outer: float) -> np.ndarray:
    d = np.sqrt(((_GX - cx) / rx) ** 2 + ((_GY - cy) / ry) ** 2)
    return (inner + (outer - inner) * np.clip(d, 0, 1)).astype(np.float32)


def fill(img: Image.Image, mask: Image.Image, colour: RGB, shade: np.ndarray | None = None, alpha: float = 1.0) -> None:
    """Paint a shape with a colour, optionally lit by a brightness multiplier."""
    base = np.zeros((H * S, W * S, 3), dtype=np.float32)
    base[:] = colour
    if shade is not None:
        base = base * shade[..., None]
        # brighter than 1 pulls toward white rather than clipping flat
        over = np.clip(shade - 1.0, 0, 1)[..., None]
        base = base * (1 - over) + 255 * over * 0.6 + base * over * 0.4
    layer = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    m = mask if alpha >= 1 else mask.point(lambda v: int(v * alpha))
    img.paste(layer, (0, 0), m)


def stroke_mask(points, width: float, closed=False, round_caps=True) -> Image.Image:
    m = Image.new("L", (W * S, H * S), 0)
    d = ImageDraw.Draw(m)
    pts = [(x * S, y * S) for x, y in points]
    if closed:
        pts = pts + [pts[0]]
    d.line(pts, fill=255, width=max(1, int(width * S)), joint="curve")
    if round_caps and len(pts) > 1:
        r = width * S / 2
        for x, y in (pts[0], pts[-1]):
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return m


def tint(img: Image.Image, mask: Image.Image, colour: RGB, alpha: float, soften: float = 0) -> None:
    """Lay a translucent colour over part of the picture (folds, highlights)."""
    m = blur(mask, soften) if soften else mask
    layer = Image.new("RGBA", img.size, colour + (255,))
    img.paste(layer, (0, 0), m.point(lambda v: int(v * alpha)))


def clip_tint(img, shape_mask, stroke, colour, alpha, soften):
    tint(img, intersect(stroke, shape_mask), colour, alpha, soften)


def grain(img: Image.Image, mask: Image.Image, amount: float = 7.0, seed: int = 1) -> None:
    rng = np.random.default_rng(seed)
    raw = rng.normal(0, amount, (H * S, W * S)).astype(np.float32)
    packed = Image.fromarray(np.clip(128 + raw * 6, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.6 * S))
    noise = (np.asarray(packed).astype(np.float32) - 128) / 6 * 1.6
    a = np.asarray(img).astype(np.float32)
    m = (np.asarray(mask).astype(np.float32) / 255.0)[..., None]
    a[..., :3] = np.clip(a[..., :3] + noise[..., None] * m, 0, 255)
    img.paste(Image.fromarray(a.astype(np.uint8), "RGBA"))


# ------------------------------------------------------------------ text and icons


def text_layer(lines: list[str], fnt, colour: RGB, centre: tuple[float, float], spacing: float = 1.15, tracking: float = 0, alpha: float = 1.0) -> Image.Image:
    layer = blank()
    d = ImageDraw.Draw(layer)
    ascent, descent = fnt.getmetrics()
    line_h = (ascent + descent) * spacing
    total = line_h * len(lines)
    y = centre[1] * S - total / 2
    for line in lines:
        if tracking:
            width = sum(fnt.getlength(ch) + tracking * S for ch in line) - tracking * S
        else:
            width = fnt.getlength(line)
        x = centre[0] * S - width / 2
        if tracking:
            for ch in line:
                d.text((x, y), ch, font=fnt, fill=colour + (int(255 * alpha),))
                x += fnt.getlength(ch) + tracking * S
        else:
            d.text((x, y), line, font=fnt, fill=colour + (int(255 * alpha),))
        y += line_h
    return layer


def place_print(img: Image.Image, layer: Image.Image, clip: Image.Image, shade: np.ndarray | None = None) -> None:
    """Put printed text or art on a garment, kept inside it and lit like the fabric."""
    a = np.asarray(layer).astype(np.float32)
    if shade is not None:
        a[..., :3] = np.clip(a[..., :3] * shade[..., None], 0, 255)
    a[..., 3] = a[..., 3] * (np.asarray(clip).astype(np.float32) / 255.0)
    out = Image.fromarray(a.astype(np.uint8), "RGBA")
    img.alpha_composite(out)


def icon_layer(kind: str, cx: float, cy: float, size: float, colour: RGB, line: float = 5.0) -> Image.Image:
    """Small line icons used as prints: anchor, cross, star, branch, drop, dove-free simple shapes."""
    layer = blank()
    d = ImageDraw.Draw(layer)
    c = colour + (255,)
    w = max(1, int(line * S))

    def P(x, y):
        return (cx * S + x * size * S, cy * S + y * size * S)

    def arc(box, a0, a1):
        (x0, y0), (x1, y1) = P(box[0], box[1]), P(box[2], box[3])
        d.arc([x0, y0, x1, y1], a0, a1, fill=c, width=w)

    if kind == "anchor":
        d.line([P(0, -0.5), P(0, 0.42)], fill=c, width=w)
        r = 0.09 * size * S
        x, y = P(0, -0.58)
        d.ellipse([x - r, y - r, x + r, y + r], outline=c, width=w)
        d.line([P(-0.18, -0.34), P(0.18, -0.34)], fill=c, width=w)
        arc((-0.46, -0.02, 0.46, 0.84), 10, 170)
        d.line([P(-0.46, 0.4), P(-0.38, 0.28)], fill=c, width=w)
        d.line([P(0.46, 0.4), P(0.38, 0.28)], fill=c, width=w)
    elif kind == "cross":
        d.line([P(0, -0.5), P(0, 0.5)], fill=c, width=w)
        d.line([P(-0.28, -0.18), P(0.28, -0.18)], fill=c, width=w)
    elif kind == "star":
        pts = []
        for i in range(16):
            r = (0.5 if i % 2 == 0 else 0.14) * size
            a = math.radians(-90 + i * 22.5)
            pts.append((cx * S + r * S * math.cos(a), cy * S + r * S * math.sin(a)))
        d.polygon(pts, fill=c)
    elif kind == "branch":
        pts = bezier(P(-0.5, 0.35), P(-0.2, 0.2), P(0.15, -0.05), P(0.5, -0.4), 40)
        d.line(pts, fill=c, width=w)
        for t in (0.15, 0.3, 0.45, 0.6, 0.75, 0.9):
            x, y = pts[int(t * 40)]
            for side in (-1, 1):
                lx, ly = x + side * 0.1 * size * S, y + (-0.1 if side < 0 else 0.1) * size * S
                d.ellipse([lx - 0.07 * size * S, ly - 0.035 * size * S, lx + 0.07 * size * S, ly + 0.035 * size * S], fill=c)
    elif kind == "drop":
        pts = bezier(P(0, -0.5), P(0.1, -0.2), P(0.34, 0.05), P(0.34, 0.2), 30) + bezier(P(0.34, 0.2), P(0.34, 0.52), P(-0.34, 0.52), P(-0.34, 0.2), 40)[1:] + bezier(P(-0.34, 0.2), P(-0.34, 0.05), P(-0.1, -0.2), P(0, -0.5), 30)[1:]
        d.polygon(pts, outline=c, width=w)
    elif kind == "rays":
        for i in range(9):
            a = math.radians(180 + i * 22.5)
            d.line([(cx * S + 0.2 * size * S * math.cos(a), cy * S + 0.2 * size * S * math.sin(a)), (cx * S + 0.5 * size * S * math.cos(a), cy * S + 0.5 * size * S * math.sin(a))], fill=c, width=w)
        r = 0.14 * size * S
        d.pieslice([cx * S - r, cy * S - r, cx * S + r, cy * S + r], 180, 360, fill=c)
    elif kind == "sheep":
        # a small round sheep: woolly body, head, legs
        for dx, dy in ((-0.2, 0), (0, -0.08), (0.2, 0), (-0.1, 0.1), (0.1, 0.1)):
            x, y = P(dx, dy)
            r = 0.17 * size * S
            d.ellipse([x - r, y - r, x + r, y + r], fill=c)
        hx, hy = P(0.36, 0.02)
        d.ellipse([hx - 0.1 * size * S, hy - 0.08 * size * S, hx + 0.1 * size * S, hy + 0.08 * size * S], fill=c)
        for lx in (-0.15, 0.12):
            d.line([P(lx, 0.2), P(lx, 0.42)], fill=c, width=w * 2)
    return layer


# ------------------------------------------------------------------ scenes


def studio_bg(base: RGB, dark: bool | None = None) -> Image.Image:
    """A soft studio backdrop that suits the product: dark green behind light things, warm cream behind dark ones."""
    if dark is None:
        dark = luma(base) > 0.62
    if dark:
        centre, edge = (38, 74, 60), (12, 32, 25)
    else:
        centre, edge = (240, 232, 215), (214, 203, 181)
    t = radial(W * 0.5, H * 0.46, W * 0.78, H * 0.72, 0.0, 1.0)[..., None]
    arr = np.array(centre, np.float32) * (1 - t) + np.array(edge, np.float32) * t
    rng = np.random.default_rng(3)
    arr += rng.normal(0, 1.4, arr.shape[:2])[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


def compose(bg: Image.Image, product: Image.Image, mask: Image.Image, floor: tuple[float, float, float, float] | None = None, dark_bg: bool = False, lift: float = 14) -> Image.Image:
    """Product on its backdrop, with a floor shadow and a soft contact shadow."""
    out = bg.copy()
    if floor:
        cx, cy, rx, ry = floor
        sh = Image.new("L", out.size, 0)
        ImageDraw.Draw(sh).ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S], fill=255)
        tint(out, blur(sh, 26), (0, 0, 0), 0.5 if dark_bg else 0.3)
    drop = blur(mask, 22)
    shifted = Image.new("L", out.size, 0)
    shifted.paste(drop, (int(10 * S), int(lift * S)))
    tint(out, shifted, (0, 0, 0), 0.42 if dark_bg else 0.26)
    out.alpha_composite(product)
    return out


def finish(img: Image.Image, path: pathlib.Path, quality: int = 80) -> None:
    final = img.convert("RGB").resize((W, H), Image.LANCZOS)
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    final.save(path, "WEBP", quality=quality, method=6)


def seeded(name: str) -> int:
    return sum(ord(c) * (i + 1) for i, c in enumerate(name)) % 10_000 + 1


__all__ = [n for n in dir() if not n.startswith("_")]
random.seed(7)
