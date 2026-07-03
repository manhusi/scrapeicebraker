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
- `status` — enum: IMPORTED, SCRAPED, SCRAPE_FAILED, ANALYZED, ANALYZE_FAILED, DRAFTED, APPROVED, EXPORTED
- `importBatchId` — melyik importból jött
- `createdAt`, `updatedAt`
- **Egyediség/dedupe:** `pageId` (elsődleges), fallback `email`. Batch-en átívelő duplikátum-védelem.
- **Nincs személynév** a forrásban — az outreach a céget szólítja meg, nem kamuzunk keresztnevet.

**CSV → Lead mapping (page-scraper):** `title`→businessName · `pageName`→pageHandle · `pageId`→pageId ·
`email`→email · `website`(||`websites/0`)→websiteUrl · `facebookUrl`→fbUrl · `category`→category ·
`intro`→intro · `followers`→followers · `phone`→phone · `address`→address.
A CSV ~400 további oszlopát (ads-snapshotok, képek) **eldobjuk** — nem kell.

### ImportBatch — egy CSV-feltöltés
- `id`, `keyword`, `fileName`, `rowCount`, `createdAt`
- Kényelmi csoportosítás: „mit importáltam és mikor".

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
- `model`, `createdAt`
- Egy leadhez a legfrissebb analízis az érvényes.

### Segment — zárt szegmens-katalógus
A szegmensek fix listája; minden ajánlat-sablon ide köt. Új szegmens = explicit döntés + `DOMAIN.md` frissítés.
- `key` (pl. `ad_management_landing`, `event_payment_software`), `name`, `description`
- Kezdő szegmensek a build során véglegesednek; a felhasználó ajánlatai határozzák meg.

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
- `id`, `leadId`
- `icebreaker` — a személyre szabott nyitómondat
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

## Nyitott, a build során eldöntendő (nem blokkolja a jóváhagyást)
- SiteContent/Analysis/Message: egy-élő vs. verziózott — alapból egy-élő, felülírással.
- MyProfile pontos alakja (kulcsolt morzsák vs. dokumentum) — a Fázis 8 tervnél véglegesítjük.
- A kezdő szegmensek konkrét listája — a te ajánlataidból (később megbeszéljük).
