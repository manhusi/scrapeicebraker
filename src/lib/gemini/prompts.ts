// A Gemini promptok EGY helyen (CONSTITUTION 8., ARCHITECTURE: prompt-katalógus).
// A szegmensek DINAMIKUSAN a DB-ből jönnek, így admin-bővítésnél nem kell kódot írni.

export type PromptSegment = {
  key: string;
  name: string;
  description: string | null;
};

export type AnalysisInput = {
  businessName: string;
  category: string | null;
  markdown: string;
};

// A weboldal-tartalmat korlátozzuk, hogy olcsó és fókuszált maradjon.
const MAX_CONTENT_CHARS = 6000;

export function buildAnalysisPrompt(
  input: AnalysisInput,
  segments: PromptSegment[],
): string {
  const segmentList = segments
    .map((s) => `- ${s.key}: ${s.description ?? s.name}`)
    .join("\n");

  const content = input.markdown.slice(0, MAX_CONTENT_CHARS);

  return `Egy magyar B2B outreach rendszernek dolgozol. A feladatod egy céget besorolni EGYETLEN fájdalom-szegmensbe a weboldala alapján, tömören összefoglalni, mivel foglalkoznak, és megállapítani, HOGYAN kezelik a foglalást.

Fontos szabályok:
- Kizárólag a lenti listából választhatsz szegmenst. Ha egyik sem illik biztosan, válaszd az "unclear"-t.
- A "signals" a konkrét, a szövegből kiolvasott kapaszkodók (szolgáltatások, ajánlatok, fájdalompontok), amiket később egy személyre szabott nyitómondathoz használunk. Konkrét legyen, ne általános.
- HAGYD FIGYELMEN KÍVÜL a nem a céghez tartozó szöveget: cookie/süti-figyelmeztetés, "A böngésző tiltja a sütiket", Google Maps saját felülete ("Add your business", "Claim this business", "Suggest an edit"), navigációs menük, jogi lábléc. Ezek NEM jelek — ne csinálj belőlük fájdalompontot.
- "bookingMode": hogyan foglalnak a vendégek? Pontosan egy érték:
  - "online": van MŰKÖDŐ online foglalás — dátumválasztós ár-naptár, azonnali online fizetés/előleg, vagy harmadik feles foglalórendszer (szallas.hu, booking.com, szallasguru, nethotelbooking.net, hotels.hu, "Foglalás most" gomb ami tényleg foglaló-oldalra visz).
  - "manual": emailben/telefonon egyeztetnek, "kérje kollégáink segítségét", utalásos előleg kézzel, ajánlatkérő űrlap, nincs online naptár/fizetés.
  - "unknown": a tartalomból nem dönthető el.
  Ha csak egy "Foglalás" szó van, de nem látszik mögötte működő rendszer, az "unknown", NEM "online".
- Magyarul válaszolj, tényszerűen, túlzások nélkül.

CÉG: ${input.businessName}
FB KATEGÓRIA: ${input.category ?? "(nincs)"}

WEBOLDAL TARTALOM:
${content}

VÁLASZTHATÓ SZEGMENSEK:
${segmentList}`;
}

export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    segmentKey: { type: "string" },
    summary: { type: "string" },
    signals: { type: "array", items: { type: "string" } },
    bookingMode: { type: "string", enum: ["online", "manual", "unknown"] },
  },
  required: ["segmentKey", "summary", "signals", "bookingMode"],
} as const;

export type AnalysisOutput = {
  segmentKey: string;
  summary: string;
  signals: string[];
  bookingMode: "online" | "manual" | "unknown";
};

// ---------------------------------------------------------------------------
// Icebreaker — a szabályok forrás-igazsága: docs/ICEBREAKER.md. Ott változtass először.
// ---------------------------------------------------------------------------

export type IcebreakerInput = {
  businessName: string;
  category: string | null;
  intro: string | null;
  summary: string | null;
  signals: string[];
  // A fix törzs első mondata — az icebreakernek úgy kell végződnie, hogy ez természetesen folytassa.
  bodyOpening: string;
  // Opcionális hang-útmutató a MyProfile-ból (admin-szerkeszthető); ha nincs, a beépített érvényes.
  voiceOverride?: string | null;
};

const DEFAULT_VOICE = `Tegeződsz. Rövid, emberi mondatok, mintha egy ismerősödnek írnál, aki vendégházat visz. Nulla korporát duma, nulla nyomulás, nulla túlzás.`;

