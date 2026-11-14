from __future__ import annotations

from PIL import Image

from art import (
    H,
    S,
    W,
    Path,
    bezier,
    blank,
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
    subtract,
    text_layer,
    tint,
    union,
)
from garments import cloth_shade, print_colour


# ------------------------------------------------------------------ hoodie


def draw_hoodie(colour, lines, reference, icon, view="front", seed=2):
    base = hex_rgb(colour)
    layer = blank()
    dark, light, stitch = darken(base, 0.5), lighten(base, 0.5), lighten(base, 0.25)

    left = (
        Path(418, 262)
        .quad((338, 268), (236, 308))
        .quad((132, 420), (84, 640))
        .line(70, 878)
        .line(176, 896)
        .quad((184, 690), (292, 520))
        .quad((284, 760), (282, 930))
        .line(500, 930)
    )
    pts = left.p + left.mirrored()[1:]
    body = mask_of(pts)

    # hood: a big soft shape behind the neck, with a dark opening
    hood_back = mask_of(ellipse_pts(500, 228, 158, 150))
    fill(layer, hood_back, darken(base, 0.18), ramp("x", [(340, 0.84), (500, 1.06), (660, 0.84)]) * ramp("y", [(80, 1.06), (380, 0.9)]))
    opening = mask_of(ellipse_pts(500, 262, 104, 92))
    fill(layer, opening, darken(base, 0.62), ramp("y", [(170, 0.55), (350, 0.9)]))

    fill(layer, body, base, cloth_shade(top=270, bottom=930))

    # hood rim drawn over the shoulders
    rim = stroke_mask(bezier((388, 262), (398, 372), (602, 372), (612, 262), 40), 38)
    fill(layer, rim, mix(base, light, 0.08), ramp("x", [(380, 0.88), (500, 1.1), (620, 0.88)]))
    clip_tint(layer, rim, stroke_mask(bezier((398, 270), (408, 372), (592, 372), (602, 270), 40), 2), dark, 0.4, 0.8)

    # kangaroo pocket
    pocket = mask_of(bezier((338, 690), (420, 664), (580, 664), (662, 690), 30) + [(690, 862), (310, 862)])
    fill(layer, pocket, darken(base, 0.04), ramp("x", [(310, 0.88), (500, 1.04), (690, 0.88)]))
    for pts_, a in (([(338, 690), (310, 862)], 0.45), ([(662, 690), (690, 862)], 0.45)):
        clip_tint(layer, pocket, stroke_mask(pts_, 3), dark, a, 1.2)
    clip_tint(layer, body, stroke_mask(bezier((338, 692), (420, 666), (580, 666), (662, 692), 30), 3), dark, 0.4, 1.0)
    clip_tint(layer, body, stroke_mask(bezier((350, 702), (420, 678), (580, 678), (650, 702), 30), 2), stitch, 0.45, 0.6)

    # ribbed hem and cuffs
    hem = mask_of([(282, 894), (718, 894), (718, 936), (500, 944), (282, 936)])
    fill(layer, hem, darken(base, 0.1), ramp("y", [(894, 1.0), (944, 0.86)]))
    for x in range(292, 712, 14):
        clip_tint(layer, hem, stroke_mask([(x, 896), (x, 942)], 3), dark, 0.22, 0.8)
    for side in (1, -1):
        def X(x):
            return 500 + side * (x - 500)
        cuff = mask_of([(X(70), 836), (X(176), 856), (X(180), 896), (X(70), 878)])
        fill(layer, cuff, darken(base, 0.1), ramp("y", [(830, 1.02), (900, 0.86)]))
        for t in range(0, 6):
            x0 = 82 + t * 17
            clip_tint(layer, cuff, stroke_mask([(X(x0), 838 + t * 2), (X(x0 + 6), 892 + t * 2)], 3), dark, 0.22, 0.8)
        folds = [([(X(130), 420), (X(170), 640), (X(140), 820)], 20, 0.13), ([(X(300), 540), (X(330), 700)], 18, 0.1)]
        for points, w, a in folds:
            clip_tint(layer, body, stroke_mask(points, w), dark, a, 14)
        clip_tint(layer, body, stroke_mask(bezier((X(236), 306), (X(290), 380), (X(296), 450), (X(294), 520), 30), 3), dark, 0.35, 0.8)

    # drawstrings
    for x0, x1 in ((462, 452), (538, 548)):
        cord = stroke_mask(bezier((x0, 330), (x0 - 6, 400), (x1, 450), (x1, 520), 30), 7)
        fill(layer, cord, lighten(base, 0.5), ramp("y", [(330, 1.02), (520, 0.9)]))
        tip = mask_of([(x1 - 5, 518), (x1 + 5, 518), (x1 + 4, 548), (x1 - 4, 548)])
        fill(layer, tip, (205, 190, 150))

    grain(layer, union(body, hood_back), 5.0, seed)

    ink = print_colour(base)
    pl = icon_layer(icon, 500, 560, 64, ink, 4.2)
    pl.alpha_composite(text_layer(lines, font("bodoni-i", 38, 500), ink, (500, 618 + (len(lines) - 2) * 20), 1.1))
    pl.alpha_composite(text_layer([reference], font("manrope", 15, 700), ink, (500, 626 + len(lines) * 34), 1.0, tracking=4.0, alpha=0.9))
    place_print(layer, pl, body, cloth_shade(strength=0.5))
    return layer, union(body, hood_back), base


