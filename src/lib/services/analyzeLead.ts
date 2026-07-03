import { prisma } from "@/lib/db";
import { generateJson } from "@/lib/gemini/client";
import {
  buildAnalysisPrompt,
  ANALYSIS_SCHEMA,
  type AnalysisOutput,
} from "@/lib/gemini/prompts";

export type AnalyzeResult =
  | { leadId: string; status: "analyzed"; segmentKey: string }
  | { leadId: string; status: "skipped_no_content" }
  | { leadId: string; status: "skipped_cached" }
  | { leadId: string; status: "failed"; reason: string };

// Egy lead analízise a scrape-elt tartalomból. Cache: ha már van Analysis, nem hívjuk újra
// (kivéve force). Fail-closed: Gemini-hiba → ANALYZE_FAILED, a lead nem vész el. A szegmenst a
// zárt katalógusra validáljuk — ismeretlen kulcs → "unclear" (CONSTITUTION 3., 5.).
export async function analyzeLead(
  leadId: string,
  opts: { force?: boolean } = {},
): Promise<AnalyzeResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { siteContent: true, analysis: true },
  });

  if (!lead) return { leadId, status: "failed", reason: "lead nem található" };
  if (!lead.siteContent) return { leadId, status: "skipped_no_content" };
  if (!opts.force && lead.analysis) return { leadId, status: "skipped_cached" };

  // A szegmenseket a DB-ből olvassuk (admin-bővíthető katalógus).
  const segments = await prisma.segment.findMany();
  if (segments.length === 0) {
    return { leadId, status: "failed", reason: "üres szegmens-katalógus (seedelj)" };
  }
  const validKeys = new Set(segments.map((s) => s.key));

  const prompt = buildAnalysisPrompt(
    {
      businessName: lead.businessName,
      category: lead.category,
      markdown: lead.siteContent.markdown,
    },
    segments,
  );

  const result = await generateJson<AnalysisOutput>(prompt, ANALYSIS_SCHEMA);

  if (!result.ok) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "ANALYZE_FAILED" },
    });
    return { leadId, status: "failed", reason: result.error };
  }

  // Zárt katalógus validáció: ismeretlen kulcs → unclear.
  const segmentKey = validKeys.has(result.data.segmentKey)
    ? result.data.segmentKey
    : "unclear";

  await prisma.analysis.upsert({
    where: { leadId },
    create: {
      leadId,
      segmentKey,
      summary: result.data.summary,
      signals: result.data.signals,
      model: result.model,
    },
    update: {
      segmentKey,
      summary: result.data.summary,
      signals: result.data.signals,
      model: result.model,
      createdAt: new Date(),
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "ANALYZED" },
  });

  return { leadId, status: "analyzed", segmentKey };
}

export type BatchAnalyzeSummary = {
  processed: number;
  analyzed: number;
  failed: number;
  skipped: number;
};

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let idx = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (idx < items.length) {
        await worker(items[idx++]);
      }
    },
  );
  await Promise.all(runners);
}

// A SCRAPED (és opcionálisan ANALYZE_FAILED) leadek analízise, limitálva.
export async function analyzePendingLeads(opts: {
  limit?: number;
  includeFailed?: boolean;
}): Promise<BatchAnalyzeSummary> {
  const statuses: ("SCRAPED" | "ANALYZE_FAILED")[] = opts.includeFailed
    ? ["SCRAPED", "ANALYZE_FAILED"]
    : ["SCRAPED"];

  const leads = await prisma.lead.findMany({
    where: { status: { in: statuses } },
    select: { id: true },
    take: opts.limit ?? 20,
    orderBy: { createdAt: "asc" },
  });

  const summary: BatchAnalyzeSummary = {
    processed: 0,
    analyzed: 0,
    failed: 0,
    skipped: 0,
  };

  await runPool(leads, 4, async (l) => {
    const r = await analyzeLead(l.id, { force: opts.includeFailed });
    summary.processed++;
    if (r.status === "analyzed") summary.analyzed++;
    else if (r.status === "failed") summary.failed++;
    else summary.skipped++;
  });

  return summary;
}
