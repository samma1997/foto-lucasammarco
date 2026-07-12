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
import { trips, type TripPhoto, type TripBook } from "@/lib/destinations";
import { SoundToggle } from "../../music-player";
import { SocialLinks } from "../../social-links";
import { prefersReducedMotion } from "@/lib/motion";

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
  shenzhen: "China",
  "japan-2025": "Japan",
  "bali-2026": "Bali",
};

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtMonth(d: string) {
  const dt = new Date(d);
  return `${MONTHS_EN[dt.getMonth()]} ${dt.getFullYear()}`;
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
  const heroRef = useRef<HTMLElement>(null);
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
    resize: () => void;
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
    const rm = prefersReducedMotion(); // transizioni istantanee

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
          duration: rm ? 0 : 0.85,
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
        { opacity: 0, y: 10, duration: rm ? 0 : 0.3, ease: "power2.in" },
        0,
      );
      tl.call(() => setDisplayedIdx(newIdx), [], rm ? 0 : 0.32);
      tl.fromTo(
        rest,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: rm ? 0 : 0.45, ease: "power2.out" },
        rm ? 0 : 0.34,
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
        `/photography/${CHRONOLOGICAL[newIdx].slug}`,
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

  // Swipe/drag (touch+pointer) + tastiera — SOLO sull'hero, non su tutta la pagina
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = Observer.create({
      type: "touch,pointer",
      target: hero,
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
    if (prefersReducedMotion()) return; // scroll nativo, niente smooth
    let rafId = 0;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
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
        resize: () => void;
      };
      lenisRef.current = lenis;
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      // FIX blocco scroll: quando la pagina cresce (170 foto lazy che caricano,
      // layout che si assesta) Lenis deve rimisurare il limite, altrimenti clampa.
      ro = new ResizeObserver(() => lenis.resize());
      ro.observe(document.body);
      lenis.resize();
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
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
  // TUTTE le foto del viaggio, in ordine cronologico (per data, stabile)
  const gridPhotos = displayedTrip.photos
    .filter((p) => p.srcThumb !== displayedTrip.coverSrc)
    .sort((a, b) => a.date.localeCompare(b.date));
  const book = displayedTrip.book;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-start justify-between px-6 md:px-10 pt-5 md:pt-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center text-white text-xs md:text-sm uppercase tracking-[0.15em] select-none"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
          >
            Luca Sammarco
          </Link>
          <SoundToggle />
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

      {/* CAROUSEL COVER */}
      <section
        ref={heroRef}
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
            {displayedName} · {fmtMonth(displayedTrip.startDate)}
          </div>
          <h1
            className="text-white/85 text-sm md:text-base leading-relaxed max-w-xl mx-auto"
            style={{ fontWeight: 300, letterSpacing: "0.01em" }}
          >
            {displayedTrip.excerpt}
          </h1>
          {displayedTrip.camera && (
            <div
              className="mt-6 text-white/40 text-[10px] md:text-xs tracking-[0.25em] uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Shot on {displayedTrip.camera}
            </div>
          )}
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

        {/* THE BOOK — solo per i viaggi con un libro */}
        {book && (
          <section
            id="the-book"
            className="scroll-mt-24 border-t border-white/10 px-6 md:px-10 py-20 md:py-28"
          >
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              {/* galleria libro animata */}
              <BookShowcase book={book} />

              {/* testo */}
              <div style={{ fontFamily: SERIF }}>
                <p
                  className="mb-4 text-white/40 text-[10px] md:text-xs uppercase tracking-[0.35em]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  The Book
                </p>
                <h2
                  className="text-4xl md:text-6xl"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {book.title}{" "}
                  <span className="text-white/40">{book.year}</span>
                </h2>
                <div className="mt-6 max-w-md space-y-4 text-white/70 text-sm md:text-base leading-relaxed" style={{ fontWeight: 300 }}>
                  {book.blurb.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <p className="text-white/90">{book.note}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {book.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/15 px-3 py-1 text-white/50 text-[10px] md:text-xs uppercase tracking-[0.15em]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <a
                  href={book.requestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 border border-white/80 px-6 py-3 text-white text-xs md:text-sm uppercase tracking-[0.25em] transition-colors hover:bg-white hover:text-black"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {book.requestLabel} →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer
          className="flex flex-col md:flex-row items-center md:items-end md:justify-between gap-2 md:gap-0 px-6 md:px-10 pb-4 md:pb-6 text-white/70 text-[10px] md:text-xs"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <p className="tracking-[0.05em]">
            © 2026 Luca Sammarco. Milan, Italy
          </p>
          <div className="flex items-center gap-6">
            <SocialLinks />
            <a
              href="https://lucasammarco.com/privacy" target="_blank" rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80 tracking-[0.05em]"
            >
              Privacy Policy
            </a>
            <a
              href="https://lucasammarco.com/privacy#cookie" target="_blank" rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80 tracking-[0.05em]"
            >
              Cookie Policy
            </a>
          </div>
        </footer>
      </div>

      {/* richiamino laterale al libro */}
      {book && lightboxIndex === null && (
        <a
          href="#the-book"
          className="fixed right-0 top-1/2 z-40 -translate-y-1/2 border border-r-0 border-white/20 bg-black/70 px-2 py-4 text-white/70 text-[10px] uppercase tracking-[0.3em] backdrop-blur transition-colors hover:text-white"
          style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)" }}
        >
          The Book
        </a>
      )}

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

/* Galleria libro — crossfade automatico stile Apple + click per ingrandire */
function BookShowcase({ book }: { book: TripBook }) {
  const images = [book.cover, book.back, ...book.spreads];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const go = useCallback(
    (i: number) => setActive((i + images.length) % images.length),
    [images.length],
  );

  // auto-cycle (si ferma quando è aperto lo zoom); riparte a ogni cambio
  useEffect(() => {
    if (zoom || prefersReducedMotion()) return;
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % images.length),
      3600,
    );
    return () => window.clearInterval(id);
  }, [zoom, active, images.length]);

  // frecce da tastiera nello zoom
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") go(active - 1);
      if (e.key === "ArrowRight") go(active + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, active, go]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label="Enlarge book"
        className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-md bg-neutral-950"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain transition-all duration-[900ms] ease-out"
            style={{
              opacity: i === active ? 1 : 0,
              transform: i === active ? "scale(1)" : "scale(1.05)",
            }}
          />
        ))}
      </button>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`View ${i + 1}`}
            className={`aspect-square overflow-hidden rounded transition-opacity ${
              i === active
                ? "opacity-100 ring-1 ring-white/70"
                : "opacity-45 hover:opacity-80"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt=""
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-5 top-5 text-white/70 text-xs uppercase tracking-[0.2em] hover:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
            onClick={() => setZoom(false)}
          >
            ✕ close
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-white/60 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(active - 1);
            }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-white/60 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(active + 1);
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

// URL download alta risoluzione (poster) forzando l'attachment via Cloudinary.
function posterDownloadUrl(src: string): string {
  return src
    .replace("/upload/", "/upload/fl_attachment/")
    .replace("f_auto", "f_jpg")
    .replace("q_auto", "q_90")
    .replace(/w_\d+/, "w_2400");
}

const LIKES_KEY = "ls-liked-photos";

function readLikes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(LIKES_KEY) || "[]"));
  } catch {
    return new Set();
  }
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
  const [likes, setLikes] = useState<Set<string>>(() => new Set());
  const [copied, setCopied] = useState(false);
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
    setLikes(readLikes());
  }, []);

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

  const toggleLike = useCallback(() => {
    if (!photo) return;
    setLikes((prevSet) => {
      const nextSet = new Set(prevSet);
      if (nextSet.has(photo.id)) nextSet.delete(photo.id);
      else nextSet.add(photo.id);
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify([...nextSet]));
      } catch {
        /* ignore */
      }
      return nextSet;
    });
  }, [photo]);

  const share = useCallback(async () => {
    if (typeof window === "undefined" || !photo) return;
    const url = window.location.href;
    const title = photo.caption || "Photo by Luca Sammarco";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: "Photo by Luca Sammarco", url });
        return;
      }
    } catch {
      return; // condivisione annullata dall'utente
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [photo]);

  if (!photo) return null;
  const liked = likes.has(photo.id);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* TOP BAR — contatore a sx, azioni a dx (like · download · close) */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3 md:px-6 md:py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-[10px] md:text-xs tracking-[0.2em] tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            aria-label={liked ? "Remove like" : "Like"}
            title={liked ? "Liked" : "Like"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              liked
                ? "border-rose-400/60 bg-rose-500/15 text-rose-400"
                : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>

          <a
            href={posterDownloadUrl(photo.src)}
            download
            onClick={(e) => e.stopPropagation()}
            aria-label="Download poster"
            title="Download — personal use & prints only"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 11 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              share();
            }}
            aria-label="Share"
            title={copied ? "Link copied" : "Share"}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              copied
                ? "border-emerald-400/60 text-emerald-400"
                : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
            }`}
          >
            {copied ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* FOTO — riempie tutto lo spazio disponibile */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-4"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous"
          className="absolute left-1 md:left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl md:text-4xl leading-none text-white/60 hover:text-white"
        >
          ‹
        </button>

        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next"
          className="absolute right-1 md:right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl md:text-4xl leading-none text-white/60 hover:text-white"
        >
          ›
        </button>
      </div>

      {/* CAPTION — fascia sottile sotto la foto, mai sovrapposta */}
      {(photo.caption || photo.exif) && (
        <div
          className="flex shrink-0 flex-col items-center gap-1 px-6 pb-3 pt-2 text-center md:pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.caption && (
            <div className="text-white/60 text-[10px] md:text-xs tracking-[0.15em]">
              {photo.caption}
            </div>
          )}
          {photo.exif && (
            <div className="text-white/35 text-[9px] md:text-[10px] tracking-[0.18em] tabular-nums">
              {photo.exif}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
