import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "lib", "photo-categories.json");

export async function GET() {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    return NextResponse.json(JSON.parse(txt || "{}"));
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  // salvataggio SOLO in locale: in produzione il filesystem è read-only
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  try {
    const body = await req.json();
    // pulizia: rimuovo le foto senza categorie per tenere il file snello
    const clean: Record<string, string[]> = {};
    for (const [id, cats] of Object.entries(body as Record<string, string[]>)) {
      if (Array.isArray(cats) && cats.length) clean[id] = cats;
    }
    await fs.writeFile(FILE, JSON.stringify(clean, null, 0) + "\n");
    return NextResponse.json({ ok: true, count: Object.keys(clean).length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
