"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { trips } from "@/lib/destinations";
import { SoundToggle } from "./music-player";
import { MonoToggle } from "./mono-toggle";
import { SocialLinks } from "./social-links";
import MusicCredit from "./music-credit";
import { prefersReducedMotion } from "@/lib/motion";

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
  const [showGlobe, setShowGlobe] = useState(false);
  const [hovering, setHovering] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const globeWrapRef = useRef<HTMLDivElement>(null);

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

  // Entrata: foto da sinistra + globo che cresce, poi marquee infinito
  useEffect(() => {
    if (!mounted || !trackRef.current) return;
    const track = trackRef.current;
    const cards = cardsRef.current.filter((c): c is HTMLDivElement => !!c);

    // Riduci movimento: niente entrata da sinistra né marquee auto-scroll
    if (prefersReducedMotion()) {
      gsap.set(track, { x: 0 });
      setShowGlobe(true);
      return;
    }

    const startX = -window.innerWidth * 0.5;
    // tutto il nastro scorre da sinistra (un solo elemento = fluidissimo)
    gsap.set(track, { x: startX });

    let marquee: gsap.core.Tween | null = null;
    const tw = gsap.to(track, {
      x: 0,
      duration: 1.15,
      ease: "power3.out",
      onComplete: () => {
        const totalWidth = track.scrollWidth / 2;
        marquee = gsap.to(track, {
          x: -totalWidth,
          duration: isMobile ? 60 : 90,
          ease: "none",
          repeat: -1,
        });
        // solo ORA monto il globo: il suo init pesante non disturba le foto
        setShowGlobe(true);
      },
    });

    return () => {
      tw.kill();
      marquee?.kill();
      gsap.set(track, { x: 0 });
    };
  }, [mounted, isMobile, photos.length]);

  // Entrata del globo (quando montato): piccolo → pieno, poi gira in home-globe
  useEffect(() => {
    if (!showGlobe || !globeWrapRef.current) return;
    if (prefersReducedMotion()) {
      gsap.set(globeWrapRef.current, { scale: 1, autoAlpha: 1 });
      return;
    }
    const tw = gsap.fromTo(
      globeWrapRef.current,
      { scale: 0.24, autoAlpha: 0, transformOrigin: "50% 50%" },
      { scale: 1, autoAlpha: 1, duration: 1.7, ease: "power3.out" },
    );
    return () => {
      tw.kill();
    };
  }, [showGlobe]);

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
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="relative shrink-0 overflow-hidden rounded-md bg-neutral-900 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.75)] will-change-transform"
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
        <div
          ref={globeWrapRef}
          className="pointer-events-auto will-change-transform"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {showGlobe && <Globe isMobile={isMobile} />}
        </div>
      </div>

      {/* MISSIONE — su desktop appare in hover sul globo, su mobile sempre visibile */}
      {showGlobe && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-6 text-center transition-opacity duration-500"
          style={{
            bottom: isMobile ? "13vh" : "12vh",
            opacity: isMobile ? 0.75 : hovering ? 0.9 : 0,
          }}
        >
          <div
            className="max-w-[540px]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <p className="mb-3 text-white/45 text-[0.58rem] uppercase tracking-[0.35em]">
              The map
            </p>
            <p className="text-white/80 text-xs md:text-sm leading-relaxed">
              Every point is a place I&apos;ve documented. The real life you
              don&apos;t usually see. Coloring the map, one country at a time.
              Since 2025.
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-6 md:px-10 pt-5 md:pt-6">
        <div
          className="flex items-center gap-3 text-white text-xs md:text-sm uppercase tracking-[0.15em] select-none"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
        >
          Luca Sammarco
          <SoundToggle />
          <MonoToggle />
        </div>
        <nav
          className="flex flex-col items-end gap-1.5 text-white/80 text-xs md:text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <Link
            href="/about"
            className="transition-opacity hover:opacity-80 tracking-[0.05em]"
          >
            About
          </Link>
          <Link
            href="/photography"
            className="transition-opacity hover:opacity-80 tracking-[0.05em]"
          >
            Photography
          </Link>
        </nav>
      </header>

      {/* FOOTER */}
      <footer
        className="absolute bottom-0 left-0 right-0 z-30 flex flex-col md:flex-row items-center md:items-end md:justify-between gap-2 md:gap-0 px-6 md:px-10 pb-4 md:pb-6 text-white/70 text-[10px] md:text-xs"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <div className="flex flex-col items-center gap-0.5 md:items-start">
          <p className="tracking-[0.05em]">
            © 2026 Luca Sammarco. Milan, Italy
          </p>
          <MusicCredit className="text-white/35 text-[9px] md:text-[10px] tracking-[0.05em]" />
        </div>
        <div className="flex items-center gap-6">
          <SocialLinks />
          <a href="https://lucasammarco.com/privacy" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80 tracking-[0.05em]">
            Privacy Policy
          </a>
          <a href="https://lucasammarco.com/privacy#cookie" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80 tracking-[0.05em]">
            Cookie Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
