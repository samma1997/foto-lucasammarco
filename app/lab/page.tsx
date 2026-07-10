"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/* ------------------------------------------------------------------ */
/*  LAB — playground transizioni / animazioni di caricamento           */
/*  Clicca un'opzione per vederla a schermo intero, poi torna al lab.  */
/* ------------------------------------------------------------------ */

const CDN =
  "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_600/v1/sammapix/portfolio/";
const P = [
  CDN + "bali-2026/01-bali-golden-hour-walk-man-bucket-street-indonesia",
  CDN + "japan/01-senso-ji-hozomon-gate-tokyo-japan-red-lantern-crowd",
  CDN + "sri-lanka/01-gangaramaya-temple-buddha-statues-stupa-colombo-sri-lanka",
  CDN + "thailand/01-wat-benchamabophit-marble-temple-bangkok-thailand",
  CDN + "china/01-shenzhen-longgang-district-night-street-neon-lights-china",
  CDN + "bali/01-balinese-stone-guardian-statue-temple-beraban-kediri-indonesia",
  CDN + "sri-lanka/15-maharagama-sri-lanka-elephant-mahout-tropical-bond",
  CDN + "sri-lanka/33-dambulla-cave-temple-buddhist-pilgrimage-sri-lanka",
];

/* eslint-disable @next/next/no-img-element */
const Img = ({ src, className }: { src: string; className?: string }) => (
  <img src={src} alt="" draggable={false} className={className} />
);

type TxProps = { onDone: () => void };

/* 1 — TENDINA: pannelli neri verticali che si aprono su una foto */
function TxPanels({ onDone }: TxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const panels = el.querySelectorAll<HTMLElement>(".panel");
    const photo = el.querySelector<HTMLElement>(".photo");
    const tl = gsap.timeline({ onComplete: onDone });
    gsap.set(photo, { scale: 1.15 });
    tl.to(photo, { scale: 1, duration: 1.1, ease: "power2.out" }, 0);
    tl.to(panels, { yPercent: -100, duration: 0.7, ease: "power3.inOut", stagger: 0.06 }, 0.15);
    tl.to(el, { autoAlpha: 0, duration: 0.4 }, "+=0.2");
    return () => {
      tl.kill();
    };
  }, [onDone]);
  return (
    <div ref={ref} className="fixed inset-0 z-[9999] bg-black">
      <div className="photo absolute inset-0">
        <Img src={P[0]} className="h-full w-full object-cover opacity-90" />
      </div>
      <div className="absolute inset-0 flex">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel h-full flex-1 bg-black" />
        ))}
      </div>
    </div>
  );
}

