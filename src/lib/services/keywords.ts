import { prisma } from "@/lib/db";
import type { KeywordStatus } from "@prisma/client";

// Kulcsszó-gyűjtő logika EGY helyen (CONSTITUTION 8.).

export type KeywordWithCounts = {
  id: string;
  term: string;
  notes: string | null;
  status: KeywordStatus;
  createdAt: Date;
  leadCount: number;
  batchCount: number;
};

export async function listKeywordsWithCounts(): Promise<KeywordWithCounts[]> {
  const keywords = await prisma.keyword.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return Promise.all(
    keywords.map(async (k) => {
      const [leadCount, batchCount] = await Promise.all([
        prisma.lead.count({ where: { importBatch: { keywordId: k.id } } }),
        prisma.importBatch.count({ where: { keywordId: k.id } }),
      ]);
      return {
        id: k.id,
        term: k.term,
        notes: k.notes,
        status: k.status,
        createdAt: k.createdAt,
        leadCount,
        batchCount,
      };
    }),
  );
}

// Kézzel felvett (tervezett) kulcsszó. Ha már létezik, csak a jegyzetet frissíti.
export async function createKeyword(term: string, notes?: string | null) {
  const t = term.trim();
  if (!t) throw new Error("A kulcsszó nem lehet üres.");
  return prisma.keyword.upsert({
    where: { term: t },
    create: { term: t, notes: notes?.trim() || null, status: "PLANNED" },
    update: { notes: notes?.trim() || undefined },
  });
}

// Importkor használt upsert: a kulcsszót IMPORTED-re állítja, visszaadja az id-t.
export async function upsertKeywordForImport(
  term: string,
): Promise<string | null> {
  const t = term.trim();
  if (!t) return null;
  const k = await prisma.keyword.upsert({
    where: { term: t },
    create: { term: t, status: "IMPORTED" },
    update: { status: "IMPORTED" },
  });
  return k.id;
}

export async function setKeywordStatus(id: string, status: KeywordStatus) {
  return prisma.keyword.update({ where: { id }, data: { status } });
}
