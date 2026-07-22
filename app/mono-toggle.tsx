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
    // niente distorsione: solo crossfade filter (fallback)
    if (!doc.startViewTransition || prefersReducedMotion()) {
      apply();
      return;
    }

    const transition = doc.startViewTransition(apply);
    transition.ready.then(() => {
      const DUR = 900;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isSmall = w < 768;

      // reveal RADIALE dal centro dello schermo: la nuova versione esplode
      // dal mezzo verso i bordi mentre si distorce → "parte dal centro"
      const cx = w / 2;
      const cy = h / 2;
      const endRadius = Math.hypot(cx, cy);
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${cx}px ${cy}px)`,
            `circle(${endRadius}px at ${cx}px ${cy}px)`,
          ],
          opacity: [0.2, 1],
        },
        {
          duration: DUR,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );

      // distorsione liquida: guido scale del displacement + il "flusso" della
      // turbolenza in rAF; parte forte e si assesta a 0 → l'immagine cola
      const disp = document.getElementById("mono-disp");
      const turb = document.getElementById("mono-turb");
      if (!disp || !turb) return;

      const start = performance.now();
      // intensità ridotta su mobile per fluidità (il displacement full-screen
      // è pesante su GPU piccole)
      const MAX = isSmall ? 150 : 260;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DUR);
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const scale = MAX * (1 - ease);
        disp.setAttribute("scale", String(scale));
        // la turbolenza "respira" un filo mentre si assesta → effetto vivo
        const f = 0.012 + 0.01 * (1 - ease);
        turb.setAttribute("baseFrequency", `${f} ${f * 1.3}`);
        if (t < 1) requestAnimationFrame(tick);
        else disp.setAttribute("scale", "0");
      };
      requestAnimationFrame(tick);
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
