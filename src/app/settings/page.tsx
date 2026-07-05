import { prisma } from "@/lib/db";
import { listKeywordsWithCounts } from "@/lib/services/keywords";
import { getCommonTemplate } from "@/lib/services/settings";
import KeywordManager, { type KeywordRow } from "./KeywordManager";
import CommonOfferEditor from "./CommonOfferEditor";
import ProfileEditor, { type ProfileRow } from "./ProfileEditor";
import ReprocessButton from "./ReprocessButton";

export const dynamic = "force-dynamic";

// Beállítások (UX.md v3): a ritka dolgok egy helyen — kulcsszó-terv, közös ajánlat, profilom.
// Fázis 11 (egységes horog): EGY közös törzs mindenkinek (getCommonTemplate).

export default async function SettingsPage() {
  const [keywords, commonTemplate, profile] = await Promise.all([
    listKeywordsWithCounts(),
    getCommonTemplate(),
    prisma.myProfile.findMany({ orderBy: { key: "asc" } }),
  ]);

  const keywordRows: KeywordRow[] = keywords.map((k) => ({
    id: k.id,
    term: k.term,
    notes: k.notes,
    status: k.status,
    leadCount: k.leadCount,
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
          EGY közös törzs megy mindenkinek, az icebreaker után. Ez az, amit itt mentesz. Ha
          módosítod, a lenti gombbal frissítsd a még nem küldött drafteket.
        </p>
        <CommonOfferEditor initialBody={commonTemplate?.body ?? ""} />
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
