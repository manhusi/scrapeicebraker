import Link from "next/link";
import { prisma } from "@/lib/db";
import type { LeadStatus, Prisma } from "@prisma/client";
import { isLeadStatus, STATUS_META } from "@/lib/pipeline";
import PipelineStepper from "@/app/components/PipelineStepper";
import StatusBadge from "@/app/components/StatusBadge";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "32px 24px",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus: LeadStatus | undefined =
    status && isLeadStatus(status) ? status : undefined;

  const where: Prisma.LeadWhereInput = activeStatus
    ? { status: activeStatus }
    : {};

  const [statusGroups, leads] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        businessName: true,
        category: true,
        email: true,
        status: true,
        analysis: { select: { segmentKey: true } },
        campaign: { select: { name: true } },
      },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of statusGroups) counts[g.status] = g._count;

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Leadek</h1>

      <PipelineStepper counts={counts} active={activeStatus} />

      <div style={{ margin: "20px 0 10px", color: "#9aa1ab", fontSize: 14 }}>
        {activeStatus ? (
          <>
            Szűrés: <strong style={{ color: STATUS_META[activeStatus].color }}>
              {STATUS_META[activeStatus].label}
            </strong>{" "}
            ({leads.length}) ·{" "}
            <Link href="/leads" style={{ color: "#7aa2ff" }}>
              összes
            </Link>
          </>
        ) : (
          <>Összes lead ({leads.length})</>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ color: "#9aa1ab", textAlign: "left" }}>
            <th style={{ padding: "8px" }}>Cég</th>
            <th style={{ padding: "8px" }}>Szegmens</th>
            <th style={{ padding: "8px" }}>Kampány</th>
            <th style={{ padding: "8px" }}>Státusz</th>
            <th style={{ padding: "8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} style={{ borderTop: "1px solid #1c2230" }}>
              <td style={{ padding: "8px" }}>
                <Link
                  href={`/leads/${l.id}`}
                  style={{ color: "#e6e8ec", textDecoration: "none", fontWeight: 600 }}
                >
                  {l.businessName}
                </Link>
                <div style={{ color: "#6e7681", fontSize: 12 }}>
                  {l.category ?? "—"}
                </div>
              </td>
              <td style={{ padding: "8px", color: "#58a6ff" }}>
                {l.analysis?.segmentKey ?? "—"}
              </td>
              <td style={{ padding: "8px", color: "#9aa1ab" }}>
                {l.campaign?.name ?? "—"}
              </td>
              <td style={{ padding: "8px" }}>
                <StatusBadge status={l.status} />
              </td>
              <td style={{ padding: "8px", textAlign: "right" }}>
                <Link
                  href={`/leads/${l.id}`}
                  style={{ color: "#7aa2ff", textDecoration: "none", fontSize: 13 }}
                >
                  megnyit →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && (
        <p style={{ color: "#9aa1ab", marginTop: 20 }}>
          Nincs lead ebben az állapotban.
        </p>
      )}
    </main>
  );
}
