import { NextResponse } from "next/server";
import { createOfferTemplate } from "@/lib/services/settings";

// POST /api/offers — új ajánlat-sablon. body: { segmentKey, name, body }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (
      typeof body.segmentKey !== "string" ||
      typeof body.name !== "string" ||
      typeof body.body !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'segmentKey', 'name' vagy 'body'." },
        { status: 400 },
      );
    }
    const template = await createOfferTemplate({
      segmentKey: body.segmentKey,
      name: body.name,
      body: body.body,
    });
    return NextResponse.json({ ok: true, id: template.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