/* 2 — GRIGLIA: tessere che si compongono e svaniscono */
function TxGrid({ onDone }: TxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const tiles = el.querySelectorAll<HTMLElement>(".tile");
    const tl = gsap.timeline({ onComplete: onDone });
    gsap.set(tiles, { autoAlpha: 0, scale: 0.6 });
    tl.to(tiles, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
      stagger: { each: 0.04, from: "center", grid: [3, 4] },
    });
    tl.to(el, { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=0.25");
    return () => {
      tl.kill();
    };
  }, [onDone]);
  return (
    <div ref={ref} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="grid grid-cols-4 gap-2 p-4" style={{ width: "min(70vw, 520px)" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="tile aspect-[3/4] overflow-hidden rounded-[3px] bg-neutral-900">
            <Img src={P[i % P.length]} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* 3 — STRIP: striscia di foto che scorre e si ferma */
function TxStrip({ onDone }: TxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const track = el.querySelector<HTMLElement>(".track");
    const tl = gsap.timeline({ onComplete: onDone });
    gsap.set(track, { xPercent: 8 });
    tl.fromTo(track, { xPercent: 8 }, { xPercent: -40, duration: 1.2, ease: "power2.inOut" });
    tl.to(el, { autoAlpha: 0, duration: 0.45 }, "+=0.1");
    return () => {
      tl.kill();
    };
  }, [onDone]);
  return (
    <div ref={ref} className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black">
      <div className="track flex gap-3">
        {[...P, ...P].map((src, i) => (
          <div key={i} className="h-[42vh] w-[24vh] shrink-0 overflow-hidden rounded-md bg-neutral-900">
            <Img src={src} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 180px 60px rgba(0,0,0,0.9)" }} />
    </div>
  );
}

/* 4 — ZOOM: una foto sfuma/zooma e rivela */
function TxZoom({ onDone }: TxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const photo = el.querySelector<HTMLElement>(".photo");
    const tl = gsap.timeline({ onComplete: onDone });
    gsap.set(photo, { scale: 1.25, filter: "blur(14px)", autoAlpha: 0 });
    tl.to(photo, { autoAlpha: 1, duration: 0.4 }, 0);
    tl.to(photo, { scale: 1, filter: "blur(0px)", duration: 0.9, ease: "power2.out" }, 0);
    tl.to(el, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, "+=0.15");
    return () => {
      tl.kill();
    };
  }, [onDone]);
  return (
    <div ref={ref} className="fixed inset-0 z-[9999] bg-black">
      <div className="photo absolute inset-0 will-change-transform">
        <Img src={P[4]} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

/* 5 — MINIMAL: solo il nome che appare, niente foto */
function TxMinimal({ onDone }: TxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const line = el.querySelector<HTMLElement>(".ln");
    const bar = el.querySelector<HTMLElement>(".bar");
    const tl = gsap.timeline({ onComplete: onDone });
    gsap.set(line, { autoAlpha: 0, y: 10 });
    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
    tl.to(line, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" });
    tl.to(bar, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0.1);
    tl.to(el, { autoAlpha: 0, duration: 0.5 }, "+=0.25");
    return () => {
      tl.kill();
    };
  }, [onDone]);
  return (
    <div ref={ref} className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black">
      <span className="ln text-white/80 text-xs uppercase tracking-[0.4em]">Luca Sammarco</span>
      <span className="bar h-px w-[120px] bg-white/50" />
    </div>
  );
}

const OPTIONS = [
  { id: "panels", name: "Tendina", desc: "Pannelli neri che si aprono su una foto", C: TxPanels },
  { id: "grid", name: "Griglia", desc: "Tessere che si compongono dal centro", C: TxGrid },
  { id: "strip", name: "Strip", desc: "Striscia di foto che scorre e si ferma", C: TxStrip },
  { id: "zoom", name: "Zoom / Focus", desc: "Una foto a fuoco che rivela la pagina", C: TxZoom },
  { id: "minimal", name: "Minimal", desc: "Solo nome + linea, niente foto", C: TxMinimal },
] as const;

export default function Lab() {
  const [active, setActive] = useState<string | null>(null);
  const Active = OPTIONS.find((o) => o.id === active)?.C;

  return (
    <main className="min-h-[100dvh] bg-black px-6 py-16 md:px-16">
      <header className="mb-12">
        <p className="text-white/40 text-[0.62rem] uppercase tracking-[0.35em]">Lab · Transizioni</p>
        <h1 className="mt-3 text-white text-3xl md:text-5xl font-light tracking-tight">
          Animazioni di caricamento
        </h1>
        <p className="mt-4 max-w-md text-white/50 text-sm leading-relaxed">
          Clicca un&apos;opzione per vederla a schermo intero. Poi dimmi quale
          preferisci (o cosa cambiare) e la trasformo nel loader del sito.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setActive(o.id)}
            className="group rounded-lg border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-white/30 hover:bg-white/[0.04]"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-white text-lg">{o.name}</span>
              <span className="text-white/30 text-[0.6rem] uppercase tracking-[0.3em] group-hover:text-white/60">
                ▶ play
              </span>
            </div>
            <p className="mt-2 text-white/45 text-xs leading-relaxed">{o.desc}</p>
          </button>
        ))}
      </div>

      {Active && <Active key={active} onDone={() => setActive(null)} />}
    </main>
  );
}
