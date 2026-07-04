import { NextResponse } from "next/server";
import { exportApprovedLeads } from "@/lib/services/exportLeads";

// POST /api/export — globális Instantly CSV a jóváhagyott leadekből (UX v4).
export async function POST() {
  try {
    const result = await exportApprovedLeads();
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
