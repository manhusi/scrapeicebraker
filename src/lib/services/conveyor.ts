import { prisma } from "@/lib/db";

// A futószalag (home) EGY forrás-igazsága (UX.md v3): állomás-számok, kampány-sorok,
// szegmens-csoportok és a kiemelt következő állomás mind innen jön.

export type StationKey =
  | "import"
  | "process"
  | "group"
  | "write"
  | "review"
  | "send";

export type SegmentGroup = {
  segmentKey: string;
  segmentName: string; // ember-nyelvű név (Segment.name) — a felület CSAK ezt mutatja
  count: number;
  // Egy kattintás célja: meglévő illő aktív kampány, vagy null → új kampány készül
  targetCampaign: { id: string; name: string } | null;
  isUnclear: boolean; // fail-closed szegmens: kézi átnézés, nem kampány
};

export type CampaignRow = {
  id: string;
  name: string;
  templateName: string | null;
  needsTemplate: boolean;
  leadCount: number;
  writable: number; // üzenetre váró (elemzett + van email)
  drafted: number; // átnézésre váró
  approved: number; // küldésre kész
  exported: number;
};

export type Conveyor = {
  totalLeads: number;
  lastImport: { fileName: string; rowCount: number; at: Date } | null;
  processable: number; // új, beolvasásra váró (van weboldala)
  noWebsite: number; // új, de weboldal nélkül — sosem lesz feldolgozható
  failed: number; // beolvasás/elemzés hiba
  disqualified: number; // elemezve, de nem célpont (pl. már online foglal)
  groups: SegmentGroup[];
  campaigns: CampaignRow[];
  templates: { id: string; name: string; segmentKey: string }[]; // inline ajánlat-választóhoz
  nextStation: StationKey;
};

export async function getConveyor(): Promise<Conveyor> {
  const [
    totalLeads,
    lastBatch,
    processable,
    noWebsite,
    failed,
    disqualified,
    unassigned,
    segments,
    campaigns,
    templates,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.importBatch.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.lead.count({ where: { status: "IMPORTED", websiteUrl: { not: null } } }),
    prisma.lead.count({ where: { status: "IMPORTED", websiteUrl: null } }),
    prisma.lead.count({
      where: { status: { in: ["SCRAPE_FAILED", "ANALYZE_FAILED"] } },
    }),
    prisma.lead.count({ where: { status: "DISQUALIFIED" } }),
    prisma.lead.findMany({
      where: { status: "ANALYZED", campaignId: null },
      select: { analysis: { select: { segmentKey: true } } },
    }),
    prisma.segment.findMany({ select: { key: true, name: true } }),
    prisma.campaign.findMany({
      where: { status: { in: ["DRAFT", "READY", "EXPORTED"] } },
      orderBy: { createdAt: "asc" },
      include: { offerTemplate: { select: { name: true, segmentKey: true } } },
    }),
    prisma.offerTemplate.findMany({
      where: { active: true },
      select: { id: true, name: true, segmentKey: true },
      orderBy: { segmentKey: "asc" },
    }),
  ]);

  const segmentName = new Map(segments.map((s) => [s.key, s.name]));

  // Kampányra váró csoportok szegmensenként.
  const bySegment = new Map<string, number>();
  for (const l of unassigned) {
    const key = l.analysis?.segmentKey ?? "unclear";
    bySegment.set(key, (bySegment.get(key) ?? 0) + 1);
  }
  const groups: SegmentGroup[] = [...bySegment.entries()]
    .map(([key, count]) => {
      const target = campaigns.find(
        (c) =>
          c.status !== "EXPORTED" && c.offerTemplate?.segmentKey === key,
      );
      return {
        segmentKey: key,
        segmentName: segmentName.get(key) ?? key,
        count,
        targetCampaign: target ? { id: target.id, name: target.name } : null,
        isUnclear: key === "unclear",
      };
    })
    .sort((a, b) => b.count - a.count);

  // Kampány-sorok a 4–6. állomáshoz.
  const rows: CampaignRow[] = await Promise.all(
    campaigns.map(async (c) => {
      const [writable, drafted, approved, exported, leadCount] =
        await Promise.all([
          prisma.lead.count({
            where: { campaignId: c.id, status: "ANALYZED", email: { not: null } },
          }),
          prisma.lead.count({ where: { campaignId: c.id, status: "DRAFTED" } }),
          prisma.lead.count({ where: { campaignId: c.id, status: "APPROVED" } }),
          prisma.lead.count({ where: { campaignId: c.id, status: "EXPORTED" } }),
          prisma.lead.count({ where: { campaignId: c.id } }),
        ]);
      return {
        id: c.id,
        name: c.name,
        templateName: c.offerTemplate?.name ?? null,
        needsTemplate: !c.offerTemplateId,
        leadCount,
        writable,
        drafted,
        approved,
        exported,
      };
    }),
  );

  // A kiemelt állomás: a pénzhez legközelebbi teendő (áramlás-vég felől visszafelé).
  const nextStation: StationKey = rows.some((r) => r.approved > 0)
    ? "send"
    : rows.some((r) => r.drafted > 0)
      ? "review"
      : rows.some((r) => r.writable > 0)
        ? "write"
        : groups.some((g) => !g.isUnclear)
          ? "group"
          : processable > 0
            ? "process"
            : "import";

  return {
    totalLeads,
    lastImport: lastBatch
      ? {
          fileName: lastBatch.fileName ?? "névtelen fájl",
          rowCount: lastBatch.rowCount,
          at: lastBatch.createdAt,
        }
      : null,
    processable,
    noWebsite,
    failed,
    disqualified,
    groups,
    campaigns: rows,
    templates,
    nextStation,
  };
}
