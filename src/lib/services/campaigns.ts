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

export async function setCampaignName(id: string, name: string) {
  const n = name.trim();
  if (!n) throw new Error("A kampány neve nem lehet üres.");
  return prisma.campaign.update({ where: { id }, data: { name: n } });
}

// A 3. állomás (Csoportosítás) egy-kattintása: egy szegmens kampányra váró leadjei
// a meglévő illő aktív kampányba mennek, vagy új kampány készül (név = szegmens neve,
// ajánlat automatikusan, ha van aktív a szegmenshez). UX.md v3.
export async function assignSegmentToCampaign(segmentKey: string): Promise<{
  campaignId: string;
  campaignName: string;
  added: number;
  created: boolean;
}> {
  if (segmentKey === "unclear")
    throw new Error("A besorolatlan leadek kézi átnézést igényelnek.");

  const existing = await prisma.campaign.findFirst({
    where: {
      status: { in: ["DRAFT", "READY"] },
      offerTemplate: { segmentKey },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    const added = await addLeadsBySegment(existing.id, segmentKey);
    return {
      campaignId: existing.id,
      campaignName: existing.name,
      added,
      created: false,
    };
  }

  const segment = await prisma.segment.findUnique({
    where: { key: segmentKey },
  });
  if (!segment) throw new Error("Nincs ilyen szegmens.");

  const template = await prisma.offerTemplate.findFirst({
    where: { segmentKey, active: true },
  });

  // Névütközésnél dátum-utótag, hogy két kampány sose legyen összetéveszthető.
  const sameName = await prisma.campaign.findFirst({
    where: { name: segment.name },
  });
  const name = sameName
    ? `${segment.name} – ${new Date().toLocaleDateString("hu-HU")}`
    : segment.name;

  const campaign = await prisma.campaign.create({
    data: { name, offerTemplateId: template?.id ?? null },
  });
  const added = await addLeadsBySegment(campaign.id, segmentKey);
  return { campaignId: campaign.id, campaignName: name, added, created: true };
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
