import type { Metadata } from "next";
import { SITE, defaultOgImage } from "@/lib/seo";

const title = "About";
const description =
  "Luca Sammarco — developer with a love for travel and photography. Shooting everyday life in motion, seeing the world through different eyes.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    url: `${SITE.url}/about`,
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

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
