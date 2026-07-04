import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getReviewQueue } from "@/lib/services/reviewMessage";
import ReviewPanel from "./ReviewPanel";

export const dynamic = "force-dynamic";

// Fókusz-mód (UX.md v3): középen az üzenet, oldalt a döntéshez kellő kontextus,
// fent a haladás. A sorrend forrás-igazsága a getReviewQueue (kampányon belül, createdAt).

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const [{ campaignId }, { lead: leadParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  const queue = await getReviewQueue(campaignId);
  if (!queue) notFound();

  const items = queue.leads;
  const reviewed = items.filter((l) => l.message!.status !== "DRAFT").length;

  // Az aktuális elem: a kért lead, különben az első átnézésre váró.
  const current =
    (leadParam && items.find((l) => l.id === leadParam)) ||
    items.find((l) => l.message!.status === "DRAFT") ||
    null;

  // Minden üzenet átnézve → lezáró állapot, iránnyal (sosem zsákutca).
  if (!current) {
    return (
      <main className="page" style={{ maxWidth: 720 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          ← Futószalag
        </Link>
        <div className="card" style={{ marginTop: 16, textAlign: "center", padding: 36 }}>
          <h1 style={{ fontSize: 20 }}>Minden üzenet átnézve ✓</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            {queue.campaign.name} — {reviewed} üzenet kész.
            {items.length > 0 && " A jóváhagyottak a Küldés állomáson exportálhatók."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
            <Link href="/" className="btn btn-primary">
              → Küldés állomás
            </Link>
            {items[0] && (
              <Link href={`/review/${campaignId}?lead=${items[0].id}`} className="btn btn-ghost">
                Üzenetek böngészése
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  const idx = items.findIndex((l) => l.id === current.id);
  const prevId = idx > 0 ? items[idx - 1].id : null;
  const nextId = idx < items.length - 1 ? items[idx + 1].id : null;

  // A jóváhagyás utáni cél: a következő átnézésre váró (előre, majd körbe).
  const nextDrafted =
    items.slice(idx + 1).find((l) => l.message!.status === "DRAFT") ??
    items.slice(0, idx).find((l) => l.message!.status === "DRAFT") ??
    null;

  const segmentKey = current.analysis?.segmentKey ?? null;
  const segment = segmentKey
    ? await prisma.segment.findUnique({ where: { key: segmentKey } })
    : null;
  const signals = Array.isArray(current.analysis?.signals)
    ? (current.analysis.signals as string[])
    : [];

  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      {/* Fejléc: honnan jöttem + haladás + lépkedés */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          ← Futószalag
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
          <span className="muted">
            {queue.campaign.name} · {reviewed}/{items.length} átnézve
          </span>
          {prevId ? (
            <Link href={`/review/${campaignId}?lead=${prevId}`} style={{ textDecoration: "none" }}>
              ← előző
            </Link>
          ) : (
            <span className="faint">← előző</span>
          )}
          <span className="faint">{idx + 1}/{items.length}</span>
          {nextId ? (
            <Link href={`/review/${campaignId}?lead=${nextId}`} style={{ textDecoration: "none" }}>
              következő →
            </Link>
          ) : (
            <span className="faint">következő →</span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 300px",
          gap: 16,
          marginTop: 16,
          alignItems: "start",
        }}
      >
        {/* Középen: az üzenet */}
        <div className="card">
          <ReviewPanel
            campaignId={campaignId}
            leadId={current.id}
            subject={current.message!.subject ?? ""}
            finalMessage={current.message!.finalMessage ?? ""}
            messageStatus={current.message!.status}
            edited={current.message!.edited}
            nextDraftedId={nextDrafted?.id ?? null}
          />
        </div>

        {/* Oldalt: a döntéshez kellő kontextus */}
        <aside className="card" style={{ fontSize: 14 }}>
          <strong style={{ fontSize: 16 }}>{current.businessName}</strong>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 13 }}>
            {current.websiteUrl && (
              <a href={current.websiteUrl} target="_blank" rel="noreferrer">
                weboldal ↗
              </a>
            )}
            {current.fbUrl && (
              <a href={current.fbUrl} target="_blank" rel="noreferrer">
                facebook ↗
              </a>
            )}
          </div>
          {current.email && (
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              {current.email}
            </div>
          )}

          {segment && (
            <div style={{ marginTop: 14 }}>
              <div className="field-label">Szegmens</div>
              {segment.name}
            </div>
          )}

          {current.analysis?.summary && (
            <div style={{ marginTop: 14 }}>
              <div className="field-label">Mivel foglalkoznak</div>
              <span className="muted">{current.analysis.summary}</span>
            </div>
          )}

          {signals.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="field-label">Kapaszkodók</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {signals.map((s, i) => (
                  <span key={i} className="badge muted" style={{ whiteSpace: "normal" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Link href={`/leads/${current.id}`} className="faint" style={{ fontSize: 13 }}>
              teljes cég-lap →
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