def render_hoodie(path, colour, lines, reference, icon, view="front", seed=2, crop=None):
    layer, mask, base = draw_hoodie(colour, lines, reference, icon, view, seed)
    scene = compose(studio_bg(base), layer, mask, floor=(500, 952, 300, 22), dark_bg=luma(base) > 0.62, lift=16)
    if crop:
        scene = scene.crop(tuple(int(v * S) for v in crop)).resize((W * S, H * S), Image.LANCZOS)
    finish(scene, path)


# ------------------------------------------------------------------ cap


def draw_cap(colour, icon, accent, view="front", seed=3):
    base = hex_rgb(colour)
    layer = blank()
    dark, light = darken(base, 0.5), lighten(base, 0.45)

    crown = mask_of(bezier((262, 650), (246, 330), (378, 244), (500, 244), 50) + bezier((500, 244), (622, 244), (754, 330), (738, 650), 50)[1:])
    fill(layer, crown, base, ramp("x", [(250, 0.76), (360, 1.0), (500, 1.1), (640, 1.0), (750, 0.76)]) * ramp("y", [(244, 1.08), (650, 0.9)]))
    # panel seams
    for xs, xe, ctrl in ((500, 500, 0), (500, 420, -50), (500, 580, 50), (500, 336, -100), (500, 664, 100)):
        seam = bezier((500, 252), (500 + ctrl * 0.6, 360), (xe + ctrl * 0.2, 520), (xe, 650), 30)
        clip_tint(layer, crown, stroke_mask(seam, 3.4), dark, 0.32, 0.9)
        clip_tint(layer, crown, stroke_mask([(x + 3, y) for x, y in seam], 2.0), light, 0.22, 0.6)
    # button and eyelets
    btn = mask_of(ellipse_pts(500, 248, 17, 13))
    fill(layer, btn, darken(base, 0.1), ramp("x", [(480, 0.9), (505, 1.12), (520, 0.9)]))
    for cx in (392, 608):
        eye = mask_of(ellipse_pts(cx, 400, 7, 6))
        fill(layer, eye, darken(base, 0.55))
    # sweatband
    clip_tint(layer, crown, stroke_mask(bezier((262, 636), (380, 662), (620, 662), (738, 636), 40), 12), dark, 0.35, 3)

    # a shadow where the crown meets the visor
    clip_tint(layer, crown, stroke_mask(bezier((262, 624), (380, 652), (620, 652), (738, 624), 40), 34), (0, 0, 0), 0.22, 10)
    # brim
    brim = mask_of(
        bezier((236, 658), (290, 626), (400, 616), (500, 616), 40)
        + bezier((500, 616), (600, 616), (710, 626), (764, 658), 40)[1:]
        + bezier((764, 658), (776, 740), (640, 796), (500, 796), 50)[1:]
        + bezier((500, 796), (360, 796), (224, 740), (236, 658), 50)[1:]
    )
    fill(layer, brim, darken(base, 0.16), ramp("x", [(230, 0.78), (350, 1.0), (500, 1.08), (650, 1.0), (770, 0.78)]) * ramp("y", [(616, 1.06), (796, 0.8)]))
    clip_tint(layer, brim, stroke_mask(bezier((246, 684), (290, 756), (400, 786), (500, 788), 40) + bezier((500, 788), (600, 786), (710, 756), (754, 684), 40)[1:], 2.4), lighten(base, 0.35), 0.5, 0.6)
    for k in (0, 1):
        clip_tint(layer, brim, stroke_mask(bezier((252, 690 + k * 22), (310, 750 + k * 14), (690, 750 + k * 14), (748, 690 + k * 22), 50), 2.0), dark, 0.22, 1.0)

    grain(layer, union(crown, brim), 4.5, seed)

    # embroidery on the front
    thread = hex_rgb(accent)
    emb = icon_layer(icon, 500, 440, 118, thread, 7.0)
    place_print(layer, emb, crown, ramp("x", [(300, 0.94), (500, 1.06), (700, 0.94)]))
    return layer, union(crown, brim), base


