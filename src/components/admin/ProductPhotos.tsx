"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { refreshCatalog } from "@/app/admin/products/actions";
import { photoUrl, type AdminImage } from "@/lib/admin-products";
import { supabaseBrowser } from "@/lib/supabase/client";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 1800;

/**
 * Phone photos are often several megabytes. Shrink them in the browser (longest side 1800 px,
 * WebP) so they upload fast and the shop stays quick. If the browser cannot do that, the
 * original is used as long as it is small enough.
 */
async function prepare(file: File): Promise<{ blob: Blob; ext: string; type: string } | string> {
  if (!TYPES.includes(file.type)) return `${file.name}: use a JPG, PNG, WebP or AVIF photo.`;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (blob && blob.size <= MAX_BYTES) return { blob, ext: "webp", type: "image/webp" };
  } catch {
    // fall through to the original file
  }
  if (file.size > MAX_BYTES) return `${file.name} is over 5 MB. Try a smaller export.`;
  return { blob: file, ext: file.type.split("/")[1].replace("jpeg", "jpg"), type: file.type };
}

export function ProductPhotos({ productId, images, colours }: { productId: string; images: AdminImage[]; colours: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sorted = [...images].sort((a, b) => a.position - b.position);

  async function done() {
    await refreshCatalog();
    router.refresh();
  }

  async function upload(files: FileList) {
    setBusy(true);
    setMessage(null);
    const supabase = supabaseBrowser();
    const problems: string[] = [];
    let position = sorted.length ? sorted[sorted.length - 1].position + 1 : 0;

    for (const file of Array.from(files)) {
      const ready = await prepare(file);
      if (typeof ready === "string") {
        problems.push(ready);
        continue;
      }
      const path = `${productId}/${crypto.randomUUID()}.${ready.ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, ready.blob, { contentType: ready.type, cacheControl: "31536000" });
      if (uploadError) {
        problems.push(`${file.name} could not be uploaded.`);
        continue;
      }
      const { error: rowError } = await supabase
        .from("product_images")
        .insert({ product_id: productId, path, position: position++ });
      if (rowError) {
        await supabase.storage.from("product-images").remove([path]);
        problems.push(`${file.name} could not be saved.`);
      }
    }

    setMessage(problems.length ? problems.join(" ") : null);
    if (input.current) input.current.value = "";
    await done();
    setBusy(false);
  }

  async function remove(image: AdminImage) {
    setBusy(true);
    const supabase = supabaseBrowser();
    await supabase.storage.from("product-images").remove([image.path]);
    await supabase.from("product_images").delete().eq("id", image.id);
    await done();
    setBusy(false);
  }

  async function setColour(image: AdminImage, colour: string) {
    setBusy(true);
    setMessage(null);
    const { error } = await supabaseBrowser().from("product_images").update({ colour }).eq("id", image.id);
    if (error) setMessage("The colour could not be saved. Try again.");
    await done();
    setBusy(false);
  }

  async function move(index: number, direction: -1 | 1) {
    const other = sorted[index + direction];
    const me = sorted[index];
    if (!other) return;
    setBusy(true);
    const supabase = supabaseBrowser();
    // swap by giving each the other's position; a temporary value avoids ties
    await supabase.from("product_images").update({ position: other.position }).eq("id", me.id);
    await supabase.from("product_images").update({ position: me.position }).eq("id", other.id);
    await done();
    setBusy(false);
  }

  return (
    <div>
      {sorted.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {sorted.map((image, i) => (
            <li key={image.id} className="overflow-hidden rounded-2xl border border-hair bg-night/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded photo */}
              <img src={photoUrl(image.path)} alt="" className="aspect-[4/5] w-full object-cover" />
              {colours.length > 0 && (
                <label className="block px-2 pt-2 text-xs text-faint">
                  Shows for
                  <select
                    value={colours.includes(image.colour) ? image.colour : ""}
                    disabled={busy}
                    onChange={(e) => setColour(image, e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-hair-2 bg-pine px-2 py-1.5 text-sm text-cream"
                  >
                    <option value="">All colours</option>
                    {colours.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex items-center justify-between gap-2 p-2 text-sm">
                <span className="px-2 text-xs text-faint">{i === 0 ? "Main photo" : `Photo ${i + 1}`}</span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Move earlier"
                    className="grid size-8 place-items-center rounded-full border border-hair-2 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={busy || i === sorted.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move later"
                    className="grid size-8 place-items-center rounded-full border border-hair-2 disabled:opacity-30"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(image)}
                    aria-label="Delete photo"
                    className="grid size-8 place-items-center rounded-full border border-berry-light/50 text-berry-light disabled:opacity-30"
                  >
                    ×
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label
        className={`mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-hair-2 px-6 py-8 text-center transition-colors hover:border-gold ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="text-cream">{busy ? "Working…" : "Add photos"}</span>
        <span className="text-sm text-faint">JPG, PNG, WebP or AVIF. Large photos are shrunk automatically.</span>
        <input
          ref={input}
          type="file"
          multiple
          accept={TYPES.join(",")}
          className="sr-only"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
      </label>
      {message && (
        <p role="status" className="mt-3 text-sm text-berry-light">
          {message}
        </p>
      )}
      <p className="mt-3 text-sm text-faint">The main photo is the one shown on cards and at the top of the product page.</p>
      {colours.length > 0 && (
        <p className="mt-2 text-sm text-faint">
          Choose a colour under each photo so it shows when a customer picks that colour. Photos set to “All colours” (for example a lifestyle
          shot) appear after the colour&apos;s own photos. Add and save the colours above first.
        </p>
      )}
    </div>
  );
}
