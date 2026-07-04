import { prisma } from "@/lib/db";
import { analyzeLead } from "@/lib/services/analyzeLead";
import { generateMessageForLead } from "@/lib/services/generateMessage";

// Globális újra-feldolgozás (UX v4): a NEM jóváhagyott leadek újraelemzése + az icebreaker
// újraírása a jelenlegi prompttal/közös törzzsel. Miután átírod a törzset a Beállításokban vagy
// hangolunk a prompton, ezzel frissíted a meglévő drafteket, anélkül hogy újra kéne scrape-elni.
//
// Fail-safe: CSAK ANALYZED/DRAFTED/ANALYZE_FAILED leadre fut (a jóváhagyott/kiküldött munkát nem
// bántja), és a kézzel szerkesztett draftet (message.edited) NEM írja felül.

export type ReprocessSummary = {
  considered: number;
  reanalyzed: number;
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

export async function reprocessAllLeads(
  opts: { limit?: number; skip?: number } = {},
): Promise<ReprocessSummary> {
  // A reprocess NEM üríti a poolt (a DRAFTED lead DRAFTED marad), ezért a kliens offset-tel
  // lapoz (skip) — különben ugyanazt a batch-et ismételné a végtelenségig.
  const leads = await prisma.lead.findMany({
    where: {
      status: { in: ["ANALYZED", "DRAFTED", "ANALYZE_FAILED"] },
      siteContent: { isNot: null },
    },
    select: { id: true, message: { select: { edited: true } } },
    orderBy: { createdAt: "asc" },
    ...(opts.skip ? { skip: opts.skip } : {}),
    ...(opts.limit ? { take: opts.limit } : {}),
  });

  const summary: ReprocessSummary = {
    considered: leads.length,
    reanalyzed: 0,
    regenerated: 0,
    keptEdited: 0,
    failed: 0,
  };

  await runPool(leads, 3, async (l) => {
    const a = await analyzeLead(l.id, { force: true });
    if (a.status !== "analyzed") {
      summary.failed++;
      return;
    }
    summary.reanalyzed++;

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
