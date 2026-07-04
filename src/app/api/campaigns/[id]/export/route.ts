import { NextResponse } from "next/server";
import { exportCampaign } from "@/lib/services/exportCampaign";

// POST /api/campaigns/[id]/export — Instantly CSV generálása + állapot EXPORTED-re.
// A CSV-t a válaszban adjuk vissza, a kliens tölti le (Blob).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const onlyApproved = Boolean(body.onlyApproved);
    
    const result = await exportCampaign(id, onlyApproved);
    if (result.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Nincs jóváhagyott üzenet az exporthoz." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
