import { site } from "@/lib/site";

/**
 * A square JPEG of a product photo, for the Meta catalog (which is most reliable with JPEG or PNG; our
 * photos are mostly WebP). Only the shop's own photos can be converted, never an address someone
 * else supplies. If conversion is not possible the original photo is returned unchanged.
 */
const SUPABASE_PHOTOS = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://none.invalid"}/storage/v1/object/public/product-images/`;

function allowed(src: string): string | null {
  if (src.startsWith("/catalog/") && !src.includes("..")) return `${site.url}${src}`;
  if (src.startsWith(SUPABASE_PHOTOS)) return src;
  return null;
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src") ?? "";
  const url = allowed(src);
  if (!url) return new Response("Not found", { status: 404 });

  const upstream = await fetch(url);
  if (!upstream.ok) return new Response("Not found", { status: 404 });
  const original = Buffer.from(await upstream.arrayBuffer());
  const cache = "public, max-age=86400, s-maxage=86400";
  const vary = "query=src"; // Netlify caches per address without its query string unless told otherwise

  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(original)
      .resize(1080, 1080, { fit: "contain", background: "#0b1d16" })
      .flatten({ background: "#0b1d16" })
      .jpeg({ quality: 88 })
      .toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": cache, "Netlify-Vary": vary } });
  } catch {
    return new Response(new Uint8Array(original), {
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "image/webp", "Cache-Control": cache, "Netlify-Vary": vary },
    });
  }
}
