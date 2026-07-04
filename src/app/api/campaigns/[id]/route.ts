import { NextResponse } from "next/server";
import {
  setCampaignName,
  setCampaignStatus,
  setCampaignTemplate,
} from "@/lib/services/campaigns";
import type { CampaignStatus } from "@prisma/client";

const VALID: CampaignStatus[] = ["DRAFT", "READY", "EXPORTED", "ARCHIVED"];

// PATCH /api/campaigns/[id] — status és/vagy offerTemplateId módosítás.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.status !== undefined) {
      if (!VALID.includes(body.status)) {
        return NextResponse.json(
          { ok: false, error: "Érvénytelen 'status'." },
          { status: 400 },
        );
      }
      await setCampaignStatus(id, body.status);
    }
    if (body.offerTemplateId !== undefined) {
      await setCampaignTemplate(id, body.offerTemplateId);
    }
    if (body.name !== undefined) {
      await setCampaignName(id, String(body.name));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
