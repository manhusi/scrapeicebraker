import { prisma } from "@/lib/db";
import { generateJson } from "@/lib/gemini/client";
import { getCommonTemplate } from "@/lib/services/settings";
import {
  buildIcebreakerPrompt,
  ICEBREAKER_SCHEMA,
  type IcebreakerOutput,
} from "@/lib/gemini/prompts";

export type GenerateResult =
  | { leadId: string; status: "drafted" }
  | { leadId: string; status: "skipped_cached" }
  | { leadId: string; status: "skipped_no_template" }
  | { leadId: string; status: "skipped_no_email" }
  | { leadId: string; status: "failed"; reason: string };

// A KÖZÖS ajánlat-sablon EGY forrás-igazsága a settings.ts-ben él (getCommonTemplate) —
// mindenki azt kapja, a törzset a /settings-ben szerkeszted.

// A teljes email összerakása EGY helyen: Szia! + icebreaker + közös törzs (docs/ICEBREAKER.md).
// Az icebreaker le van választva a törzsről: önálló megfigyelés, a törzs pivotál rá ("Amúgy…").
function assembleFinalMessage(icebreaker: string, body: string): string {
  return `Szia!\n\n${icebreaker.trim()}\n\n${body.trim()}`;
}

// Egy ANALYZED lead üzenet-draftja. Cache: meglévő Message → skip (kivéve force).
// Fail-closed: Gemini-hiba → a lead ANALYZED marad, újrafuttatható (CONSTITUTION 4., 5.).
export async function generateMessageForLead(
  leadId: string,
  opts: { force?: boolean } = {},
): Promise<GenerateResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { analysis: true, message: true },
  });

  if (!lead || !lead.analysis) {
    return { leadId, status: "failed", reason: "nincs analízis" };
  }
  // Email nélkül nem tudunk küldeni — ne égessünk rá Gemini-pénzt (CONSTITUTION: korlát-tudat).
  if (!lead.email) return { leadId, status: "skipped_no_email" };
  if (!opts.force && lead.message) return { leadId, status: "skipped_cached" };

  // Egységes horog (UX v4): mindenki a KÖZÖS sablont kapja.
  const template = await getCommonTemplate();
  if (!template) return { leadId, status: "skipped_no_template" };

  // Hang-útmutató a MyProfile-ból (admin-szerkeszthető, egy forrás-igazság).
  const voice = await prisma.myProfile.findUnique({ where: { key: "voice" } });

  const signals = Array.isArray(lead.analysis.signals)
    ? (lead.analysis.signals as string[])
    : [];

  const prompt = buildIcebreakerPrompt({
    businessName: lead.businessName,
    category: lead.category,
    intro: lead.intro,
    summary: lead.analysis.summary,
    signals,
    voiceOverride: voice?.content ?? null,
  });

  // Kreatív feladat → magasabb temperature, mint az analízisnél.
  const result = await generateJson<IcebreakerOutput>(
    prompt,
    ICEBREAKER_SCHEMA,
    { temperature: 0.7 },
  );

  if (!result.ok) {
    return { leadId, status: "failed", reason: result.error };
  }

  const icebreaker = result.data.icebreaker.trim();
  const finalMessage = assembleFinalMessage(icebreaker, template.body);

  await prisma.message.upsert({
    where: { leadId },
    create: {
      leadId,
      subject: result.data.subject.trim(),
      icebreaker,
      offerTemplateId: template.id,
      finalMessage,
      status: "DRAFT",
    },
    update: {
      subject: result.data.subject.trim(),
      icebreaker,
      offerTemplateId: template.id,
      finalMessage,
      status: "DRAFT",
      edited: false,
      generatedAt: new Date(),
      approvedAt: null,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "DRAFTED" },
  });

  return { leadId, status: "drafted" };
}

export type BatchGenerateSummary = {
  processed: number;
  drafted: number;
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

// Minden ANALYZED + emailes lead draftolása (globálisan, UX v4) — a közös sablonnal.
export async function generatePendingMessages(opts: {
  limit?: number;
}): Promise<BatchGenerateSummary> {
  const leads = await prisma.lead.findMany({
    where: { status: "ANALYZED", email: { not: null } },
    select: { id: true },
    take: opts.limit ?? 50,
    orderBy: { createdAt: "asc" },
  });

  const summary: BatchGenerateSummary = {
    processed: 0,
    drafted: 0,
    failed: 0,
    skipped: 0,
  };

  await runPool(leads, 4, async (l) => {
    const r = await generateMessageForLead(l.id);
    summary.processed++;
    if (r.status === "drafted") summary.drafted++;
    else if (r.status === "failed") summary.failed++;
    else summary.skipped++;
  });

  return summary;
}
