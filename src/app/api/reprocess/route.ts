import { NextResponse } from "next/server";
import { reprocessAllLeads } from "@/lib/services/reprocessLeads";

// POST /api/reprocess — a nem-jóváhagyott leadek újraelemzése + icebreaker újraírása a
// jelenlegi prompttal/közös törzzsel (UX v4). Body: { limit? }.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && body.limit > 0 ? body.limit : undefined;
    const summary = await reprocessAllLeads({ limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
