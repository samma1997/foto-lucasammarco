"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { trips, getTripBySlug } from "@/lib/destinations";

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

  const contentRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Fade-in on mount / slug change
  useLayoutEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, [slug]);

  const navigateTo = useCallback(
    (targetSlug: string) => {
      if (!contentRef.current) {
        router.push(`/fotografie/${targetSlug}`);
        return;
      }
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -12,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => router.push(`/fotografie/${targetSlug}`),
      });
    },
    [router]
  );

  const gridPhotos = trip
    ? trip.photos.filter((p) => p.srcThumb !== trip.coverSrc).slice(0, 40)
    : [];

  // Lightbox keyboard nav + body lock
  useEffect(() => {
    if (lightbox === null) return;
    const total = gridPhotos.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % total));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + total) % total));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, gridPhotos.length]);

  if (!trip) {
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

  const chronological = [...trips].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const currentIdx = chronological.findIndex((t) => t.slug === trip.slug);
  const total = chronological.length;
  const prevTrip = chronological[(currentIdx - 1 + total) % total];
  const nextTrip = chronological[(currentIdx + 1) % total];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER — stile home */}
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
        {/* HERO — cover centrale + peek laterali (cover altri viaggi) */}
        <section className="relative flex items-center justify-center pt-24 md:pt-28 pb-10 md:pb-14 overflow-hidden">
          {/* Peek left = viaggio precedente */}
          <button
            type="button"
            onClick={() => navigateTo(prevTrip.slug)}
            className="flex flex-col items-center gap-2 md:gap-3 absolute left-0 top-1/2 -translate-y-1/2 w-[18vw] md:w-[14vw] max-w-[200px] -translate-x-[45%] md:-translate-x-[15%] opacity-70 hover:opacity-100 transition-opacity group cursor-pointer"
          >
            <div className="w-full aspect-[3/4] overflow-hidden bg-neutral-900">
              <img
                src={prevTrip.coverSrc}
                alt={DISPLAY_NAME[prevTrip.slug] ?? prevTrip.destination}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                draggable={false}
              />
            </div>
            <div
              className="hidden md:block text-white/60 text-[10px] uppercase tracking-[0.2em] text-center"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ← {DISPLAY_NAME[prevTrip.slug] ?? prevTrip.destination}
            </div>
          </button>

          {/* Cover */}
          <div className="w-[62vw] md:w-[28vw] max-w-[460px] aspect-[3/4] overflow-hidden shadow-2xl">
            <img
              src={cover}
              alt={displayName}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Peek right = viaggio successivo */}
          <button
            type="button"
            onClick={() => navigateTo(nextTrip.slug)}
            className="flex flex-col items-center gap-2 md:gap-3 absolute right-0 top-1/2 -translate-y-1/2 w-[18vw] md:w-[14vw] max-w-[200px] translate-x-[45%] md:translate-x-[15%] opacity-70 hover:opacity-100 transition-opacity group cursor-pointer"
          >
            <div className="w-full aspect-[3/4] overflow-hidden bg-neutral-900">
              <img
                src={nextTrip.coverSrc}
                alt={DISPLAY_NAME[nextTrip.slug] ?? nextTrip.destination}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                draggable={false}
              />
            </div>
            <div
              className="hidden md:block text-white/60 text-[10px] uppercase tracking-[0.2em] text-center"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {DISPLAY_NAME[nextTrip.slug] ?? nextTrip.destination} →
            </div>
          </button>
        </section>

        {/* META — solo data + excerpt */}
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

        {/* GRIGLIA FOTO 3 COLONNE — click apre lightbox */}
        <section className="px-3 md:px-4 pb-24">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-w-[1600px] mx-auto">
            {gridPhotos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightbox(i)}
                className="relative overflow-hidden bg-neutral-900 group cursor-zoom-in"
                style={{
                  aspectRatio: p.width && p.height ? `${p.width} / ${p.height}` : "3 / 4",
                }}
              >
                <img
                  src={p.srcThumb}
                  alt={p.alt}
                  loading={i < 6 ? "eager" : "lazy"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </section>

        {/* FOOTER — stile home */}
        <footer
          className="flex flex-col md:flex-row items-center md:items-end md:justify-between gap-2 md:gap-0 px-6 md:px-10 pb-4 md:pb-6 text-white/70 text-[10px] md:text-xs"
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

      {/* LIGHTBOX */}
      {lightbox !== null && gridPhotos[lightbox] && (
        <Lightbox
          photo={gridPhotos[lightbox]}
          index={lightbox}
          total={gridPhotos.length}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((i) => (i === null ? null : (i - 1 + gridPhotos.length) % gridPhotos.length))}
          onNext={() => setLightbox((i) => (i === null ? null : (i + 1) % gridPhotos.length))}
        />
      )}
    </div>
  );
}

function Lightbox({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: { src: string; alt: string; caption: string };
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!overlayRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
  }, []);

  useLayoutEffect(() => {
    if (!imgRef.current) return;
    gsap.fromTo(imgRef.current, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" });
  }, [photo.src]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Close */}
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

      {/* Counter */}
      <div className="absolute top-5 left-5 md:top-6 md:left-6 z-20 text-white/60 text-[10px] md:text-xs tracking-[0.2em]">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* Prev */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Precedente"
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white text-2xl md:text-3xl leading-none cursor-pointer w-10 h-10 flex items-center justify-center"
      >
        ‹
      </button>

      {/* Next */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Successivo"
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white text-2xl md:text-3xl leading-none cursor-pointer w-10 h-10 flex items-center justify-center"
      >
        ›
      </button>

      {/* Image */}
      <div className="relative max-w-[95vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img
          ref={imgRef}
          src={photo.src}
          alt={photo.alt}
          className="max-w-[95vw] max-h-[85vh] object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center px-6 text-white/60 text-[10px] md:text-xs tracking-[0.15em] pointer-events-none">
          {photo.caption}
        </div>
      )}
    </div>
  );
}
