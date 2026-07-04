import Link from "next/link";
import { getConveyor, type StationKey } from "@/lib/services/conveyor";
import { ProcessButton, WriteButton, ExportButton } from "@/app/HomeActions";

export const dynamic = "force-dynamic";

// HOME = a futószalag (UX v4): 5 állomás fentről le, PONTOSAN EGY kiemelve — a pénzhez
// legközelebbi teendő. Nincs kampány, nincs csoportosítás. A számokat a conveyor.ts adja.

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
  let c: Awaited<ReturnType<typeof getConveyor>>;
  try {
    c = await getConveyor();
  } catch {
    return (
      <main className="page">
        <div className="card" style={{ borderColor: "var(--danger-border)", color: "var(--danger)" }}>
          Az adatbázis nem elérhető. Indítsd el: <code>docker compose up -d</code>
        </div>
      </main>
    );
  }

  const next = (s: StationKey) => c.nextStation === s;

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

      {/* 3. Megírás */}
      <Station
        n={3}
        title="Megírás"
        isNext={next("write")}
        isIdle={c.writable === 0}
      >
        {!c.hasCommonTemplate ? (
          <div className="station-row">
            <span style={{ color: "var(--warn)", fontSize: 13 }}>
              Előbb állíts be egy közös ajánlatot a Beállításokban.
            </span>
            <Link href="/settings" className="btn btn-ghost">
              Beállítások
            </Link>
          </div>
        ) : c.writable > 0 ? (
          <div className="station-row">
            <span className="muted" style={{ fontSize: 13 }}>
              {c.writable} elemzett lead vár üzenetre (közös ajánlat + személyre szabott icebreaker)
            </span>
            <WriteButton count={c.writable} />
          </div>
        ) : (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs üzenetre váró lead
          </span>
        )}
        {c.noEmail > 0 && (
          <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
            {c.noEmail} elemzett leadnek nincs emailje — ezeknek nem tudunk küldeni
          </div>
        )}
      </Station>

      {/* 4. Átnézés */}
      <Station
        n={4}
        title="Átnézés"
        isNext={next("review")}
        isIdle={c.drafted === 0}
      >
        {c.drafted > 0 ? (
          <div className="station-row">
            <span className="muted" style={{ fontSize: 13 }}>
              {c.drafted} üzenet vár átnézésre
            </span>
            <Link href="/review" className="btn btn-purple">
              Átnézés ({c.drafted})
            </Link>
          </div>
        ) : (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs átnézésre váró üzenet
          </span>
        )}
      </Station>

      {/* 5. Küldés */}
      <Station
        n={5}
        title="Küldés"
        isNext={next("send")}
        isIdle={c.approved === 0 && c.exported === 0}
      >
        {c.approved > 0 ? (
          <div className="station-row">
            <span className="muted" style={{ fontSize: 13 }}>
              {c.approved} jóváhagyott üzenet kész az exportra
            </span>
            <ExportButton redownload={false} />
          </div>
        ) : c.exported > 0 ? (
          <div className="station-row">
            <span className="muted" style={{ fontSize: 13 }}>
              {c.exported} üzenet exportálva ✓
            </span>
            <ExportButton redownload />
          </div>
        ) : (
          <span className="faint" style={{ fontSize: 13, marginLeft: 8 }}>
            nincs küldésre kész üzenet
          </span>
        )}
      </Station>
    </main>
  );
}
