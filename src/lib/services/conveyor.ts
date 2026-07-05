import { prisma } from "@/lib/db";
import { getCommonTemplate } from "@/lib/services/settings";

// A futószalag (home) EGY forrás-igazsága (UX v4): tisztán STÁTUSZ-alapú, globális számok.
// Nincs kampány, nincs csoportosítás — a lead csak az útján megy végig.

export type StationKey =
  | "import"
  | "process"
  | "write"
  | "review"
  | "send";

export type Conveyor = {
  totalLeads: number;
  lastImport: { fileName: string; rowCount: number; at: Date } | null;
  processable: number; // új, beolvasásra váró (van weboldala)
  noWebsite: number; // új, de weboldal nélkül — sosem lesz feldolgozható
  failed: number; // beolvasás/elemzés hiba
  writable: number; // ANALYZED + van email → megírható
  noEmail: number; // ANALYZED, de nincs email → nem küldhető
  drafted: number; // átnézésre vár
  approved: number; // küldésre kész
  exported: number; // már exportálva
  hasCommonTemplate: boolean; // van-e aktív közös ajánlat-sablon
  nextStation: StationKey;
};

export async function getConveyor(): Promise<Conveyor> {
  const [
    totalLeads,
    lastBatch,
    processable,
    noWebsite,
    failed,
    writable,
    noEmail,
    drafted,
    approved,
    exported,
    template,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.importBatch.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.lead.count({ where: { status: "IMPORTED", websiteUrl: { not: null } } }),
    prisma.lead.count({ where: { status: "IMPORTED", websiteUrl: null } }),
    prisma.lead.count({
      where: { status: { in: ["SCRAPE_FAILED", "ANALYZE_FAILED"] } },
    }),
    prisma.lead.count({ where: { status: "ANALYZED", email: { not: null } } }),
    prisma.lead.count({ where: { status: "ANALYZED", email: null } }),
    prisma.lead.count({ where: { status: "DRAFTED" } }),
    prisma.lead.count({ where: { status: "APPROVED" } }),
    prisma.lead.count({ where: { status: "EXPORTED" } }),
    getCommonTemplate(),
  ]);

  // A kiemelt állomás: a pénzhez legközelebbi teendő (áramlás-vég felől visszafelé).
  const nextStation: StationKey =
    approved > 0
      ? "send"
      : drafted > 0
        ? "review"
        : writable > 0
          ? "write"
          : processable > 0
            ? "process"
            : "import";

  return {
    totalLeads,
    lastImport: lastBatch
      ? {
          fileName: lastBatch.fileName ?? "névtelen fájl",
          rowCount: lastBatch.rowCount,
          at: lastBatch.createdAt,
        }
      : null,
    processable,
    noWebsite,
    failed,
    writable,
    noEmail,
    drafted,
    approved,
    exported,
    hasCommonTemplate: Boolean(template),
    nextStation,
  };
}
