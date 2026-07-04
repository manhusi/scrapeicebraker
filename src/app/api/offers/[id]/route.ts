import { NextResponse } from "next/server";
import { updateOfferTemplate } from "@/lib/services/settings";

// PATCH /api/offers/[id] — sablon módosítása. body: { name?, body?, active?, segmentKey? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await updateOfferTemplate(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      segmentKey:
        typeof body.segmentKey === "string" ? body.segmentKey : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
