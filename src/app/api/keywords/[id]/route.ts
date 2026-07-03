import { NextResponse } from "next/server";
import { setKeywordStatus } from "@/lib/services/keywords";
import type { KeywordStatus } from "@prisma/client";

const VALID: KeywordStatus[] = ["PLANNED", "IMPORTED", "ARCHIVED"];

// PATCH /api/keywords/[id] — státusz váltás. body: { status }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (!VALID.includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: "Érvénytelen 'status'." },
        { status: 400 },
      );
    }
    const keyword = await setKeywordStatus(id, body.status);
    return NextResponse.json({ ok: true, keyword });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
