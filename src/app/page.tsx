import Link from "next/link";
import { prisma } from "@/lib/db";

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
    const [leadCount, batches, sample] = await Promise.all([
      prisma.lead.count(),
      prisma.importBatch.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
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
        },
      }),
    ]);
    return { dbOk: true, leadCount, batches, sample };
  } catch {
    return { dbOk: false, leadCount: 0, batches: [], sample: [] };
  }
}

export default async function Home() {
  const { dbOk, leadCount, batches, sample } = await getData();

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
              <span>{b.keyword ?? b.fileName ?? "(névtelen batch)"}</span>
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
                <th style={{ padding: "6px 8px" }}>Email</th>
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
                  <td style={{ padding: "6px 8px", color: "#9aa1ab" }}>
                    {l.email ?? "—"}
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
