"""Assemble the logo layers into the files the website uses.

Reads  tools/logo/out/ (from build_logo.py)
Writes public/logo/kalo-logo-animated.svg   plays the intro once, then idles
       public/logo/kalo-logo-idle.svg       already drawn, gentle idle motion only
       public/logo/kalo-logo.svg            same artwork, no motion
       public/logo/kalo-badge-{96,192}.webp small round badge for the header
       src/app/icon.png                     browser tab icon

The animated file carries its own CSS, so it animates when used as a plain <img>.
Run: python tools/logo/make_svg.py
"""
import base64
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "out"
PUBLIC = ROOT / "public" / "logo"
PUBLIC.mkdir(parents=True, exist_ok=True)

data = json.loads((OUT / "layers.json").read_text())
C, G = data["colours"], data["groups"]
RING_RED = "#8A2B24"

CSS = """
*{transform-box:fill-box;transform-origin:center}
.disc{animation:disc .7s cubic-bezier(.16,1,.3,1) both}
.ring{transform:rotate(-90deg);animation:draw 1.1s cubic-bezier(.65,0,.35,1) both}
.ring-o{animation-delay:.15s}.ring-i{animation-delay:.35s;animation-direction:reverse;animation-name:undraw}
.leaf{transform-origin:50% 100%;animation:grow .7s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(.55s + var(--i)*70ms)}
.shadow{animation:fade .6s ease both .95s}
.base{transform-origin:50% 100%;animation:pop .65s cubic-bezier(.34,1.56,.64,1) both .9s}
.patch{animation:fade .01s both 1s}
.lid-in{transform-origin:72% 78%;animation:lid 1.5s both .9s}
.lid-idle{transform-origin:72% 78%;animation:bob 4.6s ease-in-out infinite 3s}
.swirl{animation:fade .5s ease both, shimmer 3.8s ease-in-out infinite;animation-delay:calc(1.75s + var(--i)*28ms),calc(3s + var(--i)*90ms)}
.star{animation:star .7s cubic-bezier(.34,1.56,.64,1) both, twinkle 3.4s ease-in-out infinite;animation-delay:calc(1.85s + var(--i)*45ms),calc(3s + var(--i)*370ms)}
.dot{animation:fade .6s ease both;animation-delay:calc(2s + var(--i)*40ms)}
.wipe{animation:wipe 1.25s cubic-bezier(.5,0,.2,1) both 1.05s}
.pop{transform-origin:50% 100%;animation:rise .6s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(1.95s + var(--i)*60ms)}
.flo{animation:spread .7s cubic-bezier(.16,1,.3,1) both 2.2s}
.flo-l{transform-origin:100% 50%}.flo-r{transform-origin:0 50%}
.line{animation:spread .6s cubic-bezier(.16,1,.3,1) both 2.3s}
.heart{animation:star .6s cubic-bezier(.34,1.56,.64,1) both 2.4s, beat 2.8s ease-in-out infinite 3.4s}
.tag{animation:tag .5s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(2.3s + var(--i)*22ms)}
@keyframes disc{from{opacity:0;transform:scale(.86)}}
@keyframes draw{from{stroke-dashoffset:1}}
@keyframes undraw{to{stroke-dashoffset:1}}
@keyframes grow{from{opacity:0;transform:scale(0) rotate(-12deg)}}
@keyframes fade{from{opacity:0}}
@keyframes pop{from{opacity:0;transform:scale(.7)}}
@keyframes lid{0%{opacity:0;transform:translate(36px,44px) rotate(11deg) scale(.7)}22%{opacity:1;transform:translate(36px,44px) rotate(11deg)}48%{transform:translate(38px,47px) rotate(12deg)}74%{transform:translate(-5px,-9px) rotate(-2.5deg)}88%{transform:translate(2px,2px) rotate(.6deg)}100%{transform:none}}
@keyframes bob{50%{transform:translate(-2px,-7px) rotate(-1.6deg)}}
@keyframes shimmer{50%{opacity:.45}}
@keyframes star{from{opacity:0;transform:scale(0) rotate(-45deg)}}
@keyframes twinkle{50%{opacity:.5;transform:scale(.78)}}
@keyframes wipe{from{transform:translateX(-1760px)}}
@keyframes rise{from{opacity:0;transform:translateY(26px) scale(.8)}}
@keyframes spread{from{opacity:0;transform:scaleX(0)}}
@keyframes beat{12%{transform:scale(1.22)}24%{transform:scale(1)}36%{transform:scale(1.14)}48%{transform:scale(1)}}
@keyframes tag{from{opacity:0;transform:translateY(10px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
"""


# Idle only: used where the logo should arrive already drawn (the home hero,
# which follows the loading screen that has just played the full intro).
IDLE_CSS = """
*{transform-box:fill-box;transform-origin:center}
.ring{transform:rotate(-90deg)}
.lid-idle{transform-origin:72% 78%;animation:bob 4.6s ease-in-out infinite}
.swirl{animation:shimmer 3.8s ease-in-out infinite;animation-delay:calc(var(--i)*90ms)}
.star{animation:twinkle 3.4s ease-in-out infinite;animation-delay:calc(var(--i)*370ms)}
.heart{animation:beat 2.8s ease-in-out infinite}
@keyframes bob{50%{transform:translate(-2px,-7px) rotate(-1.6deg)}}
@keyframes shimmer{50%{opacity:.45}}
@keyframes twinkle{50%{opacity:.5;transform:scale(.78)}}
@keyframes beat{12%{transform:scale(1.22)}24%{transform:scale(1)}36%{transform:scale(1.14)}48%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
"""
STYLES = {"intro": CSS, "idle": IDLE_CSS, "static": ""}


