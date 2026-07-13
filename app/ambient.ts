// Audio di sottofondo: 2 sistemi in uno.
//  1) TRACCE REALI (mp3) royalty-free CC BY — Scott Buckley (default: Amberlight)
//  2) SOUNDSCAPE GENERATIVO (Web Audio) in 7 "mood" — infinito, senza licenza
// Il picker (solo in dev) permette a Luca di scegliere. Parte al gesto (enter),
// continua su tutto il sito, con mute e ripresa automatica in background.

type W = Window & { webkitAudioContext?: typeof AudioContext };

export type MoodKey =
  | "calm"
  | "warm"
  | "uplifting"
  | "deep"
  | "cinematic"
  | "dreamy"
  | "nostalgic";

type Mood = {
  key: MoodKey;
  label: string;
  desc: string;
  chord: number[];
  waves: OscillatorType[];
  filterHz: number;
  filterLfo: { rate: number; depth: number };
  arp: number[];
  arpEvery: number;
  arpDecay: number;
  delayTime: number;
  binaural: number | null;
  shimmer: number | null;
  vol: number;
};

export type TrackDef = {
  key: string;
  label: string;
  desc: string;
  src: string;
  credit: string;
  creditUrl: string;
};

// Tracce reali (mp3) — royalty-free, Creative Commons BY 4.0
export const TRACKS: TrackDef[] = [
  {
    key: "amberlight",
    label: "Amberlight",
    desc: "Scott Buckley — caldo, nostalgico, vibe Ghibli",
    src: "/music/amberlight.mp3",
    credit: "“Amberlight” — Scott Buckley (CC BY 4.0)",
    creditUrl: "https://www.scottbuckley.com.au",
  },
  {
    key: "meanwhile",
    label: "Meanwhile",
    desc: "Scott Buckley — piano etereo, sognante",
    src: "/music/meanwhile.mp3",
    credit: "“Meanwhile” — Scott Buckley (CC BY 4.0)",
    creditUrl: "https://www.scottbuckley.com.au",
  },
];

export const MOODS: Mood[] = [
  {
    key: "calm",
    label: "Calm",
    desc: "Alfa, meditativo — La maggiore, arpeggio morbido",
    chord: [108, 136.07, 161.82, 216, 272.14],
    waves: ["sine", "triangle", "sine", "triangle", "sine"],
    filterHz: 1000,
    filterLfo: { rate: 0.03, depth: 240 },
    arp: [216, 272.14, 323.63, 432, 323.63, 272.14],
    arpEvery: 700,
    arpDecay: 2.4,
    delayTime: 0.34,
    binaural: 10.5,
    shimmer: null,
    vol: 0.13,
  },
  {
    key: "warm",
    label: "Warm",
    desc: "Caldo, lo-fi, nostalgico — Re maggiore basso",
    chord: [73.42, 110, 146.83, 185, 220],
    waves: ["sine", "sine", "triangle", "sine", "triangle"],
    filterHz: 720,
    filterLfo: { rate: 0.024, depth: 170 },
    arp: [146.83, 185, 220, 293.66, 220, 185],
    arpEvery: 900,
    arpDecay: 2.9,
    delayTime: 0.42,
    binaural: null,
    shimmer: null,
    vol: 0.15,
  },
  {
    key: "uplifting",
    label: "Uplifting",
    desc: "Luminoso, carico — Do maggiore 9, shimmer",
    chord: [130.81, 164.81, 196, 246.94, 293.66],
    waves: ["triangle", "sine", "triangle", "sine", "sine"],
    filterHz: 1700,
    filterLfo: { rate: 0.05, depth: 420 },
    arp: [196, 246.94, 293.66, 392, 493.88, 392],
    arpEvery: 560,
    arpDecay: 2.0,
    delayTime: 0.3,
    binaural: null,
    shimmer: 1046.5,
    vol: 0.13,
  },
  {
    key: "deep",
    label: "Deep",
    desc: "Spazioso, elegante — pad lenti, riverbero lungo",
    chord: [110, 164.81, 220, 277.18],
    waves: ["sine", "sine", "triangle", "sine"],
    filterHz: 820,
    filterLfo: { rate: 0.015, depth: 280 },
    arp: [110, 164.81, 220, 164.81],
    arpEvery: 1400,
    arpDecay: 4.2,
    delayTime: 0.6,
    binaural: 10.5,
    shimmer: 880,
    vol: 0.14,
  },
  {
    key: "cinematic",
    label: "Cinematic",
    desc: "Emotivo, da film — motivo lento tipo pianoforte",
    chord: [130.81, 196, 261.63, 329.63, 392],
    waves: ["sine", "sine", "triangle", "sine", "sine"],
    filterHz: 1300,
    filterLfo: { rate: 0.03, depth: 300 },
    arp: [261.63, 329.63, 392, 523.25, 392, 329.63],
    arpEvery: 950,
    arpDecay: 3.2,
    delayTime: 0.5,
    binaural: null,
    shimmer: 1046.5,
    vol: 0.14,
  },
  {
    key: "dreamy",
    label: "Dreamy",
    desc: "Etereo, sognante — riverbero ampio, scintillii alti",
    chord: [174.61, 220, 261.63, 329.63],
    waves: ["sine", "triangle", "sine", "triangle"],
    filterHz: 1500,
    filterLfo: { rate: 0.04, depth: 350 },
    arp: [349.23, 440, 523.25, 659.25, 523.25, 440],
    arpEvery: 780,
    arpDecay: 3.6,
    delayTime: 0.72,
    binaural: null,
    shimmer: 1318.5,
    vol: 0.12,
  },
  {
    key: "nostalgic",
    label: "Nostalgic",
    desc: "Caldo e malinconico — Sol maggiore, melodia tenue",
    chord: [98, 146.83, 196, 246.94, 293.66],
    waves: ["sine", "sine", "triangle", "sine", "triangle"],
    filterHz: 900,
    filterLfo: { rate: 0.025, depth: 180 },
    arp: [196, 246.94, 293.66, 246.94, 220, 196],
    arpEvery: 850,
    arpDecay: 2.8,
    delayTime: 0.44,
    binaural: null,
    shimmer: null,
    vol: 0.15,
  },
];

