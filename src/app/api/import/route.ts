import { NextResponse } from "next/server";
import { importLeadsFromCsv } from "@/lib/services/leadImport";

// POST /api/import — multipart form: file (CSV) + keyword (opcionális).
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const keyword = form.get("keyword");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Hiányzó vagy érvénytelen 'file' mező." },
        { status: 400 },
      );
    }

    const csvText = await file.text();
    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "A feltöltött CSV üres." },
        { status: 400 },
      );
    }

    const summary = await importLeadsFromCsv(csvText, {
      keyword: typeof keyword === "string" ? keyword : null,
      fileName: file.name,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Ismeretlen hiba",
      },
      { status: 500 },
    );
  }
}
