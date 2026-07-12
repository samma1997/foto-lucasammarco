/**
 * Link social minimal (Instagram + Pexels) — iconcine monocromatiche
 * pensate per stare nel footer accanto ai link legali.
 */
export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a
        href="https://www.instagram.com/lucasammarco.web/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="text-white/70 transition-colors hover:text-white"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" />
          <circle cx="12" cy="12" r="4.1" />
          <circle cx="17.5" cy="6.5" r="1.15" fill="currentColor" stroke="none" />
        </svg>
      </a>

      <a
        href="https://www.pexels.com/@samma97/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pexels"
        className="text-white/70 transition-colors hover:text-white"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.2" />
          <path d="M9.6 17.2V7.4h3.1a2.7 2.7 0 0 1 0 5.4H9.6" />
        </svg>
      </a>
    </div>
  );
}
