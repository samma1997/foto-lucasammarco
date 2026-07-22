import { notFound } from "next/navigation";

// Il LAB è un playground di sviluppo (transizioni/animazioni): in produzione non
// esiste (404), coerente con /tag. In sviluppo (npm run dev) è su /lab.
export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
