import { NextResponse } from "next/server";
import { generatePendingMessages } from "@/lib/services/generateMessage";

// POST /api/generate — az ANALYZED leadek icebreaker + üzenet draftolása.
// body: { limit?: number }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 100)
        : 20;

    const summary = await generatePendingMessages({ limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
