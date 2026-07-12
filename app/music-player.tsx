"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  startAmbient,
  isAmbientStarted,
  isAmbientMuted,
  toggleAmbientMuted,
  onAmbientChange,
} from "./ambient";

const BARS = [
  { d: "0.62s", delay: "0s" },
  { d: "0.95s", delay: "0.15s" },
  { d: "0.74s", delay: "0.33s" },
  { d: "1.05s", delay: "0.08s" },
];

/**
 * Indicatore audio (barrette equalizer) da mettere INLINE accanto al titolo.
 * Non è più fisso: sta dove lo posizioni nel markup (di fianco a "Luca Sammarco").
 * Si mostra solo dopo che l'audio è partito e si aggiorna al mute/unmute.
 */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [, force] = useState(0);

  useEffect(() => {
    const off = onAmbientChange(() => force((n) => n + 1));
    return () => {
      off();
    };
  }, []);

  if (!isAmbientStarted()) return null;
  const muted = isAmbientMuted();

  return (
    <>
      {/* keyframes iniettate qui: garantite (Tailwind non le tocca) */}
      <style>{`@keyframes eqbar{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}`}</style>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleAmbientMuted();
        }}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        title={muted ? "Sound off · click to play" : "Sound on · click to mute"}
        className={`flex h-3.5 items-center gap-[3px] rounded-[3px] outline-none transition-opacity ${className}`}
        style={{ opacity: muted ? 0.4 : 0.9 }}
      >
        {BARS.map((b, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-white"
            style={{
              height: "13px",
              transformOrigin: "center",
              transform: muted ? "scaleY(0.3)" : undefined,
              animation: muted
                ? "none"
                : `eqbar ${b.d} ease-in-out ${b.delay} infinite`,
              willChange: "transform",
            }}
          />
        ))}
      </button>
    </>
  );
}

/**
 * Avvia l'audio al PRIMO gesto SOLO sulle pagine interne (NON sulla home/intro:
 * lì parte con il click su "enter"). Componente invisibile, va in layout.
 */
export default function SoundAutostart() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/" || isAmbientStarted()) return;
    const start = () => {
      startAmbient();
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    window.addEventListener("touchstart", start);
    return remove;
  }, [pathname]);

  return null;
}
