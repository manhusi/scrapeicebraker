import { NextResponse } from "next/server";
import { processPendingLeads } from "@/lib/services/processLeads";

// POST /api/process — egyesített feldolgozás: beolvasás + elemzés egy láncban.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 100)
        : 50;

    const summary = await processPendingLeads({ limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
