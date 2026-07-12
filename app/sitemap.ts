import type { MetadataRoute } from "next";
import { trips } from "@/lib/destinations";
import { SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/photography`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/about`, changeFrequency: "monthly", priority: 0.7 },
  ];

  for (const t of trips) {
    routes.push({
      url: `${SITE.url}/photography/${t.slug}`,
      lastModified: new Date(t.endDate),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return routes;
}
