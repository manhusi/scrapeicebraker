import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import StatusBadge from "@/app/components/StatusBadge";
import CampaignChecklist from "./CampaignChecklist";
import ArchiveButton from "./ArchiveButton";

export const dynamic = "force-dynamic";

const box: React.CSSProperties = {
  background: "#141821",
  border: "1px solid #222835",
  borderRadius: 12,
  padding: 20,
  marginTop: 16,
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      offerTemplate: true,
      leads: {
        orderBy: { businessName: "asc" },
        select: {
          id: true,
          businessName: true,
          email: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!campaign) notFound();

  const pendingGenerate = campaign.leads.filter(
    (l) => l.status === "ANALYZED" && l.email,
  ).length;
  const draftedLeads = campaign.leads
    .filter((l) => l.status === "DRAFTED")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const approvedCount = campaign.leads.filter((l) => l.status === "APPROVED").length;
  const exportedCount = campaign.leads.filter((l) => l.status === "EXPORTED").length;

  const [segments, templates] = await Promise.all([
    prisma.segment.findMany({ select: { key: true } }),
    prisma.offerTemplate.findMany({
      where: { active: true },
      select: { id: true, name: true, segmentKey: true },
      orderBy: { segmentKey: "asc" },
    }),
  ]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <Link href="/campaigns" style={{ color: "#7aa2ff", textDecoration: "none" }}>
        ← Kampányok
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{campaign.name}</h1>
        <ArchiveButton campaignId={campaign.id} archived={campaign.status === "ARCHIVED"} />
      </div>

      {/* Vezetett lépések */}
      <div style={{ marginTop: 20 }}>
        <CampaignChecklist
          campaignId={campaign.id}
          leadCount={campaign.leads.length}
          hasTemplate={Boolean(campaign.offerTemplateId)}
          templateName={campaign.offerTemplate?.name ?? null}
          pendingGenerate={pendingGenerate}
          draftedCount={draftedLeads.length}
          approvedCount={approvedCount}
          exportedCount={exportedCount}
          firstDraftedLeadId={draftedLeads[0]?.id ?? null}
          segments={segments.map((s) => s.key)}
          templates={templates}
        />
      </div>

      {/* Tagok — másodlagos, összecsukható */}
      <details style={box} open={campaign.leads.length <= 10}>
        <summary style={{ cursor: "pointer", color: "#9aa1ab", fontSize: 15 }}>
          Leadek a kampányban ({campaign.leads.length})
        </summary>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 12 }}>
          <tbody>
            {campaign.leads.map((l) => (
              <tr key={l.id} style={{ borderTop: "1px solid #1c2230" }}>
                <td style={{ padding: "7px 8px", fontWeight: 600 }}>
                  <Link href={`/leads/${l.id}`} style={{ color: "#e6e8ec", textDecoration: "none" }}>
                    {l.businessName}
                  </Link>
                </td>
                <td style={{ padding: "7px 8px", color: "#9aa1ab" }}>{l.email ?? "— nincs email —"}</td>
                <td style={{ padding: "7px 8px", textAlign: "right" }}>
                  <StatusBadge status={l.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </main>
  );
}
