import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Health-check: az app fut ÉS a DB kapcsolódik-e.
// Fázis 0 siker-kritériuma ezen az endpointon mérhető.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 503 },
    );
  }
}
