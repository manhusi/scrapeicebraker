import Link from "next/link";
import { prisma } from "@/lib/db";
import ScrapeButton from "@/app/components/ScrapeButton";
import AnalyzeButton from "@/app/components/AnalyzeButton";

// Dashboard: DB-státusz + lead-szám + legutóbbi importok + minta leadek.
// A pipeline további lépései (scrape, analízis, generálás) a következő fázisokban jönnek.

export const dynamic = "force-dynamic";

const box: React.CSSProperties = {
  background: "#141821",
  border: "1px solid #222835",
  borderRadius: 12,
  padding: 20,
};

async function getData() {
  try {
    const [leadCount, statusGroups, segmentGroups, batches, sample] =
      await Promise.all([
        prisma.lead.count(),
        prisma.lead.groupBy({ by: ["status"], _count: true }),
        prisma.analysis.groupBy({ by: ["segmentKey"], _count: true }),
        prisma.importBatch.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { keyword: true },
        }),
        prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            businessName: true,
            category: true,
            email: true,
            websiteUrl: true,
            status: true,
            analysis: { select: { segmentKey: true } },
          },
        }),
      ]);
    const statusCounts: Record<string, number> = {};
    for (const g of statusGroups) statusCounts[g.status] = g._count;
    const segmentCounts: Record<string, number> = {};
    for (const g of segmentGroups) {
      if (g.segmentKey) segmentCounts[g.segmentKey] = g._count;
    }
    return { dbOk: true, leadCount, statusCounts, segmentCounts, batches, sample };
  } catch {
    return {
      dbOk: false,
      leadCount: 0,
      statusCounts: {} as Record<string, number>,
      segmentCounts: {} as Record<string, number>,
      batches: [],
      sample: [],
    };
  }
}

export default async function Home() {
  const { dbOk, leadCount, statusCounts, segmentCounts, batches, sample } =
    await getData();
  const pendingScrape = statusCounts["IMPORTED"] ?? 0;
  const pendingAnalyze = statusCounts["SCRAPED"] ?? 0;
  const hasSegments = Object.keys(segmentCounts).length > 0;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Outreach Automation</h1>
          <p style={{ color: "#9aa1ab", margin: 0 }}>
            Fázis 2 — Lead import él. Pipeline: import → scrape → analízis →
            generálás → export.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link
            href="/keywords"
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #2a3040",
              color: "#c7ccd4",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Kulcsszavak
          </Link>
          <Link
            href="/import"
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: "#3b6cff",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + CSV import
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div style={box}>
          <div style={{ color: "#9aa1ab", fontSize: 13 }}>Leadek összesen</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{leadCount}</div>
        </div>
        <div style={box}>
          <div style={{ color: "#9aa1ab", fontSize: 13 }}>Adatbázis</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: dbOk ? "#3fb950" : "#f85149",
              marginTop: 6,
            }}
          >
            {dbOk ? "● kapcsolódik" : "● nem elérhető"}
          </div>
        </div>
      </div>

      <div style={{ ...box, marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0 }}>Pipeline állapot</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ScrapeButton pending={pendingScrape} />
            <AnalyzeButton pending={pendingAnalyze} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              ["IMPORTED", "#9aa1ab"],
              ["SCRAPED", "#3fb950"],
              ["SCRAPE_FAILED", "#f85149"],
              ["ANALYZED", "#58a6ff"],
              ["DRAFTED", "#d29922"],
              ["APPROVED", "#8957e5"],
              ["EXPORTED", "#2ea043"],
            ] as const
          ).map(([st, color]) => (
            <div
              key={st}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: "#0e1117",
                border: "1px solid #1c2230",
                fontSize: 13,
              }}
            >
              <span style={{ color }}>{st}</span>{" "}
              <strong>{statusCounts[st] ?? 0}</strong>
            </div>
          ))}
        </div>
      </div>

      {hasSegments && (
        <div style={{ ...box, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Szegmensek (analízis)</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(segmentCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([seg, count]) => (
                <div
                  key={seg}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#0e1117",
                    border: "1px solid #1c2230",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: seg === "unclear" ? "#d29922" : "#58a6ff" }}>
                    {seg}
                  </span>{" "}
                  <strong>{count}</strong>
                </div>
              ))}
          </div>
        </div>
      )}

      {batches.length > 0 && (
        <div style={{ ...box, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Legutóbbi importok</h2>
          {batches.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                color: "#c7ccd4",
                borderTop: "1px solid #1c2230",
              }}
            >
              <span>{b.keyword?.term ?? b.fileName ?? "(névtelen batch)"}</span>
              <span style={{ color: "#9aa1ab" }}>{b.rowCount} lead</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...box, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Leadek (legújabb 8)</h2>
        {sample.length === 0 ? (
          <p style={{ color: "#9aa1ab" }}>
            Még nincs lead. Tölts fel egy CSV-t az <em>import</em> gombbal.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "#9aa1ab", textAlign: "left" }}>
                <th style={{ padding: "6px 8px" }}>Cég</th>
                <th style={{ padding: "6px 8px" }}>Kategória</th>
                <th style={{ padding: "6px 8px" }}>Szegmens</th>
                <th style={{ padding: "6px 8px" }}>Státusz</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid #1c2230" }}>
                  <td style={{ padding: "6px 8px" }}>{l.businessName}</td>
                  <td style={{ padding: "6px 8px", color: "#9aa1ab" }}>
                    {l.category ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {l.analysis?.segmentKey ? (
                      <span style={{ color: "#58a6ff" }}>
                        {l.analysis.segmentKey}
                      </span>
                    ) : (
                      <span style={{ color: "#6e7681" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#1c2230",
                        color: "#9aa1ab",
                      }}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
