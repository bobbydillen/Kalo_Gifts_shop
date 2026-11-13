"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { deleteProduct, saveProduct } from "@/app/admin/products/actions";
import { ProductPhotos } from "@/components/admin/ProductPhotos";
import { slugify, validateProduct, type AdminImage, type ProductInput } from "@/lib/admin-products";
import { categories, STANDARD_SIZES, type Category } from "@/lib/catalog";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-night/60 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

function Section({ title, hint, children }: { title: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-hair bg-pine p-6">
      <h2 className="text-2xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-faint">{hint}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

type ColourRow = { key: number; name: string; hex: string };

/** Editor for one product. Used for both "new" and "edit". */
export function ProductForm({
  initial,
  others,
  images,
}: {
  initial?: ProductInput & { id: string };
  others: { slug: string; name: string }[]; // non-hamper products, for the hamper picker
  images: AdminImage[];
}) {
  const router = useRouter();
  const creating = !initial;
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<Category>(initial?.category ?? "tshirt");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [weight, setWeight] = useState(String(initial?.weight_g ?? 300));
  const [length, setLength] = useState(String(initial?.length_cm ?? 25));
  const [breadth, setBreadth] = useState(String(initial?.breadth_cm ?? 20));
  const [height, setHeight] = useState(String(initial?.height_cm ?? 5));
  const [line, setLine] = useState(initial?.line ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [christmas, setChristmas] = useState(initial?.christmas ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [sort, setSort] = useState(String(initial?.sort ?? 0));
  const [messageText, setMessageText] = useState(initial?.message_text ?? "");
  const [messageRef, setMessageRef] = useState(initial?.message_ref ?? "");
  const [details, setDetails] = useState((initial?.details ?? []).join("\n"));
  const [tint, setTint] = useState(initial?.tint ?? "#1B4436");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [contains, setContains] = useState<string[]>(initial?.contains ?? []);

  const [colours, setColours] = useState<ColourRow[]>(
    (initial?.colours ?? []).map((c, i) => ({ key: i + 1, ...c })),
  );
  const [nextKey, setNextKey] = useState((initial?.colours.length ?? 0) + 1);

  // Stock is kept as text so a blank box can mean "not tracked". Keyed by colour row and size,
  // so renaming a colour does not lose its numbers.
  const stockKey = (colourKey: number, size: string) => `${colourKey}|${size}`;
  const [stock, setStock] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const s of initial?.stock ?? []) {
      const row = (initial?.colours ?? []).findIndex((c) => c.name === s.colour);
      start[stockKey(s.colour ? row + 1 : 0, s.size)] = String(s.qty);
    }
    return start;
  });

  const isHamper = category === "hamper";
  const colourColumns = colours.length ? colours.map((c) => ({ key: c.key, label: c.name || "(unnamed)" })) : [{ key: 0, label: "All" }];
  const sizeColumns = sizes.length ? sizes : [""];

  function build(): ProductInput {
    const stockRows: ProductInput["stock"] = [];
    for (const col of colours.length ? colours : [{ key: 0, name: "" }]) {
      for (const size of sizeColumns) {
        const raw = (stock[stockKey(col.key, size)] ?? "").trim();
        if (raw === "") continue;
        stockRows.push({ colour: col.name.trim(), size, qty: Number(raw) });
      }
    }
    return {
      id: initial?.id,
      slug: creating ? slug : initial!.slug,
      name,
      category,
      price: Number(price),
      weight_g: Number(weight),
      length_cm: Number(length),
      breadth_cm: Number(breadth),
      height_cm: Number(height),
      line,
      description,
      message_text: messageText,
      message_ref: messageRef,
      details: details.split("\n"),
      sizes,
      tint,
      tag,
      christmas,
      contains,
      active,
      sort: Number(sort) || 0,
      colours: colours.map(({ name, hex }) => ({ name, hex })),
      stock: stockRows,
    };
  }

  function submit() {
    setResult(null);
    const input = build();
    const checked = validateProduct(input, creating);
    if (!checked.ok) {
      setResult({ ok: false, text: checked.error });
      return;
    }
    start(async () => {
      const res = await saveProduct(checked.value);
      if (!res.ok) {
        setResult({ ok: false, text: res.error });
        return;
      }
      if (creating) {
        router.push(`/admin/products/${res.id}?created=1`);
      } else {
        setResult({ ok: true, text: "Saved. The shop has been updated." });
        router.refresh();
      }
    });
  }

  function remove() {
    if (!initial) return;
    if (!window.confirm(`Delete ${initial.name}? Its photos and stock go too. This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteProduct(initial.id);
      if (res.ok) router.push("/admin/products");
      else setResult({ ok: false, text: res.error });
    });
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Section title={<>The <em>basics</em></>}>
        <label className="block text-sm text-mist">
          Name
          <input
            required
            value={name}
            maxLength={120}
            onChange={(e) => {
              setName(e.target.value);
              if (creating && !slugTouched) setSlug(slugify(e.target.value));
            }}
            className={field}
          />
        </label>

        <label className="block text-sm text-mist">
          Web address
          <div className="mt-2 flex items-center gap-2">
            <span className="shrink-0 text-faint">/product/</span>
            <input
              value={creating ? slug : initial!.slug}
              readOnly={!creating}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={`${field} !mt-0 ${creating ? "" : "opacity-60"}`}
            />
          </div>
          <span className="mt-1 block text-xs text-faint">
            {creating ? "Made from the name. It cannot be changed after saving." : "Fixed once a product is created, so links and bags keep working."}
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm text-mist">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={field}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-mist">
            Price (₹)
            <input
              required
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              className={field}
            />
          </label>
        </div>

        <fieldset className="rounded-2xl border border-hair-2 p-5">
          <legend className="px-2 text-sm text-mist">
            Parcel for shipping <span className="text-faint">(packed, with the box)</span>
          </legend>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Weight (grams)", weight, setWeight],
              ["Length (cm)", length, setLength],
              ["Width (cm)", breadth, setBreadth],
              ["Height (cm)", height, setHeight],
            ].map(([label, value, set]) => (
              <label key={label as string} className="block text-sm text-mist">
                {label as string}
                <input
                  required
                  inputMode="numeric"
                  value={value as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value.replace(/\D/g, ""))}
                  className={field}
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">
            Sent to Shiprocket to price and book the delivery. When an order has several items the weights are added up
            and the heights are stacked.
          </p>
        </fieldset>

        <label className="block text-sm text-mist">
          One-line hook <span className="text-faint">(shown under the name)</span>
          <input value={line} maxLength={200} onChange={(e) => setLine(e.target.value)} className={field} />
        </label>

        <label className="block text-sm text-mist">
          Description
          <textarea
            rows={4}
            value={description}
            maxLength={2000}
            onChange={(e) => setDescription(e.target.value)}
            className={field}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm text-mist">
            Label on the card <span className="text-faint">(optional)</span>
            <input value={tag} maxLength={40} onChange={(e) => setTag(e.target.value)} placeholder="Christmas edit" className={field} />
          </label>
          <label className="block text-sm text-mist">
            Display order <span className="text-faint">(smaller shows first)</span>
            <input inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value.replace(/[^\d-]/g, ""))} className={field} />
          </label>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5 accent-[#d4b373]" />
            Show in the shop
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={christmas} onChange={(e) => setChristmas(e.target.checked)} className="size-5 accent-[#d4b373]" />
            Part of the Christmas edit
          </label>
        </div>
      </Section>

      <Section title={<>The words <em>on it</em></>} hint="The verse or message printed on the piece. Shown on a card on the product page.">
        <label className="block text-sm text-mist">
          Words
          <textarea rows={2} value={messageText} maxLength={400} onChange={(e) => setMessageText(e.target.value)} className={field} />
        </label>
        <label className="block text-sm text-mist">
          Reference <span className="text-faint">(for example John 3:16)</span>
          <input value={messageRef} maxLength={80} onChange={(e) => setMessageRef(e.target.value)} className={field} />
        </label>
      </Section>

      <Section title={<>Good to <em>know</em></>} hint="One short fact per line: fabric, fit, care.">
        <textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className={field} aria-label="Details, one per line" />
      </Section>

      <Section title={<>Look and <em>feel</em></>}>
        <label className="flex items-center gap-4 text-sm text-mist">
          <input type="color" value={tint} onChange={(e) => setTint(e.target.value)} className="h-11 w-16 rounded-lg border border-hair-2 bg-transparent" />
          Glow colour behind the product when there is no photo
        </label>

        <div>
          <p className="text-sm text-mist">Colours</p>
          {colours.length === 0 && <p className="mt-1 text-sm text-faint">No colours. Add some if the product comes in more than one.</p>}
          <ul className="mt-3 space-y-3">
            {colours.map((c) => (
              <li key={c.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => setColours(colours.map((x) => (x.key === c.key ? { ...x, hex: e.target.value } : x)))}
                  aria-label={`Colour swatch for ${c.name || "new colour"}`}
                  className="h-11 w-14 shrink-0 rounded-lg border border-hair-2 bg-transparent"
                />
                <input
                  value={c.name}
                  maxLength={40}
                  placeholder="Colour name"
                  onChange={(e) => setColours(colours.map((x) => (x.key === c.key ? { ...x, name: e.target.value } : x)))}
                  className={`${field} !mt-0`}
                />
                <button
                  type="button"
                  onClick={() => setColours(colours.filter((x) => x.key !== c.key))}
                  aria-label={`Remove ${c.name || "colour"}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-hair-2 text-lg hover:border-berry-light"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setColours([...colours, { key: nextKey, name: "", hex: "#F3ECDF" }]);
              setNextKey(nextKey + 1);
            }}
            className="chip mt-4"
          >
            + Add a colour
          </button>
        </div>

        <fieldset>
          <legend className="text-sm text-mist">
            Sizes <span className="text-faint">(all clothing shares one size chart)</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {STANDARD_SIZES.map((s) => (
              <label key={s} className="chip flex cursor-pointer items-center gap-2 has-[:checked]:border-cream has-[:checked]:bg-cream has-[:checked]:text-night">
                <input type="checkbox" className="sr-only" checked={sizes.includes(s)} onChange={() => setSizes(toggle(sizes, s))} />
                {s}
              </label>
            ))}
          </div>
          {isHamper && <p className="mt-2 text-sm text-faint">For a hamper, the size is the size chosen for the clothing inside it.</p>}
        </fieldset>
      </Section>

      {isHamper ? (
        <Section title={<>What is <em>inside</em></>} hint="A hamper's stock follows the scarcest item inside it, so there is nothing to count here.">
          {others.length === 0 ? (
            <p className="text-faint">Add some products first, then choose them here.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-hair-2 px-4 py-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10">
                    <input type="checkbox" className="size-5 accent-[#d4b373]" checked={contains.includes(o.slug)} onChange={() => setContains(toggle(contains, o.slug))} />
                    {o.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : (
        <Section
          title={<>Stock <em>count</em></>}
          hint="Type how many you have. Leave a box empty if you do not want to count it (it will always be available). Type 0 for sold out."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-left">
              <thead>
                <tr className="text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                  <th className="py-2 pr-4 font-normal">{colours.length ? "Colour" : ""}</th>
                  {sizeColumns.map((s) => (
                    <th key={s || "all"} className="px-2 py-2 text-center font-normal">
                      {s || "Stock"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colourColumns.map((col) => (
                  <tr key={col.key} className="border-t border-hair">
                    <th scope="row" className="py-2 pr-4 font-normal">
                      {colours.length ? col.label : ""}
                    </th>
                    {sizeColumns.map((s) => (
                      <td key={s || "all"} className="px-1 py-2">
                        <input
                          inputMode="numeric"
                          aria-label={`Stock for ${[col.label !== "All" ? col.label : "", s].filter(Boolean).join(" ") || "this product"}`}
                          value={stock[stockKey(col.key, s)] ?? ""}
                          onChange={(e) => setStock({ ...stock, [stockKey(col.key, s)]: e.target.value.replace(/\D/g, "") })}
                          className="block w-full min-w-14 rounded-lg border border-hair-2 bg-night/60 px-2 py-2 text-center tabular-nums focus:border-gold focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title={<>Pho<em>tos</em></>}>
        {initial ? (
          <ProductPhotos productId={initial.id} images={images} />
        ) : (
          <p className="text-mist">Save the product first, then you can add photos.</p>
        )}
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-hair bg-night/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="submit" disabled={pending} className="btn btn-gold disabled:opacity-60">
          {pending ? "Saving…" : creating ? "Create product" : "Save changes"}
        </button>
        {!creating && (
          <button type="button" onClick={remove} disabled={pending} className="btn btn-outline !border-berry-light/50 hover:!text-berry-light">
            Delete
          </button>
        )}
        {result && (
          <p role="status" className={result.ok ? "text-sm text-gold-light" : "text-sm text-berry-light"}>
            {result.text}
          </p>
        )}
      </div>
    </form>
  );
}
