import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-between py-12 md:py-16 px-6">
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 md:gap-10">
        <div className="relative w-full max-w-[380px] md:max-w-[420px] aspect-[3/4] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]">
          <Image
            src="/bali-scooter.jpg"
            alt="Uomo balinese su scooter, villaggio in Bali, 2026. Foto di Luca Sammarco."
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 90vw, 420px"
          />
        </div>
        <p className="font-serif italic text-2xl md:text-3xl text-white/85 tracking-tight">
          coming soon
        </p>
      </div>
      <p className="text-[10px] md:text-xs font-light text-white/70 uppercase tracking-[0.5em] pt-6">
        Luca Sammarco
      </p>
    </main>
  );
}
