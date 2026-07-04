import { scrapePendingLeads } from "@/lib/services/scrapeLead";
import { analyzePendingLeads } from "@/lib/services/analyzeLead";

// Egyesített feldolgozás: beolvasás (Firecrawl) → elemzés (Gemini) EGY láncban.
// A felhasználót nem érdekli a belső két lépés — egy gombbal az egész fut (UX.md).

export type ProcessSummary = {
  scraped: number;
  scrapeFailed: number;
  analyzed: number;
  disqualified: number;
  analyzeFailed: number;
};

export async function processPendingLeads(opts: {
  limit?: number;
}): Promise<ProcessSummary> {
  const limit = opts.limit ?? 50;

  // 1. lépés: az ÚJ leadek weboldalának beolvasása.
  const scrape = await scrapePendingLeads({ limit });

  // 2. lépés: minden beolvasott (a most készültek + korábban beragadtak) elemzése.
  const analyze = await analyzePendingLeads({ limit });

  return {
    scraped: scrape.scraped,
    scrapeFailed: scrape.failed,
    analyzed: analyze.analyzed,
    disqualified: analyze.disqualified,
    analyzeFailed: analyze.failed,
  };
}
