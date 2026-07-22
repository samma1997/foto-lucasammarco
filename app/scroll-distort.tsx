"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Distorsione delle foto pilotata dalla VELOCITÀ di scroll (stile remid /
 * "image distortion with scroll velocity"). Legge la velocità (funziona anche
 * con Lenis, che aggiorna window.scrollY), la mappa sullo `scale` del
 * feDisplacementMap #scroll-distort e la applica agli elementi `selector`.
 * Quando ti fermi, la distorsione torna a 0 → le foto si ricompongono.
 *
 * IMPORTANTE: il filtro SVG (feDisplacementMap) è pesantissimo su GPU. Va
 * applicato SOLO alle immagini davvero in viewport (~6-12), MAI a tutte le
 * ~170 del grid: con tutte applicate insieme (+ will-change: filter) la GPU
 * crolla, il framerate va a ~7fps, la distorsione resta incastrata e Chrome
 * sfratta i layer → foto nere / flicker. Un IntersectionObserver tiene il set
 * delle visibili; il filtro tocca solo quelle. Niente will-change (evita
 * l'esplosione di layer compositi).
 *
 * Solo desktop, disattivo con prefers-reduced-motion.
 */
export default function ScrollDistort({ selector }: { selector: string }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (window.innerWidth < 768) return;

    const disp = document.getElementById("scroll-disp");
    if (!disp) return;

    // immagini attualmente in viewport (aggiornate dall'IntersectionObserver)
    const visible = new Set<HTMLElement>();
    // immagini a cui è ORA applicato il filtro → pulizia mirata, niente scan globali
    const filtered = new Set<HTMLElement>();

    const clear = (n: HTMLElement) => {
      n.style.filter = "";
      filtered.delete(n);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) visible.add(el);
          else {
            visible.delete(el);
            if (filtered.has(el)) clear(el); // uscita di scena → togli il filtro
          }
        }
      },
      { rootMargin: "15% 0px" },
    );

    const observeAll = () => {
      document
        .querySelectorAll<HTMLElement>(selector)
        .forEach((n) => io.observe(n));
    };
    observeAll();

    // Il grid cambia nodi al cambio viaggio / filtro categoria (React ri-renderizza):
    // ri-osserva i nuovi <img> e ripulisci quelli rimossi. Debounce via rAF per
    // non reagire a ogni singola mutazione durante il re-render.
    let rescanQueued = false;
    const rescan = () => {
      rescanQueued = false;
      // pulisci filtri residui su nodi ormai staccati dal DOM
      for (const n of [...filtered]) if (!n.isConnected) clear(n);
      for (const n of [...visible]) if (!n.isConnected) visible.delete(n);
      io.disconnect();
      observeAll();
    };
    const mo = new MutationObserver(() => {
      if (rescanQueued) return;
      rescanQueued = true;
      requestAnimationFrame(rescan);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    let scale = 0; // scale corrente applicato
    let raf = 0;

    const MAX = 12; // distorsione massima (leggera)
    const SENS = 0.6; // sensibilità velocità → distorsione

    // Storia posizioni per stimare la velocità come spostamento NETTO su una
    // finestra breve, non frame-per-frame. Serve per Safari/WebKit: lì lo
    // smooth-scroll di Lenis oscilla a riposo (micro avanti/indietro), quindi
    // il delta per-frame resterebbe alto e la distorsione non rientrerebbe mai.
    // Sul netto l'oscillazione si annulla → da fermi lo scale torna a 0.
    const WINDOW_MS = 120;
    const hist: { t: number; y: number }[] = [
      { t: performance.now(), y: window.scrollY },
    ];

    // Applica/rimuove il filtro SOLO sulle immagini visibili. Se in B/N mantiene
    // grayscale + distorsione. Da fermi torna a "" (lo stylesheet gestisce il B/N).
    const setFilter = (want: boolean) => {
      const mono = document.documentElement.classList.contains("mono");
      if (want) {
        for (const n of visible) {
          // le foto marcate "a colori" (keep-color) restano a colori anche in
          // B/N: distorsione senza grayscale.
          const fstr =
            mono && !n.classList.contains("keep-color")
              ? "grayscale(1) url(#scroll-distort)"
              : "url(#scroll-distort)";
          if (n.style.filter !== fstr) n.style.filter = fstr;
          filtered.add(n);
        }
        // togli il filtro da quelle non più visibili ma ancora marcate
        for (const n of [...filtered]) if (!visible.has(n)) clear(n);
      } else if (filtered.size) {
        for (const n of [...filtered]) clear(n);
      }
    };

    const loop = (now: number) => {
      const y = window.scrollY;
      hist.push({ t: now, y });
      // tengo solo l'ultima finestra (~120ms)
      while (hist.length > 1 && now - hist[0].t > WINDOW_MS) hist.shift();

      // velocità = spostamento netto sulla finestra, mediato per-frame
      const oldest = hist[0];
      const frames = Math.max(1, (now - oldest.t) / 16.7);
      const vel = Math.abs(y - oldest.y) / frames;
      const target = Math.min(MAX, vel * SENS);

      // Rientro ASIMMETRICO: salita morbida, ma da fermo taglio netto. Su
      // Safari/WebKit il filtro SVG è pesante e cala l'fps: un rientro morbido
      // si trascinerebbe. Tagliando subito, il filtro si spegne (<0.4) e la GPU
      // si libera → l'fps risale.
      if (target >= scale) {
        scale += (target - scale) * 0.25; // onset morbido
      } else {
        scale += (target - scale) * 0.45; // rientro deciso
        if (target < 0.3 && scale < 0.6) scale = 0; // da fermo → stop immediato
      }
      if (scale < 0.05) scale = 0;
      disp.setAttribute("scale", scale.toFixed(2));

      // filtro solo sulle visibili quando serve; chiamato ogni frame così che
      // cambi di viewport / B/N / keep-color siano sempre riflessi (costo minimo:
      // ~9 elementi, con guardia sul valore già impostato).
      setFilter(scale > 0.4);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      for (const n of [...filtered]) clear(n);
      disp.setAttribute("scale", "0");
    };
  }, [selector]);

  return null;
}
