import { prisma } from "@/lib/db";
import { listKeywordsWithCounts } from "@/lib/services/keywords";
import KeywordManager, { type KeywordRow } from "./KeywordManager";

export const dynamic = "force-dynamic";

// Beállítások (UX.md v3): a ritka dolgok egy helyen — kulcsszó-terv, ajánlatok, profilom.
// Az ajánlat- és profil-SZERKESZTÉS a Fázis 8 — addig olvashatóan látszanak itt.

export default async function SettingsPage() {
  const [keywords, templates, segments, profile] = await Promise.all([
    listKeywordsWithCounts(),
    prisma.offerTemplate.findMany({ orderBy: { segmentKey: "asc" } }),
    prisma.segment.findMany({ select: { key: true, name: true } }),
    prisma.myProfile.findMany({ orderBy: { key: "asc" } }),
  ]);

  const segmentName = new Map(segments.map((s) => [s.key, s.name]));
  const keywordRows: KeywordRow[] = keywords.map((k) => ({
    id: k.id,
    term: k.term,
    notes: k.notes,
    status: k.status,
    leadCount: k.leadCount,
  }));

  return (
    <main className="page">
      <h1>Beállítások</h1>
      <p className="page-lead">A ritka dolgok — a napi munka a Futószalagon van.</p>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Kulcsszó-terv</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Mire keresel az Apify-ban. Importkor a CSV ehhez kötődik.
        </p>
        <KeywordManager initial={keywordRows} />
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Ajánlatok</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          A kampányok üzeneteinek törzse. Szerkesztés: Fázis 8-ban jön.
        </p>
        {templates.length === 0 ? (
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            Még nincs ajánlat-sablon (a seed hozza létre az elsőt).
          </p>
        ) : (
          templates.map((t) => (
            <details key={t.id} style={{ marginBottom: 8 }}>
              <summary style={{ cursor: "pointer", fontSize: 14 }}>
                <strong>{t.name}</strong>{" "}
                <span className="muted">
                  · {segmentName.get(t.segmentKey) ?? t.segmentKey}
                  {!t.active && " · inaktív"}
                </span>
              </summary>
              <pre
                className="muted"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 13,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  marginTop: 8,
                  padding: 12,
                  background: "var(--bg-inset)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {t.body}
              </pre>
            </details>
          ))
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Profilom</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          A megírás kontextusa: ki vagy, mi a bizonyítékod. Szerkesztés: Fázis 8-ban jön.
        </p>
        {profile.length === 0 ? (
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>
            Még üres (a seed tölti fel).
          </p>
        ) : (
          profile.map((p) => (
            <div key={p.id} style={{ marginBottom: 10, fontSize: 14 }}>
              <div className="field-label">{p.key}</div>
              <span className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {p.content}
              </span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
