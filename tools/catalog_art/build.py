"""
Renders every catalogue image into public/catalog/<slug>/ and prints the catalogue as JSON.

    python build.py render          draw all pictures (a few minutes, uses every CPU core)
    python build.py render <slug>   draw one product only
    python build.py json            print the catalogue (with picture lists) for the database
    python build.py sql             print the database load as one SQL statement
"""
from __future__ import annotations

import json
import pathlib
import sys
from concurrent.futures import ProcessPoolExecutor

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))

from catalog import PRODUCTS, slug_of, to_json  # noqa: E402

OUT = HERE.parent.parent / "public" / "catalog"

FRAME_KEY = {"Black": "black", "White": "white", "Natural wood": "wood"}
FRAME_SCALE = {"A5": 2.8, "A4": 2.45, "A3": 2.0}

# 4:5 crops (in 1000 x 1250 picture coordinates) for the close-up shots
CROPS = {
    "tee": (250, 330, 750, 955),
    "hoodie": (260, 440, 740, 1040),
    "cap": (300, 230, 700, 730),
    "tote": (300, 560, 700, 1060),
    "keychain": (300, 500, 700, 1000),
    "slim": [(330, 540, 670, 965), (330, 200, 670, 625)],
    "tumbler": [(300, 520, 700, 1020), (330, 60, 730, 560)],
    "tank": [(340, 620, 660, 1020), (340, 240, 660, 640)],
    "wellspring": [(330, 540, 670, 965), (330, 100, 670, 525)],
}


def frame_corner_crop(size: str):
    mm = {"A5": (148, 210), "A4": (210, 297), "A3": (297, 420)}[size]
    s = FRAME_SCALE[size]
    fw, fh = mm[0] * s, mm[1] * s
    x0, y0 = 500 - fw / 2, 560 - fh / 2
    return (x0 - 40, y0 - 30, x0 - 40 + 360, y0 - 30 + 450)


