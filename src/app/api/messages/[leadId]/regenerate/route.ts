import { NextResponse } from "next/server";
import { generateMessageForLead } from "@/lib/services/generateMessage";

// POST /api/messages/[leadId]/regenerate — újragenerálás (force), a draft felülíródik.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const result = await generateMessageForLead(leadId, { force: true });
    if (result.status === "failed") {
      return NextResponse.json(
        { ok: false, error: result.reason },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
