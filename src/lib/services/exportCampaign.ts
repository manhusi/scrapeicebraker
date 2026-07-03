import { prisma } from "@/lib/db";

// Instantly-kompatibilis CSV export EGY kampányból (az APPROVED üzenetekből).
// Oszlopok: email + custom változók, amikre az Instantly szekvenciában {{...}}-ként hivatkozol.

function csvCell(v: string | null | undefined): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

function slug(name: string): string {
  // Ékezetes/nem-ascii karakterek -> _ (a kampánynévből fájlnév-barát slug lesz).
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "kampany"
  );
}

export type ExportResult = { csv: string; filename: string; count: number };

export async function exportCampaign(campaignId: string): Promise<ExportResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      leads: {
        where: {
          email: { not: null },
          message: { status: { in: ["APPROVED", "EXPORTED"] } },
        },
        include: { message: true },
        orderBy: { businessName: "asc" },
      },
    },
  });

  if (!campaign) throw new Error("Nincs ilyen kampány.");

  const header = ["email", "company_name", "subject", "message", "website"];
  const rows: string[][] = [header];
  for (const l of campaign.leads) {
    if (!l.email || !l.message) continue;
    rows.push([
      l.email,
      l.businessName,
      l.message.subject ?? "",
      l.message.finalMessage ?? "",
      l.websiteUrl ?? "",
    ]);
  }

  const csv = toCsv(rows);
  const count = rows.length - 1;

  // Állapot-átmenet: az APPROVED-ből EXPORTED lesz (a lead és az üzenet is), a kampány EXPORTED.
  // Az EXPORTED-ek is benne maradnak az exportban → az újratöltés bármikor működik.
  await prisma.message.updateMany({
    where: { lead: { campaignId }, status: "APPROVED" },
    data: { status: "EXPORTED" },
  });
  await prisma.lead.updateMany({
    where: { campaignId, status: "APPROVED" },
    data: { status: "EXPORTED" },
  });

  // A kampány csak akkor EXPORTED, ha NINCS több teendő benne (nincs átnézésre/megírásra váró).
  // Részleges export esetén marad DRAFT — a státusz sose hazudik (egy kampány = egy igazság).
  const pending = await prisma.lead.count({
    where: {
      campaignId,
      status: { in: ["ANALYZED", "DRAFTED", "APPROVED"] },
    },
  });
  if (count > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: pending === 0 ? "EXPORTED" : "DRAFT" },
    });
  }

  return { csv, filename: `${slug(campaign.name)}_instantly.csv`, count };
}
