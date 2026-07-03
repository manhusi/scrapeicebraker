import { NextResponse } from "next/server";
import { scrapePendingLeads } from "@/lib/services/scrapeLead";

// POST /api/scrape — a függőben lévő (IMPORTED) leadek weboldalának scrape-je.
// body: { limit?: number, includeFailed?: boolean }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 100)
        : 20;
    const includeFailed = body.includeFailed === true;

    const summary = await scrapePendingLeads({ limit, includeFailed });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Ismeretlen hiba",
      },
      { status: 500 },
    );
  }
}
