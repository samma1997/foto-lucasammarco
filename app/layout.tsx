import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import PageLoader from "./page-loader";
import SoundAutostart from "./music-player";
import MoodPicker from "./mood-picker";
import { SITE, defaultOgImage } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";

const ibmPlex = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s · Luca Sammarco",
  },
  description: SITE.description,
  keywords: [
    "Luca Sammarco",
    "travel photography",
    "street photography",
    "photography in motion",
    "Bali",
    "Japan",
    "Sri Lanka",
    "Thailand",
    "documentary photography",
  ],
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: SITE.title,
    description: SITE.description,
    images: [
      {
        url: defaultOgImage(),
        width: 1200,
        height: 630,
        alt: "Photography by Luca Sammarco",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [defaultOgImage()],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlex.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full bg-black text-white">
        <PageLoader />
        {children}
        <SoundAutostart />
        <MoodPicker />
        <Analytics />
      </body>
    </html>
  );
}
