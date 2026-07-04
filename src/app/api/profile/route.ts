import { NextResponse } from "next/server";
import { upsertProfile } from "@/lib/services/settings";

// PUT /api/profile — profil-morzsa létrehozása/frissítése. body: { key, content }
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.key !== "string" || typeof body.content !== "string") {
      return NextResponse.json(
        { ok: false, error: "Hiányzó 'key' vagy 'content'." },
        { status: 400 },
      );
    }
    await upsertProfile(body.key, body.content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 },
    );
  }
}
