import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { trips } from "@/lib/destinations";
import { SITE, tripName, tripMonth, ogImageUrl } from "@/lib/seo";
import TripClient from "./trip-client";

export function generateStaticParams() {
  return trips.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trip = trips.find((t) => t.slug === slug);
  if (!trip) return {};

  const name = tripName(trip);
  const title = `${name} · ${tripMonth(trip.startDate)}`;
  const description = trip.excerpt;
  const image = ogImageUrl(trip.coverSrc);
  const url = `${SITE.url}/photography/${trip.slug}`;

  return {
    title,
    description,
    keywords: [name, trip.country, "travel photography", ...trip.tags],
    alternates: { canonical: `/photography/${trip.slug}` },
    openGraph: {
      type: "article",
      url,
      title: `${name} — Photography by Luca Sammarco`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Photography by Luca Sammarco`,
      description,
      images: [image],
    },
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = trips.find((t) => t.slug === slug);
  if (!trip) notFound();

  const name = tripName(trip);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `${name} — Photography by Luca Sammarco`,
    description: trip.excerpt,
    url: `${SITE.url}/photography/${trip.slug}`,
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    dateCreated: trip.startDate,
    contentLocation: { "@type": "Place", name: trip.country },
    image: trip.photos.slice(0, 30).map((p) => ({
      "@type": "ImageObject",
      contentUrl: p.src,
      name: p.caption || p.alt,
      description: p.description,
      creator: { "@type": "Person", name: SITE.author },
      contentLocation: p.location,
      ...(p.width && p.height
        ? { width: p.width, height: p.height }
        : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TripClient />
    </>
  );
}
