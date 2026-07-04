import { prisma } from "@/lib/db";

// Globális Instantly-export (UX v4): MINDEN jóváhagyott lead egy közös CSV-be, kampány nélkül.
// Oszlopok: email + custom változók, amikre az Instantly szekvenciában {{...}}-ként hivatkozol.

function csvCell(v: string | null | undefined): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export type ExportResult = { csv: string; filename: string; count: number };

export async function exportApprovedLeads(): Promise<ExportResult> {
  const leads = await prisma.lead.findMany({
    where: {
      email: { not: null },
      message: { status: { in: ["APPROVED", "EXPORTED"] } },
    },
    include: { message: true },
    orderBy: { businessName: "asc" },
  });

  const header = ["email", "company_name", "subject", "message", "website"];
  const rows: string[][] = [header];
  for (const l of leads) {
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

  // Állapot-átmenet: APPROVED → EXPORTED (a lead és az üzenet is). Az EXPORTED-ek benne maradnak,
  // így az újratöltés bármikor működik.
  await prisma.message.updateMany({
    where: { lead: { email: { not: null } }, status: "APPROVED" },
    data: { status: "EXPORTED" },
  });
  await prisma.lead.updateMany({
    where: { status: "APPROVED" },
    data: { status: "EXPORTED" },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return { csv, filename: `outreach_${stamp}_instantly.csv`, count };
}
