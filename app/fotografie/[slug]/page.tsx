"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { trips, type TripPhoto } from "@/lib/destinations";

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

// Ordine cronologico stabile (tutti i viaggi)
const CHRONOLOGICAL = [...trips].sort((a, b) =>
  a.startDate.localeCompare(b.startDate),
);
const N = CHRONOLOGICAL.length;

// Distanza signed con wrap-around
function wrapDist(d: number) {
  if (d > N / 2) d -= N;
  if (d < -N / 2) d += N;
  return d;
}

// Layout per slot in base alla distanza signed dal centro
function slotLayout(dist: number, isMobile: boolean) {
  const abs = Math.abs(dist);
  if (dist === 0)
    return { x: 0, scale: 1, opacity: 1, zIndex: 20, pe: "auto" as const };
  if (abs === 1)
    return {
      x: dist * (isMobile ? 58 : 38),
      scale: isMobile ? 0.36 : 0.42,
      opacity: 0.65,
      zIndex: 10,
      pe: "auto" as const,
    };
  if (abs === 2)
    return {
      x: dist * (isMobile ? 95 : 72),
      scale: 0.3,
      opacity: 0,
      zIndex: 5,
      pe: "none" as const,
    };
  return {
    x: dist * 110,
    scale: 0.3,
    opacity: 0,
    zIndex: 0,
    pe: "none" as const,
  };
}

