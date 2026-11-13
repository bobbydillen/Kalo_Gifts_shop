"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent, type Ref } from "react";
import { frameSpec } from "@/lib/catalog";

export type PhotoResult = { blob: Blob; ext: "webp" | "jpg"; thumb: string; orient: "portrait" | "landscape" };
export type PhotoHandle = { exportPhoto: () => Promise<PhotoResult | null> };

const DPI = 150; // print detail we ask for
const SOFT_BELOW_DPI = 100; // under this the print may look soft
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 7.5 * 1024 * 1024; // the storage limit is 8 MB

type Loaded = { el: HTMLImageElement; url: string; w: number; h: number };

/**
 * Lets the customer choose a photo and fit it to the frame. The photo sits inside a picture of
 * the frame (in the chosen colour); dragging moves it and the slider zooms, always filling the
 * exact shape that will be printed, so what they see is what we print. `exportPhoto` returns the
 * cropped print file and a small preview, and is called when they add the item to the bag.
 */
export function PhotoDesigner({
  size,
  frameColour,
  onReady,
  ref,
}: {
  size: string; // A5, A4 or A3
  frameColour: string; // hex of the chosen frame colour
  onReady: (ready: boolean) => void;
  ref: Ref<PhotoHandle>;
}) {
  const spec = frameSpec(size) ?? frameSpec("A4")!;
  const [mmW, mmH] = spec.mm;

  const input = useRef<HTMLInputElement>(null);
  const windowEl = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const [img, setImg] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orient, setOrient] = useState<"portrait" | "landscape">("portrait");
  const [zoom, setZoom] = useState(1);
  const [centre, setCentre] = useState({ x: 0.5, y: 0.5 }); // the point of the photo at the middle of the frame, 0 to 1
  const [boxW, setBoxW] = useState(0);

  const portrait = orient === "portrait";
  const printW = portrait ? mmW : mmH; // millimetres across, as printed
  const printH = portrait ? mmH : mmW;
  const boxH = boxW * (printH / printW);

  // measure the picture window so the maths works in real pixels
  useEffect(() => {
    const el = windowEl.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setBoxW(el.clientWidth));
    observer.observe(el);
    setBoxW(el.clientWidth);
    return () => observer.disconnect();
  }, [orient]);

  // free the photo from memory when it is replaced or the page closes
  useEffect(() => {
    return () => {
      if (img) URL.revokeObjectURL(img.url);
    };
  }, [img]);

  const cover = img && boxW ? Math.max(boxW / img.w, boxH / img.h) : 1;
  const scale = cover * zoom;
  const viewW = img && boxW ? boxW / scale : 0; // how much of the photo shows, in photo pixels
  const viewH = img && boxW ? boxH / scale : 0;

  const clamp = useCallback(
    (c: { x: number; y: number }) => {
      if (!img || !viewW) return c;
      const halfX = viewW / 2 / img.w;
      const halfY = viewH / 2 / img.h;
      return {
        x: Math.min(1 - halfX, Math.max(halfX, c.x)),
        y: Math.min(1 - halfY, Math.max(halfY, c.y)),
      };
    },
    [img, viewW, viewH],
  );
  const c = clamp(centre);

  const dpi = img && viewW ? viewW / (printW / 25.4) : Infinity;
  const soft = dpi < SOFT_BELOW_DPI;

  function load(file: File) {
    setError(null);
    if (!ACCEPT.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP photo. iPhone photos in HEIC format: share or export them as JPG first.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("That photo is over 30 MB. Please choose a smaller one.");
      return;
    }
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      setImg({ el, url, w: el.naturalWidth, h: el.naturalHeight });
      setOrient(el.naturalWidth > el.naturalHeight ? "landscape" : "portrait");
      setZoom(1);
      setCentre({ x: 0.5, y: 0.5 });
      onReady(true);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      setError("We could not open that photo. Try another one, or save it as a JPG.");
    };
    el.src = url;
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: c.x, cy: c.y };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || !img) return;
    const dx = (e.clientX - start.x) / (img.w * scale);
    const dy = (e.clientY - start.y) / (img.h * scale);
    setCentre(clamp({ x: start.cx - dx, y: start.cy - dy }));
  }
  const up = () => {
    drag.current = null;
  };

  useImperativeHandle(
    ref,
    () => ({
      async exportPhoto() {
        if (!img || !viewW) return null;
        const outW = Math.round((printW / 25.4) * DPI);
        const outH = Math.round((printH / 25.4) * DPI);
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img.el, c.x * img.w - viewW / 2, c.y * img.h - viewH / 2, viewW, viewH, 0, 0, outW, outH);

        const toBlob = (type: string, quality: number) =>
          new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
        let blob = await toBlob("image/webp", 0.9);
        let ext: "webp" | "jpg" = "webp";
        if (!blob || blob.type !== "image/webp") {
          blob = await toBlob("image/jpeg", 0.9);
          ext = "jpg";
        }
        if (blob && blob.size > MAX_OUTPUT_BYTES) blob = await toBlob(ext === "webp" ? "image/webp" : "image/jpeg", 0.75);
        if (!blob || blob.size > MAX_OUTPUT_BYTES) return null;

        const t = document.createElement("canvas");
        const k = 160 / Math.max(outW, outH);
        t.width = Math.round(outW * k);
        t.height = Math.round(outH * k);
        t.getContext("2d")!.drawImage(canvas, 0, 0, t.width, t.height);
        return { blob, ext, thumb: t.toDataURL("image/jpeg", 0.7), orient };
      },
    }),
    [img, viewW, viewH, c.x, c.y, printW, printH, orient],
  );

  return (
    <div>
      <div className="rounded-3xl border border-hair bg-[radial-gradient(ellipse_at_50%_30%,#243b31,#0d1d16_75%)] p-5 sm:p-8">
        {/* the frame */}
        <div
          className={`mx-auto transition-[width] duration-500 ease-glide ${portrait ? "w-[min(100%,19rem)]" : "w-[min(100%,28rem)]"}`}
          style={{
            background: frameColour,
            padding: "4%",
            borderRadius: 3,
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.18), inset 0 -3px 8px rgba(0,0,0,.35), 0 28px 50px -18px rgba(0,0,0,.85), 0 6px 14px -4px rgba(0,0,0,.5)",
          }}
        >
          <div
            ref={windowEl}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className={`relative overflow-hidden bg-[#161c19] ${img ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
            style={{ aspectRatio: `${printW} / ${printH}`, boxShadow: "inset 0 0 14px rgba(0,0,0,.6)" }}
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local preview of the customer's own photo
              <img
                src={img.url}
                alt="Your photo in the frame"
                draggable={false}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  width: img.w * scale,
                  height: img.h * scale,
                  left: boxW / 2 - c.x * img.w * scale,
                  top: boxH / 2 - c.y * img.h * scale,
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="absolute inset-0 grid place-items-center gap-2 p-4 text-center text-cream/80 transition-colors hover:text-gold-light"
              >
                <span>
                  <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-current text-2xl">+</span>
                  <span className="block font-serif text-2xl">Add your photo</span>
                  <span className="mt-1 block text-xs text-cream/50">It will appear in this frame</span>
                </span>
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-faint">
          {spec.id} · {mmW} × {mmH} mm · {portrait ? "upright" : "sideways"}
        </p>
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        aria-label="Choose your photo"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) load(file);
          e.target.value = "";
        }}
      />

      {img && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Frame direction" className="flex rounded-full border border-hair-2 p-1 text-sm">
              {(["portrait", "landscape"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={orient === o}
                  onClick={() => setOrient(o)}
                  className="rounded-full px-4 py-1.5 text-mist transition-colors aria-pressed:bg-cream aria-pressed:text-night"
                >
                  {o === "portrait" ? "Upright" : "Sideways"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => input.current?.click()} className="text-sm text-gold-light underline underline-offset-4">
              Change photo
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setCentre({ x: 0.5, y: 0.5 });
              }}
              className="text-sm text-mist underline underline-offset-4 hover:text-cream"
            >
              Reset
            </button>
          </div>

          <label className="flex items-center gap-3 text-sm text-mist">
            <span className="w-12">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#d4b373]"
              aria-label="Zoom"
            />
          </label>
          <p className="text-xs text-faint">Drag the photo to move it. This is exactly what we will print and frame.</p>

          {soft && (
            <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-light">
              This photo is small for {spec.id}, so the print may look a little soft. A closer crop or a larger photo will look sharper.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
