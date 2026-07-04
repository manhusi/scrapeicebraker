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
  // Opcionális hang-útmutató a MyProfile-ból (admin-szerkeszthető); ha nincs, a beépített érvényes.
  voiceOverride?: string | null;
};

const DEFAULT_VOICE = `Tegeződsz. Rövid, emberi mondatok, mintha egy ismerősödnek írnál. Nulla korporát duma, nulla nyomulás, nulla túlzás.`;

export function buildIcebreakerPrompt(input: IcebreakerInput): string {
  const signalList = input.signals.map((s) => `- ${s}`).join("\n");

  return `Egy magyar kisvállalkozásnak írt cold email EGYETLEN NYITÓ MONDATÁT írod (icebreaker) és egy tárgysort. Az email ajánlata KÜLÖN, fix törzsben van — te AZZAL NEM foglalkozol. A te dolgod egyetlen dolog: egy őszinte, konkrét megfigyelés a cégükről, ami bebizonyítja, hogy tényleg megnézted őket. Semmi eladás, semmi ajánlat, semmi átvezetés — azt a törzs viszi.

HANG: ${input.voiceOverride?.trim() || DEFAULT_VOICE}

A CÉG, AKINEK ÍRSZ:
Név: ${input.businessName}
FB kategória: ${input.category ?? "(nincs)"}
FB bio: ${input.intro ?? "(nincs)"}
Mivel foglalkoznak: ${input.summary ?? "(nincs)"}
KONKRÉT JELEK a weboldalukról (CSAK ezekre hivatkozhatsz tényként):
${signalList}

KÉT TESZT, amin a mondatodnak át kell mennie:
- Ha változtatás nélkül elmenne egy másik hasonló cégnek is → ROSSZ, írd újra.
- Ha egy unott gyakornok meg tudná írni pusztán a cég nevéből → ROSSZ, írd újra.

ICEBREAKER SZABÁLYOK:
1. 1-2 rövid mondat, gyakran EGY a legjobb. Max ~30 szó.
2. A LEGJELLEMZŐBB, legspecifikusabb részletet válaszd a fenti jelekből/bióból — ami megkülönbözteti őket minden más hasonló cégtől: nevesített egység, szokatlan feature, konkrét szám, egy saját mondatuk. KERÜLD a niche-generikust (wifi, szauna, dézsa, "szép környezet", "kikapcsolódás"), amit minden konkurens is mondhat — kivéve ha van rajta egyedi csavar.
3. Csak tény a jelekből/bióból. Semmi kitaláció. Ha kevés az adat, a legkonkrétabb elérhető dolgot mondd EGY sima mondatban — SOHA ne told ki generikus dicsérettel.
4. TISZTA MEGFIGYELÉS, NULLA sales. TILOS: ajánlat, kérdés, bármilyen bridge egy problémára/fájdalomra, "gondolom nálatok is…", és bármi a hirdetésről / marketingről / eredményről / foglalási adminról. Azt MIND a törzs viszi, nem te.
5. Emberi, meleg, de nem nyálas. Egy őszinte reakció OK, ha KONKRÉT dologra szól ("ezt az üvegfalat eltaláltátok"). TILOS a generikus bók: "szuper", "lenyűgöző", "fantasztikus", "gyönyörű oldal", bók-halmozás.
6. NYITÁS: legtöbbször kezdj KÖZVETLENÜL a konkrétummal, felvezető nélkül (pl. "A panorámás üvegfalatok tényleg eltalált." / "Nálatok a dézsa elektromosan is fűthető, ez ügyes."). A "Megakadt a szemem…" / "Feltűnt, hogy…" / "Nézegettem az oldalatokat…" típusú felvezetőt CSAK RITKÁN használd — sose alapértelmezésként. Cél: ha egymás mellé tennénk 10 leveledet, ne ugyanazzal a szóval induljanak.
7. Tilos: "nem X, hanem Y"; gondolatjel-lánc; kérdéssel kezdés; "remélem jól vagy" töltelék; felkiáltójel-halom.

TÁRGYSOR SZABÁLYOK: 2-5 szó, kisbetűs, a megfigyeléshez kötve (pl. "a kék kabin", "a jurta az erdőben"). Nem salesy, nincs benne "ajánlat" vagy "lehetőség".

Ne köszönj (a "Szia!" fix). Csak a megfigyelés-mondatot add, semmi mást.`;
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
