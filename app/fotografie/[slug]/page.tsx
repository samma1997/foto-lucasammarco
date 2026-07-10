"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { trips, getTripBySlug, type TripPhoto } from "@/lib/destinations";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Observer);
}

function cldResize(url: string, width: number): string {
  return url.replace(/w_\d+/, `w_${width}`);
}

const DISPLAY_NAME: Record<string, string> = {
  "sri-lanka": "Sri Lanka",
  bali: "Bali",
  thailand: "Thailand",
  shenzhen: "Cina",
  "japan-2025": "Giappone",
  "bali-2026": "Bali",
};

const MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function fmtMonth(d: string) {
  const dt = new Date(d);
  return `${MONTHS_IT[dt.getMonth()]} ${dt.getFullYear()}`;
}

const SERIF = "var(--font-mono), ui-monospace, monospace";

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug ?? "");
  const trip = getTripBySlug(slug);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const coverImgRef = useRef<HTMLDivElement>(null);
  const prevPeekImgRef = useRef<HTMLDivElement>(null);
  const nextPeekImgRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const lenisRef = useRef<{
    raf: (t: number) => void;
    destroy: () => void;
    start: () => void;
    stop: () => void;
  } | null>(null);

  const gridPhotos = trip
    ? trip.photos.filter((p) => p.srcThumb !== trip.coverSrc).slice(0, 40)
    : [];

  // ENTRY — reset stato transizione + fade in (o subtle settle se veniamo da nav)
  useLayoutEffect(() => {
    isNavigatingRef.current = false;
    activeTimelineRef.current?.kill();
    activeTimelineRef.current = null;

    // Kill qualsiasi tween residuo sui refs → no stato residuo tra route
    const refs = [
      coverImgRef.current,
      prevPeekImgRef.current,
      nextPeekImgRef.current,
      restRef.current,
      contentRef.current,
    ].filter(Boolean) as HTMLElement[];
    gsap.killTweensOf(refs);
    refs.forEach((el) => gsap.set(el, { clearProps: "transform,opacity" }));

    if (!contentRef.current) return;
    const skip =
      typeof window !== "undefined" &&
      sessionStorage.getItem("foto-skip-intro") === "1";
    if (skip) {
      sessionStorage.removeItem("foto-skip-intro");
      // Subtle settle → nasconde eventuale flash di caricamento route
      gsap.fromTo(
        contentRef.current,
        { opacity: 0.75, y: -4 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
      return;
    }
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }
    );
  }, [slug]);

  // Cleanup timeline su unmount
  useEffect(() => {
    return () => {
      activeTimelineRef.current?.kill();
    };
  }, []);

  // Lenis smooth scroll → feel editoriale/silky per scroll nativo verticale
  useEffect(() => {
    let rafId = 0;
    let cancelled = false;
    (async () => {
      const mod = await import("lenis");
      if (cancelled) return;
      const LenisCtor = mod.default;
      const lenis = new LenisCtor({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
      }) as unknown as {
        raf: (t: number) => void;
        destroy: () => void;
        start: () => void;
        stop: () => void;
      };
      lenisRef.current = lenis;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Stop Lenis quando lightbox aperto → no scroll dietro alla modale
  useEffect(() => {
    if (lightboxIndex !== null) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [lightboxIndex]);

  // Ordine cronologico + prev/next (wrap-around)
  const chronological = trip
    ? [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate))
    : [];
  const currentIdx = trip
    ? chronological.findIndex((t) => t.slug === trip.slug)
    : -1;
  const totalTrips = chronological.length;
  const prevTrip = trip
    ? chronological[(currentIdx - 1 + totalTrips) % totalTrips]
    : null;
  const nextTrip = trip
    ? chronological[(currentIdx + 1) % totalTrips]
    : null;

  const navigateTo = useCallback(
    (targetSlug: string, direction: "prev" | "next") => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      const targetPeekRef =
        direction === "prev" ? prevPeekImgRef : nextPeekImgRef;
      const otherPeekRef =
        direction === "prev" ? nextPeekImgRef : prevPeekImgRef;

      if (!coverImgRef.current || !targetPeekRef.current) {
        sessionStorage.setItem("foto-skip-intro", "1");
        router.push(`/fotografie/${targetSlug}`);
        return;
      }

      const coverRect = coverImgRef.current.getBoundingClientRect();
      const peekRect = targetPeekRef.current.getBoundingClientRect();

      const coverDx =
        peekRect.left + peekRect.width / 2 - (coverRect.left + coverRect.width / 2);
      const coverDy =
        peekRect.top + peekRect.height / 2 - (coverRect.top + coverRect.height / 2);
      const coverScale = peekRect.width / coverRect.width;

      const peekDx =
        coverRect.left + coverRect.width / 2 - (peekRect.left + peekRect.width / 2);
      const peekDy =
        coverRect.top + coverRect.height / 2 - (peekRect.top + peekRect.height / 2);
      const peekScale = coverRect.width / peekRect.width;

      // Kill timeline precedente se esiste (utente clicca durante altra animazione)
      activeTimelineRef.current?.kill();

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut", force3D: true },
        onComplete: () => {
          sessionStorage.setItem("foto-skip-intro", "1");
          router.push(`/fotografie/${targetSlug}`);
        },
      });
      activeTimelineRef.current = tl;

      // Cover shrink → posizione del peek cliccato
      tl.to(
        coverImgRef.current,
        {
          x: coverDx,
          y: coverDy,
          scale: coverScale,
          duration: 0.85,
        },
        0
      );
      // Peek cliccato grow → centro (posizione della cover)
      tl.to(
        targetPeekRef.current,
        {
          x: peekDx,
          y: peekDy,
          scale: peekScale,
          zIndex: 10,
          duration: 0.85,
        },
        0
      );
      // Altro peek fade + subtle scale-down
      if (otherPeekRef.current) {
        tl.to(
          otherPeekRef.current,
          { opacity: 0, scale: 0.9, duration: 0.45, ease: "power2.in" },
          0
        );
      }
      // Rest (meta + grid + footer) fade + drift verticale sottile
      if (restRef.current) {
        tl.to(
          restRef.current,
          { opacity: 0, y: 20, duration: 0.5, ease: "power2.in" },
          0
        );
      }
    },
    [router]
  );

  // NAV via swipe / wheel orizzontale / tastiera
  useEffect(() => {
    if (!trip || !prevTrip || !nextTrip) return;

    const goPrev = () => {
      if (lightboxIndex !== null) return;
      navigateTo(prevTrip.slug, "prev");
    };
    const goNext = () => {
      if (lightboxIndex !== null) return;
      navigateTo(nextTrip.slug, "next");
    };

    // Solo touch swipe orizzontale (no wheel/mouse — evita trigger accidentale su scroll verticale)
    const obs = Observer.create({
      type: "touch",
      target: window,
      tolerance: 100,
      onLeft: goNext,
      onRight: goPrev,
    });

    const onKey = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      obs.kill();
      window.removeEventListener("keydown", onKey);
    };
  }, [trip, prevTrip, nextTrip, navigateTo, lightboxIndex]);

  if (!trip || !prevTrip || !nextTrip) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
        <div>
          <div
            className="text-white/50 text-xs uppercase tracking-[0.3em] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Viaggio non trovato
          </div>
          <Link
            href="/fotografie"
            className="text-white underline underline-offset-4 hover:text-white/70"
            style={{ fontFamily: SERIF }}
          >
            ← Torna al portfolio
          </Link>
        </div>
      </div>
    );
  }

  const displayName = DISPLAY_NAME[slug] ?? trip.destination;
  const cover = trip.coverSrc;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-start justify-between px-6 md:px-10 pt-5 md:pt-6">
        <Link
          href="/"
          className="flex items-center text-white text-xs md:text-sm uppercase tracking-[0.15em] select-none"
          style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
        >
          Luca Sammarco
        </Link>
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

      <div ref={contentRef}>
        {/* HERO — cover centrale + peek laterali */}
        <section className="relative flex items-center justify-center pt-24 md:pt-28 pb-10 md:pb-14">
          {/* Peek left = viaggio precedente */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[45%] md:-translate-x-[15%] w-[18vw] md:w-[14vw] max-w-[200px]">
            <button
              type="button"
              onClick={() => navigateTo(prevTrip.slug, "prev")}
              className="w-full flex flex-col items-center gap-2 md:gap-3 opacity-70 hover:opacity-100 transition-opacity group cursor-pointer"
            >
              <div
                ref={prevPeekImgRef}
                className="w-full aspect-[3/4] overflow-hidden bg-neutral-900 will-change-transform"
              >
                <img
                  src={cldResize(prevTrip.coverSrc, 500)}
                  alt={DISPLAY_NAME[prevTrip.slug] ?? prevTrip.destination}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div
                className="hidden md:block text-white/60 text-[10px] uppercase tracking-[0.2em] text-center"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ← {DISPLAY_NAME[prevTrip.slug] ?? prevTrip.destination}
              </div>
            </button>
          </div>

          {/* Cover */}
          <div
            ref={coverImgRef}
            className="w-[62vw] md:w-[28vw] max-w-[460px] aspect-[3/4] overflow-hidden shadow-2xl will-change-transform"
          >
            <img
              src={cover}
              alt={displayName}
              className="w-full h-full object-cover"
              draggable={false}
              loading="eager"
              // @ts-expect-error fetchPriority is a valid HTML attribute
              fetchpriority="high"
            />
          </div>

          {/* Peek right = viaggio successivo */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[45%] md:translate-x-[15%] w-[18vw] md:w-[14vw] max-w-[200px]">
            <button
              type="button"
              onClick={() => navigateTo(nextTrip.slug, "next")}
              className="w-full flex flex-col items-center gap-2 md:gap-3 opacity-70 hover:opacity-100 transition-opacity group cursor-pointer"
            >
              <div
                ref={nextPeekImgRef}
                className="w-full aspect-[3/4] overflow-hidden bg-neutral-900 will-change-transform"
              >
                <img
                  src={cldResize(nextTrip.coverSrc, 500)}
                  alt={DISPLAY_NAME[nextTrip.slug] ?? nextTrip.destination}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  draggable={false}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div
                className="hidden md:block text-white/60 text-[10px] uppercase tracking-[0.2em] text-center"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {DISPLAY_NAME[nextTrip.slug] ?? nextTrip.destination} →
              </div>
            </button>
          </div>
        </section>

        <div ref={restRef}>
          {/* META */}
          <section
            className="text-center px-6 pb-10 md:pb-14 max-w-2xl mx-auto"
            style={{ fontFamily: SERIF }}
          >
            <div
              className="text-white/50 text-[10px] md:text-xs tracking-[0.2em] mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {displayName} — {fmtMonth(trip.startDate)}
            </div>
            <h1
              className="text-white/85 text-sm md:text-base leading-relaxed max-w-xl mx-auto"
              style={{ fontWeight: 300, letterSpacing: "0.01em" }}
            >
              {trip.excerpt}
            </h1>
          </section>

          {/* GRIGLIA */}
          <section className="px-3 md:px-4 pb-24">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-[1600px] mx-auto">
              {gridPhotos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="relative overflow-hidden bg-neutral-900 group cursor-zoom-in"
                  style={{
                    aspectRatio:
                      p.width && p.height ? `${p.width} / ${p.height}` : "3 / 4",
                  }}
                >
                  <img
                    src={p.srcThumb}
                    alt={p.alt}
                    loading={i < 6 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer
            className="flex flex-col md:flex-row items-center md:items-end md:justify-between gap-2 md:gap-0 px-6 md:px-10 pb-4 md:pb-6 text-white/70 text-[10px] md:text-xs"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <p className="tracking-[0.05em]">
              © 2026 Luca Sammarco. Milano, Italia
            </p>
            <div className="flex gap-6">
              <a
                href="#privacy"
                className="transition-opacity hover:opacity-80 tracking-[0.05em]"
              >
                Privacy Policy
              </a>
              <a
                href="#cookie"
                className="transition-opacity hover:opacity-80 tracking-[0.05em]"
              >
                Cookie Policy
              </a>
            </div>
          </footer>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={gridPhotos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: TripPhoto[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const total = photos.length;

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Chiudi"
        className="absolute top-5 right-5 md:top-6 md:right-6 z-20 text-white/70 hover:text-white text-2xl md:text-3xl leading-none cursor-pointer w-10 h-10 flex items-center justify-center"
      >
        ×
      </button>

      <div className="absolute top-5 left-5 md:top-6 md:left-6 z-20 text-white/60 text-[10px] md:text-xs tracking-[0.2em] pointer-events-none">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        aria-label="Precedente"
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white text-3xl md:text-4xl leading-none cursor-pointer w-12 h-12 flex items-center justify-center"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        aria-label="Successivo"
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white text-3xl md:text-4xl leading-none cursor-pointer w-12 h-12 flex items-center justify-center"
      >
        ›
      </button>

      <div
        className="relative max-w-[95vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          className="max-w-[95vw] max-h-[85vh] object-contain select-none"
          draggable={false}
        />
      </div>

      {photo.caption && (
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center px-6 text-white/60 text-[10px] md:text-xs tracking-[0.15em] pointer-events-none">
          {photo.caption}
        </div>
      )}
    </div>
  );
}
