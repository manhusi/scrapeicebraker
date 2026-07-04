# UX v3 — „Futószalag" (a felület forrás-igazsága)

> Minden UI-döntés ehhez igazodik. A mérce: „ránézel, és tudod, hol tartasz és mi az egyetlen
> következő lépés." Ez a v3 a v2 (kampány-központú home) teljes leváltása — Bálint döntése
> (2026-07-04): a régi UI-ból semmi nem marad.

## Miért v3 (a v2 tanulságai — ezeket nem ismételjük meg)

1. **Két párhuzamos világ volt** (kampány vs. lead-raktár), a felhasználó logisztikázott köztük —
   ugyanaz a „kampányhoz adás" művelet KÉT helyen élt (PoolBar + checklist 1. lépés), legördülőkkel.
2. **A zsargon kilógott**: nyers szegmens-kulcsok (`booking_lodge`) a felületen, saját szabályunk ellenére.
3. **A checklist állapotai törékenyek voltak**: setup (lead+ajánlat) és ismétlődő munka (megírás→átnézés→export)
   egy listában, származtatott feltételekkel, amik új lead érkezésekor visszaugrottak.
4. **A fő emberi munka (átnézés) el volt dugva** a lead-adatlapon, adatmezők és scrape-tartalom között.
5. **Nem volt design-rendszer**: inline style-ok, ~30× ismételt színkódok — minden új képernyő másolat.

## A modell: a folyamat maga a felület

A projekt egy gyár: FB-leadekből jóváhagyott, személyre szabott email lesz. Háromfajta munka van,
és a felület ezek szerint válik szét:

- **Gépi munka** (feldolgozás, megírás) — egy gomb indítja, a belseje rejtve.
- **Emberi munka** (átnézés) — dedikált, fókuszált képernyő, mert itt megy el Bálint ideje.
- **Ritka beállítás** (ajánlatok, profil, kulcsszavak) — külön oldalon, nem szem előtt.

## A home: a futószalag (`/`)

Egyetlen függőleges lista, 6 állomás, fentről le a lead útja szerint. Minden állomás EGY sor:
név (ember-nyelven) + darabszám + legfeljebb EGY akció. Kampány-szintű állomásoknál (4–6.)
kampányonként egy sor.

```
1. Behozás        „45 lead a rendszerben”                [CSV feltöltése]
2. Feldolgozás    „12 új lead vár beolvasásra”           [Feldolgozás indítása]
3. Csoportosítás  „7 · Egyedi gyártó — kampányra vár”    [→ Gyártók kampányba]  (vagy [Új kampány])
4. Megírás        „Szauna: 27 lead vár üzenetre”         [Megírás]
5. Átnézés        „Szauna: 14 üzenet vár”                [Átnézés]  → /review/[id]
6. Küldés         „Szauna: 13 jóváhagyva”                [Instantly CSV]
```

