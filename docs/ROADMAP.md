# ROADMAP — Outreach Automation Rendszer

> Ez a munka logikai fázisokra bontva. Mindig tudd, melyik fázisban vagy.
> Minden fázis a stabil előzőre épül, és van **siker-kritériuma** (mit jelent, hogy „kész").
> Élő dokumentum: fázis zárásakor frissítsd az állapotot és a tanulságokat.

## Mit építünk (egy mondatban)

Egy rendszer, ami Apify-ból CSV-ként beérkező FB-lead listát feldúsít (Firecrawl weboldal-scrape),
megérti mivel foglalkoznak (Gemini szegmentálás), személyre szabott, emberi icebreakert ír (Gemini),
a megfelelő ajánlat-sablont választja hozzá, majd Instantly-be tölthető CSV-t exportál.

## A pipeline állapotgépe (a rendszer gerince)

Minden lead ezen az úton megy végig, egy státusz-mezővel követve:

```
IMPORTED → SCRAPED → ANALYZED → DRAFTED → APPROVED → EXPORTED
              │          │          │          │
         (Firecrawl)  (Gemini)   (Gemini)  (te/auto)
```

Bármelyik lépés hibázhat anélkül, hogy a lead elveszne — a státusz megmarad, a lépés újrafuttatható.

## Fázisok

### Fázis 0 — Alapok (skeleton + infra)
- Next.js (TS) váz, docker-compose Postgresszel, Prisma bekötve, `.env` séma, health-check.
- **Siker:** `docker compose up` → app fut localhoston, `/api/health` zöld, DB kapcsolódik.

### Fázis 1 — Kontraktus + adat (séma)
- Prisma séma és migrációk: Lead, ImportBatch, SiteContent, Analysis, Segment, OfferTemplate,
  MyProfile, Message, Setting (lásd `DOMAIN.md`).
- **Siker:** migráció lefut üres DB-n, `prisma studio`-ban látszanak a táblák, seed adat betölt.

### Fázis 2 — Lead import (CSV BE)
- CSV feltöltő UI + parser + oszlop-mapping → Lead rekordok, ImportBatch-hez kötve, duplikátum-védelem.
- **Siker:** valós Apify-export CSV-t feltöltve a leadek megjelennek a listában, helyes mezőkkel.

### Fázis 3 — Firecrawl dúsítás
- Egy/batch lead weboldalának scrape-je → SiteContent (markdown). Rate-limit, retry, cache
  (ugyanazt kétszer nem scrape-eljük), hibánál a lead SCRAPE_FAILED, nem vész el.
- **Siker:** egy valós weboldal ténylegesen lescrape-elve, a tartalom a DB-ben, státusz SCRAPED.

### Fázis 3.5 — Kulcsszó-gyűjtő (Keyword collector)
- `Keyword` entitás + `/keywords` oldal: keresendő kulcsszavak egy helyen, státusszal, lead-számmal.
  ImportBatch a Keyword-höz kötve. Az import upsertálja a kulcsszót. (Kulcsszó ≠ szegmens — lásd DOMAIN.)
- **Siker:** felveszek egy kulcsszót, importkor hozzákötődik a batch, a `/keywords` mutatja a lead-számot.

### Fázis 4 — Gemini analízis + szegmentálás
- SiteContent → { szegmens, mit csinálnak (összefoglaló), fájópontok/jelek }. Zárt szegmens-katalógus.
- **Siker:** valós tartalomból helyes szegmens és értelmes összefoglaló, státusz ANALYZED.

### Fázis 5 — Icebreaker + ajánlat generálás
- Előbb **utánaolvasunk, hogyan kell jó icebreakert írni** (kutatás → prompt-alapelvek doksi).
- Gemini icebreaker (természetes, nem robotos) + ajánlat-sablon kiválasztás (auto/hibrid kapcsoló).
- Final message összerakás: icebreaker + kiválasztott ajánlat-törzs, placeholder-behelyettesítéssel.
- **Siker:** olvasva emberinek ható icebreaker + a szegmenshez illő ajánlat, státusz DRAFTED.

### Fázis 6 — Review UI (hibrid mód)
- Lead-lista státuszokkal, draft áttekintő/szerkesztő, jóváhagyás. Auto módban ez a lépés átugorható.
- **Siker:** végig tudsz menni N leaden, szerkeszted/jóváhagyod, státusz APPROVED.

### Fázis 7 — Export (CSV KI)
- APPROVED üzenetek → Instantly-kompatibilis CSV (email, név, icebreaker, üzenet, custom mezők).
- **Siker:** letöltött CSV ténylegesen importálható Instantly-be, státusz EXPORTED.

### Fázis 7.5 — UI v3: Futószalag (teljes UI-újraírás)
- A v2 UI (kampány-központú home + lead-raktár) teljes leváltása a `docs/UX.md` v3 spec szerint:
  home = futószalag (6 állomás, egy kiemelt következő lépés), dedikált review fókusz-mód,
  design-rendszer (CSS-változók + primitívek), halott route-ok törlése.
- **Siker:** minden oldal a v3 oldaltérkép szerint renderel valós adattal, tsc 0 hiba, a teljes
  út (import → feldolgozás → csoportosítás → megírás → átnézés → export) végigjárható a felületen.

### Fázis 9 — Icebreaker-igazság + kvalifikáció ✅
- A v1 icebreaker manufaktúrázta a fájdalmat (25-ből 19 ugyanazzal a „kézi kör" sablonnal zárt,
  online-foglalós leadeknek is állította a kézi munkát — a régi scraper hibája). Javítás:
  (1) az analízis eldönti a `bookingMode`-ot (manual/online/unknown) + kiszűri a scrape-szemetet;
  (2) a foglalás-fájdalom szegmenseknél az online-foglalós lead DISQUALIFIED (nem célpont, de látható);
  (3) az icebreaker-prompt átírva: feltételes+igaz+változatos átvezetés, tiltott sablonfarok, nincs
  törzs-szivárgás; (4) a duplikáció-bug javítva (stripLeakedOpening). Spec: `docs/ICEBREAKER.md`.
- **Siker:** valós Gemini-verifikáció (9 lead újraelemzve, 4 helyesen DISQUALIFIED /Wishkó, StagLand,
  Mátra ForRest, Pilis Kabin — mind online foglal/; 5 újragenerált icebreaker: 0 sablonfarok /volt 19/25/,
  0 nonszensz, 0 duplikáció; a Google-chrome hallucináció eltűnt). tsc 0.

### Fázis 8 — Profil + ajánlat admin ✅
- MyProfile (mivel foglalkozom / ajánlataim kontextusa) és OfferTemplate szerkesztő UI.
- **Siker:** felületen szerkeszthető a saját kontextus és a sablonok, a generálás ezt használja.

## A múlt hibái, amiket NEM ismételünk meg
- **Firecrawl blokkolt-tartalom (valós lecke, Fázis 3):** a `success:true` nem garancia — védett oldalak
  captcha/„biztonsági ellenőrzés" oldalt adnak vissza. Detektálni kell (kulcsszó + min. hossz) és
  `SCRAPE_FAILED`-re tenni. A `stealth` proxy nem segített és 5× kredit — NEM használjuk auto-retryre.
- Nem scrape-elünk/generálunk kétszer ugyanarra (pénz) — cache + idempotencia.
- Nem tippelünk API-válasz formátumot — a Firecrawl/Gemini bekötés előtt valós hívással verifikáljuk.
- Nem SQLite-izmus a sémában — Supabase-kompatibilis Postgres marad.
- Nem robotos icebreaker — előbb kutatás, csak utána prompt.

## Jelenlegi állapot
- **Fázis 0 — KÉSZ** (verifikálva: `/api/health` → `{status:ok, db:connected}`, `/` → 200, Postgres healthy).
  Stack: Next.js 15.5 (TS, App Router), Prisma 6.19, Postgres 16 Dockerben. Prisma kliens: `src/lib/db.ts`.
  Indítás: `docker compose up -d` majd `npm run dev`.
- **Fázis 1 — KÉSZ** (verifikálva: 9 domain tábla + enumok létrejöttek, Lead oszlopok = CSV mapping).
  Migráció: `prisma/migrations/20260703145237_init/`. Segment/OfferTemplate/MyProfile üresek (seed később).
- **Fázis 2 — KÉSZ** (verifikálva valós CSV-vel: 45 lead beszúrva, 4 hibás sor kihagyva, ismételt
  import 0 új / 45 dedupe. Mapping DB-ből ellenőrizve). Kód: `src/lib/services/leadCsv.ts` (parser+mapping),
  `leadImport.ts` (dedupe+insert), `/api/import`, `/import` UI, dashboard `/`.
- **Fázis 3 — KÉSZ** (verifikálva valós scrape-pel: 39 SCRAPED, 5 SCRAPE_FAILED /blokkolt/, 1 IMPORTED
  /nincs weboldal/). Kód: `src/lib/firecrawl/client.ts` (blokkolt-detektálás, retry),
  `src/lib/services/scrapeLead.ts` (cache, fail-closed, pool), `/api/scrape`, dashboard ScrapeButton.
- **Fázis 3.5 — KÉSZ** (verifikálva: `Keyword` entitás, migráció backfillel /szauma→45 lead, 0 adatvesztés/,
  `/keywords` oldal add+archivál, import upsertálja a kulcsszót, tsc 0 hiba). Kód:
  `src/lib/services/keywords.ts`, `/api/keywords`, `/api/keywords/[id]`, `/keywords` UI.
  Migráció kézzel írva + `migrate deploy` (a destruktív drop miatt non-interaktívan).
- **Fázis 4 — KÉSZ** (verifikálva valós Gemini-hívással: 6 szegmens seedelve, 39/39 lead elemezve 0 hiba,
  megoszlás booking_lodge 27 / custom_manufacturer 7 / product_ecom 4 / unclear 1; tsc 0 hiba).
  Modell: `gemini-2.5-flash` (env `GEMINI_MODEL`), strukturált JSON responseSchema, header-auth, retry.
  Kód: `src/lib/gemini/client.ts`, `src/lib/gemini/prompts.ts` (prompt-katalógus, dinamikus szegmensek),
  `src/lib/segments/catalog.ts` (6 archetípus + idempotens seed), `src/lib/services/analyzeLead.ts`,
  `/api/segments/seed`, `/api/analyze`, dashboard AnalyzeButton + szegmens-megoszlás.
  Lecke: az `unclear` fail-closed valóban kiszűrte a cookie-fal mögötti (rossz scrape) tartalmat.
- **Fázis 5 — KÉSZ** (verifikálva: 25 draft valós leadeken, 0 hiba, batch-audit tiszta — 9-féle kezdés,
  0 tiltott minta). Architektúra: az email a videóra kér igent, a Grand Slam a videóban (ICEBREAKER.md).
  Scope-döntés: CSAK booking_lodge első körben (27 lead), 1 videó. Kód: prompts.buildIcebreakerPrompt
  (anti-AI szabályokkal), `src/lib/services/generateMessage.ts`, `src/lib/setup/seed.ts` (MyProfile +
  booking_lodge sablon v1 + offer_mode=hybrid), `/api/setup/seed`, `/api/generate`, GenerateButton.
  Message.subject migráció: `20260703180000_add_message_subject`.
  Lecke: az első batch-ben a Gemini üres meta-kommentárt írt ("Ez egy nagyon konkrét kapacitás") —
  prompt-szabály lett belőle (6-7.: ne kommentáld a megfigyelést, variáld a kezdést).
  ⚠️ NYITOTT: Bálintnak fel kell vennie a ~2 perces booking_lodge videót, mielőtt a kampány kimegy.
- **Fázis 6 — KÉSZ: Kampányok + Review IA** (verifikálva: 7 oldal HTTP 200, éles jóváhagyás lead+message
  APPROVED-ra, tsc 0 hiba, 0 log-hiba). Új domain: `Campaign` entitás + `Lead.campaignId` (migráció
  `20260703190000_add_campaign` backfillel: 27 booking_lodge lead a „Szauna – Booking Lodge" kampányba).
  A generálás mostantól KAMPÁNY-alapú (a kampány ajánlat-sablonját használja), a scrape/analyze globális.
  IA: TopNav (Dashboard/Kampányok/Leadek/Kulcsszavak), kattintható PipelineStepper (→ /leads?status=X),
  `/leads` szűrhető lista, `/leads/[id]` detail teljes úttal + szerkeszthető üzenet + jóváhagyás +
  prev/next review-lépkedés, `/campaigns` + `/campaigns/[id]` (tagok, generálás, státusz, lead-hozzáadás).
  Forrás-igazságok: `src/lib/pipeline.ts` (státusz-meta), services: campaigns.ts, reviewMessage.ts.
- **Fázis 6.5 — KÉSZ: Vezetett UX** (verifikálva: hero + checklist + címkék renderelnek, tsc 0, log 0).
  Elvek kőbe vésve: `docs/UX.md` (a rendszer vezet; egy képernyő egy akció; gép belseje rejtve;
  checklist-folyamatok). Új: NextAction hub (`lib/services/nextAction.ts` + NextActionCard),
  egyesített feldolgozás (`processLeads.ts` + `/api/process` — beolvasás+elemzés egy láncban),
  kampány = 5 lépéses vezetett checklist (CampaignChecklist), beszédes státusz-címkék
  („Átnézésre vár" nem „DRAFTED"). Törölve: ScrapeButton, AnalyzeButton, CampaignControls.
- **Fázis 6.6 — KÉSZ: Kampány-központú IA** („egy kampány = egy igazság", Bálint döntése). Home =
  kampánylista (kártyánként saját következő-lépés CTA: `campaignNextStep`), alatta Lead-raktár sáv
  (`getPoolSummary` + PoolBar: feldolgozás, szegmensenkénti „kampányra vár", hibák). Dashboard
  megszűnt, `/campaigns` → `/` redirect, TopNav: Kampányok · Lead-raktár · Kulcsszavak.
  BUG-JAVÍTÁS: a review prev/next mostantól a lead kampányán BELÜL lépked (nem globálisan) — két
  párhuzamos kampány nem keveredik. Törölve: nextAction.ts, NextActionCard.
  (Verifikálva: 6 útvonal 200, kártya-CTA + raktár renderel, tsc 0, log 0.)
- **Fázis 7 — CSV VERIFIKÁLVA, INSTANTLY-IMPORT NYITOTT** (a `fazis7` commitban bekerült:
  `exportCampaign.ts`, `/api/campaigns/[id]/export`, export gomb). A CSV-kimenet most VERIFIKÁLVA valós
  kódúton (jóváhagyás→export→visszaállítás, éles adat érintetlen): helyes Instantly-fejlécek
  (email, company_name, subject, message, website), minden sor oszlopszáma egyezik, a többsoros törzs +
  speciális karakterek (`&`, `|`, ékezet) jól escape-elve, UTF-8 megőrizve, fájlnév-slug helyes,
  a már EXPORTED sorok újratölthetők. NYITOTT (a te manuális lépésed): a letöltött CSV tényleges
  betöltése egy Instantly-fiókba. Tanulság: a 7. lépés (verifikáció) nem opcionális — a doksi-frissítés
  akkor kimaradt.
- **Fázis 7.5 — KÉSZ: UI v3 „Futószalag"** (verifikálva élőben: 9 útvonal 200, tsc 0, szerver-log 0;
  jóváhagyás→automata továbblépés review-ban élesben tesztelve majd visszavonva; egy-kattintásos
  szegmens→kampány tesztelve /7 lead, inline ajánlat-választó megjelent/ majd visszavonva; `unclear`
  fail-closed). A teljes régi UI törölve, semmi nem maradt belőle. Új: `src/app/globals.css`
  (CSS-változók), `src/app/ui/` (Button/Badge/EmptyState/TopNav/api.ts), `lib/services/conveyor.ts`
  (a home egy forrás-igazsága, downstream-first kiemelés), `/review/[campaignId]` fókusz-mód (az
  üzenet-szerkesztés EGYETLEN helye), `/settings` (kulcsszavak + ajánlat/profil olvasva),
  `assignSegmentToCampaign` + `POST /api/campaigns/from-segment`, kampány-átnevezés a PATCH-ben.
  Törölve: PoolBar/CampaignChecklist/PipelineStepper/StatusBadge/MessageEditor/KeywordManager(régi),
  `/keywords` oldal, halott route-ok (`/api/scrape`, `/api/analyze`, `/api/generate`),
  `campaignNextStep`/`getPoolSummary`. Bálint döntései: home=futószalag; feldolgozás import után
  EGY kattintás (nem automata — kredit-kontroll); csoportosítás egy-kattintásos ajánlat (nem automata);
  sötét téma rendszerezve. Lecke: dev-szerver alatt tömeges fájlcsere → `.next` korrupció (500),
  gyógymód: `rm -rf .next` + újraindítás.
- **Fázis 8 — KÉSZ: Profil + ajánlat admin** (verifikálva valós végpont-hívásokkal: PUT profil-upsert,
  POST/PATCH ajánlat-sablon, hibás szegmens fail-closed elutasítva, UI in-place szerkesztő kinyílik,
  tsc 0, konzol 0; a teszt-sorok kitakarítva, éles adat érintetlen). Séma-migráció NEM kellett (a
  MyProfile/OfferTemplate séma már teljes volt). Logika: `lib/services/settings.ts` (createOfferTemplate,
  updateOfferTemplate, upsertProfile). Route-ok: `POST /api/offers`, `PATCH /api/offers/[id]`,
  `PUT /api/profile`. UI: `/settings` OfferEditor (név/törzs/szegmens/aktív + új sablon) + ProfileEditor
  (kulcsonkénti content + új kulcs). Döntések a `DOMAIN.md`-ben rögzítve (kulcsolt morzsák; nincs kemény
  törlés → deaktiválás; `offer_mode` szándékosan nincs a UI-n a küldés-biztonság miatt).
- **Fázis 11 — KÉSZ: Egységes horog, kampány/csoportosítás nélkül** (Bálint döntése). Stratégiaváltás:
  EGY közös ajánlat mindenkinek (mindenki hirdet → jobb megtérülést akar; a különbség a VSL-ben).
  Folyam 6→5 állomás: **Behozás → Feldolgozás → Megírás → Átnézés → Küldés** (Csoportosítás ELTŰNT).
  Minden globális, státusz-alapú: `conveyor.ts` átírva; `generatePendingMessages` + `getReviewQueue` +
  export globális; közös sablon = az egyetlen aktív `OfferTemplate` (`getCommonTemplate`). Új: `/review`
  (globális), `/api/write`, `/api/export`, `/api/reprocess` + Beállítások „Draftek frissítése" gomb.
  Törölve (halott): `services/campaigns.ts`, `exportCampaign.ts`, `reprocessCampaign.ts`,
  `/api/campaigns/*`, `/campaigns/[id]`, `/review/[campaignId]`, grouping-állomás, GroupButton.
  A `Campaign` séma megmarad (rollback-barát), de a folyam nem használja. Verifikálva: 6 útvonal 200,
  home 5 állomás (Csoportosítás=0), kiemelt=Átnézés, `/review` globálisan renderel, tsc 0.
  ⚠️ NYITOTT (Bálint): a közös törzs megírása a Beállításokban (ads-horog + „(Remélem nálatok nem
  így van), de…" bridge), majd „Draftek frissítése", és a ~2 perces VSL felvétele.
- **Következő:** Fázis 7 export-verifikáció valós Instantly-importtal (a kód kész — most már a globális
  `/api/export` —, a bizonyíték a te manuális lépésed: exportált CSV betöltése egy Instantly-fiókba).
