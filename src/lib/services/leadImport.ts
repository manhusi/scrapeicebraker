import { prisma } from "@/lib/db";
import { parseLeadCsv, type LeadInput } from "@/lib/services/leadCsv";

export type ImportSummary = {
  batchId: string | null; // null, ha nem került be új lead (üres batch-et nem hozunk létre)
  totalRows: number; // hasznos (nevesített) sorok a CSV-ben
  inserted: number; // ténylegesen beszúrt új leadek
  skippedErrorRows: number; // név nélküli / hibás sorok
  skippedDuplicateInFile: number; // fájlon belüli duplikátum
  skippedAlreadyExists: number; // DB-ben már létező (korábbi import)
};

// Dedupe kulcs: pageId elsődleges; ha nincs pageId, akkor email fallback (CONSTITUTION 4.).
function dedupeInFile(leads: LeadInput[]): {
  unique: LeadInput[];
  skipped: number;
} {
  const seenPageId = new Set<string>();
  const seenEmail = new Set<string>();
  const unique: LeadInput[] = [];
  let skipped = 0;

  for (const l of leads) {
    if (l.pageId && seenPageId.has(l.pageId)) {
      skipped++;
      continue;
    }
    if (!l.pageId && l.email && seenEmail.has(l.email)) {
      skipped++;
      continue;
    }
    if (l.pageId) seenPageId.add(l.pageId);
    if (l.email) seenEmail.add(l.email);
    unique.push(l);
  }
  return { unique, skipped };
}

export async function importLeadsFromCsv(
  csvText: string,
  opts: { keyword?: string | null; fileName?: string | null },
): Promise<ImportSummary> {
  const { leads, skippedRows } = parseLeadCsv(csvText);
  const { unique, skipped: skippedDuplicateInFile } = dedupeInFile(leads);

  // DB-dedupe: mely pageId / email létezik már?
  const pageIds = unique
    .map((l) => l.pageId)
    .filter((v): v is string => Boolean(v));
  const emails = unique
    .map((l) => l.email)
    .filter((v): v is string => Boolean(v));

  const existing = await prisma.lead.findMany({
    where: {
      OR: [{ pageId: { in: pageIds } }, { email: { in: emails } }],
    },
    select: { pageId: true, email: true },
  });
  const existPageId = new Set(
    existing.map((e) => e.pageId).filter((v): v is string => Boolean(v)),
  );
  const existEmail = new Set(
    existing.map((e) => e.email).filter((v): v is string => Boolean(v)),
  );

  const toInsert = unique.filter((l) => {
    if (l.pageId && existPageId.has(l.pageId)) return false;
    if (!l.pageId && l.email && existEmail.has(l.email)) return false;
    return true;
  });
  const skippedAlreadyExists = unique.length - toInsert.length;

  const keyword = opts.keyword?.trim() || null;

  // Üres importnál nem hozunk létre batch-et (ne szemetelje a listát).
  let batchId: string | null = null;
  if (toInsert.length > 0) {
    const batch = await prisma.importBatch.create({
      data: {
        keyword,
        fileName: opts.fileName?.trim() || null,
        rowCount: toInsert.length,
      },
    });
    batchId = batch.id;
    await prisma.lead.createMany({
      data: toInsert.map((l) => ({
        ...l,
        sourceKeyword: keyword,
        importBatchId: batch.id,
      })),
      skipDuplicates: true, // biztonsági háló a pageId unique constraintre
    });
  }

  return {
    batchId,
    totalRows: leads.length,
    inserted: toInsert.length,
    skippedErrorRows: skippedRows,
    skippedDuplicateInFile,
    skippedAlreadyExists,
  };
}
