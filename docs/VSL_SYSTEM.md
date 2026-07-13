# VSL-szállító rendszer — build brief (kontextussal)

> Ez a doksi egy **átadási brief** a projekt-Claude-nak: előbb a **miért + mit** (üzleti
> kontextus), utána a **technikai terv**. Kapcsolódó: `docs/VSL.md` (a VSL-playbook,
> forrás-igazság), `prisma/schema.prisma` (a meglévő outreach-modell), `docs/ROADMAP.md`.

---

## A. Kontextus — MIÉRT csináljuk

**A business:** hideg megkeresés → **személyre szabott videó-auditok** (VSL) küldése kis-
és középvállalkozásoknak (vidéki szálláshelyek, wellness, faház/jakuzzi gyártók-kereskedők).
A cold email **egyetlen** célja: igent kapni egy ~2 perces videóra. Az első éles kampány:
**~50 email → ~8 pozitív** ("küldd a videót"). Innentől a szűk keresztmetszet nem a
megkeresés, hanem a **szállítás**: eljuttatni a videót, mérni a hatását, kezelni a válaszokat.

**Miért kell ez a rendszer (a hiányzó réteg):** ma nincs
1. **személyre szabott oldal**, ahova a videó kerül (maga az oldal is a personalizáció bizonyítéka),
2. **mérés** — megnyitotta-e, meddig nézte, kattintott-e (enélkül vakon dolgozunk),
3. **egy hely a válaszok kezelésére** (az email-válaszok szétszórtan érkeznek).

**Mi a VSL (fontos, mert ez határozza meg az oldalt):** **meleg, személyre szabott audit**,
NEM klasszikus cold VSL. ~2 perc, **egy fájdalom / egy fix**, a végén **EGY pici CTA** — a
prospekt már igent mondott, nem kell agitálni. Ezért a publikus oldal is **minimalista: a
videó a hős, alatta egyetlen gomb.** A gomb **visszahívást kér** (név, tel, email) → **neked
jön értesítés** → 24 órán belül hívsz → **telefonon zársz** (grand slam / kockázat-megfordítás).
A rendszer pontosan ezt a folyamatot szolgálja ki.

**Üzleti cél / stratégia:** próba (kis súrlódás, ezt adja el a VSL) → bizonyíték az ő
közönségükön → **retainer (300–400k/hó)**. A mérés két okból kritikus:
- **Prioritás:** aki megnézte / kattintott = "hot" → azt hívod előbb.
- **Iteráció:** a **drop-off görbe** megmutatja, hol esik ki a néző → gyorsabb
  *diagnózis→script* átfutás (ez a valódi kézi szűk keresztmetszet, lásd `docs/VSL.md`).

**Hol illeszkedik:** `dekanybalint.com` admin → **cégre szabott landing** (a videó + egy gomb).
A link az email-válaszba megy. Az oldal maga is a személyre szabottság bizonyítéka.

## B. MIT építünk — a vezérgondolat

**Egy prospekt = egy nézet.** A `Lead` (audit + firecrawl-adat, amit már tárolunk) + a VSL-
oldala + a videó-nézési adatai + a beérkező email-válaszai + a visszahívási kérése **mind
ugyanazon a kártyán** fut össze. Az admin így nem három külön eszköz, hanem **egy mini-CRM**:
megnyitod Art Hotelt, és látod, hogy a videó 80%-áig eljutott, kattintott, és válaszolt emailben.

Három komponens:
1. **Admin** — leadek/oldalak felvétele, statisztika, nézési/kattintási mérés.
2. **Publikus VSL-oldal** — hero: csak a videó + egy gomb → visszahívó form.
3. **Resend** — küldés + **fogadás** + email-inbox menüpont az oldalon.

---

## 0. Stack (a meglévőre építünk)
Next.js (App Router) + Prisma + Postgres + TypeScript — ugyanaz, mint a `14_inkognito_a`.
**Újrahasználjuk a `Lead` modellt**, nem duplikálunk. Email: Resend.
(Ha a `dekanyb_site` is Next.js, ott is ugyanez a séma portolható.)

