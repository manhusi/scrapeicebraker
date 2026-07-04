import Link from "next/link";
import { prisma } from "@/lib/db";
import type { LeadStatus, Prisma } from "@prisma/client";
import { isLeadStatus, STATUS_META, ALL_STATUSES } from "@/lib/pipeline";
import Badge from "@/app/ui/Badge";
import EmptyState from "@/app/ui/EmptyState";

export const dynamic = "force-dynamic";

// Lead-állomány (UX.md v3): kereshető/szűrhető lista — információ, nem munka.

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const activeStatus: LeadStatus | undefined =
    status && isLeadStatus(status) ? status : undefined;
  const query = q?.trim() || undefined;

  const where: Prisma.LeadWhereInput = {
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(query
      ? { businessName: { contains: query, mode: "insensitive" as const } }
      : {}),
  };

  const [statusGroups, leads, segments] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        businessName: true,
        category: true,
        status: true,
        analysis: { select: { segmentKey: true } },
        campaign: { select: { id: true, name: true } },
      },
    }),
    prisma.segment.findMany({ select: { key: true, name: true } }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of statusGroups) counts[g.status] = g._count;
  const segmentName = new Map(segments.map((s) => [s.key, s.name]));

  return (
    <main className="page">
      <h1>Leadek</h1>
      <p className="page-lead">Minden behozott cég, állapot szerint szűrhetően.</p>

      {/* Állapot-szűrő chipek — ember-nyelvű címkékkel (lib/pipeline.ts) */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href="/leads" className={`chip${!activeStatus ? " is-active" : ""}`}>
          Összes
        </Link>
        {ALL_STATUSES.filter((s) => (counts[s] ?? 0) > 0).map((s) => (
          <Link
            key={s}
            href={`/leads?status=${s}`}
            className={`chip${activeStatus === s ? " is-active" : ""}`}
          >
            {STATUS_META[s].label} · {counts[s]}
          </Link>
        ))}
      </div>

      {/* Keresés */}
      <form method="get" style={{ marginBottom: 16 }}>
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        <input
          className="input"
          type="search"
          name="q"
          defaultValue={query ?? ""}
          placeholder="keresés cégnévre…"
          style={{ width: 280 }}
        />
      </form>

      {leads.length === 0 ? (
        <EmptyState>
          Nincs lead ebben a nézetben.{" "}
          <Link href="/import">Importálj egy CSV-t</Link>, vagy nézd az{" "}
          <Link href="/leads">összeset</Link>.
        </EmptyState>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Cég</th>
              <th>Szegmens</th>
              <th>Kampány</th>
              <th>Állapot</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link
                    href={`/leads/${l.id}`}
                    style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600 }}
                  >
                    {l.businessName}
                  </Link>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {l.category ?? "—"}
                  </div>
                </td>
                <td className="muted">
                  {l.analysis?.segmentKey
                    ? segmentName.get(l.analysis.segmentKey) ?? l.analysis.segmentKey
                    : "—"}
                </td>
                <td className="muted">
                  {l.campaign ? (
                    <Link href={`/campaigns/${l.campaign.id}`} style={{ textDecoration: "none" }}>
                      {l.campaign.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Badge status={l.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