def jobs_for(p: dict):
    """Returns [(module, function, args, kwargs, filename, colour_name_or_empty)]."""
    art = p.get("art", {})
    kind = art.get("kind")
    slug = p["slug"]
    d = OUT / slug
    colours = p.get("colours", [])
    out = []

    def add(module, fn, args, kwargs, name, colour=""):
        out.append((module, fn, (str(d / name),) + tuple(args), kwargs, name, colour))

    if kind == "tee":
        for i, (cn, ch) in enumerate(colours, 1):
            add("garments", "render_tee", (ch, art["lines"], art["ref"], art["icon"]), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        first = colours[0][1]
        add("garments", "render_tee", (first, art["lines"], art["ref"], art["icon"]), dict(view="back", seed=7), "back.webp")
        add("garments", "render_tee", (first, art["lines"], art["ref"], art["icon"]), dict(seed=1, crop=CROPS["tee"]), "detail.webp")
    elif kind == "hoodie":
        for i, (cn, ch) in enumerate(colours, 1):
            add("more_garments", "render_hoodie", (ch, art["lines"], art["ref"], art["icon"]), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        add("more_garments", "render_hoodie", (colours[0][1], art["lines"], art["ref"], art["icon"]), dict(seed=1, crop=CROPS["hoodie"]), "detail.webp")
    elif kind == "cap":
        for i, (cn, ch) in enumerate(colours, 1):
            accent = "#1B4436" if cn == "Cream" else "#F3ECDF"
            add("more_garments", "render_cap", (ch, art["icon"], accent), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        add("more_garments", "render_cap", (colours[0][1], art["icon"], "#1B4436"), dict(seed=1, crop=CROPS["cap"]), "detail.webp")
    elif kind == "tote":
        for i, (cn, ch) in enumerate(colours, 1):
            add("more_garments", "render_tote", (ch, art["lines"], art["ref"], art["icon"]), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        add("more_garments", "render_tote", (colours[0][1], art["lines"], art["ref"], art["icon"]), dict(seed=1, crop=CROPS["tote"]), "detail.webp")
    elif kind == "keychain":
        for i, (cn, _) in enumerate(colours, 1):
            add("more_garments", "render_keychain", ("brass" if cn == "Brass" else "silver",), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        add("more_garments", "render_keychain", ("brass",), dict(crop=CROPS["keychain"]), "detail.webp")
    elif kind == "bottle":
        shape = art["shape"]
        for i, (cn, ch) in enumerate(colours, 1):
            add("bottles", "render_bottle", (shape, ch, art["lines"], art["ref"], art["icon"]), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        first = colours[0][1]
        for n, box in enumerate(CROPS[shape], 1):
            add("bottles", "render_bottle", (shape, first, art["lines"], art["ref"], art["icon"]), dict(seed=1, crop=box), f"detail-{n}.webp")
    elif kind == "frame":
        for i, (cn, _) in enumerate(colours, 1):
            add("frames", "render_frame", ("A4", FRAME_KEY[cn], art["art"], art["lines"], art["ref"], art["icon"]), dict(seed=i), f"{i}-{slug_of(cn)}.webp", cn)
        add("frames", "render_sizes", ("wood", art["lines"] or ["Your", "photo"], art["ref"], art["icon"]), dict(), "sizes.webp")
        add("frames", "render_frame", ("A4", FRAME_KEY[colours[2][0]], art["art"], art["lines"], art["ref"], art["icon"]), dict(seed=3, crop=frame_corner_crop("A4")), "detail.webp")
    elif kind == "hamper":
        add("hampers", "render_hamper_closed", (), dict(box=art["box"], label=art["label"]), "1-closed.webp")
        add("hampers", "render_hamper_open", (art["items"],), dict(box=art["box"]), "2-open.webp")
    return out


def run(job):
    module, fn, args, kwargs, *_ = job
    mod = __import__(module)
    getattr(mod, fn)(*args, **kwargs)
    return args[0] if args else fn


def render(only: str | None = None):
    all_jobs = []
    for p in PRODUCTS:
        if only and p["slug"] != only:
            continue
        all_jobs += jobs_for(p)
    print(f"{len(all_jobs)} pictures to draw")
    done = 0
    with ProcessPoolExecutor(12) as ex:
        for _ in ex.map(run, all_jobs):
            done += 1
            if done % 10 == 0:
                print(f"  {done}/{len(all_jobs)}")
    print("finished")


def full_json() -> str:
    data = json.loads(to_json())
    for item, p in zip(data, PRODUCTS):
        item["images"] = [dict(path=f"/catalog/{p['slug']}/{name}", colour=colour) for *_, name, colour in jobs_for(p)]
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


LOADER = r"""
do $load$
declare
  data jsonb := $json$__JSON__$json$::jsonb;
  p jsonb; v_id uuid; v_keep boolean; pos int; k text; v text;
begin
  for p in select e from jsonb_array_elements(data) as e loop
    v_keep := coalesce((p->>'keep')::boolean, false);
    select id into v_id from public.products where slug = coalesce(p->>'old_slug', p->>'slug');
    if v_id is null then select id into v_id from public.products where slug = p->>'slug'; end if;

    if v_id is null then
      insert into public.products
        (slug, name, category, price, line, description, message_text, message_ref, details, sizes, tint, tag, christmas, contains, active, sort,
         weight_g, length_cm, breadth_cm, height_cm, custom_photo, size_prices)
      values
        (p->>'slug', p->>'name', p->>'category', (p->>'price')::int, p->>'line', p->>'description',
         nullif(p->'message'->>0, ''), nullif(p->'message'->>1, ''),
         array(select jsonb_array_elements_text(p->'details')), array(select jsonb_array_elements_text(coalesce(p->'sizes', '[]'::jsonb))),
         p->>'tint', nullif(p->>'tag', ''), coalesce((p->>'christmas')::boolean, false),
         array(select jsonb_array_elements_text(coalesce(p->'contains', '[]'::jsonb))), coalesce((p->>'active')::boolean, true), (p->>'sort')::int,
         (p->>'weight')::int, (p->'dims'->>0)::int, (p->'dims'->>1)::int, (p->'dims'->>2)::int,
         coalesce((p->>'custom_photo')::boolean, false), coalesce(p->'size_prices', '{}'::jsonb))
      returning id into v_id;
    elsif v_keep then
      update public.products set sort = (p->>'sort')::int, weight_g = (p->>'weight')::int,
             length_cm = (p->'dims'->>0)::int, breadth_cm = (p->'dims'->>1)::int, height_cm = (p->'dims'->>2)::int
       where id = v_id;
    else
      update public.products set
        slug = p->>'slug', name = p->>'name', category = p->>'category', price = (p->>'price')::int, line = p->>'line', description = p->>'description',
        message_text = nullif(p->'message'->>0, ''), message_ref = nullif(p->'message'->>1, ''),
        details = array(select jsonb_array_elements_text(p->'details')), sizes = array(select jsonb_array_elements_text(coalesce(p->'sizes', '[]'::jsonb))),
        tint = p->>'tint', tag = nullif(p->>'tag', ''), christmas = coalesce((p->>'christmas')::boolean, false),
        contains = array(select jsonb_array_elements_text(coalesce(p->'contains', '[]'::jsonb))),
        active = coalesce((p->>'active')::boolean, true), sort = (p->>'sort')::int,
        weight_g = (p->>'weight')::int, length_cm = (p->'dims'->>0)::int, breadth_cm = (p->'dims'->>1)::int, height_cm = (p->'dims'->>2)::int,
        custom_photo = coalesce((p->>'custom_photo')::boolean, false), size_prices = coalesce(p->'size_prices', '{}'::jsonb)
      where id = v_id;
    end if;

    if not v_keep then
      delete from public.product_colours where product_id = v_id;
      insert into public.product_colours (product_id, name, hex, position)
        select v_id, c->>0, c->>1, (ord - 1)::int from jsonb_array_elements(coalesce(p->'colours', '[]'::jsonb)) with ordinality as t(c, ord);
    elsif p ? 'fix_colours' then
      for k, v in select key, value from jsonb_each_text(p->'fix_colours') loop
        update public.product_colours set name = v where product_id = v_id and name = k;
      end loop;
    end if;

    delete from public.stock where product_id = v_id;
    if coalesce((p->>'has_stock')::boolean, false) then
      insert into public.stock (product_id, colour, size, qty)
        select v_id, r->>'colour', r->>'size', (r->>'qty')::int from jsonb_array_elements(p->'stock_rows') as r;
    end if;

    delete from public.product_images where product_id = v_id and path like '/catalog/%';
    select coalesce(max(position) + 1, 0) into pos from public.product_images where product_id = v_id;
    insert into public.product_images (product_id, path, position, colour)
      select v_id, im->>'path', pos + (ord - 1)::int, im->>'colour' from jsonb_array_elements(p->'images') with ordinality as t(im, ord);
  end loop;
end
$load$;
"""


def load_sql() -> str:
    return LOADER.replace("__JSON__", full_json())


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "render"
    if cmd == "render":
        render(sys.argv[2] if len(sys.argv) > 2 else None)
    elif cmd == "json":
        print(full_json())
    elif cmd == "sql":
        print(load_sql())
