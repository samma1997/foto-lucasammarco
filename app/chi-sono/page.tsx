"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trips } from "@/lib/destinations";

/* ------------------------------------------------------------------ */
/*  Fotografia in movimento — scroll-driven frame sequence (Apple-style) */
/*  151 frame WebP estratti dal video, scrubbed su <canvas> allo scroll  */
/* ------------------------------------------------------------------ */

const FRAME_COUNT = 151;
const framePath = (i: number) =>
  `/motion-frames/frame_${String(i + 1).padStart(3, "0")}.webp`;

// Foto reali dai viaggi (Cloudinary) per il momento showcase
const CDN = "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_600/v1/sammapix/portfolio/";
const PHOTOS: { src: string; alt: string; rot: number }[] = [
  { src: CDN + "bali-2026/01-bali-golden-hour-walk-man-bucket-street-indonesia", alt: "Bali, golden hour", rot: 0 },
  { src: CDN + "japan/01-senso-ji-hozomon-gate-tokyo-japan-red-lantern-crowd", alt: "Tokyo, Senso-ji", rot: -2 },
  { src: CDN + "sri-lanka/01-gangaramaya-temple-buddha-statues-stupa-colombo-sri-lanka", alt: "Colombo, Sri Lanka", rot: 3 },
  { src: CDN + "thailand/01-wat-benchamabophit-marble-temple-bangkok-thailand", alt: "Bangkok, Thailandia", rot: 8 },
];

// Muro di foto finale — 4 colonne dai viaggi
const WALL_COLUMNS: { src: string; alt: string }[][] = (() => {
  const all = trips.flatMap((t) =>
    t.photos.map((p) => ({ src: p.srcThumb, alt: p.alt }))
  );
  const step = Math.max(1, Math.floor(all.length / 28));
  const picked = all.filter((_, i) => i % step === 0).slice(0, 28);
  const cols: { src: string; alt: string }[][] = [[], [], [], []];
  picked.forEach((p, i) => cols[i % 4].push(p));
  return cols;
})();

// Noise SVG inline → grain cinematografico senza asset
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  );

/* -------- Barra scroll + lettura % (solo dev, non invasiva) -------- */
function DevScrollHUD() {
  const [on, setOn] = useState(true);
  const [prog, setProg] = useState(0); // 0..1 scroll
  const [ptr, setPtr] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") setOn((v) => !v);
    };
    let raf = 0;
    const upd = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProg(max > 0 ? window.scrollY / max : 0);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(upd);
    };
    const onMove = (e: PointerEvent) =>
      setPtr({
        x: Math.round((e.clientX / window.innerWidth) * 100),
        y: Math.round((e.clientY / window.innerHeight) * 100),
      });
    window.addEventListener("keydown", k);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    upd();
    return () => {
      window.removeEventListener("keydown", k);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const pct = Math.round(prog * 100);
  const frame = Math.min(FRAME_COUNT, Math.round(prog * (FRAME_COUNT - 1)) + 1);
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  if (!on) {
    return (
      <button
        onClick={() => setOn(true)}
        className="pointer-events-auto fixed bottom-3 right-3 z-[600] rounded bg-white/10 px-2 py-1 text-[10px] tracking-widest text-white/70 backdrop-blur"
      >
        HUD (g)
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[600]">
      {/* readout in alto */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/80 px-4 py-1.5 text-[12px] font-medium tabular-nums text-white ring-1 ring-white/15">
        <span className="text-cyan-300">SCROLL {pct}%</span>
        <span className="mx-2 text-white/30">·</span>
        <span>FRAME {String(frame).padStart(3, "0")}/{FRAME_COUNT}</span>
        <span className="mx-2 text-white/30">·</span>
        <span className="text-white/60">
          POS {ptr ? `x${ptr.x} y${ptr.y}` : "—"}
        </span>
      </div>

      {/* barra verticale scroll */}
      <div className="absolute right-5 top-1/2 h-[72vh] -translate-y-1/2">
        <div className="relative mx-auto h-full w-[3px] rounded bg-white/15">
          {/* riempimento */}
          <div
            className="absolute left-0 top-0 w-full rounded bg-cyan-300/80"
            style={{ height: pct + "%" }}
          />
          {/* tacche */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute right-full flex -translate-y-1/2 items-center gap-1 pr-2"
              style={{ top: t + "%" }}
            >
              <span className="rounded bg-black/70 px-1 text-[9px] tabular-nums text-white/55">
                {t}
              </span>
              <span className="block h-px w-2 bg-white/25" />
            </div>
          ))}
          {/* marker corrente */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ top: pct + "%" }}
          >
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-300 ring-2 ring-black" />
              <span className="absolute right-full top-1/2 mr-2 -translate-y-1/2 rounded bg-cyan-300 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-black">
                {pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-[10px] tracking-widest text-white/70">
        scrolla e leggi la % · dimmi entrata→uscita di ogni testo · [g] nascondi
      </div>
    </div>
  );
}

