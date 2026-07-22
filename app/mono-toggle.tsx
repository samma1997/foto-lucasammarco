"use client";

import { useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

/**
 * Toggle Bianco & Nero — controllo di sito, inline in header accanto a
 * "Luca Sammarco" / SoundToggle. Aggiunge la classe `mono` su <html> e il CSS
 * globale desatura tutte le foto.
 *
 * Al click, la nuova versione (mono o colore) si "spande" a MACCHIA circolare
 * dal punto esatto del cursore, via View Transitions API + clip-path animato.
 * Fallback morbido (crossfade filter) dove l'API non c'è o se reduced-motion.
 */
export function MonoToggle({ className = "" }: { className?: string }) {
  // parte SEMPRE a colori: nessuna persistenza, si resetta a ogni caricamento
  const [mono, setMono] = useState(false);

  const apply = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("mono");
    root.classList.toggle("mono", next);
    setMono(next);
  };

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const doc = document as ViewTransitionDoc;
    // niente animazione a macchia: solo crossfade filter (fallback)
    if (!doc.startViewTransition || prefersReducedMotion()) {
      apply();
      return;
    }

    // punto d'origine della macchia = centro del bottone cliccato
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const transition = doc.startViewTransition(apply);
    transition.ready.then(() => {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          // durata più ampia + easing "silky" (easeOutExpo): scatto iniziale
          // morbido e lunga frenata → sensazione molto fluida
          duration: 950,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  // testo: in colore propone "B&W", in mono propone il ritorno a "COLOUR"
  const label = mono ? "Colour" : "B&W";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mono ? "View in colour" : "View in black & white"}
      aria-pressed={mono}
      title={mono ? "Switch back to colour" : "Switch to black & white"}
      className={`text-white text-xs md:text-sm uppercase tracking-[0.15em] leading-none outline-none transition-opacity hover:opacity-80 ${className}`}
      style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
    >
      {label}
    </button>
  );
}