def render_cap(path, colour, icon, accent, view="front", seed=3, crop=None):
    layer, mask, base = draw_cap(colour, icon, accent, view, seed)
    scene = compose(studio_bg(base), layer, mask, floor=(500, 812, 270, 18), dark_bg=luma(base) > 0.62, lift=14)
    if crop:
        scene = scene.crop(tuple(int(v * S) for v in crop)).resize((W * S, H * S), Image.LANCZOS)
    finish(scene, path)


# ------------------------------------------------------------------ tote


def draw_tote(colour, lines, reference, icon, seed=4):
    base = hex_rgb(colour)
    layer = blank()
    dark, light = darken(base, 0.5), lighten(base, 0.5)

    # handles behind and in front
    back = stroke_mask(bezier((372, 470), (364, 130), (636, 130), (628, 470), 60), 30)
    fill(layer, back, darken(base, 0.18), ramp("y", [(150, 1.0), (470, 0.78)]))
    body_pts = [(286, 470), (714, 470), (736, 1012), (264, 1012)]
    body = mask_of(body_pts)
    fill(layer, body, base, ramp("x", [(270, 0.84), (380, 1.0), (500, 1.06), (620, 1.0), (730, 0.84)]) * ramp("y", [(470, 1.04), (1012, 0.92)]))
    front = stroke_mask(bezier((332, 478), (330, 218), (668, 218), (668, 478), 60), 30)
    fill(layer, intersect(front, mask_of([(0, 0), (1000, 0), (1000, 478), (0, 478)])), mix(base, light, 0.05), ramp("y", [(230, 1.1), (478, 0.92)]))
    fill(layer, front, mix(base, light, 0.05), ramp("y", [(230, 1.1), (478, 0.92)]))

    # canvas weave, top hem and stitching
    for y in range(480, 1012, 9):
        clip_tint(layer, body, stroke_mask([(260, y), (740, y)], 1.2), dark, 0.07, 0.3)
    for x in range(270, 740, 9):
        clip_tint(layer, body, stroke_mask([(x, 470), (x + 8, 1012)], 1.0), light, 0.05, 0.3)
    clip_tint(layer, body, stroke_mask([(288, 506), (712, 506)], 2.4), light, 0.4, 0.5)
    clip_tint(layer, body, stroke_mask([(290, 514), (710, 514)], 2.0), dark, 0.25, 0.5)
    clip_tint(layer, body, stroke_mask([(292, 440 + 80), (330, 590)], 12), dark, 0.0, 1)
    # box-stitch where the handles meet the bag
    for cx in (332, 668):
        for pts_ in ([(cx - 26, 478), (cx - 26, 540), (cx + 26, 540), (cx + 26, 478)], [(cx - 26, 478), (cx + 26, 540)], [(cx + 26, 478), (cx - 26, 540)]):
            clip_tint(layer, body, stroke_mask(pts_, 2.2), light, 0.45, 0.5)
    clip_tint(layer, body, stroke_mask([(286, 470), (264, 1012)], 8), dark, 0.22, 4)
    clip_tint(layer, body, stroke_mask([(714, 470), (736, 1012)], 8), dark, 0.22, 4)
    # soft folds
    for pts_, w, a in (([(380, 560), (372, 760), (392, 990)], 24, 0.08), ([(620, 580), (632, 800), (612, 990)], 24, 0.08)):
        clip_tint(layer, body, stroke_mask(pts_, w), dark, a, 14)

    grain(layer, body, 6.0, seed)

    ink = print_colour(base)
    n = len(lines)
    pl = icon_layer(icon, 500, 690 - n * 8, 92, ink, 5.0)
    pl.alpha_composite(text_layer(lines, font("bodoni-i", 52, 500), ink, (500, 790 + n * 6), 1.1))
    pl.alpha_composite(text_layer([reference], font("manrope", 18, 700), ink, (500, 830 + n * 36), 1.0, tracking=4.0, alpha=0.9))
    place_print(layer, pl, body, ramp("x", [(270, 0.92), (500, 1.04), (730, 0.92)]))
    return layer, union(body, back), base


