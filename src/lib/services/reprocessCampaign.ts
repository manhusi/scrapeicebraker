import { prisma } from "@/lib/db";
import { analyzeLead } from "@/lib/services/analyzeLead";
import { generateMessageForLead } from "@/lib/services/generateMessage";

// Egy kampány újra-feldolgozása (Fázis 9): a NEM jóváhagyott leadek újraelemzése (friss bookingMode
// + kvalifikáció) és az icebreaker újraírása a jelenlegi prompttal. Prompt-hangolás után ezzel
// frissíthető egy meglévő kampány, anélkül hogy újra kéne importálni/scrape-elni (a scrape cache-elt).
//
// Fail-safe korlátok:
// - CSAK ANALYZED/DRAFTED/ANALYZE_FAILED leadre fut — a jóváhagyott (APPROVED/EXPORTED) munkát nem bántja.
// - A kézzel szerkesztett (message.edited) draftet NEM írja felül — az emberi munka szent.

export type ReprocessSummary = {
  considered: number;
  reanalyzed: number;
  disqualified: number;
  regenerated: number;
  keptEdited: number;
  failed: number;
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
      while (idx < items.length) await worker(items[idx++]);
    },
  );
  await Promise.all(runners);
}

export async function reprocessCampaign(
  campaignId: string,
  opts: { limit?: number } = {},
): Promise<ReprocessSummary> {
  const leads = await prisma.lead.findMany({
    where: {
      campaignId,
      status: { in: ["ANALYZED", "DRAFTED", "ANALYZE_FAILED"] },
      siteContent: { isNot: null },
    },
    select: { id: true, message: { select: { edited: true } } },
    orderBy: { createdAt: "asc" },
    ...(opts.limit ? { take: opts.limit } : {}),
  });

  const summary: ReprocessSummary = {
    considered: leads.length,
    reanalyzed: 0,
    disqualified: 0,
    regenerated: 0,
    keptEdited: 0,
    failed: 0,
  };

  await runPool(leads, 3, async (l) => {
    const a = await analyzeLead(l.id, { force: true });
    if (a.status === "disqualified") {
      summary.disqualified++;
      return;
    }
    if (a.status !== "analyzed") {
      summary.failed++;
      return;
    }
    summary.reanalyzed++;

    // A kézzel szerkesztett draftet megőrizzük — nem írjuk felül a te munkádat.
    if (l.message?.edited) {
      summary.keptEdited++;
      return;
    }

    const g = await generateMessageForLead(l.id, { force: true });
    if (g.status === "drafted") summary.regenerated++;
    else summary.failed++;
  });

  return summary;
}