## 1. Adatmodell (új Prisma modellek)

```prisma
// A kiküldött személyre szabott VSL-oldal (egy leadhez köthető)
model VslPage {
  id            String   @id @default(cuid())
  slug          String   @unique          // pl. "art-hotel-9f3k" (random token → nem kitalálható)
  leadId        String?  @unique
  lead          Lead?    @relation(fields: [leadId], references: [id])
  businessName  String                     // megjelenítéshez / og-tag
  contactName   String?
  videoUrl      String                     // Cloudflare Stream / Bunny / MP4
  videoDuration Int?                       // mp, a % számításhoz
  status        String   @default("draft") // draft | published | archived
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  visits        PageVisit[]
  events        TrackingEvent[]
  callbacks     CallbackRequest[]
}

// Egy látogatás (session-rollup — a gyors admin-statokhoz)
model PageVisit {
  id            String   @id @default(cuid())
  pageId        String
  page          VslPage  @relation(fields: [pageId], references: [id])
  visitorId     String                     // localStorage-ból, dedupe
  maxWatchPct   Int      @default(0)        // meddig jutott (0-100)
  watchSeconds  Int      @default(0)
  reachedEnd    Boolean  @default(false)
  clickedCta    Boolean  @default(false)
  submittedForm Boolean  @default(false)
  country       String?
  device        String?
  firstSeen     DateTime @default(now())
  lastSeen      DateTime @updatedAt
}

// Granuláris események (a drop-off görbéhez / heatmaphez)
model TrackingEvent {
  id        String   @id @default(cuid())
  pageId    String
  visitorId String
  type      String    // page_view | play | progress | pause | ended | cta_click | form_submit
  value     Int?      // progress %-nál a decilis
  createdAt DateTime  @default(now())
  page      VslPage   @relation(fields: [pageId], references: [id])
}

// Visszahívási kérés (a hero gomb formja)
model CallbackRequest {
  id        String   @id @default(cuid())
  pageId    String
  page      VslPage  @relation(fields: [pageId], references: [id])
  name      String
  phone     String
  email     String?
  status    String   @default("new")  // new | called | closed
  createdAt DateTime @default(now())
}

// Email (küldött + fogadott) — a "email menüpont" inboxhoz
model EmailMessage {
  id          String   @id @default(cuid())
  direction   String    // inbound | outbound
  leadId      String?                    // auto-párosítás a feladó címéből
  fromAddr    String
  toAddr      String
  subject     String?
  bodyText    String?  @db.Text
  bodyHtml    String?  @db.Text
  threadKey   String?                    // szálakba fűzéshez
  resendId    String?
  createdAt   DateTime @default(now())
}
```

## 2. Publikus VSL-oldal — `/v/[slug]`
- **Hero = a videó + EGY gomb, semmi más.** A videó a hős, az oldal levegős (lásd `docs/VSL.md`).
  Fekvő 16:9, mobilon full-screen-barát. (A benne lévő minta-hirdetés lehet álló — az a videó dolga.)
- **Lejátszás:** click-to-play, szép poszter-frame (a cég nevével) → tiszta `play` esemény.
  (Autoplay+hang böngészőben tiltott, ne erőltessük.)
- **Gomb → egyszerű modal form:** név, telefon, email. Submit → `CallbackRequest` + **azonnali
  értesítő email neked Resenden** → köszönő-képernyő. Ez a "nekem jön értesítés, 24 órán belül hívok" lánc.
