import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black px-6 text-center text-white"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <p className="text-white/30 text-[11px] uppercase tracking-[0.4em]">
        404
      </p>
      <h1
        className="mt-6 max-w-md text-2xl md:text-3xl leading-snug"
        style={{ fontWeight: 300 }}
      >
        This frame doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-sm text-white/45 text-xs md:text-sm leading-relaxed">
        The shot you&apos;re looking for isn&apos;t here. Let&apos;s go back to
        where the light is.
      </p>

      <div className="mt-10 flex items-center gap-6 text-xs md:text-sm">
        <Link
          href="/"
          className="border border-white/80 px-6 py-3 uppercase tracking-[0.25em] transition-colors hover:bg-white hover:text-black"
        >
          Home
        </Link>
        <Link
          href="/photography"
          className="text-white/60 uppercase tracking-[0.2em] transition-opacity hover:text-white"
        >
          Photography →
        </Link>
      </div>
    </div>
  );
}
