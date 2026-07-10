"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ------------------------------------------------------------------ */
/*  Fotografia in movimento — scroll-driven frame sequence (Apple-style) */
/*  151 frame WebP estratti dal video, scrubbed su <canvas> allo scroll  */
/* ------------------------------------------------------------------ */

const FRAME_COUNT = 151;
const framePath = (i: number) =>
  `/motion-frames/frame_${String(i + 1).padStart(3, "0")}.webp`;

// Noise SVG inline → grain cinematografico senza asset
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  );

export default function ChiSono() {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // overlay refs
  const hintRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  // beat refs
  const beat2 = useRef<HTMLDivElement>(null);
  const beat3 = useRef<HTMLDivElement>(null);
  const beat4 = useRef<HTMLDivElement>(null);
  const beat5 = useRef<HTMLDivElement>(null);
  const beat6 = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0); // 0..1 loader
  const [ready, setReady] = useState(false);

  /* ---------- 1. Preload di tutti i frame ---------- */
  const imagesRef = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loaded = 0;
    const done = () => {
      loaded++;
      if (cancelled) return;
      setProgress(loaded / FRAME_COUNT);
      if (loaded === FRAME_COUNT) setReady(true);
    };
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = done;
      img.onerror = done;
      imgs[i] = img;
    }
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- 2. Lenis smooth scroll + GSAP ticker sync ---------- */
  useEffect(() => {
    let rafOff: (() => void) | null = null;
    type LenisLike = {
      raf: (t: number) => void;
      destroy: () => void;
      on: (ev: string, cb: () => void) => void;
    };
    let lenis: LenisLike | null = null;
    let cancelled = false;
    (async () => {
      const mod = await import("lenis");
      if (cancelled) return;
      const LenisCtor = mod.default;
      lenis = new LenisCtor({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
      }) as unknown as LenisLike;

      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      rafOff = () => gsap.ticker.remove(tick);
    })();
    return () => {
      cancelled = true;
      rafOff?.();
      lenis?.destroy();
    };
  }, []);

  /* ---------- 3. Canvas draw (cover-fit + DPR) ---------- */
  const drawFrame = useRef<(i: number) => void>(() => {});
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cw = 0;
    let ch = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    drawFrame.current = (i: number) => {
      const idx = Math.max(0, Math.min(FRAME_COUNT - 1, i));
      const img = imagesRef.current[idx];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number, dh: number, dx: number, dy: number;
      if (cr > ir) {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      } else {
        dh = ch;
        dw = ch * ir;
        dy = 0;
        dx = (cw - dw) / 2;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      // counter + progress dot
      const p = idx / (FRAME_COUNT - 1);
      if (counterRef.current)
        counterRef.current.textContent = `${String(idx + 1).padStart(
          3,
          "0"
        )} / ${FRAME_COUNT}`;
      if (dotRef.current) dotRef.current.style.top = `${p * 100}%`;
    };

    const onResize = () => {
      resize();
      drawFrame.current(currentFrame.current);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---------- 4. Timeline scrubbed (frame + testi) ---------- */
  const currentFrame = useRef(0);
  useEffect(() => {
    if (!ready || !stageRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;
    const pin = isMobile ? 400 : 600; // vh

    // primo frame subito
    drawFrame.current(0);

    const ctx = gsap.context(() => {
      const frameObj = { i: 0 };
      const beats = [beat2, beat3, beat4, beat5, beat6].map((r) => r.current!);
      // stato iniziale testi nascosti
      gsap.set(beats, { autoAlpha: 0 });
      const b2lines = beat2.current!.querySelectorAll<HTMLElement>(".line");
      if (!reduce) gsap.set(b2lines, { yPercent: 110 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stageRef.current!,
          start: "top top",
          end: `+=${pin}%`,
          scrub: reduce ? 0.3 : 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ---- frame sequence lungo tutto lo scroll ----
      tl.to(
        frameObj,
        {
          i: FRAME_COUNT - 1,
          duration: 100,
          ease: "none",
          onUpdate: () => {
            const idx = Math.round(frameObj.i);
            currentFrame.current = idx;
            drawFrame.current(idx);
          },
        },
        0
      );

      // ---- scroll hint esce ----
      tl.to(hintRef.current, { autoAlpha: 0, duration: 5 }, 3);

      // helper beat: in / out
      const inY = reduce ? 0 : 40;
      const outY = reduce ? 0 : -24;
      const beatIn = (el: HTMLElement, at: number) =>
        tl.fromTo(
          el,
          { autoAlpha: 0, y: inY },
          { autoAlpha: 1, y: 0, duration: 5, ease: "power3.out" },
          at
        );
      const beatOut = (el: HTMLElement, at: number) =>
        tl.to(el, { autoAlpha: 0, y: outY, duration: 3, ease: "sine.in" }, at);

      // BEAT 2 — headline (10 → 27)
      beatIn(beat2.current!, 10);
      if (!reduce)
        tl.to(
          b2lines,
          { yPercent: 0, duration: 5, stagger: 1.3, ease: "expo.out" },
          10
        );
      beatOut(beat2.current!, 24);

      // BEAT 3 — metodo, blur-to-focus (30 → 47)
      tl.fromTo(
        beat3.current!,
        { autoAlpha: 0, filter: reduce ? "blur(0px)" : "blur(12px)" },
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 5,
          ease: "power2.out",
        },
        30
      );
      beatOut(beat3.current!, 44);

      // BEAT 4 — luce / luoghi (50 → 67)
      beatIn(beat4.current!, 50);
      beatOut(beat4.current!, 64);

      // BEAT 5 — l'istante (70 → 86)
      beatIn(beat5.current!, 70);
      beatOut(beat5.current!, 83);

      // BEAT 6 — CTA (88 → fine, resta)
      beatIn(beat6.current!, 88);
    }, stageRef);

    return () => ctx.revert();
  }, [ready]);

  const label =
    "text-white/70 text-[0.62rem] md:text-[0.68rem] uppercase tracking-[0.35em]";
  // ombra morbida per leggibilità su aree chiare (cielo/strada) — niente box
  const SHADOW =
    "0 2px 34px rgba(0,0,0,0.62), 0 1px 4px rgba(0,0,0,0.5)";

  return (
    <main className="bg-black text-white">
      {/* ---------- LOADER ---------- */}
      {!ready && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <span className={label}>Fotografia in movimento</span>
            <span className="text-white/40 text-[0.62rem] tracking-[0.35em] tabular-nums">
              {Math.round(progress * 100).toString().padStart(2, "0")}%
            </span>
          </div>
        </div>
      )}

      {/* ---------- STAGE (viene pinnato) ---------- */}
      <section
        ref={stageRef}
        className="relative h-[100dvh] w-full overflow-hidden bg-black"
      >
        {/* canvas frame sequence */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Luca Sammarco fotografa in viaggio, in movimento"
        />

        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 100% 82% at 50% 50%, transparent 50%, rgba(0,0,0,0.74) 100%)",
          }}
        />

        {/* scrim top/bottom per leggibilità testi + HUD */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[38%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[42%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.58), transparent)",
          }}
        />

        {/* letterbox 2.39:1 (solo desktop) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden md:block bg-black" style={{ height: "max(0px, calc((100vh - 100vw / 2.39) / 2))" }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden md:block bg-black" style={{ height: "max(0px, calc((100vh - 100vw / 2.39) / 2))" }} />

        {/* ---------- TESTI ---------- */}
        {/* BEAT 2 — headline, terzo sinistro */}
        <div
          ref={beat2}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 left-6 md:left-[7vw] top-1/2 -translate-y-1/2 max-w-[86vw] md:max-w-[42vw]"
        >
          <p className={`${label} mb-4`}>Luca Sammarco — Fotografo</p>
          <h1 className="font-medium leading-[0.98] tracking-[-0.01em] text-[15vw] md:text-[8vw]">
            <span className="block overflow-hidden">
              <span className="line block will-change-transform">Fotografia</span>
            </span>
            <span className="block overflow-hidden">
              <span className="line block will-change-transform">in movimento</span>
            </span>
          </h1>
        </div>

        {/* BEAT 3 — metodo, sinistra bassa */}
        <div
          ref={beat3}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 left-6 md:left-[7vw] bottom-[16vh] md:bottom-[22vh] max-w-[86vw] md:max-w-[40vw]"
        >
          <p className={`${label} mb-4`}>Il metodo</p>
          <p className="font-light leading-[1.15] tracking-[0.01em] text-[7vw] md:text-[3rem]">
            Cammino, guardo,
            <br />e solo allora scatto.
          </p>
        </div>

        {/* BEAT 4 — luce, centro-alto */}
        <div
          ref={beat4}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 left-1/2 -translate-x-1/2 top-[16vh] md:top-[18vh] w-[90vw] md:w-auto text-center"
        >
          <p className={`${label} mb-4`}>Asia · 2024—2026</p>
          <p className="font-light leading-[1.08] tracking-[0.01em] text-[8vw] md:text-[3.6vw]">
            La luce naturale
            <br />detta ogni scatto.
          </p>
        </div>

        {/* BEAT 5 — l'istante, basso destra */}
        <div
          ref={beat5}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 right-6 md:right-[7vw] bottom-[16vh] md:bottom-[24vh] max-w-[80vw] md:max-w-[32vw] text-right"
        >
          <p className={`${label} mb-4`}>[ l&apos;istante ]</p>
          <p className="font-light leading-[1.12] tracking-[0.01em] text-[8vw] md:text-[3rem]">
            Tutto scorre.
            <br />L&apos;immagine resta.
          </p>
        </div>

        {/* BEAT 6 — CTA, centro basso */}
        <div
          ref={beat6}
          style={{ textShadow: SHADOW }}
          className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[14vh] md:bottom-[16vh] flex flex-col items-center gap-5 text-center"
        >
          <p className={label}>Esplora il lavoro</p>
          <Link
            href="/fotografie"
            className="pointer-events-auto text-white/80 hover:text-white transition-colors text-[0.85rem] md:text-base tracking-[0.35em] uppercase focus-visible:outline focus-visible:outline-1 focus-visible:outline-white focus-visible:outline-offset-4"
          >
            [ fotografie ]
          </Link>
        </div>

        {/* ---------- HUD ---------- */}
        {/* frame counter */}
        <div className="pointer-events-none absolute z-40 left-6 md:left-[7vw] bottom-6 md:bottom-8">
          <span className="text-white/30 text-[0.6rem] tracking-[0.3em] tabular-nums">
            [ <span ref={counterRef}>001 / {FRAME_COUNT}</span> ]
          </span>
        </div>

        {/* progress line (desktop) */}
        <div className="pointer-events-none absolute z-40 right-6 top-0 hidden h-full md:block">
          <div className="relative h-full w-px bg-white/15">
            <span
              ref={dotRef}
              className="absolute left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"
              style={{ top: "0%" }}
            />
          </div>
        </div>

        {/* scroll hint */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute z-40 left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center gap-2"
        >
          <span className={label}>Scroll</span>
          <span className="text-white/60 text-sm animate-bounce">∨</span>
        </div>

        {/* grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-50 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: `url("${GRAIN}")`, backgroundRepeat: "repeat" }}
        />
      </section>

      {/* header minimale (torna alla home) */}
      <header className="pointer-events-none fixed top-0 left-0 right-0 z-[60] flex items-start justify-between px-6 md:px-10 pt-5 md:pt-6">
        <Link
          href="/"
          className="pointer-events-auto text-white text-xs md:text-sm uppercase tracking-[0.15em] font-medium hover:opacity-80 transition-opacity"
        >
          Luca Sammarco
        </Link>
        <Link
          href="/fotografie"
          className="pointer-events-auto text-white/80 text-xs md:text-sm tracking-[0.05em] hover:opacity-80 transition-opacity"
        >
          Fotografie
        </Link>
      </header>
    </main>
  );
}