**Kiemelés-szabály (a „most mit csináljak?" válasza):** mindig PONTOSAN EGY állomás kiemelt — a
**legáramlás-végibb** teendős állomás (a pénzhez legközelebbi): Küldés → Átnézés → Megírás →
Csoportosítás → Feldolgozás → Behozás. A többi állomás normál; az üres állomás vékony, halvány sor.
A kiemelést a `lib/services/conveyor.ts` számolja (EGY forrás-igazság, `nextStation`).

**Hibák nem tűnnek el:** a nem olvasható/elemezhető leadek a Feldolgozás állomás alatt jelennek meg
figyelmeztető sorként („⚠ 5 lead nem olvasható — megnézem" → `/leads?status=SCRAPE_FAILED`).

## Az állomások viselkedése

| # | Állomás | Mit mutat | Akció | Hova nyúl |
|---|---|---|---|---|
| 1 | Behozás | összes lead + utolsó import | CSV feltöltése | `/import` |
| 2 | Feldolgozás | IMPORTED + weboldalas leadek száma; hibák | Feldolgozás indítása | `POST /api/process` |
| 3 | Csoportosítás | elemzett, kampány nélküli leadek **szegmensenként, ember-nyelvű névvel** (`Segment.name`) | EGY kattintás: ha van illő aktív kampány → „→ [név]-be"; ha nincs → „Új kampány" (név = szegmens neve, ajánlat automatikusan hozzácsatolva, ha van aktív a szegmenshez) | `POST /api/campaigns/from-segment` |
| 4 | Megírás | kampányonként: hány lead vár üzenetre | „Megírás (N)"; ha a kampánynak nincs ajánlata → inline ajánlat-választó (ez az egyetlen kivétel az egy-akció alól, mert enélkül a sor zsákutca) | `POST /api/campaigns/[id]/generate` |
| 5 | Átnézés | kampányonként: hány üzenet vár átnézésre + haladás (13/27) | „Átnézés" | `/review/[campaignId]` |
| 6 | Küldés | kampányonként: hány jóváhagyott üzenet kész | „Instantly CSV letöltése" | `POST /api/campaigns/[id]/export` |

A kampány-sorok (4–6.) mindegyikén a kampány neve link a `/campaigns/[id]` összegzőre (másodlagos:
átnevezés, archiválás, tag-lista — NEM munkafelület, csak áttekintés).

## Az átnézés: fókusz-mód (`/review/[campaignId]`)

A rendszer egyetlen üzenet-szerkesztő felülete (egy tevékenység = egy hely). Elrendezés:

- **Középen az üzenet**: tárgy + törzs, szerkeszthetően. Elsődleges gomb: **Jóváhagyás** (ment is).
  Másodlagos: Kihagyás (következőre lép mentés nélkül), Újraírás (regenerate).
- **Oldalt a kontextus**: cégnév, weboldal-link, szegmens (ember-nyelven), Gemini-összefoglaló,
  jelek (signals) — minden, ami a döntéshez kell, kattintás nélkül.
- **Fent a haladás**: „12/27 átnézve" + előző/következő lépkedés.
- Jóváhagyás után **automatikusan a következő** átnézésre váró üzenet jön.
- Jóváhagyott üzenetre lépve (prev/next) a gomb „Jóváhagyás visszavonása" — így a hibajavítás is itt él.
- Sorrend: `createdAt` szerint, a kampányon BELÜL (v2-ből megtartott szabály: két kampány sosem keveredik).

## Oldaltérkép (zárt katalógus — új route csak spec-frissítéssel)

| Oldal | Szerep | Elsődleges akció |
|---|---|---|
| `/` | Futószalag — teljes állapot + következő lépés | a kiemelt állomás akciója |
| `/review/[campaignId]` | fókuszált átnézés | Jóváhagyás |
| `/campaigns/[id]` | kampány-összegző (másodlagos: átnevezés, archiválás, tagok) | — |
| `/leads` | kereshető/szűrhető állomány — információ, nem munka | lead megnyitása |
| `/leads/[id]` | egy cég teljes útja (adatok, analízis, üzenet OLVASHATÓAN, scrape-tartalom) | „Átnézés megnyitása" ha van üzenete |
| `/import` | CSV be → összegző → **„Feldolgozás indítása"** gomb (Bálint döntése: egy kattintás, nem automata) | feltöltés, majd feldolgozás |
| `/settings` | ajánlatok + profilom (Fázis 8-ig olvasható), kulcsszó-gyűjtő | — |

Navigáció (3 elem): **Futószalag · Leadek · Beállítások**. Nincs globális „+ Import" CTA — az import
az 1. állomásról indul.

## Design-rendszer (anti-spagetti alap)

- **Minden szín/térköz/sugár CSS-változó** a `src/app/globals.css`-ben (sötét téma — Bálint döntése).
  Hex-kód komponensben TILOS; kivétel a `lib/pipeline.ts` státusz-színei, amik ott az EGY forrás-igazság.
- **Primitívek** a `src/app/ui/`-ban: `Button` (variánsokkal), `Badge`, `EmptyState`, `TopNav`,
  `api.ts` (kliens-hívás egy helyen); a kártya/űrlap/táblázat szemantikus CSS-osztály (`.card`,
  `.input`, `.table`…). Oldal csak ezekből épül. Inline style-erdő tilos.
- **Nyelv:** magyar, tegeződő, hétköznapi. Zsargon tilos a felületen: „beolvasás" nem „scrape",
  „megírás" nem „generálás", „átnézésre vár" nem „DRAFTED", szegmens = `Segment.name` sosem `key`.

## API-következmények (route-katalógus változása)

- **Új:** `POST /api/campaigns/from-segment` — kampány létrehozása/kiegészítése egy szegmens
  kampányra váró leadjeivel (a 3. állomás egy-kattintása).
- **Új (Fázis 8):** `POST /api/offers` + `PATCH /api/offers/[id]` (ajánlat-sablon létrehozás/szerkesztés),
  `PUT /api/profile` (profil-morzsa upsert kulcs szerint). Logika: `lib/services/settings.ts`.
- **Törölve (halott, UI nem hívja):** `/api/scrape`, `/api/analyze`, `/api/generate` — a
  `/api/process` és a `/api/campaigns/[id]/generate` fedi le őket. A seed route-ok maradnak (setup-eszközök).
- Minden más route változatlan.
