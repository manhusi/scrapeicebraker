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

### Fázis 8 — Profil + ajánlat admin
- MyProfile (mivel foglalkozom / ajánlataim kontextusa) és OfferTemplate szerkesztő UI.
- **Siker:** felületen szerkeszthető a saját kontextus és a sablonok, a generálás ezt használja.

## A múlt hibái, amiket NEM ismételünk meg
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
- **Következő:** Fázis 3 — Firecrawl dúsítás. ⚠️ Ehhez kell a `FIRECRAWL_API_KEY` a `.env`-be.
