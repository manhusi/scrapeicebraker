import { NextResponse } from "next/server";
import { generatePendingMessages } from "@/lib/services/generateMessage";

// POST /api/write — minden ANALYZED + emailes lead icebreaker-draftja a közös sablonnal (UX v4).
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 200)
        : 50;
    const summary = await generatePendingMessages({ limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
