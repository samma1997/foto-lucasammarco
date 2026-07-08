"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Foto per la carrellata intro (mix Cloudinary + locale)
const introSlides = [
  {
    src: "/bali-scooter.jpg",
    alt: "Uomo balinese su scooter, Bali 2026.",
  },
  {
    src: "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_1600/v1/sammapix/portfolio/japan/01-senso-ji-hozomon-gate-tokyo-japan-red-lantern-crowd",
    alt: "Senso-ji, Hozomon Gate, Tokyo, Giappone.",
  },
  {
    src: "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_1600/v1/sammapix/portfolio/sri-lanka/53-sri-lanka-train-journey-girl-window-portrait-red-blue",
    alt: "Ragazza al finestrino del treno, Sri Lanka.",
  },
  {
    src: "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_1600/v1/sammapix/portfolio/thailand/67-kayan-long-neck-woman-portrait-chiang-rai-thailand",
    alt: "Donna Kayan, Chiang Rai, Thailandia.",
  },
  {
    src: "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_1600/v1/sammapix/portfolio/china/12-longgang-china-hanfu-woman-traditional-garden-umbrella",
    alt: "Donna in hanfu con parasole, Longgang, Cina.",
  },
  {
    src: "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_1600/v1/sammapix/portfolio/bali/02-balinese-man-udeng-sarong-coastal-rock-bali-indonesia",
    alt: "Uomo balinese con udeng sulla costa, Bali.",
  },
  {
    src: "https://res.cloudinary.com/do9hrcwn1/image/upload/c_limit,f_auto,q_auto,w_1600/v1/sammapix/portfolio/bali-2026/12-bali-street-vendor-scooter-portrait-food-cart-indonesia",
    alt: "Venditore ambulante in scooter, Bali 2026.",
  },
];

const heroTexts = {
  it: { line1: "queste sono le mie strade", line2: "questa è la mia gente" },
  en: { line1: "these are my roads", line2: "these are my people" },
};

const uiTexts = {
  it: { enter: "ENTRA", sound: "audio", scroll: "scorri per esplorare" },
  en: { enter: "ENTER", sound: "sound", scroll: "scroll to explore" },
};

type Lang = "it" | "en";

export default function Experience() {
  const [entered, setEntered] = useState(false);
  const [lang, setLang] = useState<Lang>("it");
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (soundOn) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch(() => setSoundOn(false));
    } else {
      audioRef.current.pause();
    }
  }, [soundOn]);

  const handleEnter = () => {
    setEntered(true);
    setSoundOn(true);
  };

  return (
    <>
      <audio ref={audioRef} src="/music/ambient.mp3" loop preload="none" />

      {/* --- INTRO GATE --- */}
      {!entered && (
        <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center fade-in-slow">
          {/* Slideshow full-bleed dietro il frame */}
          <div className="absolute inset-0 opacity-40">
            {introSlides.map((s, i) => (
              <div
                key={s.src}
                className="slide absolute inset-0"
                style={{ animationDelay: `${(i * 9) / introSlides.length}s` }}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  className="object-cover"
                  priority={i < 2}
                  sizes="100vw"
                />
              </div>
            ))}
          </div>

          {/* Vignette + grain */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000_90%)] pointer-events-none" />

          {/* Frame centrale con carrellata dentro */}
          <div className="relative z-10 flex flex-col items-center gap-8 md:gap-10">
            <div className="relative w-[70vw] max-w-[380px] aspect-[3/4] border border-white/60">
              {introSlides.map((s, i) => (
                <div
                  key={`f-${s.src}`}
                  className="slide absolute inset-0"
                  style={{ animationDelay: `${(i * 9) / introSlides.length}s` }}
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    className="object-cover"
                    priority={i < 2}
                    sizes="(max-width: 768px) 70vw, 380px"
                  />
                </div>
              ))}

              {/* Cursore X pulsante al centro */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="pulse-x text-white text-2xl mix-blend-difference select-none">
                  ✕
                </span>
              </div>

              {/* Onde SVG scarabocchiate sopra al frame */}
              <svg
                className="absolute left-[-8%] right-[-8%] top-[55%] w-[116%] pointer-events-none wave"
                viewBox="0 0 200 40"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 20 Q 20 5, 40 20 T 80 20 T 120 20 T 160 20 T 200 20"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M0 30 Q 25 18, 50 30 T 100 30 T 150 30 T 200 30"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </div>

            <button
              onClick={handleEnter}
              className="text-white text-2xl md:text-3xl tracking-widest hover:opacity-70 transition-opacity cursor-pointer"
              style={{ fontFamily: "var(--font-hand)" }}
              aria-label="Entra nel sito"
            >
              {uiTexts[lang].enter}
            </button>
          </div>
        </div>
      )}

      {/* --- HERO POST-ENTRA --- */}
      <main className="h-[100dvh] w-full relative overflow-hidden bg-black">
        {/* Foto sfondo full-bleed con ken burns */}
        <div className="absolute inset-0 ken-burns">
          <Image
            src="/bali-scooter.jpg"
            alt="Uomo balinese su scooter, villaggio in Bali, 2026. Foto di Luca Sammarco."
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>

        {/* Overlay scuro per leggibilità */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.8)_100%)]" />

        {/* Top bar: nome + lingua */}
        <div className="absolute top-6 md:top-8 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10">
          <div className="text-[10px] md:text-xs font-light text-white/85 uppercase tracking-[0.35em] fade-in-2">
            Luca Sammarco
          </div>
          <div className="flex items-center gap-3 text-[10px] md:text-xs font-light uppercase tracking-[0.25em] fade-in-2">
            <button
              onClick={() => setLang("it")}
              className={`transition-opacity ${
                lang === "it" ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
              aria-label="Italiano"
            >
              IT
            </button>
            <span className="text-white/30">/</span>
            <button
              onClick={() => setLang("en")}
              className={`transition-opacity ${
                lang === "en" ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
              aria-label="English"
            >
              EN
            </button>
          </div>
        </div>

        {/* Testo graffiti centrale */}
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 text-center">
          <h1
            className="fade-in-1 text-4xl md:text-7xl leading-[1.05] text-[#EF7B11] drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] -rotate-1"
            style={{ fontFamily: "var(--font-marker)" }}
          >
            {heroTexts[lang].line1}
          </h1>
          <h1
            className="fade-in-2 text-4xl md:text-7xl leading-[1.05] mt-2 md:mt-4 text-[#EF7B11] drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] rotate-1"
            style={{ fontFamily: "var(--font-marker)" }}
          >
            {heroTexts[lang].line2}
          </h1>
        </div>

        {/* Bottom: scroll hint + toggle sound */}
        <div className="absolute bottom-6 md:bottom-8 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10 fade-in-3">
          <div className="text-[10px] md:text-xs font-light text-white/70 uppercase tracking-[0.35em]">
            {uiTexts[lang].scroll}
          </div>
          <button
            onClick={() => setSoundOn((v) => !v)}
            className="flex items-center gap-2 text-[10px] md:text-xs font-light text-white/85 uppercase tracking-[0.35em] hover:opacity-70 transition-opacity"
            aria-label={soundOn ? "Disattiva audio" : "Attiva audio"}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                soundOn ? "bg-[#EF7B11]" : "bg-white/40"
              }`}
            />
            {soundOn ? `${uiTexts[lang].sound} on` : `${uiTexts[lang].sound} off`}
          </button>
        </div>
      </main>
    </>
  );
}
