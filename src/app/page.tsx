import Link from "next/link";
import { getConveyor, type StationKey } from "@/lib/services/conveyor";
import {
  ProcessButton,
  GroupButton,
  WriteButton,
  TemplatePicker,
  ExportButton,
} from "@/app/HomeActions";

export const dynamic = "force-dynamic";

// HOME = a futószalag (UX.md v3): 6 állomás fentről le, PONTOSAN EGY kiemelve —
// a pénzhez legközelebbi teendő. A számokat és a kiemelést a lib/services/conveyor.ts adja.

function Station({
  n,
  title,
  isNext,
  isIdle,
  children,
}: {
  n: number;
  title: string;
  isNext: boolean;
  isIdle: boolean;
  children: React.ReactNode;
}) {
  const cls = `station${isNext ? " is-next" : ""}${isIdle ? " is-idle" : ""}`;
  return (
    <div className={cls}>
      <div className="station-num">{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        {children}
      </div>
    </div>
  );
}

export default async function Home() {
  let conveyor: Awaited<ReturnType<typeof getConveyor>>;
  try {
    conveyor = await getConveyor();
  } catch {
    return (
      <main className="page">
        <div className="card" style={{ borderColor: "var(--danger-border)", color: "var(--danger)" }}>
          Az adatbázis nem elérhető. Indítsd el: <code>docker compose up -d</code>
        </div>
      </main>
    );
  }

  const c = conveyor;
  const next = (s: StationKey) => c.nextStation === s;

  // Kampány-sorok állomásonként: csak ott jelenik meg egy kampány, ahol teendője van.
  const writeRows = c.campaigns.filter(
    (r) => r.writable > 0 || (r.needsTemplate && r.leadCount > 0),
  );
  const reviewRows = c.campaigns.filter((r) => r.drafted > 0);
  const sendRows = c.campaigns.filter((r) => r.approved > 0);
  const doneRows = c.campaigns.filter(
    (r) => r.approved === 0 && r.drafted === 0 && r.writable === 0 && r.exported > 0,
  );

  return (
    <main className="page">
      <h1>Futószalag</h1>
      <p className="page-lead">
        A leadek útja fentről le. A kék állomás a következő lépésed.
      </p>

      {/* 1. Behozás */}
      <Station n={1} title="Behozás" isNext={next("import")} isIdle={false}>
        <div className="station-row">
          <span className="muted" style={{ fontSize: 13 }}>
            {c.totalLeads} lead a rendszerben
            {c.lastImport &&
              ` · utolsó import: ${c.lastImport.fileName} (${c.lastImport.rowCount} sor)`}
          </span>
          <Link href="/import" className={next("import") ? "btn btn-primary" : "btn btn-ghost"}>
            CSV feltöltése
          </Link>
        </div>
      </Station>

      {/* 2. Feldolgozás */}
      <Station
        n={2}
        title="Feldolgozás"
        isNext={next("process")}
        isIdle={c.processable === 0 && c.failed === 0}
      >
        {c.processable > 0 ? (
          <div className="station-row">
            <span className="muted" style={{ fontSize: 13 }}>
              {c.processable} új lead vár beolvasásra és elemzésre
            </span>
            <ProcessButton count={c.processable} />
          </div>
        ) : (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs feldolgozásra váró lead
          </span>
        )}
        {c.noWebsite > 0 && (
          <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
            {c.noWebsite} leadnek nincs weboldala — ezek nem dolgozhatók fel
          </div>
        )}
        {c.failed > 0 && (
          <div style={{ marginTop: 8 }}>
            <Link
              href="/leads?status=SCRAPE_FAILED"
              style={{ color: "var(--danger)", fontSize: 13, textDecoration: "none" }}
            >
              ⚠ {c.failed} lead nem olvasható/elemezhető — megnézem
            </Link>
          </div>
        )}
      </Station>

      {/* 3. Csoportosítás */}
      <Station
        n={3}
        title="Csoportosítás"
        isNext={next("group")}
        isIdle={c.groups.length === 0 && c.disqualified === 0}
      >
        {c.groups.length === 0 ? (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs kampányra váró lead
          </span>
        ) : (
          c.groups.map((g) =>
            g.isUnclear ? (
              <div className="station-row" key={g.segmentKey}>
                <span className="muted" style={{ fontSize: 13 }}>
                  {g.count} · {g.segmentName}
                </span>
                <Link href="/leads?status=ANALYZED" className="btn btn-ghost">
                  Megnézem
                </Link>
              </div>
            ) : (
              <div className="station-row" key={g.segmentKey}>
                <span style={{ fontSize: 14 }}>
                  <strong>{g.count}</strong> · {g.segmentName} — kampányra vár
                </span>
                <GroupButton
                  segmentKey={g.segmentKey}
                  targetName={g.targetCampaign?.name ?? null}
                />
              </div>
            ),
          )
        )}
        {c.disqualified > 0 && (
          <div style={{ marginTop: 8 }}>
            <Link
              href="/leads?status=DISQUALIFIED"
              className="faint"
              style={{ fontSize: 12, textDecoration: "none" }}
            >
              {c.disqualified} lead nem célpont (már online foglal) — megnézem
            </Link>
          </div>
        )}
      </Station>

      {/* 4. Megírás */}
      <Station
        n={4}
        title="Megírás"
        isNext={next("write")}
        isIdle={writeRows.length === 0}
      >
        {writeRows.length === 0 ? (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs üzenetre váró kampány
          </span>
        ) : (
          writeRows.map((r) => (
            <div className="station-row" key={r.id}>
              <span style={{ fontSize: 14 }}>
                <Link href={`/campaigns/${r.id}`} style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
                  {r.name}
                </Link>
                <span className="muted"> · {r.writable} lead vár üzenetre</span>
              </span>
              {r.needsTemplate ? (
                <TemplatePicker campaignId={r.id} templates={c.templates} />
              ) : (
                <WriteButton campaignId={r.id} count={r.writable} />
              )}
            </div>
          ))
        )}
      </Station>

      {/* 5. Átnézés */}
      <Station
        n={5}
        title="Átnézés"
        isNext={next("review")}
        isIdle={reviewRows.length === 0}
      >
        {reviewRows.length === 0 ? (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs átnézésre váró üzenet
          </span>
        ) : (
          reviewRows.map((r) => (
            <div className="station-row" key={r.id}>
              <span style={{ fontSize: 14 }}>
                <Link href={`/campaigns/${r.id}`} style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
                  {r.name}
                </Link>
                <span className="muted">
                  {" "}· {r.drafted} üzenet vár · {r.approved + r.exported} kész
                </span>
              </span>
              <Link href={`/review/${r.id}`} className="btn btn-purple">
                Átnézés ({r.drafted})
              </Link>
            </div>
          ))
        )}
      </Station>

      {/* 6. Küldés */}
      <Station
        n={6}
        title="Küldés"
        isNext={next("send")}
        isIdle={sendRows.length === 0 && doneRows.length === 0}
      >
        {sendRows.length === 0 && doneRows.length === 0 ? (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs küldésre kész üzenet
          </span>
        ) : (
          <>
            {sendRows.map((r) => (
              <div className="station-row" key={r.id}>
                <span style={{ fontSize: 14 }}>
                  <Link href={`/campaigns/${r.id}`} style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
                    {r.name}
                  </Link>
                  <span className="muted"> · {r.approved} jóváhagyott üzenet kész</span>
                </span>
                <ExportButton campaignId={r.id} redownload={false} />
              </div>
            ))}
            {doneRows.map((r) => (
              <div className="station-row" key={r.id}>
                <span className="muted" style={{ fontSize: 13 }}>
                  {r.name} · {r.exported} üzenet exportálva ✓
                </span>
                <ExportButton campaignId={r.id} redownload />
              </div>
            ))}
          </>
        )}
      </Station>
    </main>
  );
}
