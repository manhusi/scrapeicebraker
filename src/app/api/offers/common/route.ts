import { NextResponse } from "next/server";
import { saveCommonBody } from "@/lib/services/settings";

// PUT /api/offers/common — a KÖZÖS ajánlat-törzs mentése. body: { body }
// Fázis 11 (egységes horog): egyetlen törzs mindenkinek; a szolgáltatás kikényszeríti,
// hogy pontosan egy aktív sablon legyen.
export async function PUT(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    if (typeof payload.body !== "string") {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'body' (a közös törzs)." },
        { status: 400 },
      );
    }
    const template = await saveCommonBody(payload.body);
    return NextResponse.json({ ok: true, id: template.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
