import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import PageLoader from "./page-loader";
import SoundAutostart from "./music-player";

const ibmPlex = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Luca Sammarco · Photography in motion",
  description:
    "Travel photography by Luca Sammarco. Documenting real life across the world, one country at a time.",
  metadataBase: new URL("https://foto.lucasammarco.com"),
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
      </body>
    </html>
  );
}
