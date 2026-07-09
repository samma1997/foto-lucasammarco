"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { trips } from "@/lib/destinations";
import Home from "./home";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Photo = { src: string; alt: string };

const allPhotos: Photo[] = [
  { src: "/bali-scooter.jpg", alt: "Bali 2026" },
  ...trips.flatMap((t) =>
    t.photos.map((p) => ({ src: p.srcThumb, alt: p.alt }))
  ),
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Intro() {
  const [entered, setEntered] = useState(false);
  const [gridPhotos, setGridPhotos] = useState<Photo[] | null>(null);
  const [gridConfig, setGridConfig] = useState({
    cols: 5,
    rows: 3,
    w: 0,
    h: 0,
    total: 15,
    isMobile: false,
  });
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const isMobile = vw < 768;
      // Mobile: griglia più compatta 3×3 = 9 card (più leggibile su schermo piccolo)
      const cols = isMobile ? 3 : 5;
      const rows = isMobile ? 3 : 3;
      const total = cols * rows;
      const w = isMobile ? vw * 0.5 : vw * 0.21;
      const h = w * 1.5;
      setGridConfig({ cols, rows, w, h, total, isMobile });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Foto random in base al conteggio (grid total)
  useEffect(() => {
    if (gridConfig.total === 0) return;
    setGridPhotos(shuffle(allPhotos).slice(0, gridConfig.total));
  }, [gridConfig.total]);

  useIsomorphicLayoutEffect(() => {
    if (entered || !gridPhotos || gridConfig.w === 0) return;

    const cards = cardsRef.current.filter(
      (c): c is HTMLDivElement => !!c
    );
    if (cards.length === 0 || !textRef.current) return;

    const isMobile = gridConfig.isMobile;

    // State iniziale: griglia invisibile con leggero scale-in
    gsap.set(cards, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 0.94,
      opacity: 0,
    });
    gsap.set(textRef.current, { xPercent: -50, opacity: 0, y: 12 });

    const tl = gsap.timeline({ delay: 0.3 });

    // Fase 1: griglia entra smooth (expo.out, stagger da centro verso esterno)
    tl.to(cards, {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: "expo.out",
      stagger: { each: 0.035, from: "center" },
    });

    // Pausa contemplativa
    tl.to({}, { duration: 0.5 });

    // Fase 2: gather al mazzetto — easing custom cubic-bezier(0.76, 0, 0.24, 1)
    const jitterX = isMobile ? 10 : 24;
    const jitterY = isMobile ? 8 : 15;
    const rotMax = isMobile ? 5 : 7;
    const targetScale = isMobile ? 0.8 : 0.9;

    tl.to(cards, {
      x: (_, el) => {
        const rect = (el as HTMLDivElement).getBoundingClientRect();
        return window.innerWidth / 2 - (rect.left + rect.width / 2) +
          gsap.utils.random(-jitterX, jitterX);
      },
      y: (_, el) => {
        const rect = (el as HTMLDivElement).getBoundingClientRect();
        return window.innerHeight / 2 - (rect.top + rect.height / 2) +
          gsap.utils.random(-jitterY, jitterY);
      },
      scale: targetScale,
      duration: 1.4,
      ease: "power4.inOut",
      stagger: { each: isMobile ? 0.03 : 0.04, from: "random" },
    });

    // Rotation separata con back.out per micro-overshoot naturale (raccomandazione ui-ux)
    tl.to(
      cards,
      {
        rotation: () => gsap.utils.random(-rotMax, rotMax),
        duration: 1.2,
        ease: "back.out(1.2)",
        stagger: { each: isMobile ? 0.03 : 0.04, from: "random" },
      },
      "<0.1"
    );

    // Fase 3: testo entra (sine.out smooth, overlap con fine gather)
    tl.to(
      textRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "sine.out",
      },
      "-=0.5"
    );

    // Fase 4: breathing loop del mazzetto (subtle scale 1 ↔ 1.015)
    tl.to(
      cards,
      {
        scale: `+=${targetScale * 0.02}`,
        duration: 3.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.02, from: "random" },
      },
      "-=0.2"
    );

    return () => {
      tl.kill();
    };
  }, [entered, gridPhotos, gridConfig.w, gridConfig.isMobile]);

  if (entered) {
    return <Home />;
  }

  const ready = gridPhotos !== null && gridConfig.w > 0;

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${gridConfig.cols}, ${gridConfig.w}px)`,
              gridTemplateRows: `repeat(${gridConfig.rows}, ${gridConfig.h}px)`,
              gap: gridConfig.isMobile ? "10px 12px" : "14px 16px",
            }}
          >
            {gridPhotos!.map((p, i) => (
              <div
                key={`grid-${i}`}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="relative overflow-hidden bg-neutral-900 will-change-transform shadow-[0_18px_44px_-14px_rgba(0,0,0,0.75)]"
                style={{ zIndex: i + 1 }}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover"
                  priority
                  loading="eager"
                  sizes="(max-width: 768px) 50vw, 21vw"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={textRef}
        className="absolute z-[200] left-1/2 flex flex-col items-center gap-4"
        style={{
          bottom: "10vh",
        }}
      >
        <p
          className="text-white/85 text-xs md:text-sm tracking-[0.12em] whitespace-nowrap"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 400 }}
        >
          Fotografia in movimento
        </p>
        <button
          onClick={() => setEntered(true)}
          className="pointer-events-auto text-white/70 text-[10px] md:text-xs tracking-[0.35em] hover:text-white transition-colors cursor-pointer whitespace-nowrap uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
          aria-label="Entra nel sito"
        >
          [ enter ]
        </button>
      </div>
    </div>
  );
}
