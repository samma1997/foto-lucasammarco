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
 * Solo desktop, disattivo con prefers-reduced-motion (il filtro full-res è
 * pesante su GPU piccole).
 */
export default function ScrollDistort({ selector }: { selector: string }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (window.innerWidth < 768) return;

    const disp = document.getElementById("scroll-disp");
    if (!disp) return;

    let last = window.scrollY;
    let vel = 0; // velocità smussata (px/frame)
    let scale = 0; // scale corrente applicato
    let filtered = false;
    let raf = 0;

    const MAX = 26; // distorsione massima
    const SENS = 0.9; // sensibilità velocità → distorsione

    const setFilter = (on: boolean) => {
      if (on === filtered) return;
      filtered = on;
      document.querySelectorAll<HTMLElement>(selector).forEach((n) => {
        n.style.filter = on ? "url(#scroll-distort)" : "";
        n.style.willChange = on ? "filter" : "";
      });
    };

    const loop = () => {
      const y = window.scrollY;
      const dv = Math.abs(y - last);
      last = y;

      // velocità smussata + decadimento
      vel += (dv - vel) * 0.25;
      const target = Math.min(MAX, vel * SENS);

      // avvicino lo scale al target (lerp) → morbido sia in salita che in rientro
      scale += (target - scale) * 0.2;
      if (scale < 0.05) scale = 0;
      disp.setAttribute("scale", scale.toFixed(2));

      // applico il filtro solo quando serve (evito costo GPU da fermi/scroll lento)
      setFilter(scale > 0.4);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      setFilter(false);
      disp.setAttribute("scale", "0");
    };
  }, [selector]);

  return null;
}
