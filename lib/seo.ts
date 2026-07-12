import { trips, type Trip } from "@/lib/destinations";

export const SITE = {
  url: "https://foto.lucasammarco.com",
  name: "Luca Sammarco",
  title: "Luca Sammarco · Photography in motion",
  description:
    "Travel photography by Luca Sammarco. Documenting real life across the world, one country at a time.",
  author: "Luca Sammarco",
  locale: "en_US",
  instagram: "https://www.instagram.com/lucasammarco.web/",
  pexels: "https://www.pexels.com/@samma97/",
} as const;

export const DISPLAY_NAME: Record<string, string> = {
  "sri-lanka": "Sri Lanka",
  bali: "Bali",
  thailand: "Thailand",
  shenzhen: "China",
  "japan-2025": "Japan",
  "bali-2026": "Bali",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function tripMonth(startDate: string): string {
  const d = new Date(startDate);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function tripName(t: Trip): string {
  return DISPLAY_NAME[t.slug] ?? t.destination;
}

/** Trasforma una cover Cloudinary in una OG image 1200x630 (jpg, crop smart). */
export function ogImageUrl(cloudinarySrc: string): string {
  return cloudinarySrc.replace(
    /\/upload\/[^/]+\//,
    "/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/",
  );
}

/** OG image di default per home/about: la cover del viaggio più recente. */
export function defaultOgImage(): string {
  const latest = [...trips].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  )[0];
  return ogImageUrl(latest.coverSrc);
}
