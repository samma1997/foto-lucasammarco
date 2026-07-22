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
      suppressHydrationWarning
    >
      <head>
        {/* Applica il B/N salvato PRIMA del primo paint → niente flash a colori
            al refresh. Lo stato è persistito dal toggle in ls-mono. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('ls-mono')==='1')document.documentElement.classList.add('mono')}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full bg-black text-white">
        {/* filtro di distorsione liquida per la transizione colore ⇄ B/N */}
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{ position: "absolute", pointerEvents: "none" }}
        >
          <filter
            id="mono-distort"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              id="mono-turb"
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              id="mono-disp"
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          {/* distorsione pilotata dalla velocità di scroll (sulle foto) */}
          <filter
            id="scroll-distort"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              id="scroll-turb"
              type="fractalNoise"
              baseFrequency="0.015 0.02"
              numOctaves="2"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              id="scroll-disp"
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <PageLoader />
        {children}
        <SoundAutostart />
        <MoodPicker />
        <Analytics />
      </body>
    </html>
  );
}
