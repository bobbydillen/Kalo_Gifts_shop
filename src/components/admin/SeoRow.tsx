"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { saveSeo, type SeoResult } from "@/app/admin/(panel)/seo/actions";

const field =
  "mt-1.5 block w-full rounded-xl border border-hair-2 bg-night/60 px-3 py-2.5 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

const TITLE_GOOD = 60; // longer titles are cut off in Google
const DESC_GOOD = 160;

/** One page's search title and description, with a preview of how it looks on Google. */
export function SeoRow({
  seoKey,
  label,
  path,
  suffix,
  defaults,
  saved,
}: {
  seoKey: string;
  label: string;
  path: string;
  /** Added after the title by the site (" · KALO Gifts"), empty for the home page. */
  suffix: string;
  defaults: { title: string; description: string };
  saved: { title: string; description: string } | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(saved?.title ?? "");
  const [description, setDescription] = useState(saved?.description ?? "");
  const [result, setResult] = useState<SeoResult | null>(null);
  const [busy, start] = useTransition();

  const shownTitle = (title.trim() || defaults.title) + suffix;
  const shownDescription = description.trim() || defaults.description;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveSeo(data);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  function reset() {
    setTitle("");
    setDescription("");
    const data = new FormData();
    data.set("key", seoKey);
    start(async () => {
      const res = await saveSeo(data);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  const count = (n: number, good: number) => (
    <span className={n > good ? "text-berry-light" : "text-faint"}>
      {n}/{good}
    </span>
  );

  return (
    <form onSubmit={submit} className="rounded-2xl border border-hair bg-pine p-5">
      <input type="hidden" name="key" value={seoKey} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl">{label}</h3>
        <span className="text-xs text-faint">
          {path} {saved ? <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-gold-light">Customised</span> : <span className="ml-2">Default</span>}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-night/70 p-4">
        <p className="text-xs text-faint">How it can look on Google</p>
        <p className="mt-1 truncate text-lg text-[#8ab4f8]">{shownTitle}</p>
        <p className="text-xs text-[#9aa0a6]">https://kalogifts.com{path === "/" ? "" : path}</p>
        <p className="mt-1 line-clamp-2 text-sm text-mist">{shownDescription}</p>
      </div>

      <label className="mt-4 block text-sm text-mist">
        <span className="flex justify-between">
          Title {count(shownTitle.length, TITLE_GOOD)}
        </span>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={defaults.title} className={field} />
      </label>
      <label className="mt-3 block text-sm text-mist">
        <span className="flex justify-between">
          Description {count(shownDescription.length, DESC_GOOD)}
        </span>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={320}
          rows={3}
          placeholder={defaults.description}
          className={field}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={busy} className="btn btn-gold disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        {saved && (
          <button type="button" onClick={reset} disabled={busy} className="text-sm text-faint underline underline-offset-4 hover:text-cream">
            Back to default
          </button>
        )}
        {result && (
          <span role="status" className={`text-sm ${result.ok ? "text-gold-light" : "text-berry-light"}`}>
            {result.ok ? (result.reset ? "Back to default." : "Saved. The site updates within a minute.") : result.error}
          </span>
        )}
      </div>
    </form>
  );
}
