import categoriesMap from "@/lib/photo-categories.json";

/**
 * Categorie curate a mano da Luca (via /tag). Poche e mobile-friendly.
 * Una foto può stare in più categorie; se non è in nessuna resta "uncategorized"
 * (compare solo in "All", senza chip dedicato).
 */
export type Category = { key: string; label: string; hint: string };

export const CATEGORIES: Category[] = [
  {
    key: "portraits",
    label: "Portraits",
    hint: "Una persona è IL soggetto: figura intera, mezzo busto o primo piano, posata o candida. La foto parla di LEI.",
  },
  {
    key: "street",
    label: "Street",
    hint: "Una SCENA è il soggetto: momenti, folla, persone in lontananza. Nessuno domina il frame.",
  },
  {
    key: "scooter",
    label: "Scooter",
    hint: "Scooter e moto ben presenti nella foto (in guida o parcheggiati).",
  },
  {
    key: "food",
    label: "Food & Markets",
    hint: "Cibo, bancarelle, mercati, chi cucina o vende, frutta/spezie.",
  },
  {
    key: "temples",
    label: "Temples",
    hint: "Templi, statue, santuari, monaci, scene spirituali/rituali.",
  },
  {
    key: "landscape",
    label: "Landscape",
    hint: "La natura/lo scenario è il soggetto: risaie, montagne, mare, cielo. Senza persona dominante.",
  },
];

const MAP = categoriesMap as Record<string, string[]>;

/** Categorie assegnate a una foto (per id). */
export function categoriesForPhotoId(id: string): string[] {
  return MAP[id] ?? [];
}

/** Categorie presenti in un set di foto, con conteggio, ordinate per frequenza. */
export function availableCategories(
  photos: { id: string }[],
): { key: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of photos) {
    for (const key of categoriesForPhotoId(p.id)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return CATEGORIES.filter((c) => counts.has(c.key))
    .map((c) => ({ key: c.key, label: c.label, count: counts.get(c.key)! }))
    .sort((a, b) => b.count - a.count);
}