const DEFAULT_SELECTION = "amberlight"; // parte con la traccia reale

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let audioEl: HTMLAudioElement | null = null;
let fadeIv: number | null = null;
let mode: "mood" | "track" = "track";
let started = false;
let muted = false;
let arpTimer: number | null = null;
let keepAliveAttached = false;
let currentMood: MoodKey = "calm";
let currentTrack: string | null = null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function getMoodDef(key: MoodKey): Mood {
  return MOODS.find((m) => m.key === key) ?? MOODS[0];
}
function isTrackKey(k: string): boolean {
  return TRACKS.some((t) => t.key === k);
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(max-width: 768px)").matches ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

function targetVol(m: Mood): number {
  const mul = isMobileDevice() ? 1.9 : 1;
  return Math.min(0.3, m.vol * mul);
}
function targetTrackVol(): number {
  // le tracce sono già masterizzate: volume da sottofondo, più alto su mobile
  return isMobileDevice() ? 0.5 : 0.3;
}

function attachKeepAlive() {
  if (keepAliveAttached) return;
  const ka = () => {
    if (document.visibilityState !== "visible") return;
    if (mode === "track") {
      if (audioEl && audioEl.paused && !muted) audioEl.play().catch(() => {});
    } else if (ctx && ctx.state === "suspended") {
      ctx.resume?.();
    }
  };
  document.addEventListener("visibilitychange", ka);
  window.addEventListener("focus", ka);
  window.addEventListener("pageshow", ka);
  keepAliveAttached = true;
}

/* ------------------------- TRACCE REALI (mp3) ------------------------- */

function fadeAudio(to: number, durMs: number) {
  if (!audioEl) return;
  if (fadeIv) {
    clearInterval(fadeIv);
    fadeIv = null;
  }
  const from = audioEl.volume;
  const steps = 24;
  let i = 0;
  fadeIv = window.setInterval(() => {
    i++;
    if (!audioEl) {
      if (fadeIv) clearInterval(fadeIv);
      fadeIv = null;
      return;
    }
    audioEl.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
    if (i >= steps) {
      if (fadeIv) clearInterval(fadeIv);
      fadeIv = null;
    }
  }, durMs / steps);
}

function playTrack(key: string, fadeSec: number) {
  const def = TRACKS.find((t) => t.key === key);
  if (!def) return;
  teardownGenerative();
  mode = "track";
  currentTrack = key;
  started = true;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.preload = "auto";
  }
  if (!audioEl.src.endsWith(def.src)) audioEl.src = def.src;
  audioEl.volume = 0;
  audioEl.play().catch(() => {});
  fadeAudio(muted ? 0 : targetTrackVol(), fadeSec * 1000);
  attachKeepAlive();
}

/* ---------------------- SOUNDSCAPE GENERATIVO ------------------------- */

function teardownGenerative() {
  if (arpTimer) {
    clearInterval(arpTimer);
    arpTimer = null;
  }
  try {
    ctx?.close();
  } catch {
    /* ignore */
  }
  ctx = null;
  master = null;
}

