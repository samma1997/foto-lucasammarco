"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { trips } from "@/lib/destinations";

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

const sortedTrips = [...trips].sort((a, b) =>
  b.startDate.localeCompare(a.startDate),
);

const COUNTRY_OF_TRIP: Record<string, { country: string; continent: string }> = {
  "japan-2025": { country: "Japan", continent: "Asia" },
  "bali-2026": { country: "Indonesia", continent: "Asia" },
  "sri-lanka": { country: "Sri Lanka", continent: "Asia" },
  bali: { country: "Indonesia", continent: "Asia" },
  thailand: { country: "Thailand", continent: "Asia" },
  shenzhen: { country: "China", continent: "Asia" },
};

type ContinentGroup = {
  continent: string;
  trips: typeof sortedTrips;
  countries: string[];
};

const CONTINENTS: ContinentGroup[] = (() => {
  const map = new Map<string, ContinentGroup>();
  sortedTrips.forEach((t) => {
    const meta = COUNTRY_OF_TRIP[t.slug];
    if (!map.has(meta.continent)) {
      map.set(meta.continent, {
        continent: meta.continent,
        trips: [],
        countries: [],
      });
    }
    const g = map.get(meta.continent)!;
    g.trips.push(t);
    if (!g.countries.includes(meta.country)) g.countries.push(meta.country);
  });
  return Array.from(map.values());
})();

function tripYear(startDate: string) {
  return new Date(startDate).getFullYear();
}

function ContinentBlock({
  group,
  copy,
}: {
  group: ContinentGroup;
  copy: number;
}) {
  return (
    <section className="mb-24">
      <div className="mb-8 border-b border-white/10 pb-4">
        <h2
          className="text-white text-5xl md:text-7xl uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          {group.continent}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {group.trips.map((t, i) => (
          <Link
            key={`${t.slug}-${copy}-${i}`}
            href={`/fotografie/${t.slug}`}
            className="group relative aspect-[4/5] overflow-hidden bg-neutral-900 block"
          >
            <img
              src={cldResize(t.coverSrc, 700)}
              alt={DISPLAY_NAME[t.slug] ?? t.destination}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              draggable={false}
              loading={i < 4 ? "eager" : "lazy"}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
            <div
              className="absolute top-4 left-4 text-white/70 text-xs"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div
                className="text-white text-2xl md:text-3xl uppercase leading-none flex items-baseline gap-3"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                <span>{DISPLAY_NAME[t.slug] ?? t.destination}</span>
                <span className="text-white/40" style={{ fontWeight: 300 }}>|</span>
                <span className="text-white/80" style={{ fontWeight: 400 }}>
                  {tripYear(t.startDate)}
                </span>
              </div>
              <div
                className="mt-3 text-white/70 text-xs"
                style={{ fontFamily: "var(--font-mono)", fontWeight: 300 }}
              >
                {t.photoCount} foto
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const NUM_COPIES = 2;

export default function FotografiePage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const repRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const rep = repRef.current;
    if (!track || !rep) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    let repHeight = rep.offsetHeight;
    let scrollY = 0;
    let currentY = 0;
    let raf = 0;
    let running = true;

    const measure = () => {
      const h = rep.offsetHeight;
      if (h > 0) repHeight = h;
    };
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(rep);

    const observer = Observer.create({
      target: window,
      type: "wheel,touch",
      wheelSpeed: 1,
      preventDefault: true,
      onChangeY: (self) => {
        const evt = self.event as Event | undefined;
        const isTouch = !!evt && evt.type.startsWith("touch");
        // Su touch il segno di deltaY è opposto al wheel → invertiamo per uniformare
        const delta = isTouch ? -self.deltaY : self.deltaY;
        scrollY += delta * 1.5;
      },
    });

    const wrap = (v: number) => {
      if (repHeight <= 0) return 0;
      const m = ((v % repHeight) + repHeight) % repHeight;
      return m;
    };

    // Smoothing FPS-independent → silky su qualunque refresh rate
    let lastT = performance.now();
    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastT, 64); // clamp per gap tab switch
      lastT = now;
      if (repHeight > 0) {
        // half-life ~120ms → damping smooth stile Lenis
        const smoothing = 1 - Math.pow(0.001, dt / 120);
        currentY += (scrollY - currentY) * smoothing;
        const y = -wrap(currentY);
        track.style.transform = `translate3d(0, ${y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.kill();
      ro.disconnect();
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black text-white overflow-hidden"
      style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
    >
      {/* HEADER — stile home (con fade nero sopra il loop) */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-start justify-between px-6 md:px-10 pt-5 md:pt-6 pb-6 bg-gradient-to-b from-black via-black/90 to-transparent">
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

      {/* TRACK LOOP */}
      <div
        ref={trackRef}
        className="absolute top-0 left-0 right-0 will-change-transform pt-20 px-6 md:px-10"
      >
        {Array.from({ length: NUM_COPIES }).map((_, r) => (
          <div key={`rep-${r}`} ref={r === 0 ? repRef : null}>
            {CONTINENTS.map((g) => (
              <ContinentBlock key={`${g.continent}-${r}`} group={g} copy={r} />
            ))}
          </div>
        ))}
      </div>

      {/* FOOTER — stile home (con fade nero sopra il loop) */}
      <footer
        className="absolute bottom-0 left-0 right-0 z-40 flex flex-col md:flex-row items-center md:items-end md:justify-between gap-2 md:gap-0 px-6 md:px-10 pt-8 pb-4 md:pb-6 text-white/70 text-[10px] md:text-xs bg-gradient-to-t from-black via-black/90 to-transparent"
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
