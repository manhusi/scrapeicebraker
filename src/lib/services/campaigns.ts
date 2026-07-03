import { prisma } from "@/lib/db";
import type { CampaignStatus } from "@prisma/client";

// Kampány-menedzsment logika EGY helyen (CONSTITUTION 8.).

export type CampaignWithCounts = {
  id: string;
  name: string;
  status: CampaignStatus;
  notes: string | null;
  offerTemplateId: string | null;
  templateName: string | null;
  segmentKey: string | null;
  leadCount: number;
  generatableCount: number;
  draftedCount: number;
  approvedCount: number;
  exportedCount: number;
  createdAt: Date;
};

// EGY kampány következő lépése — a kampány-kártya CTA-ja ebből jön (UX: a rendszer vezet).
export type CampaignNextStep = {
  label: string;
  detail: string;
};

export function campaignNextStep(c: CampaignWithCounts): CampaignNextStep {
  if (c.leadCount === 0)
    return { label: "Leadek hozzáadása", detail: "még üres a kampány" };
  if (!c.offerTemplateId)
    return { label: "Ajánlat kiválasztása", detail: `${c.leadCount} lead vár` };
  if (c.draftedCount > 0)
    return {
      label: "Átnézés folytatása",
      detail: `${c.draftedCount} üzenet átnézésre vár`,
    };
  if (c.generatableCount > 0)
    return {
      label: "Megírás indítása",
      detail: `${c.generatableCount} lead vár üzenetre`,
    };
  if (c.approvedCount > 0)
    return {
      label: "Export Instantly-be",
      detail: `${c.approvedCount} üzenet kész`,
    };
  if (c.exportedCount > 0 && c.exportedCount === c.leadCount)
    return { label: "Kész", detail: "minden exportálva" };
  return { label: "Megnyitás", detail: `${c.leadCount} lead` };
}

export async function listCampaignsWithCounts(): Promise<CampaignWithCounts[]> {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { offerTemplate: true },
  });

  return Promise.all(
    campaigns.map(async (c) => {
      const [leadCount, generatableCount, draftedCount, approvedCount, exportedCount] =
        await Promise.all([
          prisma.lead.count({ where: { campaignId: c.id } }),
          prisma.lead.count({
            where: { campaignId: c.id, status: "ANALYZED", email: { not: null } },
          }),
          prisma.lead.count({ where: { campaignId: c.id, status: "DRAFTED" } }),
          prisma.lead.count({ where: { campaignId: c.id, status: "APPROVED" } }),
          prisma.lead.count({ where: { campaignId: c.id, status: "EXPORTED" } }),
        ]);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        notes: c.notes,
        offerTemplateId: c.offerTemplateId,
        templateName: c.offerTemplate?.name ?? null,
        segmentKey: c.offerTemplate?.segmentKey ?? null,
        leadCount,
        generatableCount,
        draftedCount,
        approvedCount,
        exportedCount,
        createdAt: c.createdAt,
      };
    }),
  );
}

// A lead-raktár összefoglalója: ami még NINCS kampányban (utánpótlás).
export type PoolSummary = {
  processable: number; // új, feldolgozásra váró (van weboldala)
  unassignedBySegment: { segmentKey: string; count: number }[]; // elemzett, kampány nélkül
  failed: number; // beolvasás/elemzés hiba
};

export async function getPoolSummary(): Promise<PoolSummary> {
  const [processable, unassigned, failed] = await Promise.all([
    prisma.lead.count({
      where: { status: "IMPORTED", websiteUrl: { not: null } },
    }),
    prisma.lead.findMany({
      where: { status: "ANALYZED", campaignId: null },
      select: { analysis: { select: { segmentKey: true } } },
    }),
    prisma.lead.count({
      where: { status: { in: ["SCRAPE_FAILED", "ANALYZE_FAILED"] } },
    }),
  ]);

  const bySegment = new Map<string, number>();
  for (const l of unassigned) {
    const key = l.analysis?.segmentKey ?? "unclear";
    bySegment.set(key, (bySegment.get(key) ?? 0) + 1);
  }

  return {
    processable,
    unassignedBySegment: [...bySegment.entries()]
      .map(([segmentKey, count]) => ({ segmentKey, count }))
      .sort((a, b) => b.count - a.count),
    failed,
  };
}

export async function createCampaign(
  name: string,
  offerTemplateId?: string | null,
) {
  const n = name.trim();
  if (!n) throw new Error("A kampány neve nem lehet üres.");
  return prisma.campaign.create({
    data: { name: n, offerTemplateId: offerTemplateId?.trim() || null },
  });
}

export async function setCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.campaign.update({ where: { id }, data: { status } });
}

export async function setCampaignTemplate(
  id: string,
  offerTemplateId: string | null,
) {
  return prisma.campaign.update({
    where: { id },
    data: { offerTemplateId: offerTemplateId || null },
  });
}

// Leadek hozzáadása kampányhoz szegmens alapján (csak a még kampány nélkülieket).
export async function addLeadsBySegment(
  campaignId: string,
  segmentKey: string,
): Promise<number> {
  const analyses = await prisma.analysis.findMany({
    where: { segmentKey },
    select: { leadId: true },
  });
  const leadIds = analyses.map((a) => a.leadId);
  if (leadIds.length === 0) return 0;

  const res = await prisma.lead.updateMany({
    where: { id: { in: leadIds }, campaignId: null },
    data: { campaignId },
  });
  return res.count;
}

// Egy lead kivétele a kampányból (a message-t és státuszt nem bántjuk itt).
export async function removeLeadFromCampaign(leadId: string) {
  return prisma.lead.update({
    where: { id: leadId },
    data: { campaignId: null },
  });
}
