"use client";

import { useEffect, useState } from "react";
import { getActiveTrackCredit, onAmbientChange } from "./ambient";

/**
 * Credito musica (richiesto da CC BY 4.0). Compare solo quando è attiva una
 * traccia reale; per i mood generativi non serve alcun credito.
 */
export default function MusicCredit({ className = "" }: { className?: string }) {
  const [, force] = useState(0);

  useEffect(() => {
    const off = onAmbientChange(() => force((n) => n + 1));
    return () => {
      off();
    };
  }, []);

  const credit = getActiveTrackCredit();
  if (!credit) return null;

  return (
    <a
      href={credit.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`transition-opacity hover:opacity-80 ${className}`}
      title="Music license"
    >
      ♪ {credit.credit}
    </a>
  );
}
