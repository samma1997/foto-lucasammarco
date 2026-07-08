import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Luca Sammarco — Fotografia di viaggio",
  description:
    "Portfolio fotografico di viaggio di Luca Sammarco. Storie, strade, persone.",
  metadataBase: new URL("https://foto.lucasammarco.com"),
  openGraph: {
    title: "Luca Sammarco — Fotografia di viaggio",
    description: "Portfolio fotografico di viaggio. Storie, strade, persone.",
    url: "https://foto.lucasammarco.com",
    siteName: "Luca Sammarco Photography",
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">{children}</body>
    </html>
  );
}
