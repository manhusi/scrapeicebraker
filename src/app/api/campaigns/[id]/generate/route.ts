import { NextResponse } from "next/server";
import { generatePendingMessages } from "@/lib/services/generateMessage";

// POST /api/campaigns/[id]/generate — a kampány ANALYZED leadjeinek draftolása.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const summary = await generatePendingMessages({
      campaignId: id,
      limit: 100,
    });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
