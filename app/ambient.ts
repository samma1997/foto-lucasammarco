// Soundscape "mood" generato con Web Audio — royalty-free, parte al gesto (enter).
// Basi con un minimo di supporto scientifico:
//  - ARMONIA MAGGIORE = affetto positivo (effetto reale, ben documentato)
//  - accordatura A = 432 Hz (percepita più "morbida" da molti)
//  - BATTIMENTO BINAURALE ~10.5 Hz (alfa) → stato di flow/positività rilassata
//    (evidenze modeste ma reali; funziona al meglio in CUFFIA)
//  - PULSAZIONE ISOCRONICA leggera (stessa frequenza) → entrainment anche a casse
// Nota onesta: le "frequenze miracolose" (es. 528 Hz) NON sono provate; qui resto
// su ciò che ha davvero un po' di letteratura, e soprattutto suona bene.

type W = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;
let muted = false;
const VOL = 0.1; // basso: sottofondo leggero, presente ma non invasivo
const BEAT = 10.5; // Hz — alfa (flow, buon umore)
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function startAmbient() {
  if (started || typeof window === "undefined") return;
  const Ctor = window.AudioContext || (window as W).webkitAudioContext;
  if (!Ctor) return;
  muted = false; // parte SEMPRE suonando
  started = true;

  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // filtro caldo con lento respiro
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 950;
  filter.Q.value = 0.5;
  filter.connect(master);
  const fLfo = ctx.createOscillator();
  fLfo.frequency.value = 0.03;
  const fLfoGain = ctx.createGain();
  fLfoGain.gain.value = 220;
  fLfo.connect(fLfoGain);
  fLfoGain.connect(filter.frequency);
  fLfo.start();

  // pulsazione isocronica leggera (entrainment su casse)
  const iso = ctx.createGain();
  iso.gain.value = 1;
  iso.connect(filter);
  const isoLfo = ctx.createOscillator();
  isoLfo.frequency.value = BEAT;
  const isoDepth = ctx.createGain();
  isoDepth.gain.value = 0.12; // sottile
  isoLfo.connect(isoDepth);
  isoDepth.connect(iso.gain);
  isoLfo.start();

  // ACCORDO MAGGIORE (La maggiore), A2=108 da A4=432
  const chord = [108, 136.07, 161.82, 216, 272.14];
  chord.forEach((f, i) => {
    const osc = ctx!.createOscillator();
    osc.type = i % 2 === 0 ? "sine" : "triangle";
    osc.frequency.value = f;
    osc.detune.value = (i - 2) * 3;
    const g = ctx!.createGain();
    g.gain.value = i >= 4 ? 0.04 : 0.08; // top più tenue
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

  // BATTIMENTO BINAURALE ~10.5 Hz (in cuffia) sul La grave
  const carrier = 216;
  ([[-BEAT / 2, -1], [BEAT / 2, 1]] as [number, number][]).forEach(
    ([off, pan]) => {
      const osc = ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = carrier + off;
      const g = ctx!.createGain();
      g.gain.value = 0.05;
      const p = ctx!.createStereoPanner();
      p.pan.value = pan;
      osc.connect(g);
      g.connect(p);
      p.connect(master!); // diretto (non filtrato/pulsato) per un binaurale pulito
      osc.start();
    },
  );

  // ARPEGGIO dolce dell'accordo maggiore (movimento + umore positivo, uplifting)
  // con delay/feedback per spazio. Non pulsato → resta liquido.
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.34;
  const fb = ctx.createGain();
  fb.gain.value = 0.34;
  delay.connect(fb);
  fb.connect(delay);
  const arpBus = ctx.createGain();
  arpBus.gain.value = 0.5;
  arpBus.connect(filter);
  arpBus.connect(delay);
  delay.connect(filter);
  const arpNotes = [216, 272.14, 323.63, 432, 323.63, 272.14]; // La maggiore, su e giù
  let arpI = 0;
  const arpTimer = window.setInterval(() => {
    if (!ctx || muted) return; // da muto non genera nulla
    const f = arpNotes[arpI++ % arpNotes.length];
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0007, t + 2.4);
    o.connect(g);
    g.connect(arpBus);
    o.start(t);
    o.stop(t + 2.6);
  }, 700); // ~movimento morbido, non ritmico
  void arpTimer;

  const now = ctx.currentTime;
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(muted ? 0 : VOL, now + 3);
  ctx.resume?.();
  notify();

  // Rete di sicurezza: il browser sospende l'AudioContext quando il tab va in
  // background o su lock mobile. Al ritorno lo riprendiamo → musica sempre
  // continua, in loop infinito, senza interruzioni percepite.
  const keepAlive = () => {
    if (!ctx) return;
    if (document.visibilityState === "visible" && ctx.state === "suspended") {
      ctx.resume?.();
    }
  };
  document.addEventListener("visibilitychange", keepAlive);
  window.addEventListener("focus", keepAlive);
  window.addEventListener("pageshow", keepAlive);
}

export function setAmbientMuted(m: boolean) {
  muted = m;
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(m ? 0 : VOL, ctx.currentTime + 0.5);
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
