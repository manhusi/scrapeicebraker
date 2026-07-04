import { NextResponse } from "next/server";
import { reprocessCampaign } from "@/lib/services/reprocessCampaign";

// POST /api/campaigns/[id]/reprocess — a kampány nem-jóváhagyott leadjeinek újraelemzése +
// icebreaker újraírása a jelenlegi logikával (prompt-hangolás utáni frissítés).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && body.limit > 0 ? body.limit : undefined;
    const summary = await reprocessCampaign(id, { limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