- **Tracking (a lényeg, #1-hez):** kliens-szkript HTML5 `<video>` eseményekre:
  - `play/pause/ended` + `timeupdate` (throttle-ölve) → milestone-ok 10/25/50/75/90/100%-nál.
  - kilépéskor `navigator.sendBeacon` a végső állapottal (watchSeconds, maxWatchPct).
  - minden a saját `/api/track` végpontra → `TrackingEvent` + `PageVisit` rollup. **Az adat nálunk marad.**
- **Személyre szabás:** slug + `og:title/description` a cég nevére. Content-clutter nincs.

## 3. Admin — `/admin/vsl` (jelszóval védve!)
Éles domainen lesz → **kötelező auth** (első körben egyszerű jelszavas middleware env-ből; NextAuth később).

- **Lista nézet:** minden VSL-oldal egy sorban a funnel-státusszal: *kiküldve → megnyitotta →
  elindította → 50% → CTA-ig → kattintott → formot küldött*. Utolsó aktivitás, "hot" jelölés.
- **Létrehozás:** válassz `Lead`-et (vagy kézzel), cégnév/kontakt, videó-URL, generált slug, publish.
- **Prospekt-részlet (mini-CRM kártya):** a lead audit-adatai + nézési idővonal (meddig, hányszor,
  mikor) + kattintások + visszahívási kérés + **a beérkező email-válaszai** — egy helyen.
- **Dashboard + extrák:**
  - **Drop-off görbe / heatmap** videónként (hol unják el a VSL-t → input a következő scripthez).
  - **Funnel-konverziók** összesítve (megnyitás% / átlag nézési% / CTA% / form%).
  - **"Hot lead" riasztás:** ≥X% nézés vagy form-submit → azonnali email neked (+ badge).

## 4. Resend — küldés + fogadás + inbox (#3)
- **Küldés:** Resend API a kimenő emailekhez (VSL-link, "tartó" üzenet, riasztások). Sablonokkal.
- **Event-tracking:** Resend webhook → `delivered/opened/clicked/bounced` → ebből a
  "megnyitotta-e az emailt" metrika (a videó-nézés meg on-page).
- **Fogadás (inbound):** ⚠️ **verifikálni kell** — a Resend elsősorban kimenő. Ha van élő
  **Resend Inbound**, arra kötünk egy `/api/webhooks/resend-inbound` végpontot → `EmailMessage`.
  Ha nincs: **Cloudflare Email Routing (ingyenes) catch-all → webhook**, vagy Postmark inbound.
- **Email menüpont (inbox):** `/admin/inbox` — szálak, olvasás, **válasz (Resenden megy ki)**.
  A húzós rész: **a beérkező levelet a feladó címe alapján automatikusan a `Lead`-hez párosítjuk**
  → a válasz megjelenik a prospekt kártyáján is. Videó-engagement + email egy fonálon.

## 5. Videó-hosting (döntést igényel)
- **Ajánlott:** **Cloudflare Stream** / **Bunny Stream** — olcsó, adaptív, gyors CDN; a nézési
  analitikát **a saját `/api/track`-kel mérjük**, így nem függünk a platform statjaitól.
- **Alternatíva:** **Mux** — drágább, de beépített nézési analitika (kevesebb saját kód).
- **Legkisebb:** statikus MP4 — pár leadre oké, de nincs adaptív minőség.
- **Javaslat:** Cloudflare Stream + saját tracking.

## 6. Végrehajtási sorrend
1. **Prisma migráció** (a fenti modellek).
2. **Publikus `/v/[slug]`** hero + videó + gomb + form + `/api/track` + `/api/callback`
   (legkorábbi éles érték — tudsz linket küldeni).
3. **Admin** lista + létrehozás + prospekt-részlet + alap statok.
4. **Resend kimenő** + form-értesítő + esemény-webhook.
5. **Inbox** (inbound webhook + `/admin/inbox` + lead-párosítás).
6. **Dashboard heatmap / funnel.**

## 7. Nyitott döntések
- Videó-host: **Cloudflare Stream** (ajánlott) / Mux / MP4?
- Admin-auth: egyszerű jelszó env-ből most, NextAuth később — jó?
- Ez a **`14_inkognito_a`-ban** épül, vagy rögtön a **`dekanyb_site`-ban**? (Séma bárhol ugyanez.)
- Resend Inbound elérhető a fiókban, vagy Cloudflare Email Routing legyen a fogadás?
- Publikus domain: `dekanybalint.com/v/...`?
