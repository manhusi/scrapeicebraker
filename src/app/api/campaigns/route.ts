import { NextResponse } from "next/server";
import {
  createCampaign,
  listCampaignsWithCounts,
} from "@/lib/services/campaigns";

export async function GET() {
  try {
    const campaigns = await listCampaignsWithCounts();
    return NextResponse.json({ ok: true, campaigns });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}

// POST /api/campaigns — új kampány. body: { name, offerTemplateId? }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'name'." },
        { status: 400 },
      );
    }
    const campaign = await createCampaign(body.name, body.offerTemplateId);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
