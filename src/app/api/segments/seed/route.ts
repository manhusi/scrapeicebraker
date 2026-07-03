import { NextResponse } from "next/server";
import { seedSegments } from "@/lib/segments/catalog";

// POST /api/segments/seed — a 6 fájdalom-szegmens idempotens seedelése.
export async function POST() {
  try {
    const result = await seedSegments();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
