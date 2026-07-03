import { prisma } from "@/lib/db";
import { scrapeUrl } from "@/lib/firecrawl/client";

export type ScrapeLeadResult =
  | { leadId: string; status: "scraped"; length: number }
  | { leadId: string; status: "skipped_cached" }
  | { leadId: string; status: "skipped_no_url" }
  | { leadId: string; status: "failed"; reason: string };

// Egy lead weboldalának scrape-je. Cache: ha már van SiteContent ugyanarra az URL-re,
// nem scrape-elünk újra, hacsak force=true (CONSTITUTION 4.). Fail-closed (CONSTITUTION 5.).
export async function scrapeLead(
  leadId: string,
  opts: { force?: boolean } = {},
): Promise<ScrapeLeadResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { siteContent: true },
  });

  if (!lead) return { leadId, status: "failed", reason: "lead nem található" };

  const url = lead.websiteUrl?.trim();
  if (!url) {
    // Nincs mit scrape-elni — nem hiba, csak kihagyjuk.
    return { leadId, status: "skipped_no_url" };
  }

  // Cache: ugyanarra az URL-re már van tartalom → skip (kivéve force).
  if (!opts.force && lead.siteContent && lead.siteContent.sourceUrl === url) {
    return { leadId, status: "skipped_cached" };
  }

  const outcome = await scrapeUrl(url);

  if (!outcome.ok) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "SCRAPE_FAILED" },
    });
    return { leadId, status: "failed", reason: outcome.reason };
  }

  // Egy-élő SiteContent: upsert (felülír).
  await prisma.siteContent.upsert({
    where: { leadId },
    create: {
      leadId,
      sourceUrl: url,
      markdown: outcome.markdown,
      meta: outcome.meta as object,
    },
    update: {
      sourceUrl: url,
      markdown: outcome.markdown,
      meta: outcome.meta as object,
      scrapedAt: new Date(),
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "SCRAPED" },
  });

  return { leadId, status: "scraped", length: outcome.markdown.length };
}

export type BatchScrapeSummary = {
  processed: number;
  scraped: number;
  failed: number;
  skippedCached: number;
  skippedNoUrl: number;
};

// Kis konkurenciájú pool, hogy tempózzunk a rate-limit miatt (CONSTITUTION 6.).
async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let idx = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const current = items[idx++];
      await worker(current);
    }
  });
  await Promise.all(runners);
}

// Az IMPORTED (és opcionálisan SCRAPE_FAILED) leadek scrape-je, limitálva.
export async function scrapePendingLeads(opts: {
  limit?: number;
  includeFailed?: boolean;
}): Promise<BatchScrapeSummary> {
  const statuses: ("IMPORTED" | "SCRAPE_FAILED")[] = opts.includeFailed
    ? ["IMPORTED", "SCRAPE_FAILED"]
    : ["IMPORTED"];

  const leads = await prisma.lead.findMany({
    where: { status: { in: statuses }, websiteUrl: { not: null } },
    select: { id: true },
    take: opts.limit ?? 20,
    orderBy: { createdAt: "asc" },
  });

  const summary: BatchScrapeSummary = {
    processed: 0,
    scraped: 0,
    failed: 0,
    skippedCached: 0,
    skippedNoUrl: 0,
  };

  await runPool(leads, 3, async (l) => {
    const r = await scrapeLead(l.id, { force: opts.includeFailed });
    summary.processed++;
    if (r.status === "scraped") summary.scraped++;
    else if (r.status === "failed") summary.failed++;
    else if (r.status === "skipped_cached") summary.skippedCached++;
    else if (r.status === "skipped_no_url") summary.skippedNoUrl++;
  });

  return summary;
}
