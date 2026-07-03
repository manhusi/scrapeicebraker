import { NextResponse } from "next/server";
import { addLeadsBySegment } from "@/lib/services/campaigns";

// POST /api/campaigns/[id]/leads — leadek hozzáadása szegmens alapján. body: { segmentKey }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (typeof body.segmentKey !== "string" || !body.segmentKey) {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'segmentKey'." },
        { status: 400 },
      );
    }
    const added = await addLeadsBySegment(id, body.segmentKey);
    return NextResponse.json({ ok: true, added });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
