import { prisma } from "@/lib/db";
import { listKeywordsWithCounts } from "@/lib/services/keywords";
import KeywordManager, { type KeywordRow } from "./KeywordManager";
import OfferEditor, { type OfferRow } from "./OfferEditor";
import ProfileEditor, { type ProfileRow } from "./ProfileEditor";
import ReprocessButton from "./ReprocessButton";

export const dynamic = "force-dynamic";

// Beállítások (UX.md v3): a ritka dolgok egy helyen — kulcsszó-terv, ajánlatok, profilom.
// Fázis 8: az ajánlatok és a profil szerkeszthetők (services/settings.ts).

export default async function SettingsPage() {
  const [keywords, templates, segments, profile] = await Promise.all([
    listKeywordsWithCounts(),
    prisma.offerTemplate.findMany({ orderBy: [{ segmentKey: "asc" }, { createdAt: "asc" }] }),
    prisma.segment.findMany({ orderBy: { key: "asc" }, select: { key: true, name: true } }),
    prisma.myProfile.findMany({ orderBy: { key: "asc" } }),
  ]);

  const keywordRows: KeywordRow[] = keywords.map((k) => ({
    id: k.id,
    term: k.term,
    notes: k.notes,
    status: k.status,
    leadCount: k.leadCount,
  }));
  const offerRows: OfferRow[] = templates.map((t) => ({
    id: t.id,
    segmentKey: t.segmentKey,
    name: t.name,
    body: t.body,
    active: t.active,
  }));
  const profileRows: ProfileRow[] = profile.map((p) => ({
    key: p.key,
    content: p.content,
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
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Közös ajánlat (a levél törzse)</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          EGY közös törzs megy mindenkinek, az icebreaker után. Itt szerkeszted. Ha módosítod,
          a lenti gombbal frissítsd a még nem küldött drafteket.
        </p>
        <OfferEditor offers={offerRows} segments={segments} />
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <ReprocessButton />
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Profilom</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          A megírás kontextusa: ki vagy, mi a bizonyítékod, milyen hangon írsz.
        </p>
        <ProfileEditor profile={profileRows} />
      </section>
    </main>
  );
}
