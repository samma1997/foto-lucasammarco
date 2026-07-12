"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trips } from "@/lib/destinations";
import { CATEGORIES } from "@/lib/categories";

type Item = {
  id: string;
  srcThumb: string;
  alt: string;
  tripSlug: string;
  tripName: string;
  date: string;
};

const DISPLAY_NAME: Record<string, string> = {
  "sri-lanka": "Sri Lanka",
  bali: "Bali",
  thailand: "Thailand",
  shenzhen: "China",
  "japan-2025": "Japan",
  "bali-2026": "Bali 2026",
};

const ALL_ITEMS: Item[] = trips.flatMap((t) =>
  t.photos.map((p) => ({
    id: p.id,
    srcThumb: p.srcThumb,
    alt: p.alt,
    tripSlug: t.slug,
    tripName: DISPLAY_NAME[t.slug] ?? t.destination,
    date: p.date,
  })),
);

type Map = Record<string, string[]>;

export default function TagPage() {
  const [map, setMap] = useState<Map>({});
  const [trip, setTrip] = useState<string>("all");
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<number | null>(null);

  // carica lo stato salvato
  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setMap(d || {}))
      .catch(() => {});
  }, []);

  const queue = useMemo(
    () =>
      (trip === "all"
        ? ALL_ITEMS
        : ALL_ITEMS.filter((i) => i.tripSlug === trip)),
    [trip],
  );

  useEffect(() => {
    setIdx(0);
  }, [trip]);

  const current = queue[Math.min(idx, queue.length - 1)];

  const save = useCallback((next: Map) => {
    setStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
        .then(() => setStatus("saved"))
        .catch(() => setStatus("idle"));
    }, 400);
  }, []);

  const toggle = useCallback(
    (key: string) => {
      if (!current) return;
      setMap((prev) => {
        const cur = new Set(prev[current.id] ?? []);
        if (cur.has(key)) cur.delete(key);
        else cur.add(key);
        const next = { ...prev };
        if (cur.size) next[current.id] = [...cur];
        else delete next[current.id];
        save(next);
        return next;
      });
    },
    [current, save],
  );

  const clearCurrent = useCallback(() => {
    if (!current) return;
    setMap((prev) => {
      const next = { ...prev };
      delete next[current.id];
      save(next);
      return next;
    });
  }, [current, save]);

  const go = useCallback(
    (delta: number) => setIdx((i) => Math.max(0, Math.min(queue.length - 1, i + delta))),
    [queue.length],
  );

  const nextUntagged = useCallback(() => {
    for (let j = idx + 1; j < queue.length; j++) {
      if (!(map[queue[j].id]?.length)) {
        setIdx(j);
        return;
      }
    }
  }, [idx, queue, map]);

  // scorciatoie tastiera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      } else if (e.key === "0" || e.key.toLowerCase() === "c") {
        clearCurrent();
      } else if (e.key.toLowerCase() === "u") {
        nextUntagged();
      } else {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= CATEGORIES.length) toggle(CATEGORIES[n - 1].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, toggle, clearCurrent, nextUntagged]);

  const taggedCount = Object.keys(map).length;
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const cats of Object.values(map))
      for (const k of cats) c[k] = (c[k] ?? 0) + 1;
    return c;
  }, [map]);

  const currentCats = new Set(current ? map[current.id] ?? [] : []);

  return (
    <div
      className="min-h-screen bg-neutral-950 text-white"
      style={{ fontFamily: "var(--font-mono), monospace" }}
    >
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold uppercase tracking-[0.2em]">
            Photo tagger
          </span>
          <select
            value={trip}
            onChange={(e) => setTrip(e.target.value)}
            className="rounded border border-white/20 bg-neutral-900 px-2 py-1"
          >
            <option value="all">All trips ({ALL_ITEMS.length})</option>
            {trips.map((t) => (
              <option key={t.slug} value={t.slug}>
                {DISPLAY_NAME[t.slug] ?? t.destination} ({t.photos.length})
              </option>
            ))}
          </select>
          <span className="text-white/50">
            Tagged {taggedCount}/{ALL_ITEMS.length} ·{" "}
            {Math.round((taggedCount / ALL_ITEMS.length) * 100)}%
          </span>
          <span
            className={`ml-auto rounded px-2 py-0.5 text-[10px] uppercase tracking-widest ${
              status === "saving"
                ? "bg-amber-500/20 text-amber-300"
                : status === "saved"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/10 text-white/40"
            }`}
          >
            {status === "saving" ? "saving…" : status === "saved" ? "saved ✓" : "idle"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/40">
          {CATEGORIES.map((c, i) => (
            <span key={c.key}>
              <span className="text-white/60">[{i + 1}]</span> {c.label}:{" "}
              {catCounts[c.key] ?? 0}
            </span>
          ))}
          <span className="text-white/60">[0/C] clear · [U] next untagged · [←→/space] nav</span>
        </div>
      </div>

      {!current ? (
        <div className="p-10 text-center text-white/40">No photos.</div>
      ) : (
        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* posizione */}
          <div className="mb-3 flex items-center justify-between text-xs text-white/50">
            <button onClick={() => go(-1)} className="hover:text-white">
              ← prev
            </button>
            <span>
              {current.tripName} · {idx + 1} / {queue.length}
            </span>
            <button onClick={() => go(1)} className="hover:text-white">
              next →
            </button>
          </div>

          {/* foto */}
          <div className="relative flex items-center justify-center rounded-lg bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.srcThumb}
              alt={current.alt}
              className="max-h-[60vh] w-auto object-contain"
              draggable={false}
            />
          </div>
          <p className="mt-2 line-clamp-2 text-center text-[11px] text-white/35">
            {current.alt}
          </p>

          {/* categorie */}
          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
            {CATEGORIES.map((c, i) => {
              const on = currentCats.has(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggle(c.key)}
                  title={c.hint}
                  className={`flex flex-col rounded-lg border px-4 py-3 text-left transition-colors ${
                    on
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                      : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="text-xs opacity-50">{i + 1}</span>
                  </span>
                  <span className="mt-1 text-[10px] leading-snug opacity-50">
                    {c.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-white/40">
            <button onClick={clearCurrent} className="hover:text-white">
              clear (0)
            </button>
            <span>·</span>
            <button onClick={nextUntagged} className="hover:text-white">
              next untagged (U)
            </button>
          </div>

          {/* preload prossima */}
          {queue[idx + 1] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={queue[idx + 1].srcThumb} alt="" className="hidden" />
          )}
        </div>
      )}
    </div>
  );
}
