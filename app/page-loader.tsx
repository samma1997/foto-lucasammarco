"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

// Loading phrases — a random one each time (short, poetic, reflective)
const PHRASES = [
  "The light won't wait",
  "Nothing holds still",
  "Beauty rarely poses",
  "The best light is leaving",
  "Stillness is a kind of speed",
  "What passes, stays",
  "The moment outruns the eye",
  "Wander, then look",
  "Every road remembers",
  "Look before it's gone",
];

export default function PageLoader() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return; // home: nessun loader (c'è l'intro)
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // frase random ogni volta (via DOM per evitare mismatch di hydration)
    const p = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    const base = el.querySelector<HTMLElement>(".base");
    const fill = el.querySelector<HTMLElement>(".fill");
    if (base) base.textContent = p;
    if (fill) fill.textContent = p;

    gsap.set(el, { autoAlpha: 1, pointerEvents: "auto" });
    gsap.set(fill, { clipPath: "inset(0 100% 0 0)" });
    const hide = () => gsap.set(el, { pointerEvents: "none" });

    const tl = gsap.timeline();
    if (reduce) {
      gsap.set(fill, { clipPath: "inset(0 0% 0 0)" });
      tl.to(el, { autoAlpha: 0, duration: 0.4, delay: 0.35, onComplete: hide });
    } else {
      // la frase si "carica" da grigio a bianco, sinistra → destra
      tl.to(fill, {
        clipPath: "inset(0 0% 0 0)",
        duration: 1.05,
        ease: "power1.inOut",
      });
      tl.to(
        el,
        { autoAlpha: 0, duration: 0.5, ease: "power2.inOut", onComplete: hide },
        "+=0.2"
      );
    }
    const safety = window.setTimeout(hide, 3500);
    return () => {
      tl.kill();
      window.clearTimeout(safety);
    };
  }, [pathname]);

  // niente loader su: home (c'è l'intro) e dettaglio viaggio /photography/<slug>
  // (lì c'è già l'animazione della carrellata → eviteremmo doppia animazione)
  if (pathname === "/" || /^\/photography\/[^/]+$/.test(pathname)) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      aria-hidden
    >
      <div className="relative whitespace-nowrap text-sm md:text-lg tracking-[0.12em]">
        <span className="base text-neutral-700">{PHRASES[0]}</span>
        <span
          className="fill absolute inset-0 text-white"
          style={{ clipPath: "inset(0 100% 0 0)" }}
        >
          {PHRASES[0]}
        </span>
      </div>
    </div>
  );
}
