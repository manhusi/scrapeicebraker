import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  listCampaignsWithCounts,
  campaignNextStep,
  getPoolSummary,
} from "@/lib/services/campaigns";
import PoolBar from "@/app/components/PoolBar";
import CampaignCreate from "@/app/campaigns/CampaignCreate";

export const dynamic = "force-dynamic";

// HOME = Kampányok. Egy kampány = egy igazság (UX.md): minden kártya a saját következő
// lépését mutatja, a raktár (kampányon kívüli leadek) külön sáv alatta.

const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  DRAFT: "#d29922",
  READY: "#3fb950",
  EXPORTED: "#2ea043",
  ARCHIVED: "#6e7681",
};

export default async function Home() {
  let campaigns: Awaited<ReturnType<typeof listCampaignsWithCounts>> = [];
  let pool: Awaited<ReturnType<typeof getPoolSummary>> | null = null;
  let templates: { id: string; name: string; segmentKey: string }[] = [];
  let dbOk = true;

  try {
    [campaigns, pool, templates] = await Promise.all([
      listCampaignsWithCounts(),
      getPoolSummary(),
      prisma.offerTemplate.findMany({
        where: { active: true },
        select: { id: true, name: true, segmentKey: true },
        orderBy: { segmentKey: "asc" },
      }),
    ]);
  } catch {
    dbOk = false;
  }

  if (!dbOk) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            background: "#141821",
            border: "1px solid #5a2530",
            borderRadius: 12,
            padding: 20,
            color: "#f85149",
          }}
        >
          ⚠ Az adatbázis nem elérhető. Indítsd el: <code>docker compose up -d</code>
        </div>
      </main>
    );
  }

  const active = campaigns.filter((c) => c.status !== "ARCHIVED");
  const archived = campaigns.filter((c) => c.status === "ARCHIVED");

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Kampányok</h1>
      <p style={{ color: "#9aa1ab", marginTop: 0, fontSize: 14 }}>
        Egy kampány egy ajánlat + a hozzá tartozó leadek. Nyisd meg, és a lépések végigvezetnek.
      </p>

      {/* Kampány-kártyák — mindegyiken a SAJÁT következő lépése */}
      {active.length === 0 ? (
        <div
          style={{
            background: "#141821",
            border: "1px solid #222835",
            borderRadius: 12,
            padding: 24,
            marginTop: 16,
            color: "#9aa1ab",
            fontSize: 14,
          }}
        >
          Még nincs kampányod. Hozz létre egyet lent — az fogja össze a leadeket, az ajánlatot és az exportot.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {active.map((c) => {
            const next = campaignNextStep(c);
            return (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                style={{
                  display: "block",
                  background: "#141821",
                  border: "1px solid #222835",
                  borderRadius: 12,
                  padding: "18px 20px",
                  textDecoration: "none",
                  color: "#e6e8ec",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: CAMPAIGN_STATUS_COLOR[c.status] ?? "#9aa1ab",
                        display: "inline-block",
                      }}
                    />
                    <strong style={{ fontSize: 16 }}>{c.name}</strong>
                    <span style={{ color: "#6e7681", fontSize: 13 }}>
                      {c.leadCount} lead · {c.templateName ?? "nincs ajánlat"}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "#1d2a4d",
                      border: "1px solid #3b6cff",
                      color: "#7aa2ff",
                      fontWeight: 600,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {next.label} →
                  </span>
                </div>
                <div style={{ color: "#9aa1ab", fontSize: 13, marginTop: 8 }}>
                  {next.detail}
                  {c.approvedCount > 0 && next.label !== "Export Instantly-be" && (
                    <span style={{ color: "#8957e5" }}> · {c.approvedCount} jóváhagyva</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Lead-raktár — utánpótlás */}
      {pool && (
        <PoolBar
          processable={pool.processable}
          unassignedBySegment={pool.unassignedBySegment}
          failed={pool.failed}
          campaigns={active.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}

      {/* Új kampány */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 15, color: "#9aa1ab", marginBottom: 10 }}>Új kampány</h2>
        <CampaignCreate templates={templates} />
      </div>

      {archived.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ color: "#6e7681", fontSize: 13, cursor: "pointer" }}>
            Archivált kampányok ({archived.length})
          </summary>
          <div style={{ marginTop: 8 }}>
            {archived.map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                style={{ display: "block", color: "#6e7681", fontSize: 14, padding: "6px 0", textDecoration: "none" }}
              >
                {c.name} · {c.leadCount} lead
              </Link>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}
