"use client";

import { useEffect, useState } from "react";
import {
  MOODS,
  TRACKS,
  playSelection,
  getSelection,
  isAmbientStarted,
  onAmbientChange,
} from "./ambient";

/**
 * Selettore audio — SOLO in sviluppo (npm run dev). Serve a Luca per ascoltare
 * le tracce reali + i mood generativi e scegliere. Assente in produzione.
 */
export default function MoodPicker() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const off = onAmbientChange(() => force((n) => n + 1));
    return () => {
      off();
    };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  const active = getSelection();
  const pick = (k: string) => {
    playSelection(k);
    force((n) => n + 1);
  };

  const Item = ({
    k,
    label,
    desc,
  }: {
    k: string;
    label: string;
    desc: string;
  }) => (
    <button
      onClick={() => pick(k)}
      className={`rounded px-2 py-1 text-left text-[11px] transition-colors ${
        active === k
          ? "bg-emerald-400/20 text-emerald-300"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="font-semibold">{label}</span>
      <span className="ml-1 opacity-50">{desc}</span>
    </button>
  );

  return (
    <div
      className="fixed bottom-3 left-3 z-[300] max-h-[80vh] overflow-auto rounded-lg border border-white/15 bg-black/85 p-2 text-white backdrop-blur"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-white/40 hover:text-white"
      >
        🎵 audio {open ? "▾" : "▸"}{" "}
        {isAmbientStarted() ? "" : "(premi enter prima)"}
      </button>
      {open && (
        <div className="flex flex-col gap-1">
          <span className="mt-1 px-2 text-[8px] uppercase tracking-[0.2em] text-white/30">
            Tracce reali
          </span>
          {TRACKS.map((t) => (
            <Item key={t.key} k={t.key} label={t.label} desc={t.desc} />
          ))}
          <span className="mt-2 px-2 text-[8px] uppercase tracking-[0.2em] text-white/30">
            Generative (infinite)
          </span>
          {MOODS.map((m) => (
            <Item key={m.key} k={m.key} label={m.label} desc={m.desc} />
          ))}
        </div>
      )}
    </div>
  );
}
