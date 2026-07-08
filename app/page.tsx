import Image from "next/image";

export default function Home() {
  return (
    <main className="h-[100dvh] w-full relative overflow-hidden bg-black">
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

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.75)_100%)]" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center gap-3 md:gap-4">
        <p className="fade-line-1 font-serif italic text-3xl md:text-5xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          cerco luce.
        </p>
        <p className="fade-line-2 font-serif italic text-3xl md:text-5xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          cerco persone.
        </p>
        <p className="fade-line-3 font-serif italic text-3xl md:text-5xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          cerco strade.
        </p>
      </div>

      <p className="fade-name absolute bottom-8 md:bottom-10 left-0 right-0 z-10 text-center text-[10px] md:text-xs font-light text-white/80 uppercase tracking-[0.5em]">
        Luca Sammarco
      </p>
    </main>
  );
}
