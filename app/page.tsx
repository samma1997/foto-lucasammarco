import Image from "next/image";

export default function Home() {
  return (
    <main className="h-[100dvh] bg-black text-white flex flex-col items-center justify-between py-8 md:py-14 px-6 overflow-hidden">
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-5 md:gap-8">
        <div className="relative aspect-[3/4] h-[55dvh] md:h-[68dvh] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] fade-in-1">
          <Image
            src="/bali-scooter.jpg"
            alt="Uomo balinese su scooter, villaggio in Bali, 2026. Foto di Luca Sammarco."
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 45vh, 420px"
          />
        </div>
        <p className="font-serif italic text-xl md:text-3xl text-white/85 tracking-tight fade-in-2">
          coming soon
        </p>
      </div>
      <p className="text-[10px] md:text-xs font-light text-white/70 uppercase tracking-[0.5em] fade-in-3">
        Luca Sammarco
      </p>
    </main>
  );
}
