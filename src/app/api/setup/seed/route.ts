import { NextResponse } from "next/server";
import { seedAll } from "@/lib/setup/seed";

// POST /api/setup/seed — minden kezdő-adat idempotens seedelése
// (szegmensek + MyProfile + sablonok + beállítások).
export async function POST() {
  try {
    const result = await seedAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
