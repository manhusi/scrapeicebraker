import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Badge from "@/app/ui/Badge";

export const dynamic = "force-dynamic";

// Cég-lap (UX.md v3): egy lead teljes útja OLVASHATÓAN. Az üzenet szerkesztése
// NEM itt történik — annak egy helye van: a review fókusz-mód.

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <span className="faint">{k}: </span>
      <span className="muted">{v ?? "—"}</span>
    </div>
  );
}

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { siteContent: true, analysis: true, message: true },
  });
  if (!lead) notFound();

  const segmentKey = lead.analysis?.segmentKey ?? null;
  const segment = segmentKey
    ? await prisma.segment.findUnique({ where: { key: segmentKey } })
    : null;
  const signals = Array.isArray(lead.analysis?.signals)
    ? (lead.analysis.signals as string[])
    : [];

  return (
    <main className="page">
      <Link href="/leads" style={{ textDecoration: "none" }}>
        ← Leadek
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{lead.businessName}</h1>
        <Badge status={lead.status} />
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13 }}>
        {lead.websiteUrl && (
          <a href={lead.websiteUrl} target="_blank" rel="noreferrer">
            weboldal ↗
          </a>
        )}
        {lead.fbUrl && (
          <a href={lead.fbUrl} target="_blank" rel="noreferrer">
            facebook ↗
          </a>
        )}
        {lead.email && <span className="muted">{lead.email}</span>}
      </div>

      {/* Alapadatok */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 14 }}>
          <Field k="Kategória" v={lead.category} />
          <Field k="Követők" v={lead.followers?.toLocaleString("hu-HU") ?? null} />
          <Field k="Kulcsszó" v={lead.sourceKeyword} />
          <Field k="Telefon" v={lead.phone} />
          <Field k="Cím" v={lead.address} />
        </div>
        {lead.intro && (
          <div style={{ marginTop: 12, fontSize: 14 }} className="muted">
            <span className="faint">FB bio: </span>
            {lead.intro}
          </div>
        )}
      </div>

      {/* Mit értett meg a gép */}
      {lead.analysis && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>
            {segment?.name ?? lead.analysis.segmentKey}
          </h2>
          <p className="muted" style={{ fontSize: 14 }}>
            {lead.analysis.summary}
          </p>
          {signals.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {signals.map((s, i) => (
                <span key={i} className="badge muted">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Üzenet — olvashatóan; szerkeszteni a review-ban lehet */}
      {lead.message && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Üzenet</h2>
            <Link href={`/review?lead=${lead.id}`} className="btn btn-purple">
              Átnézés megnyitása
            </Link>
          </div>
          {lead.message.subject && (
            <p style={{ fontSize: 14, marginBottom: 6 }}>
              <span className="faint">Tárgy: </span>
              {lead.message.subject}
            </p>
          )}
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 14,
              fontFamily: "inherit",
              lineHeight: 1.5,
              margin: 0,
            }}
            className="muted"
          >
            {lead.message.finalMessage}
          </pre>
        </div>
      )}

      {/* Beolvasott weboldal-tartalom (összecsukva) */}
      {lead.siteContent && (
        <details className="card" style={{ marginTop: 16 }}>
          <summary className="muted" style={{ cursor: "pointer" }}>
            Beolvasott weboldal-tartalom ({lead.siteContent.markdown.length} karakter)
          </summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              marginTop: 12,
              maxHeight: 400,
              overflow: "auto",
            }}
            className="faint"
          >
            {lead.siteContent.markdown}
          </pre>
        </details>
      )}
    </main>
  );
}