export default function ChiSono() {
  const isDev = process.env.NODE_ENV !== "production";
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // overlay refs
  const hintRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const wallColRefs = useRef<(HTMLDivElement | null)[]>([]);

  // beat refs
  const beat2 = useRef<HTMLDivElement>(null);
  const beat3 = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
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
      // pre-decodifica il frame → drawImage istantaneo, scrub senza stutter
      img.onload = () => {
        if (img.decode) img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = done;
      img.src = framePath(i);
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
    let refreshOff: (() => void) | null = null;
    type LenisLike = {
      raf: (t: number) => void;
      destroy: () => void;
      resize: () => void;
      on: (ev: string, cb: () => void) => void;
    };
    let lenis: LenisLike | null = null;
    let cancelled = false;
    gsap.registerPlugin(ScrollTrigger);
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
      // FIX pin+Lenis: quando ScrollTrigger ricalcola (pin spacer), Lenis
      // deve rimisurare lo scroll-height, altrimenti clampa a 1 schermo.
      const onRefresh = () => lenis?.resize();
      ScrollTrigger.addEventListener("refresh", onRefresh);
      refreshOff = () => ScrollTrigger.removeEventListener("refresh", onRefresh);
      ScrollTrigger.refresh();
      rafOff = () => gsap.ticker.remove(tick);
    })();
    return () => {
      cancelled = true;
      refreshOff?.();
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
      // sorgente 720p → DPR 1 basta e avanza, dimezza il fill-rate = scrub fluido
      const dpr = 1;
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
      // beat 2 = titolo iniziale, visibile già a 0%; gli altri nascosti
      gsap.set([beat3, beat4, beat5, beat6].map((r) => r.current!), {
        autoAlpha: 0,
      });
      gsap.set(beat2.current!, { autoAlpha: 1 });
      const b2lines = beat2.current!.querySelectorAll<HTMLElement>(".line");
      if (!reduce) gsap.set(b2lines, { yPercent: 0 });

      // momento foto: stato iniziale (card nascoste + rotazione a ventaglio)
      const pics = photosRef.current!.querySelectorAll<HTMLElement>(".pic");
      const ptitle =
        photosRef.current!.querySelector<HTMLElement>(".ptitle");
      gsap.set(photosRef.current!, { autoAlpha: 0 });
      gsap.set(pics, {
        autoAlpha: 0,
        y: reduce ? 0 : 80,
        scale: reduce ? 1 : 0.9,
        rotation: (i: number) => (reduce ? 0 : PHOTOS[i]?.rot ?? 0),
        transformOrigin: "center center",
      });
      if (ptitle) gsap.set(ptitle, { autoAlpha: 0, y: reduce ? 0 : 30 });
      gsap.set(blackoutRef.current!, { autoAlpha: 0 });
      gsap.set(wallRef.current!, { autoAlpha: 0 });

      // marquee del muro (in pausa; parte quando il muro è visibile ~77%)
      const marquee: gsap.core.Tween[] = [];
      if (!reduce)
        wallColRefs.current.forEach((col, i) => {
          if (!col) return;
          const up = i % 2 === 0;
          const dur = 38 + i * 5;
          marquee.push(
            up
              ? gsap.fromTo(
                  col,
                  { yPercent: 0 },
                  { yPercent: -50, duration: dur, ease: "none", repeat: -1, paused: true }
                )
              : gsap.fromTo(
                  col,
                  { yPercent: -50 },
                  { yPercent: 0, duration: dur, ease: "none", repeat: -1, paused: true }
                )
          );
        });

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
          onUpdate: (self) => {
            const show = self.progress > 0.76;
            marquee.forEach((t) => (show ? t.play() : t.pause()));
          },
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
            if (idx === currentFrame.current) return; // niente redraw inutili
            currentFrame.current = idx;
            drawFrame.current(idx);
          },
        },
        0
      );

      // ---- scroll hint esce ----
      tl.to(hintRef.current, { autoAlpha: 0, duration: 5 }, 3);

      // helper beat: in / out — entrata filmica (scale + blur drift)
      const inY = reduce ? 0 : 46;
      const outY = reduce ? 0 : -30;
      const inScale = reduce ? 1 : 1.08;
      const beatIn = (el: HTMLElement, at: number) =>
        tl.fromTo(
          el,
          {
            autoAlpha: 0,
            y: inY,
            scale: inScale,
            filter: reduce ? "blur(0px)" : "blur(9px)",
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 5.5,
            ease: "power3.out",
          },
          at
        );
      const beatOut = (el: HTMLElement, at: number) =>
        tl.to(
          el,
          {
            autoAlpha: 0,
            y: outY,
            scale: reduce ? 1 : 1.04,
            filter: reduce ? "blur(0px)" : "blur(6px)",
            duration: 3,
            ease: "sine.in",
          },
          at
        );

      // BEAT 2 — TITOLO INIZIALE: già visibile a 0%, si dissolve ~8%
      beatOut(beat2.current!, 8);

      // BEAT 3 — basso destra, blur-to-focus (9 → ~40)
      tl.fromTo(
        beat3.current!,
        {
          autoAlpha: 0,
          scale: inScale,
          filter: reduce ? "blur(0px)" : "blur(14px)",
        },
        {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 5.5,
          ease: "power2.out",
        },
        9
      );
      beatOut(beat3.current!, 26);

      // MOMENTO FOTO — titolo a sinistra + ventaglio foto reali (30 → 46)
      tl.to(photosRef.current!, { autoAlpha: 1, duration: 0.01 }, 30);
      if (ptitle)
        tl.fromTo(
          ptitle,
          { autoAlpha: 0, y: reduce ? 0 : 30 },
          { autoAlpha: 1, y: 0, duration: 4, ease: "power3.out" },
          30
        );
      tl.to(
        pics,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 4.5,
          ease: "power3.out",
          stagger: reduce ? 0 : 1.1,
        },
        31
      );
      tl.to(
        photosRef.current!,
        {
          autoAlpha: 0,
          y: reduce ? 0 : -24,
          filter: reduce ? "blur(0px)" : "blur(6px)",
          duration: 3,
          ease: "sine.in",
        },
        46
      );

      // BEAT 4 — "La luce naturale", centrata in basso (58 → 82, tiene dentro il nero)
      beatIn(beat4.current!, 58);
      beatOut(beat4.current!, 82);

      // BEAT 5 — l'istante: PARCHEGGIATO (evita overlap con beat4 in basso)
      // beatIn(beat5.current!, 70);
      // beatOut(beat5.current!, 83);

      // FADE TO BLACK — il video sfuma al nero dal ~75%
      tl.to(
        blackoutRef.current!,
        { autoAlpha: 1, duration: 8, ease: "power1.in" },
        75
      );

      // MURO DI FOTO — entra a 77% sopra il nero e resta fino alla fine
      tl.to(
        wallRef.current!,
        { autoAlpha: 1, duration: 7, ease: "power2.out" },
        77
      );

      // BEAT 6 — CTA: nel muro di foto (vedi wallRef)
    }, stageRef);

    // misure corrette dopo layout completo (muro sotto, font, ecc.)
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      ctx.revert();
    };
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

        {/* cornice nera sfumata attorno al video (stile CapCut) — centro pulito */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ boxShadow: "inset 0 0 220px 130px rgba(0,0,0,0.97)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 108% 98% at 50% 50%, transparent 46%, rgba(0,0,0,0.82) 100%)",
          }}
        />

        {/* scrim leggeri solo per leggibilità HUD/testi ai bordi */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[26%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[30%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.46), transparent)",
          }}
        />

        {/* fade to black finale (dal ~75%) */}
        <div
          ref={blackoutRef}
          className="pointer-events-none absolute inset-0 z-20 bg-black opacity-0"
        />

        {/* ---------- TESTI ---------- */}
        {/* BEAT 2 — headline, terzo sinistro */}
        <div
          ref={beat2}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 left-6 md:left-[7vw] right-6 top-1/2 -translate-y-1/2"
        >
          <p className={`${label} mb-4`}>Luca Sammarco — Fotografo</p>
          <h1
            className="font-medium leading-[0.98] tracking-[-0.01em]"
            style={{ fontSize: "clamp(1.9rem, 8vw, 4.4rem)" }}
          >
            <span className="block overflow-hidden">
              <span className="line block will-change-transform">Fotografia</span>
            </span>
            <span className="block overflow-hidden">
              <span className="line block will-change-transform">in movimento</span>
            </span>
          </h1>
          <p className="mt-5 md:mt-6 max-w-[78vw] md:max-w-[26vw] font-light leading-[1.4] text-white/75 text-[3.6vw] md:text-[1rem]">
            Immagini nate camminando. L&apos;istante colto mentre tutto scorre.
          </p>
        </div>

        {/* BEAT 3 — metodo, sinistra bassa */}
        <div
          ref={beat3}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 right-6 md:right-[7vw] bottom-[14vh] md:bottom-[18vh] max-w-[80vw] md:max-w-[34vw] text-right"
        >
          <p className={`${label} mb-3`}>Il metodo</p>
          <p className="font-light leading-[1.22] tracking-[0.01em] text-[4.5vw] md:text-[1.7rem]">
            Cammino, guardo,
            <br />e solo allora scatto.
          </p>
        </div>

        {/* MOMENTO FOTO — titolo + una foto sotto, a sinistra */}
        <div
          ref={photosRef}
          className="pointer-events-none absolute inset-0 z-30"
        >
          <div className="absolute left-6 md:left-[7vw] bottom-[8vh] md:bottom-[9vh] max-w-[74vw] md:max-w-[30vw]">
            <div className="ptitle" style={{ textShadow: SHADOW }}>
              <p className={`${label} mb-3`}>Il lavoro · Asia</p>
              <p
                className="font-light leading-[1.05] tracking-[-0.005em]"
                style={{ fontSize: "clamp(1.6rem, 5.5vw, 3rem)" }}
              >
                Un fotogramma
                <br />alla volta.
              </p>
            </div>

            <div className="pic mt-6 md:mt-7 relative w-[48vw] md:w-[15vw] aspect-[3/4] overflow-hidden rounded-md bg-neutral-900 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PHOTOS[0].src}
                alt={PHOTOS[0].alt}
                className="h-full w-full object-cover"
                draggable={false}
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* BEAT 4 — luce, centro-alto */}
        <div
          ref={beat4}
          style={{ textShadow: SHADOW }}
          className="pointer-events-none absolute z-30 left-1/2 -translate-x-1/2 bottom-[12vh] md:bottom-[14vh] w-[90vw] md:w-auto text-center"
        >
          <p className={`${label} mb-4`}>Asia · 2024—2026</p>
          <p className="font-light leading-[1.12] tracking-[0.01em] text-[6vw] md:text-[2.8vw]">
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
          <p className="font-light leading-[1.18] tracking-[0.01em] text-[5.5vw] md:text-[2.2rem]">
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

        {/* MURO DI FOTO — entra a 77%, sopra il video che sfuma al nero */}
        <div
          ref={wallRef}
          className="pointer-events-none absolute inset-0 z-40 bg-black opacity-0"
        >
          <div className="grid h-full grid-cols-2 gap-4 px-5 md:grid-cols-4 md:gap-6 md:px-12">
            {WALL_COLUMNS.map((col, i) => (
              <div
                key={i}
                className={`relative overflow-hidden ${i >= 2 ? "hidden md:block" : ""}`}
              >
                <div
                  ref={(el) => {
                    wallColRefs.current[i] = el;
                  }}
                  className="flex flex-col gap-4 will-change-transform md:gap-6"
                >
                  {[...col, ...col].map((p, j) => (
                    <div
                      key={j}
                      className="relative w-full overflow-hidden rounded-md bg-neutral-900 aspect-[3/4]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.src}
                        alt={p.alt}
                        className="h-full w-full object-cover"
                        draggable={false}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* nero sopra */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[32%]"
            style={{ background: "linear-gradient(to bottom, #000 28%, transparent)" }}
          />
          {/* nero sotto (ospita la CTA) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%]"
            style={{ background: "linear-gradient(to top, #000 42%, transparent)" }}
          />

          {/* CTA */}
          <div className="absolute inset-x-0 bottom-[10vh] flex flex-col items-center gap-5 text-center">
            <p className={label}>Esplora il mio lavoro</p>
            <Link
              href="/fotografie"
              className="pointer-events-auto text-white/85 hover:text-white transition-colors text-[0.9rem] md:text-base tracking-[0.35em] uppercase focus-visible:outline focus-visible:outline-1 focus-visible:outline-white focus-visible:outline-offset-4"
            >
              [ fotografie ]
            </Link>
          </div>
        </div>

        {/* grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-50 opacity-[0.06]"
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

      {isDev && <DevScrollHUD />}
    </main>
  );
}
