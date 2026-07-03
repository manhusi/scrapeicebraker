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

  return `Egy magyar B2B outreach rendszernek dolgozol. A feladatod egy céget besorolni EGYETLEN fájdalom-szegmensbe a weboldala alapján, és tömören összefoglalni, mivel foglalkoznak.

Fontos szabályok:
- Kizárólag a lenti listából választhatsz szegmenst. Ha egyik sem illik biztosan, válaszd az "unclear"-t.
- A "signals" a konkrét, a szövegből kiolvasott kapaszkodók (szolgáltatások, ajánlatok, fájdalompontok), amiket később egy személyre szabott nyitómondathoz használunk. Konkrét legyen, ne általános.
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
  },
  required: ["segmentKey", "summary", "signals"],
} as const;

export type AnalysisOutput = {
  segmentKey: string;
  summary: string;
  signals: string[];
};
