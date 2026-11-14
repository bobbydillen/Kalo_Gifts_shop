"""
The launch catalogue: one definition per product that drives both the pictures and the database.

Products marked keep=True are the ones you entered yourself (name, details, colours and price are
left exactly as they are); only their pictures, stock and parcel weight are filled in.
"""
from __future__ import annotations

import json
import random

SIZES6 = ["XS", "S", "M", "L", "XL", "XXL"]
FRAME_SIZES = ["A5", "A4", "A3"]


def slug_of(name: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-").replace("--", "-")


# colours: (name, hex)
CREAM, PINE, INK, BERRY = ("Cream", "#F3ECDF"), ("Pine", "#1B4436"), ("Ink", "#16130F"), ("Berry", "#A3282A")

PRODUCTS: list[dict] = [
    # ------------------------------------------------------------------ T-shirts
    dict(
        slug="grace-tee", name="Grace Tee", category="tshirt", price=799, sort=2,
        line="Soft cotton, a quiet word on the chest.",
        description="An oversized, easy tee with a verse printed small over the heart. Heavy enough to hold its shape, soft enough to live in. Made to be worn on the slow days and the busy ones.",
        details=["Oversized fit", "180 GSM, 100% combed cotton", "Printed with soft-touch, wash-fast ink", "Machine wash cold, inside out"],
        message=("My grace is sufficient for you.", "2 Corinthians 12:9"), tag=None, christmas=False, tint="#1B4436", weight=300, dims=(30, 24, 3),
        sizes=SIZES6, colours=[CREAM, PINE, INK], stock="clothing",
        art=dict(kind="tee", lines=["My grace is", "sufficient for you."], ref="2 CORINTHIANS 12:9", icon="branch"),
    ),
    dict(
        slug="be-still-tee", name="Be Still Tee", category="tshirt", price=849, sort=3,
        line="For the days that need a little quiet.",
        description="A relaxed tee in earthy tones with a rising-sun mark and a verse for stillness. Pairs with everything, and looks good with nothing to prove.",
        details=["Relaxed fit", "200 GSM, 100% cotton", "Garment-washed for a soft, lived-in feel", "Machine wash cold, inside out"],
        message=("Be still, and know that I am God.", "Psalm 46:10"), tag=None, christmas=False, tint="#A8823F", weight=310, dims=(30, 24, 3),
        sizes=SIZES6, colours=[("Sand", "#D8C7A5"), ("Sage", "#9CAB8D"), ("Stone", "#7E827F")], stock="clothing",
        art=dict(kind="tee", lines=["Be still, and", "know that I am God."], ref="PSALM 46:10", icon="rays"),
    ),
    dict(
        slug="anchor-tee", name="Anchor Tee", category="tshirt", price=749, sort=4,
        line="Hope you can hold on to.",
        description="A clean, classic tee with an anchor and the verse that goes with it. A steady everyday piece in deep, calm colours.",
        details=["Regular fit", "180 GSM, 100% combed cotton", "Printed with soft-touch, wash-fast ink", "Machine wash cold, inside out"],
        message=("We have this hope as an anchor for the soul.", "Hebrews 6:19"), tag=None, christmas=False, tint="#1F2A4D", weight=290, dims=(30, 24, 3),
        sizes=SIZES6, colours=[("Navy", "#1F2A4D"), CREAM, ("Clay", "#B8705A")], stock="clothing",
        art=dict(kind="tee", lines=["We have this hope", "as an anchor", "for the soul."], ref="HEBREWS 6:19", icon="anchor"),
    ),
    dict(
        slug="joy-tee", name="Joy to the World Tee", category="tshirt", price=899, sort=1,
        line="Christmas, worn close.",
        description="Our Christmas tee: a bright star and the line everyone sings. A festive layer for family photos, carol nights and the whole month of December.",
        details=["Relaxed fit", "200 GSM, 100% cotton", "Printed with soft-touch, wash-fast ink", "Machine wash cold, inside out"],
        message=("Joy to the world, the Lord has come.", "Luke 2:11"), tag="Christmas edit", christmas=True, tint="#A3282A", weight=310, dims=(30, 24, 3),
        sizes=SIZES6, colours=[BERRY, PINE, CREAM], stock="clothing",
        art=dict(kind="tee", lines=["Joy to the", "world, the Lord", "has come."], ref="LUKE 2:11", icon="star"),
    ),
    # ------------------------------------------------------------------ Hoodie
    dict(
        slug="be-still-hoodie", name="Be Still Hoodie", category="hoodie", price=1499, sort=5,
        line="Heavy fleece for slow winter mornings.",
        description="A cosy, brushed-fleece hoodie with the verse printed across the chest. Roomy through the body, warm in the hood, and made to be lived in all winter.",
        details=["Relaxed fit", "340 GSM brushed fleece inside", "Kangaroo pocket and ribbed cuffs", "Machine wash cold, inside out"],
        message=("Be still, and know that I am God.", "Psalm 46:10"), tag="Christmas edit", christmas=True, tint="#A3282A", weight=750, dims=(34, 28, 6),
        sizes=SIZES6, colours=[PINE, BERRY, INK], stock="hoodie",
        art=dict(kind="hoodie", lines=["Be still, and", "know that I am God."], ref="PSALM 46:10", icon="rays"),
    ),
    # ------------------------------------------------------------------ Cap, tote, keychain
    dict(
        slug="hold-fast-cap", old_slug="light-cap", name="Hold Fast Cap", category="cap", price=449, sort=20,
        line="A small anchor, worn every day.",
        description="A six-panel cotton cap with a tiny embroidered anchor on the front. Easy to wear, easy to love, and adjustable to fit.",
        details=["One size, adjustable strap", "Cotton twill", "Embroidered anchor", "Spot clean"],
        message=("We have this hope as an anchor for the soul.", "Hebrews 6:19"), tag=None, christmas=False, tint="#1B4436", weight=120, dims=(24, 20, 10),
        sizes=[], colours=[CREAM, PINE, INK], stock="cap",
        art=dict(kind="cap", icon="anchor"),
    ),
    dict(
        slug="carry-tote", name="Carry Tote", category="tote", price=499, sort=21,
        line="Sturdy canvas for the everyday.",
        description="A roomy canvas tote with a verse about sharing the load. Strong enough for books, groceries and everything in between.",
        details=["Heavy cotton canvas", "Long shoulder handles", "Reinforced, box-stitched handles", "Machine wash cold"],
        message=("Carry each other's burdens.", "Galatians 6:2"), tag=None, christmas=False, tint="#1B4436", weight=260, dims=(38, 34, 3),
        sizes=[], colours=[CREAM, INK, PINE], stock="tote",
        art=dict(kind="tote", lines=["Carry each", "other's burdens."], ref="GALATIANS 6:2", icon="cross"),
    ),
    dict(
        slug="anchor-keychain", name="Anchor Keychain", category="keychain", price=249, sort=22,
        line="Hope that travels with your keys.",
        description="A small metal anchor on a sturdy ring: a little reminder to keep close. Packed in a gift pouch, so it is ready to give.",
        details=["Metal anchor charm and ring", "Brass or silver finish", "Comes in a gift pouch"],
        message=("This hope we have as an anchor of the soul.", "Hebrews 6:19"), tag=None, christmas=False, tint="#A8823F", weight=60, dims=(12, 8, 3),
        sizes=[], colours=[("Brass", "#B8934A"), ("Silver", "#C4CAD2")], stock="keychain",
        art=dict(kind="keychain"),
    ),
    # ------------------------------------------------------------------ Bottles (yours: kept as they are)
    dict(
        slug="mood-mug", keep=True, name="Mood Mug", category="bottle", sort=10, weight=650, dims=(26, 11, 11),
        colours=[("Midnight Mood", "#1C1A19"), ("Cloud Mood", "#F5F4F0"), ("Crush Mood", "#F2B8B0"), ("Dreamy Mood", "#BFD3E6"), ("Sunny Mood", "#F3EBC4")],
        stock="bottle", art=dict(kind="none"),
    ),
    dict(
        slug="thirst-crusher", keep=True, name="Thirst Crusher", category="bottle", sort=11, weight=620, dims=(28, 9, 9),
        colours=[("Blush Crush", "#F2D9D3"), ("Sky Crush", "#9CC4E8"), ("Navy Crush", "#1F2A4D"), ("Berry Crush", "#D9246E"), ("Midnight Crush", "#151515")],
        stock="bottle", art=dict(kind="none"),
    ),
    dict(
        slug="flowstate-bottles", keep=True, name="FlowState Bottles", category="bottle", sort=12, weight=700, dims=(28, 12, 12),
        colours=[("Blush Sand", "#E2DFD7"), ("Lavender Haze", "#D3D1DE"), ("Sage Green", "#B2AC88"), ("Vanilla Cream", "#F2D8AB"), ("Midnight Black", "#0B0C10")],
        stock="bottle", art=dict(kind="bottle", shape="tumbler", lines=["KALO"], ref="GIFTS", icon=""),
        fix_colours={"Vanilla Cream:": "Vanilla Cream"},
    ),
    dict(
        slug="slim-sip", keep=True, name="Slim Sip", category="bottle", sort=13, weight=450, dims=(27, 8, 8),
        colours=[("Sunny Sip", "#F2CC2E"), ("Blush Sip", "#F3DDE3"), ("Matcha Sip", "#8FA66A"), ("Midnight Sip", "#121212"), ("Ocean Sip", "#6F9AD6")],
        stock="bottle", art=dict(kind="bottle", shape="slim", lines=["KALO"], ref="GIFTS", icon=""),
    ),
    dict(
        slug="tiny-tank", keep=True, name="Tiny Tank", category="bottle", sort=14, weight=300, dims=(20, 8, 8),
        colours=[("Cherry Tank", "#B3202E")], stock="bottle_single", art=dict(kind="bottle", shape="tank", lines=["KALO"], ref="GIFTS", icon=""),
    ),
    dict(
        slug="wellspring-bottle", name="Wellspring Bottle", category="bottle", price=699, sort=15,
        line="A verse to sip by, all day long.",
        description="A slim stainless bottle with a verse about joy and living water. Keeps drinks cold for hours and fits most bags and cup holders.",
        details=["304 stainless steel", "Vacuum insulated: cold for 12 hours, hot for 6", "Leakproof screw-on lid with carry loop", "BPA free", "Hand wash"],
        message=("With joy you will draw water from the wells of salvation.", "Isaiah 12:3"), tag="Christmas edit", christmas=True, tint="#C23A36", weight=560, dims=(27, 8, 8),
        sizes=[], colours=[CREAM, PINE, BERRY], stock="bottle",
        art=dict(kind="bottle", shape="wellspring", lines=["With joy you", "will draw water"], ref="ISAIAH 12:3", icon="drop"),
    ),
    # ------------------------------------------------------------------ Photo frames
    dict(
        slug="custom-photo-frame", name="Custom Photo Frame", category="frame", price=549, sort=30, custom_photo=True, active=True,
        size_prices={"A5": 549, "A4": 849, "A3": 1349},
        line="Your photo, printed and framed.",
        description="Upload your favourite photo, fit it to the frame and see exactly how it will look. We print it on quality photo paper and frame it for you, ready to hang or stand.",
        details=["Printed on quality photo paper", "Choose A5, A4 or A3", "Black, white or natural wood frame", "Made to order, ready to hang or stand"],
        tag=None, christmas=False, tint="#1B4436", weight=1100, dims=(44, 33, 6),
        sizes=FRAME_SIZES, colours=[("Black", "#1A1A1A"), ("White", "#F2F0EA"), ("Natural wood", "#B98B58")], stock="made_to_order",
        art=dict(kind="frame", art="photo", lines=[], ref="", icon="star"),
    ),
    dict(
        slug="be-still-frame", name="Be Still Frame", category="frame", price=499, sort=31,
        size_prices={"A5": 499, "A4": 799, "A3": 1249},
        line="A verse for the wall.",
        description="A calm, typographic print of Psalm 46:10 in a clean frame with a soft mat. A quiet reminder for the hallway, desk or bedside.",
        details=["Printed on 250 GSM matte art paper", "Solid frame with a soft white mat", "Ready to hang or stand", "Choose A5, A4 or A3"],
        message=("Be still, and know that I am God.", "Psalm 46:10"), tag=None, christmas=False, tint="#1B4436", weight=1100, dims=(44, 33, 6),
        sizes=FRAME_SIZES, colours=[("Black", "#1A1A1A"), ("White", "#F2F0EA"), ("Natural wood", "#B98B58")], stock="frame",
        art=dict(kind="frame", art="verse", lines=["Be still, and", "know that I", "am God."], ref="PSALM 46:10", icon="rays"),
    ),
    dict(
        slug="grace-upon-grace-frame", name="Grace Upon Grace Frame", category="frame", price=549, sort=32,
        size_prices={"A5": 549, "A4": 849, "A3": 1299},
        line="Grace, one gift after another.",
        description="A simple olive-branch print of John 1:16 in a clean frame. A gentle reminder, and a lovely gift for new homes and anniversaries.",
        details=["Printed on 250 GSM matte art paper", "Solid frame with a soft white mat", "Ready to hang or stand", "Choose A5, A4 or A3"],
        message=("Grace upon grace.", "John 1:16"), tag=None, christmas=False, tint="#A8823F", weight=1100, dims=(44, 33, 6),
        sizes=FRAME_SIZES, colours=[("Black", "#1A1A1A"), ("White", "#F2F0EA"), ("Natural wood", "#B98B58")], stock="frame",
        art=dict(kind="frame", art="verse", lines=["Grace upon", "grace."], ref="JOHN 1:16", icon="branch"),
    ),
    dict(
        slug="shepherd-frame", name="The Lord Is My Shepherd Frame", category="frame", price=599, sort=33,
        size_prices={"A5": 599, "A4": 899, "A3": 1349},
        line="Psalm 23, framed.",
        description="The first line of the best-loved psalm, set in elegant type in a classic frame. A comfort for the wall of any room.",
        details=["Printed on 250 GSM matte art paper", "Solid frame with a soft white mat", "Ready to hang or stand", "Choose A5, A4 or A3"],
        message=("The Lord is my shepherd; I shall not want.", "Psalm 23:1"), tag=None, christmas=False, tint="#1B4436", weight=1100, dims=(44, 33, 6),
        sizes=FRAME_SIZES, colours=[("Black", "#1A1A1A"), ("White", "#F2F0EA"), ("Natural wood", "#B98B58")], stock="frame",
        art=dict(kind="frame", art="verse", lines=["The Lord is", "my shepherd;", "I shall not want."], ref="PSALM 23:1", icon="cross"),
    ),
    # ------------------------------------------------------------------ Hampers
    dict(
        slug="joy-hamper", name="The Joy Hamper", category="hamper", price=2199, sort=40, contains=["be-still-hoodie", "wellspring-bottle", "anchor-keychain"],
        line="A hoodie, a bottle and a keychain, wrapped and ready.",
        description="A gift for someone who deserves a proper surprise: our Be Still Hoodie, a Wellspring Bottle and an Anchor Keychain, packed in a gift box with tissue and a ribbon. Add a handwritten card to make it theirs.",
        details=["Be Still Hoodie, Wellspring Bottle and Anchor Keychain", "Packed in a gift box with tissue and ribbon", "Choose the hoodie size and colour", "Add a handwritten card"],
        tag="Hamper", christmas=True, tint="#A3282A", weight=1500, dims=(35, 28, 15), sizes=SIZES6, colours=[], stock="hamper",
        art=dict(kind="hamper", box="berry", label="Joy",
                 items=[("hoodie", dict(colour="#1B4436", lines=["Be still, and", "know that I am God."], ref="PSALM 46:10", icon="rays"), 0.56, (322, 690)),
                        ("bottle", dict(shape="wellspring", colour="#F3ECDF", lines=["With joy you", "will draw water"], ref="ISAIAH 12:3", icon="drop"), 0.6, (690, 690)),
                        ("keychain", dict(finish="brass", anchor=(500, 640)), 0.5, (500, 760))]),
    ),
    dict(
        slug="everyday-hamper", name="The Everyday Hamper", category="hamper", price=1699, sort=41, contains=["grace-tee", "carry-tote", "hold-fast-cap"],
        line="A tee, a tote and a cap for the daily round.",
        description="Three easy pieces for every day: a Grace Tee, a Carry Tote and a Hold Fast Cap, packed together in a gift box with tissue and a ribbon. A thoughtful gift for friends and family.",
        details=["Grace Tee, Carry Tote and Hold Fast Cap", "Packed in a gift box with tissue and ribbon", "Choose the tee size and colour", "Add a handwritten card"],
        tag="Hamper", christmas=True, tint="#A8823F", weight=1300, dims=(35, 28, 15), sizes=SIZES6, colours=[], stock="hamper",
        art=dict(kind="hamper", box="kraft", label="Daily",
                 items=[("tee", dict(colour="#F3ECDF", lines=["My grace is", "sufficient for you."], ref="2 CORINTHIANS 12:9", icon="branch"), 0.55, (330, 690)),
                        ("tote", dict(colour="#16130F", lines=["Carry each", "other's burdens."], ref="GALATIANS 6:2", icon="cross"), 0.5, (690, 700)),
                        ("cap", dict(colour="#1B4436", icon="anchor", accent="#F3ECDF"), 0.5, (500, 770))]),
    ),
    dict(
        slug="build-your-own-hamper", keep=True, name="Build your own hamper", category="hamper", sort=39, weight=500, dims=(35, 28, 15),
        colours=[], stock="none",
        art=dict(kind="hamper", box="pine", label="Yours",
                 items=[("tee", dict(colour="#9CAB8D", lines=["Be still, and", "know that I am God."], ref="PSALM 46:10", icon="rays"), 0.55, (320, 690)),
                        ("bottle", dict(shape="slim", colour="#F2CC2E", lines=["KALO"], ref="GIFTS", icon=""), 0.56, (500, 700)),
                        ("keychain", dict(finish="silver", anchor=(500, 640)), 0.5, (690, 760))]),
    ),
]

# ---------------------------------------------------------------- stock

CLOTHING_BASE = {"XS": 4, "S": 9, "M": 14, "L": 12, "XL": 8, "XXL": 4}
HOODIE_BASE = {"XS": 3, "S": 6, "M": 10, "L": 9, "XL": 6, "XXL": 3}


def stock_for(p: dict) -> list[tuple[str, str, int]]:
    rng = random.Random(p["slug"])
    kind = p.get("stock", "none")
    colours = [c[0] for c in p.get("colours", [])]
    rows: list[tuple[str, str, int]] = []
    if kind in ("clothing", "hoodie"):
        base = CLOTHING_BASE if kind == "clothing" else HOODIE_BASE
        for c in colours:
            for s in p["sizes"]:
                rows.append((c, s, max(1, base[s] + rng.randint(-2, 3))))
    elif kind == "frame":
        for c in colours:
            for s in p["sizes"]:
                rows.append((c, s, rng.randint(6, 14)))
    elif kind == "bottle":
        for c in colours:
            rows.append((c, "", rng.randint(12, 28)))
    elif kind == "bottle_single":
        rows.append((colours[0], "", 24))
    elif kind == "cap":
        for c in colours:
            rows.append((c, "", rng.randint(12, 22)))
    elif kind == "tote":
        for c in colours:
            rows.append((c, "", rng.randint(14, 26)))
    elif kind == "keychain":
        for c in colours:
            rows.append((c, "", rng.randint(35, 70)))
    return rows


# a few items running low, so the "Only 2 left" cue can be seen on the live shop
LOW = {("grace-tee", "Ink", "XXL"): 2, ("be-still-hoodie", "Berry", "XS"): 1, ("anchor-tee", "Clay", "XL"): 3, ("joy-tee", "Berry", "XXL"): 2, ("slim-sip", "Matcha Sip", ""): 3}


def final_stock(p: dict):
    return [(c, s, LOW.get((p["slug"], c, s), q)) for c, s, q in stock_for(p)]


def to_json() -> str:
    out = []
    for p in PRODUCTS:
        q = {k: v for k, v in p.items() if k not in ("art", "stock")}
        q["stock_rows"] = [dict(colour=c, size=s, qty=n) for c, s, n in final_stock(p)]
        q["has_stock"] = p.get("stock") not in ("none", "made_to_order")
        out.append(q)
    return json.dumps(out, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    print(to_json())