export default function TripPage() {
  const params = useParams();
  const initialSlug = String(params?.slug ?? "");
  const initialIdx = Math.max(
    0,
    CHRONOLOGICAL.findIndex((t) => t.slug === initialSlug),
  );

  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [displayedIdx, setDisplayedIdx] = useState(initialIdx);
  const [isMobile, setIsMobile] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const restRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  // Refs sync per leggere valori stabili dentro handlers (nessuna stale closure)
  const currentIdxRef = useRef(initialIdx);
  const isMobileRef = useRef(false);
  const lightboxIndexRef = useRef<number | null>(null);
  const lenisRef = useRef<{
    raf: (t: number) => void;
    destroy: () => void;
    start: () => void;
    stop: () => void;
  } | null>(null);

  // Sync ref con state
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);
  useEffect(() => {
    lightboxIndexRef.current = lightboxIndex;
  }, [lightboxIndex]);

  // Mobile detection
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Layout istantaneo (mount + resize) — NON riparte su currentIdx change
  useLayoutEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = wrapDist(i - currentIdxRef.current);
      const layout = slotLayout(dist, isMobile);
      gsap.set(el, {
        x: `${layout.x}vw`,
        scale: layout.scale,
        opacity: layout.opacity,
        zIndex: layout.zIndex,
      });
      el.style.pointerEvents = layout.pe;
    });
    setMounted(true);
  }, [isMobile]);

  // Cleanup timeline su unmount
  useEffect(() => {
    return () => {
      activeTimelineRef.current?.kill();
    };
  }, []);

  // Navigazione unificata → una sola timeline, un solo onComplete
  const navigateStep = useCallback((direction: -1 | 1) => {
    if (isTransitioningRef.current) return;
    if (lightboxIndexRef.current !== null) return;
    isTransitioningRef.current = true;

    const oldIdx = currentIdxRef.current;
    const newIdx = (oldIdx + direction + N) % N;
    const mobile = isMobileRef.current;

    activeTimelineRef.current?.kill();

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut", force3D: true, overwrite: "auto" },
      onComplete: () => {
        isTransitioningRef.current = false;
        activeTimelineRef.current = null;
      },
    });
    activeTimelineRef.current = tl;

    // Anima ogni slot verso il nuovo layout
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = wrapDist(i - newIdx);
      const layout = slotLayout(dist, mobile);
      tl.to(
        el,
        {
          x: `${layout.x}vw`,
          scale: layout.scale,
          opacity: layout.opacity,
          zIndex: layout.zIndex,
          duration: 0.85,
        },
        0,
      );
      el.style.pointerEvents = layout.pe;
    });

    // Meta+grid: fade out → swap content → fade in (nella STESSA timeline)
    const rest = restRef.current;
    if (rest) {
      tl.to(
        rest,
        { opacity: 0, y: 10, duration: 0.3, ease: "power2.in" },
        0,
      );
      tl.call(() => setDisplayedIdx(newIdx), [], 0.32);
      tl.fromTo(
        rest,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
        0.34,
      );
    } else {
      tl.call(() => setDisplayedIdx(newIdx), [], 0);
    }

    // State + URL — non usati per animare, quindi ok se React re-render arriva più tardi
    currentIdxRef.current = newIdx;
    setCurrentIdx(newIdx);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        `/fotografie/${CHRONOLOGICAL[newIdx].slug}`,
      );
    }
  }, []);

  const goPrev = useCallback(() => navigateStep(-1), [navigateStep]);
  const goNext = useCallback(() => navigateStep(1), [navigateStep]);

  const goToSlot = useCallback(
    (targetIdx: number) => {
      const dist = wrapDist(targetIdx - currentIdxRef.current);
      if (dist === 1) goNext();
      else if (dist === -1) goPrev();
    },
    [goNext, goPrev],
  );

  // Swipe/drag (touch+pointer) + tastiera
  useEffect(() => {
    const obs = Observer.create({
      type: "touch,pointer",
      target: window,
      tolerance: 100,
      onLeft: goNext,
      onRight: goPrev,
    });
    const onKey = (e: KeyboardEvent) => {
      if (lightboxIndexRef.current !== null) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      obs.kill();
      window.removeEventListener("keydown", onKey);
    };
  }, [goPrev, goNext]);

  // Lenis smooth scroll
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

  useEffect(() => {
    if (lightboxIndex !== null) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [lightboxIndex]);

  const displayedTrip = CHRONOLOGICAL[displayedIdx];
  const displayedName =
    DISPLAY_NAME[displayedTrip.slug] ?? displayedTrip.destination;
  const gridPhotos = displayedTrip.photos
    .filter((p) => p.srcThumb !== displayedTrip.coverSrc)
    .slice(0, 40);

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

      {/* CAROUSEL COVER */}
      <section
        className="relative flex items-center justify-center overflow-hidden select-none"
        style={{
          height: "min(70vh, 720px)",
          paddingTop: "6rem",
          cursor: "grab",
        }}
      >
        {CHRONOLOGICAL.map((t, i) => {
          const dist = wrapDist(i - currentIdx);
          const isPeek = Math.abs(dist) === 1;
          return (
            <div
              key={t.slug}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              onClick={() => goToSlot(i)}
              className={`absolute w-[62vw] md:w-[28vw] max-w-[460px] aspect-[3/4] overflow-hidden shadow-2xl will-change-transform ${
                dist === 0 ? "cursor-default" : "cursor-pointer"
              } ${mounted ? "" : "invisible"}`}
              style={{ transformOrigin: "center center" }}
              aria-label={DISPLAY_NAME[t.slug] ?? t.destination}
            >
              <img
                src={cldResize(t.coverSrc, isPeek ? 500 : 900)}
                alt={DISPLAY_NAME[t.slug] ?? t.destination}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                loading={Math.abs(wrapDist(i - initialIdx)) <= 2 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          );
        })}
      </section>

      <div ref={restRef}>
        {/* META */}
        <section
          className="text-center px-6 pt-6 md:pt-8 pb-10 md:pb-14 max-w-2xl mx-auto"
          style={{ fontFamily: SERIF }}
        >
          <div
            className="text-white/50 text-[10px] md:text-xs tracking-[0.2em] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {displayedName} — {fmtMonth(displayedTrip.startDate)}
          </div>
          <h1
            className="text-white/85 text-sm md:text-base leading-relaxed max-w-xl mx-auto"
            style={{ fontWeight: 300, letterSpacing: "0.01em" }}
          >
            {displayedTrip.excerpt}
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
                    p.width && p.height
                      ? `${p.width} / ${p.height}`
                      : "3 / 4",
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
    [total],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total],
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
