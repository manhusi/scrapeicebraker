# DOMAIN — adatmodell (a rendszer forrás-igazsága)

> Ez az adatvilág egyetlen igazsága. A Prisma séma ennek az implementációja, nem fordítva.
> Prózában/vázlatként írva; a típusos séma a build-fázisban készül belőle.
> Változtatás CSAK itt átvezetve, majd migrációval (lásd CONSTITUTION 1., 3.).

## Entitások

### Lead — egy prospect (FB oldal / cég)
A pipeline alanya. Egy sor = egy megkeresendő cég. A mezők a **valós Apify page-scraper CSV-hez**
igazítva (lásd a mapping táblát lent).
- `id`
- `businessName` — a cég olvasható neve (CSV: `title`, pl. „Erdélyi Dézsa és Szauna") → **megszólítás**
- `pageHandle` — FB handle/slug (CSV: `pageName`, pl. `erdelyidezsaszauna`)
- `pageId` — FB oldal azonosító (CSV: `pageId`) → **elsődleges dedupe kulcs**
- `email` — céges email (CSV: `email`)
- `websiteUrl` — weboldal (CSV: `website`, fallback `websites/0`) → **Firecrawl input**
- `fbUrl` — FB oldal URL (CSV: `facebookUrl`)
- `category` — FB kategória (CSV: `category`, pl. „Health & wellness website") → **szegmens-jel**
- `intro` — FB bio (CSV: `intro`) → icebreaker nyersanyag
- `followers` — követők (CSV: `followers`) → méret-jel
- `phone`, `address` — kontextus (CSV: `phone`, `address`)
- `sourceKeyword` — melyik kulcsszóra jött (kézzel megadva importkor, a CSV nem tartalmazza)
- `status` — enum: IMPORTED, SCRAPED, SCRAPE_FAILED, ANALYZED, ANALYZE_FAILED, **DISQUALIFIED**, DRAFTED, APPROVED, EXPORTED, **BANNED**
  - `DISQUALIFIED` (Fázis 9): elemezve, de NEM célpont — a foglalás-fájdalom szegmenseknél már
    online foglal (`Analysis.bookingMode = "online"`), ezért nem kap üzenetet. Nem vész el, látható
    a „Nem célpont" szűrőben, kézzel visszavehető. Lásd `docs/ICEBREAKER.md` (kvalifikáció).
  - `BANNED` (Fázis 13): átnézésnél kézzel eldobott vállalkozás (a „Törlés" gomb). NEM kemény törlés —
    a lead sora és a `pageId`/`email` dedupe-kulcs a DB-ben marad, ezért ha ugyanezt a céget később
    (más kulcsszóval, pl. hirdetéskezelővel) újra behúznád, az import „már megvan"-ként átugorja
    (`skippedAlreadyExists`). A bannolt lead kimarad a review-sorból ÉS az exportból (fail-closed).
    A `Message` érintetlen marad DRAFT-on (sose kap APPROVED-ot, így exportba se kerülhet). Kézzel
    visszavehető (status → DRAFTED). A dedup státusz-független, ezért nem igényel külön logikát.
- `importBatchId` — melyik importból jött
- `campaignId` — melyik kampányba szervezve (N—1, opcionális). A generálás/review/export kampány-szintű.
- `createdAt`, `updatedAt`
- **Egyediség/dedupe:** `pageId` (elsődleges), fallback `email`. Batch-en átívelő duplikátum-védelem.
- **Nincs személynév** a forrásban — az outreach a céget szólítja meg, nem kamuzunk keresztnevet.

**CSV → Lead mapping (page-scraper):** `title`→businessName · `pageName`→pageHandle · `pageId`→pageId ·
`email`→email · `website`(||`websites/0`)→websiteUrl · `facebookUrl`→fbUrl · `category`→category ·
`intro`→intro · `followers`→followers · `phone`→phone · `address`→address.
A CSV ~400 további oszlopát (ads-snapshotok, képek) **eldobjuk** — nem kell.

### Keyword — a kulcsszó-gyűjtő (Meta Ads keresési tengely)
A kulcsszó ≠ szegmens. A kulcsszó azt mondja meg, HONNAN jön a lead (melyik Meta Ads keresés);
a szegmens azt, MILYEN fájdalom/ajánlat illik rá. Egy helyen kezelve.
- `id`, `term` (egyedi, pl. „szauna", „fogorvos"), `notes`
- `status` — enum: PLANNED (tervezett keresés), IMPORTED (van hozzá lead), ARCHIVED
- `createdAt`, `updatedAt`
- Használat: előre felveheted a keresendő kulcsszavakat (PLANNED), majd import köti hozzá a batch-et.

### Campaign — az outreach szervező-egysége (menedzselhető)
Egy nevesített kampány EGY ajánlatra fókuszál, leadeket fog össze, és egy Instantly-exportot ad ki.
A generálás/review/export kampány-szintű; a scrape/analyze ellenben globális, kampány-független.
- `id`, `name` (pl. „Szauna – Booking Lodge")
- `offerTemplateId` — melyik ajánlat-sablonnal megy (a szegmens ebből adódik). A generálás EZT használja.
- `status` — enum: DRAFT (építés alatt), READY (átnézve, exportálható), EXPORTED, ARCHIVED
- `notes`, `createdAt`, `updatedAt`
- Tagság: `Lead.campaignId` (N—1). Egy lead egyszerre egy kampányban.

### ImportBatch — egy CSV-feltöltés
- `id`, `fileName`, `rowCount`, `createdAt`
- `keywordId` — melyik Keyword-höz tartozik (N—1). A batch importkor ehhez kötődik.
- Kényelmi csoportosítás: „mit importáltam, melyik kulcsszóra, mikor".

### SiteContent — Firecrawl scrape eredménye
- `id`, `leadId`
- `sourceUrl` — mit scrape-eltünk
- `markdown` — a kigyűjtött tartalom
- `meta` — cím, leírás stb. (JSON)
- `scrapedAt`
- Cache: adott URL-hez egyszer scrape-elünk, hacsak nincs „újra".

### Analysis — Gemini megértés + szegmentálás
- `id`, `leadId`
- `segmentKey` — a kiválasztott szegmens (lásd Segment)
- `summary` — mivel foglalkoznak (rövid)
- `signals` — fájópontok / kapaszkodók az icebreakerhez (JSON vagy szöveg)
- `bookingMode` (Fázis 9) — a foglalás módja a jelekből: `manual` | `online` | `unknown`. Az `online`
  a foglalás-fájdalom szegmenseknél (`booking_lodge`, `service_wellness`, `event_program`) kizáró ok.
  Forrás-igazság a szegmens-halmazra: `lib/segments/catalog.ts` (`BOOKING_PAIN_SEGMENTS`).
- `model`, `createdAt`
- Egy leadhez a legfrissebb analízis az érvényes.

### Segment — FÁJDALOM-alapú, bővíthető katalógus
A szegmensek **fájdalom-archetípusok**, nem niche-ek — ezért egy új kulcsszó (fogorvos, ügyvéd…) nem
töri el a rendszert, a leadek ugyanabba a fájdalomba esnek. Zárt a katalógus abban az értelemben, hogy
a Gemini csak a meglévő szegmensekből választhat (nem talál ki újat) — de a katalógus admin-felületen
BŐVÍTHETŐ (Fázis 8), a Gemini a DB aktuális listáját olvassa. Új szegmens = explicit döntés.
- `key`, `name`, `description` (a fájdalom + kinek szól)
- Kezdő 6 (fájdalom-archetípusok): `booking_lodge`, `custom_manufacturer`, `product_ecom`,
  `service_wellness`, `event_program`, `unclear` (fail-closed háló).
- **Proof-horgony (lásd memória: outreach-business-context):** két bizonyított ajánlat a mag —
  foglalás+fizetés szoftver (kacatanya.hu) és hirdetés+konverziós landing (mobil faház). A szomszédos
  szegmensek ezekre a case study-kra épülnek.

### OfferTemplate — ajánlat-sablon (az üzenet fő törzse)
Szegmensenként több is lehet.
- `id`, `segmentKey`, `name`
- `body` — az ajánlat szövege, placeholderekkel (pl. `{{contactName}}`, `{{painPoint}}`)
- `active` — használatban van-e
- `createdAt`, `updatedAt`

### MyProfile — a saját kontextusom (mivel foglalkozom, mi az ajánlatom)
A generálás kontextusa; „csak jó, ha tudjuk". Kevés, de fontos sor.
- `id`, `key`, `content` — kulcsolt tudásmorzsák (pl. `about_me`, `positioning`, `proof`)
- Alternatíva: egyetlen szerkeszthető dokumentum + strukturált ajánlat-lista. A build-fázisban véglegesítjük.

### Message — a generált/kész üzenet
Architektúra: az email a videóra kér igent; a Grand Slam a videóban (lásd `ICEBREAKER.md`).
- `id`, `leadId`
- `subject` — Gemini-generált tárgysor (rövid, konkrét, nem salesy)
- `icebreaker` — a személyre szabott nyitó (megfigyelés + átvezetés)
- `offerTemplateId` — melyik ajánlat-sablon lett választva
- `finalMessage` — icebreaker + behelyettesített ajánlat-törzs (ez megy exportba)
- `status` — DRAFT, APPROVED, EXPORTED
- `edited` — kézzel módosították-e a jóváhagyásnál
- `generatedAt`, `approvedAt`

### Setting — globális kapcsolók
- `key`, `value` (JSON/szöveg)
- Kiemelt: `offer_mode` = `hybrid` | `auto` (alap: `hybrid`).

## Kapcsolatok (röviden)
- Lead 1—1 (legfrissebb) SiteContent, Analysis, Message; 1—N a történeti verziókra, ha megtartjuk.
- Lead N—1 ImportBatch.
- OfferTemplate N—1 Segment; Analysis a `segmentKey`-en át köt a Segmenthez és sablonokhoz.
- Message N—1 OfferTemplate.

## Fázis 8 — véglegesített döntések (admin)
- **MyProfile = kulcsolt morzsák** (nem egyetlen dokumentum). A `voice` kulcs LÖKET-hordozó: a
  generálás közvetlenül ezt olvassa (`generateMessage.ts`). A `/settings` szerkeszti a content-et
  kulcsonként, és új kulcs is felvehető. A morzsák törlése nem cél (a `voice` sose tűnhet el).
- **OfferTemplate szerkesztés:** name + body + `active` kapcsoló + szegmens; új sablon létrehozható.
  Kemény törlés NINCS — az `active:false` kiveszi az ÚJ választásból, de a történetet/hivatkozásokat
  őrzi (a meglévő kampányok generálása `active`-tól függetlenül működik, mert a Message a template.body-t
  fixálja). Egy szegmenshez több aktív sablon lehet; a Csoportosítás/generálás az elsőt (legfrissebbet) veszi.
- **Setting `offer_mode` (hybrid/auto): SZÁNDÉKOSAN nincs a UI-n** — az auto-mód jóváhagyás nélkül küldene
  (CONSTITUTION 11–12.), ezért csak explicit, külön döntéssel nyílik meg, nem egy admin-kapcsolóval.

## Nyitott, a build során eldöntendő (nem blokkolja a jóváhagyást)
- SiteContent/Analysis/Message: egy-élő vs. verziózott — alapból egy-élő, felülírással.
- A kezdő szegmensek konkrét listája — a te ajánlataidból (később megbeszéljük).