def b64(name):
    return "data:image/webp;base64," + base64.b64encode((OUT / f"{name}.webp").read_bytes()).decode()


def paths(items, cls, fill=None, order=None):
    items = sorted(items, key=order) if order else items
    out = []
    for i, it in enumerate(items):
        f = fill or C[it["fill"]]
        out.append(f'<path class="{cls}" style="--i:{i}" fill="{f}" fill-rule="evenodd" d="{it["d"]}"/>')
    return "".join(out)


def svg(mode):
    r = data["rings"]
    im = data["images"]
    lid, base = im["lid"], im["base"]
    patch = " ".join(f"{x},{y}" for x, y in data["patch"])
    divider = G["divider"]
    hearts = [d for d in divider if d["fill"] == "red"]
    lines = [d for d in divider if d["fill"] != "red"]
    from_box = lambda it: math.hypot(it["cx"] - 720, it["cy"] - 470)
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280" role="img" aria-label="KALO Gifts. Artisanal gifts, made with heart.">',
        f"<style>{STYLES[mode].strip()}</style>" if STYLES[mode] else "",
        "<defs>",
        '<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93322A"/><stop offset="1" stop-color="#6C2018"/></linearGradient>',
        '<linearGradient id="wf"><stop offset=".85" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
        '<radialGradient id="sh"><stop offset="0" stop-color="#5A3A1C" stop-opacity=".34"/><stop offset="1" stop-color="#5A3A1C" stop-opacity="0"/></radialGradient>',
        '<mask id="wm" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="1280"><rect class="wipe" x="-400" y="600" width="2000" height="420" fill="url(#wf)"/></mask>',
        "</defs>",
        f'<circle class="disc" cx="640" cy="640" r="640" fill="{data["cream"]}"/>',
        f'<circle class="ring ring-o" cx="640" cy="640" r="{r["outer"]["r"]}" fill="none" stroke="{RING_RED}" stroke-width="{r["outer"]["w"]}" pathLength="1" stroke-dasharray="1"/>',
        f'<circle class="ring ring-i" cx="640" cy="640" r="{r["inner"]["r"]}" fill="none" stroke="{C["gold"]}" stroke-width="{r["inner"]["w"]}" pathLength="1" stroke-dasharray="1"/>',
        "<g>" + paths(G["sprig_l"], "leaf", order=lambda it: -it["cy"]) + "</g>",
        "<g>" + paths(G["sprig_r"], "leaf", order=lambda it: -it["cy"]) + "</g>",
        "<g>" + paths(G["dots"], "dot") + "</g>",
        '<ellipse class="shadow" cx="665" cy="690" rx="290" ry="34" fill="url(#sh)"/>',
        f'<image class="base" href="{b64("base")}" x="{base["x"]}" y="{base["y"]}" width="{base["w"]}" height="{base["h"]}"/>',
        f'<polygon class="patch" points="{patch}" fill="#6E1D15"/>',
        "<g opacity=\".9\">" + paths(G["swirls"], "swirl", order=from_box) + "</g>",
        f'<g class="lid-in"><g class="lid-idle"><image href="{b64("lid")}" x="{lid["x"]}" y="{lid["y"]}" width="{lid["w"]}" height="{lid["h"]}"/></g></g>',
        "<g>" + paths(G["stars"], "star", order=from_box) + "</g>",
        '<g mask="url(#wm)">' + paths(G["word"], "word", fill="url(#wg)") + "</g>",
        "<g>" + paths(G["gifts"], "pop") + "</g>",
        paths(G["flourish_l"], "flo flo-l") + paths(G["flourish_r"], "flo flo-r"),
        paths(lines, "line") + paths(hearts, "heart"),
        "<g>" + paths(G["tagline"], "tag") + "</g>",
        "</svg>",
    ]
    return "".join(parts)


def badges():
    src = Image.open(ROOT / "assets" / "logo" / "kalo-gifts-logo-original.jpg").convert("RGB")
    big = src.resize((1280 * 2, 1280 * 2), Image.LANCZOS)
    mask = Image.new("L", big.size, 0)
    ImageDraw.Draw(mask).ellipse((44, 44, big.width - 44, big.height - 44), fill=255)
    big.putalpha(mask)
    big = big.crop((40, 40, big.width - 40, big.height - 40))
    for size in (96, 192):
        big.resize((size, size), Image.LANCZOS).save(PUBLIC / f"kalo-badge-{size}.webp", quality=92, method=6)
    big.resize((256, 256), Image.LANCZOS).save(ROOT / "src" / "app" / "icon.png")


if __name__ == "__main__":
    for name, mode in [("kalo-logo-animated.svg", "intro"), ("kalo-logo-idle.svg", "idle"), ("kalo-logo.svg", "static")]:
        (PUBLIC / name).write_text(svg(mode), encoding="utf-8")
        print(name, round((PUBLIC / name).stat().st_size / 1024), "kB")
    badges()
