import { NextResponse } from "next/server";
import { createKeyword, listKeywordsWithCounts } from "@/lib/services/keywords";

// GET /api/keywords — lista lead-számokkal.
export async function GET() {
  try {
    const keywords = await listKeywordsWithCounts();
    return NextResponse.json({ ok: true, keywords });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}

// POST /api/keywords — új (tervezett) kulcsszó. body: { term, notes? }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.term !== "string" || !body.term.trim()) {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'term'." },
        { status: 400 },
      );
    }
    const keyword = await createKeyword(body.term, body.notes ?? null);
    return NextResponse.json({ ok: true, keyword });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
