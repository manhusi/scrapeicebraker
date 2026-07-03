import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import StatusBadge from "@/app/components/StatusBadge";
import MessageEditor from "./MessageEditor";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "32px 24px",
};
const box: React.CSSProperties = {
  background: "#141821",
  border: "1px solid #222835",
  borderRadius: 12,
  padding: 20,
  marginTop: 16,
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      siteContent: true,
      analysis: true,
      message: true,
      campaign: true,
    },
  });

  if (!lead) notFound();

  // Prev/next lépkedés az azonos státuszú soron belül — a lead KAMPÁNYÁRA szűkítve
  // (egy kampány = egy igazság; két párhuzamos kampány review-ja nem keveredhet).
  const sameStatus = await prisma.lead.findMany({
    where: {
      status: lead.status,
      ...(lead.campaignId ? { campaignId: lead.campaignId } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const idx = sameStatus.findIndex((l) => l.id === id);
  const prevId = idx > 0 ? sameStatus[idx - 1].id : null;
  const nextId =
    idx >= 0 && idx < sameStatus.length - 1 ? sameStatus[idx + 1].id : null;

  const signals = Array.isArray(lead.analysis?.signals)
    ? (lead.analysis.signals as string[])
    : [];

  return (
    <main style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          href={lead.campaignId ? `/campaigns/${lead.campaignId}` : `/leads?status=${lead.status}`}
          style={{ color: "#7aa2ff", textDecoration: "none" }}
        >
          ← {lead.campaign ? lead.campaign.name : "Lead-raktár"}
        </Link>
        <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
          {prevId ? (
            <Link href={`/leads/${prevId}`} style={{ color: "#7aa2ff", textDecoration: "none" }}>
              ← előző
            </Link>
          ) : (
            <span style={{ color: "#3a4150" }}>← előző</span>
          )}
          <span style={{ color: "#3a4150" }}>
            {idx + 1}/{sameStatus.length}
          </span>
          {nextId ? (
            <Link href={`/leads/${nextId}`} style={{ color: "#7aa2ff", textDecoration: "none" }}>
              következő →
            </Link>
          ) : (
            <span style={{ color: "#3a4150" }}>következő →</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{lead.businessName}</h1>
        <StatusBadge status={lead.status} />
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13 }}>
        {lead.websiteUrl && (
          <a href={lead.websiteUrl} target="_blank" rel="noreferrer" style={{ color: "#7aa2ff" }}>
            weboldal ↗
          </a>
        )}
        {lead.fbUrl && (
          <a href={lead.fbUrl} target="_blank" rel="noreferrer" style={{ color: "#7aa2ff" }}>
            facebook ↗
          </a>
        )}
        {lead.email && <span style={{ color: "#9aa1ab" }}>{lead.email}</span>}
      </div>

      {/* Adatok */}
      <div style={box}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 14 }}>
          <Field k="Kategória" v={lead.category} />
          <Field k="Követők" v={lead.followers?.toLocaleString("hu-HU") ?? null} />
          <Field k="Kulcsszó" v={lead.sourceKeyword} />
          <Field k="Kampány" v={lead.campaign?.name ?? null} />
          <Field k="Telefon" v={lead.phone} />
          <Field k="Cím" v={lead.address} />
        </div>
        {lead.intro && (
          <div style={{ marginTop: 12, color: "#c7ccd4", fontSize: 14 }}>
            <span style={{ color: "#6e7681" }}>FB bio: </span>
            {lead.intro}
          </div>
        )}
      </div>

      {/* Analízis */}
      {lead.analysis && (
        <div style={box}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>
            Analízis · <span style={{ color: "#58a6ff" }}>{lead.analysis.segmentKey}</span>
          </h2>
          <p style={{ color: "#c7ccd4", fontSize: 14 }}>{lead.analysis.summary}</p>
          {signals.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {signals.map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: "#0e1117",
                    border: "1px solid #1c2230",
                    color: "#9aa1ab",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Üzenet szerkesztő */}
      {lead.message ? (
        <div style={box}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Üzenet</h2>
          <MessageEditor
            leadId={lead.id}
            subject={lead.message.subject ?? ""}
            finalMessage={lead.message.finalMessage ?? ""}
            approved={lead.message.status !== "DRAFT"}
            edited={lead.message.edited}
          />
        </div>
      ) : (
        <div style={box}>
          <p style={{ color: "#9aa1ab", margin: 0 }}>
            Még nincs üzenet. A generálás a kampány oldalán indítható.
          </p>
        </div>
      )}

      {/* Scrape-elt tartalom (összecsukható) */}
      {lead.siteContent && (
        <details style={box}>
          <summary style={{ cursor: "pointer", color: "#9aa1ab" }}>
            Scrape-elt weboldal-tartalom ({lead.siteContent.markdown.length} karakter)
          </summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              color: "#8b949e",
              marginTop: 12,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            {lead.siteContent.markdown}
          </pre>
        </details>
      )}
    </main>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <span style={{ color: "#6e7681" }}>{k}: </span>
      <span style={{ color: "#c7ccd4" }}>{v ?? "—"}</span>
    </div>
  );
}
