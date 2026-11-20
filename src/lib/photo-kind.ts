/**
 * What a product photo is, read from its file name, so no extra database column is needed:
 * - "photo": a normal photo (on the product page, cards and the "worn" strip)
 * - "cut": a bottle cut out on a transparent background (stands on the bottle shelves)
 * - "cut-back" / "cut-front": a tee or hoodie cut out, back or front (hangs on the wear rail)
 * - "art": a frame's print on its own, no frame (the gallery wall puts it in each frame colour)
 *
 * Uploaded photos live at <product id>/<name>; changing the kind in the admin renames the file:
 *   photo     -> <id>/<uuid>.webp
 *   cut       -> <id>/cut/<uuid>.webp
 *   cut-back  -> <id>/cut-back-<uuid>.webp
 *   cut-front -> <id>/cut-front-<uuid>.webp
 *   art       -> <id>/art/<uuid>.webp
 * The launch photos in /public follow the same pattern (/catalog/bottles/cut/…, …/cut-back.webp).
 */

export type PhotoKind = "photo" | "cut" | "cut-back" | "cut-front" | "art";

export const PHOTO_KINDS: { id: PhotoKind; label: string }[] = [
  { id: "photo", label: "Photo" },
  { id: "cut", label: "Bottle cut-out" },
  { id: "cut-back", label: "Garment cut-out, back" },
  { id: "cut-front", label: "Garment cut-out, front" },
  { id: "art", label: "Print artwork (no frame)" },
];

export function photoKind(path: string): PhotoKind {
  if (/\/cut-back[.-][^/]*$/.test(path)) return "cut-back";
  if (/\/cut-front[.-][^/]*$/.test(path)) return "cut-front";
  if (/\/cut\/[^/]+$/.test(path)) return "cut";
  if (/\/art\/[^/]+$/.test(path)) return "art";
  return "photo";
}

/** The storage path for an uploaded photo of this kind (keeps the product folder and the file name's id). */
export function pathForKind(path: string, kind: PhotoKind): string {
  const slash = path.lastIndexOf("/");
  const file = path.slice(slash + 1);
  const folder = path.slice(0, slash).replace(/\/(cut|art)$/, "");
  const base = file.replace(/^cut-(back|front)-/, "");
  if (kind === "cut" || kind === "art") return `${folder}/${kind}/${base}`;
  if (kind === "cut-back" || kind === "cut-front") return `${folder}/${kind}-${base}`;
  return `${folder}/${base}`;
}

export const isCutout = (path: string) => {
  const kind = photoKind(path);
  return kind === "cut" || kind === "cut-back" || kind === "cut-front";
};
