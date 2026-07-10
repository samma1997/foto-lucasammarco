"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { trips } from "@/lib/destinations";

const Globe = dynamic(() => import("./home-globe"), { ssr: false });

type Photo = { src: string; alt: string };

const allPhotos: Photo[] = [
  { src: "/bali-scooter.webp", alt: "Bali 2026" },
  ...trips.flatMap((t) => t.photos.map((p) => ({ src: p.srcThumb, alt: p.alt }))),
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const photos = useMemo(() => {
    // 20 foto random, duplicate x2 per loop infinito
    return shuffle(allPhotos).slice(0, 20);
  }, []);

  // Marquee infinito con GSAP
  useEffect(() => {
    if (!mounted || !trackRef.current) return;
    const track = trackRef.current;
    const totalWidth = track.scrollWidth / 2; // metà = 1 set

    const tween = gsap.to(track, {
      x: -totalWidth,
      duration: isMobile ? 60 : 90,
      ease: "none",
      repeat: -1,
    });

    return () => {
      tween.kill();
      gsap.set(track, { x: 0 });
    };
  }, [mounted, isMobile, photos.length]);

  // Fade in shell
  useEffect(() => {
    if (!mounted || !shellRef.current) return;
    gsap.fromTo(
      shellRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: "sine.out" }
    );
  }, [mounted]);

  const cardW = isMobile ? "45vw" : "21vw";
  const cardH = isMobile ? "calc(45vw * 1.5)" : "calc(21vw * 1.5)";
  const gap = isMobile ? 10 : 16;

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden opacity-0"
    >
      {/* CAROUSEL INFINITA BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
        <div
          ref={trackRef}
          className="flex items-center will-change-transform"
          style={{ gap: `${gap}px` }}
        >
          {[...photos, ...photos].map((p, i) => (
            <div
              key={`c-${i}`}
              className="relative shrink-0 overflow-hidden rounded-md bg-neutral-900 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.75)]"
              style={{ width: cardW, height: cardH }}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 768px) 45vw, 21vw"
                className="object-cover"
                priority={i < 6}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* GLOBO CENTRALE */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Globe isMobile={isMobile} />
        </div>
      </div>

      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-6 md:px-10 pt-5 md:pt-6">
        <div
          className="flex items-center text-white text-xs md:text-sm uppercase tracking-[0.15em] select-none"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
        >
          Luca Sammarco
        </div>
        <nav
          className="flex flex-col items-end gap-1.5 text-white/80 text-xs md:text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <a
            href="/chi-sono"
            className="transition-opacity hover:opacity-80 tracking-[0.05em]"
          >
            Chi sono
          </a>
          <a
            href="/fotografie"
            className="transition-opacity hover:opacity-80 tracking-[0.05em]"
          >
            Fotografie
          </a>
        </nav>
      </header>

      {/* FOOTER */}
      <footer
        className="absolute bottom-0 left-0 right-0 z-30 flex flex-col md:flex-row items-center md:items-end md:justify-between gap-2 md:gap-0 px-6 md:px-10 pb-4 md:pb-6 text-white/70 text-[10px] md:text-xs"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <p className="tracking-[0.05em]">
          © 2026 Luca Sammarco. Milano, Italia
        </p>
        <div className="flex gap-6">
          <a href="#privacy" className="transition-opacity hover:opacity-80 tracking-[0.05em]">
            Privacy Policy
          </a>
          <a href="#cookie" className="transition-opacity hover:opacity-80 tracking-[0.05em]">
            Cookie Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
