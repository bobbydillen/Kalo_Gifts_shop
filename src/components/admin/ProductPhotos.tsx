"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { refreshCatalog } from "@/app/admin/products/actions";
import { photoUrl, type AdminImage } from "@/lib/admin-products";
import { PHOTO_KINDS, pathForKind, photoKind, type PhotoKind } from "@/lib/photo-kind";
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

/** Which kinds make sense for a category: bottles stand as cut-outs, tees and hoodies hang as back and front cut-outs. */
function kindsFor(category: string): PhotoKind[] {
  if (category === "bottle") return ["photo", "cut"];
  if (category === "tshirt" || category === "hoodie") return ["photo", "cut-back", "cut-front"];
  if (category === "frame") return ["photo", "art"];
  return ["photo"];
}

export function ProductPhotos({ productId, images, colours, category }: { productId: string; images: AdminImage[]; colours: string[]; category: string }) {
  const kinds = kindsFor(category);
  const [uploadKind, setUploadKind] = useState<PhotoKind>("photo");
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
      const path = pathForKind(`${productId}/${crypto.randomUUID()}.${ready.ext}`, uploadKind);
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

  /** Changing a photo's kind renames its file (the kind is part of the name, see photo-kind.ts). */
  async function setKind(image: AdminImage, kind: PhotoKind) {
    const next = pathForKind(image.path, kind);
    if (image.path.startsWith("/") || next === image.path) return;
    setBusy(true);
    setMessage(null);
    const supabase = supabaseBrowser();
    const { error: moveError } = await supabase.storage.from("product-images").move(image.path, next);
    if (moveError) {
      setMessage("The photo could not be changed. Try again.");
    } else {
      const { error } = await supabase.from("product_images").update({ path: next }).eq("id", image.id);
      if (error) {
        await supabase.storage.from("product-images").move(next, image.path);
        setMessage("The photo could not be changed. Try again.");
      }
    }
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
              <img
                src={photoUrl(image.path)}
                alt=""
                className={`aspect-[4/5] w-full ${photoKind(image.path) === "photo" ? "object-cover" : "bg-[repeating-conic-gradient(#1b4436_0%_25%,#112a21_0%_50%)] bg-[length:16px_16px] object-contain p-2"}`}
              />
              {kinds.length > 1 && (
                <label className="block px-2 pt-2 text-xs text-faint">
                  Kind
                  <select
                    value={photoKind(image.path)}
                    disabled={busy || image.path.startsWith("/")}
                    onChange={(e) => setKind(image, e.target.value as PhotoKind)}
                    className="mt-1 block w-full rounded-lg border border-hair-2 bg-pine px-2 py-1.5 text-sm text-cream disabled:opacity-70"
                  >
                    {PHOTO_KINDS.filter((k) => kinds.includes(k.id) || k.id === photoKind(image.path)).map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
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

      {kinds.length > 1 && (
        <label className="mt-4 block text-sm text-mist">
          Add new photos as
          <select
            value={uploadKind}
            onChange={(e) => setUploadKind(e.target.value as PhotoKind)}
            className="mt-1 block w-full max-w-xs rounded-lg border border-hair-2 bg-pine px-3 py-2 text-sm text-cream"
          >
            {PHOTO_KINDS.filter((k) => kinds.includes(k.id)).map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
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
      {category === "bottle" && (
        <p className="mt-2 text-sm text-faint">
          For the Bottle Bar, add for each colour a <span className="text-cream">bottle cut-out</span>: a PNG of the bottle alone on a
          transparent background, standing upright, with a little space around it. Add the normal product photo too, as a Photo. Set the
          colour under both. Without a cut-out the bottle still sells, but stands on the shelf as its photo.
        </p>
      )}
      {category === "frame" && (
        <p className="mt-2 text-sm text-faint">
          For the gallery wall, add the <span className="text-cream">print artwork</span> on its own (no frame, straight, the exact print
          shape) as “Print artwork”, once, for all colours. The wall then shows it in each frame colour named Pink, White or Blue. Photos of
          the real framed print can be added as Photos, with their colour.
        </p>
      )}
      {(category === "tshirt" || category === "hoodie") && (
        <p className="mt-2 text-sm text-faint">
          For the hanging rail, add a <span className="text-cream">garment cut-out, back</span> and (if it has a print or is worth showing) a{" "}
          <span className="text-cream">garment cut-out, front</span>: PNGs of the garment alone on a transparent background, laid flat and
          straight, collar at the top. Photos of people wearing it go in as Photos. A tee or hoodie with at least one cut-out hangs on the rail;
          without one it shows in the grid only.
        </p>
      )}
      {colours.length > 0 && (
        <p className="mt-2 text-sm text-faint">
          Choose a colour under each photo so it shows when a customer picks that colour. Photos set to “All colours” (for example a lifestyle
          shot) appear after the colour&apos;s own photos. Add and save the colours above first.
        </p>
      )}
    </div>
  );
}
