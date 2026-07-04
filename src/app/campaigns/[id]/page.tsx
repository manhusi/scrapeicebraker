import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Badge from "@/app/ui/Badge";
import CampaignAdmin from "./CampaignAdmin";

export const dynamic = "force-dynamic";

// Kampány-összegző (UX.md v3): áttekintés + adminisztráció. A munka a futószalagon
// és a review fókusz-módban folyik — innen csak odalinkelünk.

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      offerTemplate: { select: { id: true, name: true } },
      leads: {
        orderBy: { businessName: "asc" },
        select: { id: true, businessName: true, email: true, status: true },
      },
    },
  });
  if (!campaign) notFound();

  const templates = await prisma.offerTemplate.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { segmentKey: "asc" },
  });

  const drafted = campaign.leads.filter((l) => l.status === "DRAFTED").length;
  const approved = campaign.leads.filter((l) => l.status === "APPROVED").length;

  return (
    <main className="page">
      <Link href="/" style={{ textDecoration: "none" }}>
        ← Futószalag
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{campaign.name}</h1>
        <span className="muted" style={{ fontSize: 14 }}>
          {campaign.leads.length} lead · {campaign.offerTemplate?.name ?? "nincs ajánlat"}
        </span>
        {drafted > 0 && (
          <Link href={`/review/${campaign.id}`} className="btn btn-purple">
            Átnézés ({drafted})
          </Link>
        )}
        {approved > 0 && (
          <span className="muted" style={{ fontSize: 13 }}>
            {approved} küldésre kész — a futószalag Küldés állomásán exportálható
          </span>
        )}
      </div>

      <CampaignAdmin
        campaignId={campaign.id}
        name={campaign.name}
        archived={campaign.status === "ARCHIVED"}
        templateId={campaign.offerTemplate?.id ?? null}
        templates={templates}
      />

      <div className="card" style={{ marginTop: 16 }}>
        <table className="table">
          <tbody>
            {campaign.leads.map((l) => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>
                  <Link href={`/leads/${l.id}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                    {l.businessName}
                  </Link>
                </td>
                <td className="muted">{l.email ?? "— nincs email —"}</td>
                <td style={{ textAlign: "right" }}>
                  <Badge status={l.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaign.leads.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Még nincs lead a kampányban — a futószalag Csoportosítás állomásán kerül ide.
          </p>
        )}
      </div>
    </main>
  );
}