function buildMood(mood: Mood, fade: number) {
  const Ctor = window.AudioContext || (window as W).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();

  master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3.2;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  master.connect(comp);
  comp.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = mood.filterHz;
  filter.Q.value = 0.5;
  filter.connect(master);
  const fLfo = ctx.createOscillator();
  fLfo.frequency.value = mood.filterLfo.rate;
  const fLfoGain = ctx.createGain();
  fLfoGain.gain.value = mood.filterLfo.depth;
  fLfo.connect(fLfoGain);
  fLfoGain.connect(filter.frequency);
  fLfo.start();

  const iso = ctx.createGain();
  iso.gain.value = 1;
  iso.connect(filter);
  if (mood.binaural) {
    const isoLfo = ctx.createOscillator();
    isoLfo.frequency.value = mood.binaural;
    const isoDepth = ctx.createGain();
    isoDepth.gain.value = 0.1;
    isoLfo.connect(isoDepth);
    isoDepth.connect(iso.gain);
    isoLfo.start();
  }

  mood.chord.forEach((f, i) => {
    const osc = ctx!.createOscillator();
    osc.type = mood.waves[i % mood.waves.length];
    osc.frequency.value = f;
    osc.detune.value = (i - mood.chord.length / 2) * 3;
    const g = ctx!.createGain();
    g.gain.value = i >= mood.chord.length - 1 ? 0.04 : 0.08;
    const swell = ctx!.createOscillator();
    swell.frequency.value = 0.04 + i * 0.015;
    const swellGain = ctx!.createGain();
    swellGain.gain.value = 0.05;
    swell.connect(swellGain);
    swellGain.connect(g.gain);
    osc.connect(g);
    g.connect(iso);
    osc.start();
    swell.start();
  });

  if (mood.binaural) {
    const carrier = mood.chord[Math.min(3, mood.chord.length - 1)];
    (
      [
        [-mood.binaural / 2, -1],
        [mood.binaural / 2, 1],
      ] as [number, number][]
    ).forEach(([off, pan]) => {
      const osc = ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = carrier + off;
      const g = ctx!.createGain();
      g.gain.value = 0.045;
      const p = ctx!.createStereoPanner();
      p.pan.value = pan;
      osc.connect(g);
      g.connect(p);
      p.connect(master!);
      osc.start();
    });
  }

  if (mood.shimmer) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = mood.shimmer;
    const g = ctx.createGain();
    g.gain.value = 0.015;
    const trem = ctx.createOscillator();
    trem.frequency.value = 0.12;
    const tremG = ctx.createGain();
    tremG.gain.value = 0.012;
    trem.connect(tremG);
    tremG.connect(g.gain);
    osc.connect(g);
    g.connect(filter);
    osc.start();
    trem.start();
  }

  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = mood.delayTime;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  delay.connect(fb);
  fb.connect(delay);
  const arpBus = ctx.createGain();
  arpBus.gain.value = 0.5;
  arpBus.connect(filter);
  arpBus.connect(delay);
  delay.connect(filter);
  let arpI = 0;
  arpTimer = window.setInterval(() => {
    if (!ctx || muted) return;
    const f = mood.arp[arpI++ % mood.arp.length];
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0007, t + mood.arpDecay);
    o.connect(g);
    g.connect(arpBus);
    o.start(t);
    o.stop(t + mood.arpDecay + 0.2);
  }, mood.arpEvery);

  const now = ctx.currentTime;
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(muted ? 0 : targetVol(mood), now + fade);
  ctx.resume?.();
  attachKeepAlive();
}

function playMood(mood: MoodKey, fade: number) {
  if (audioEl) audioEl.pause();
  currentMood = mood;
  const wasMuted = muted;
  teardownGenerative();
  muted = wasMuted;
  mode = "mood";
  started = true;
  buildMood(getMoodDef(mood), fade);
}

/* ------------------------------ API ---------------------------------- */

export function startAmbient(sel?: string) {
  if (started || typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const url = params.get("track") || params.get("mood");
  const valid = (k: string) => isTrackKey(k) || MOODS.some((m) => m.key === k);
  const pick = sel ?? (url && valid(url) ? url : DEFAULT_SELECTION);
  muted = false;
  if (isTrackKey(pick)) playTrack(pick, 2.5);
  else playMood(pick as MoodKey, 2.5);
  notify();
}

/** Cambia sorgente al volo (traccia o mood). */
export function playSelection(key: string) {
  if (!started) {
    startAmbient(key);
    return;
  }
  if (isTrackKey(key)) playTrack(key, 1.4);
  else playMood(key as MoodKey, 1.4);
  notify();
}

export const getSelection = () => (mode === "track" ? currentTrack : currentMood);

/** Credito da mostrare quando è attiva una traccia CC BY (null per i mood). */
export function getActiveTrackCredit(): { credit: string; url: string } | null {
  if (mode !== "track" || !currentTrack) return null;
  const def = TRACKS.find((t) => t.key === currentTrack);
  return def ? { credit: def.credit, url: def.creditUrl } : null;
}

export function setAmbientMuted(m: boolean) {
  muted = m;
  if (mode === "track") {
    fadeAudio(m ? 0 : targetTrackVol(), 500);
  } else if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(
      m ? 0 : targetVol(getMoodDef(currentMood)),
      ctx.currentTime + 0.5,
    );
  }
  notify();
}
export const toggleAmbientMuted = () => setAmbientMuted(!muted);
export const isAmbientStarted = () => started;
export const isAmbientMuted = () => muted;
export function onAmbientChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
