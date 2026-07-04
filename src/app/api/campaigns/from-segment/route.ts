import { NextResponse } from "next/server";
import { assignSegmentToCampaign } from "@/lib/services/campaigns";

// POST /api/campaigns/from-segment — a Csoportosítás állomás egy-kattintása.
// body: { segmentKey } → a szegmens kampányra váró leadjei illő/új kampányba kerülnek.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.segmentKey !== "string" || !body.segmentKey) {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'segmentKey'." },
        { status: 400 },
      );
    }
    const result = await assignSegmentToCampaign(body.segmentKey);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
