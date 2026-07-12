import type { Metadata } from "next";
import { SITE, defaultOgImage } from "@/lib/seo";

const title = "Photography";
const description =
  "Travel and street photography by Luca Sammarco — Bali, Japan, Sri Lanka, Thailand and China. Real life, documented one country at a time.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/photography" },
  openGraph: {
    type: "website",
    url: `${SITE.url}/photography`,
    title: `${title} · ${SITE.name}`,
    description,
    images: [{ url: defaultOgImage(), width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · ${SITE.name}`,
    description,
    images: [defaultOgImage()],
  },
};

export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