export function buildIcebreakerPrompt(input: IcebreakerInput): string {
  const signalList = input.signals.map((s) => `- ${s}`).join("\n");

  return `Cold email NYITÓ SORAIT írod (icebreaker) és egy tárgysort egy magyar kisvállalkozásnak. Az email többi része fix sablon, ami így kezdődik: "${input.bodyOpening}" — a te szövegednek úgy kell végződnie, hogy ez a mondat természetesen folytassa.

HANG: ${input.voiceOverride?.trim() || DEFAULT_VOICE}

A CÉG, AKINEK ÍRSZ:
Név: ${input.businessName}
FB kategória: ${input.category ?? "(nincs)"}
FB bio: ${input.intro ?? "(nincs)"}
Mivel foglalkoznak: ${input.summary ?? "(nincs)"}
KONKRÉT JELEK a weboldalukról (CSAK ezekre hivatkozhatsz tényként):
${signalList}

ICEBREAKER SZABÁLYOK:
1. 1-3 rövid mondat, ennyi. Egy KONKRÉT megfigyeléssel indít a fenti jelekből (ház neve, előleg %, foglalási mód, ár, szolgáltatás). A teszt: ha a szöveged 10 másik cégnek is elmehetne, rossz.
2. TILOS bármit állítani, ami nincs a jelek között. Inkább kevesebbet mondj, mint kitalált dolgot. SEMMILYEN fájdalmat/hiányt ne tulajdoníts nekik, ami a jelekből nem olvasható ki tényként.
3. Ha van rá jel, a foglaláshoz/fizetéshez/adminhoz KÖTHETŐ részletet emelj ki (foglalási mód, előleg %, ár-megjelenítés, elérhetőség), mert a fix törzs ezt folytatja. Puszta vendég-extrát (jakuzzi, reggeli, SUP) csak akkor, ha nincs jobb — és akkor se aggass rá kézi-munka állítást.
4. Az átvezetés IGAZ és VÁLTOZATOS:
   - Ha a jelek közt VAN kézi folyamat (emailes/telefonos egyeztetés, utalásos előleg, "kérje kollégáink segítségét", ajánlatkérő űrlap, kézi számlázás): a megfigyelés MAGA ez legyen — így magától folytatja a törzset.
   - Ha NINCS ilyen jel: a megfigyelés önmagában is megállhat, VAGY egy könnyed, az adott konkrétumhoz kötött, más-más szóval megfogalmazott feltételezéssel zárj — SOSE tényként.
   - SZIGORÚAN TILOS a "foglalás körüli kézi kör" / "kézi munka" sablonmondat és bármely visszatérő záró fordulat. Ha a záró mondatod változtatás nélkül elmenne egy másik szállásnak is, írd újra.
5. NE használd és NE ismételd a törzs első sorát. Az icebreakered SOHA ne tartalmazza a(z) "${input.bodyOpening}" szöveget, és ne azzal végződjön — azt a rendszer teszi hozzá.
6. Megfigyelés, nem bók. "Lenyűgöző/fantasztikus/kiváló" és bók-halmozás tilos. Max egy fél-mondatnyi konkrét, visszafogott dicséret ("a bordó házatok nagyon eltalált"), ha természetes.
7. Tilos: "nem X, hanem Y" szerkezet; gondolatjel; kérdéssel kezdés; "remélem jól vagy" töltelék; felkiáltójel-halmozás.
8. NE kommentáld a saját megfigyelésed ("ez nagyon jó/konkrét/hasznos/okos" típusú üres mondat tilos). A megfigyelés önmagában áll, utána jön az átvezetés.
9. Ne mindig ugyanazzal a szóval kezdd. Variálj természetesen: "Feltűnt, hogy…", "Nézegettem az oldalatokat, és…", "Olvastam, hogy…", "Láttam, hogy…" — mintha tényleg más-más ember oldalát nézted volna végig aznap.

TÁRGYSOR SZABÁLYOK: 2-5 szó, kisbetűs, konkrét, a megfigyeléshez kötődik (pl. "kiemelt időszakok foglalása", "a bordó kabin"). Nem salesy, nem clickbait, nincs benne "ajánlat" vagy "lehetőség".

Ne köszönj (a "Szia!" fix). Csak az icebreaker szöveget add, a sablon-törzset NE ismételd.`;
}

export const ICEBREAKER_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    icebreaker: { type: "string" },
  },
  required: ["subject", "icebreaker"],
} as const;

export type IcebreakerOutput = {
  subject: string;
  icebreaker: string;
};