def render_tote(path, colour, lines, reference, icon, seed=4, crop=None):
    layer, mask, base = draw_tote(colour, lines, reference, icon, seed)
    scene = compose(studio_bg(base), layer, mask, floor=(500, 1020, 280, 20), dark_bg=luma(base) > 0.62, lift=14)
    if crop:
        scene = scene.crop(tuple(int(v * S) for v in crop)).resize((W * S, H * S), Image.LANCZOS)
    finish(scene, path)


# ------------------------------------------------------------------ keychain


def metal(base_rgb):
    return base_rgb


def draw_keychain(finish_name, seed=5):
    gold = finish_name == "brass"
    base = (190, 150, 78) if gold else (196, 202, 210)
    layer = blank()
    dark, light = darken(base, 0.5), lighten(base, 0.65)

    # key ring and chain
    ring = stroke_mask(ellipse_pts(500, 220, 128, 128, 0, 360, 120), 16, closed=True)
    fill(layer, ring, base, ramp("x", [(372, 0.8), (440, 1.1), (520, 1.25), (628, 0.8)]) * ramp("y", [(92, 1.15), (348, 0.85)]))
    for i, (cx, cy) in enumerate(((500, 372), (500, 418), (500, 464))):
        link = stroke_mask(ellipse_pts(cx, cy, 17 if i % 2 == 0 else 10, 24, 0, 360, 48), 8, closed=True)
        fill(layer, link, base, ramp("x", [(470, 0.85), (500, 1.2), (530, 0.85)]))

    # the anchor charm
    thick = 34
    shaft = stroke_mask([(500, 520), (500, 900)], thick)
    top_ring = stroke_mask(ellipse_pts(500, 536, 38, 38, 0, 360, 80), 18, closed=True)
    bar = stroke_mask([(420, 612), (580, 612)], 26)
    arc_pts = [(500 + 190 * __import__("math").cos(__import__("math").radians(a)), 700 + 190 * __import__("math").sin(__import__("math").radians(a))) for a in range(15, 166, 3)]
    arc = stroke_mask(arc_pts, 34)
    fl, fr = (310, 840), (690, 840)
    tipL = mask_of([(344, 742), (290, 756), (292, 654)])
    tipR = mask_of([(656, 742), (710, 756), (708, 654)])
    charm = union(shaft, top_ring, bar, arc, tipL, tipR)
    shade = ramp("x", [(300, 0.78), (420, 1.0), (500, 1.2), (620, 1.0), (700, 0.76)]) * ramp("y", [(500, 1.12), (900, 0.86)])
    # a darker edge gives the charm thickness
    edge = blur_mask(charm, 5)
    fill(layer, charm, darken(base, 0.18), shade)
    inner = shrink(charm, 5)
    fill(layer, inner, base, shade * 1.04)
    # shine
    hl = stroke_mask([(486, 560), (486, 880)], 6)
    clip_tint(layer, charm, hl, light, 0.5, 2)
    clip_tint(layer, charm, stroke_mask([(430, 612), (470, 612)], 5), light, 0.5, 2)
    grain(layer, charm, 3.0, seed)
    return layer, union(charm, ring), base


def blur_mask(m, r):
    from art import blur

    return blur(m, r)


def shrink(m, px):
    from PIL import ImageFilter

    return m.filter(ImageFilter.MinFilter(int(px * 2) * 2 + 1))


def render_keychain(path, finish_name, seed=5, crop=None):
    layer, mask, base = draw_keychain(finish_name, seed)
    scene = compose(studio_bg(base, dark=True), layer, mask, floor=(500, 930, 200, 18), dark_bg=True, lift=16)
    if crop:
        scene = scene.crop(tuple(int(v * S) for v in crop)).resize((W * S, H * S), Image.LANCZOS)
    finish(scene, path)
