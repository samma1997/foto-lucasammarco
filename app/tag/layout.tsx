import { notFound } from "next/navigation";

// La piattaforma di tagging è uno strumento LOCALE: in produzione non esiste
// (404). In sviluppo (npm run dev) è raggiungibile su /tag.
export default function TagLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
