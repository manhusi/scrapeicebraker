import type { LeadStatus } from "@prisma/client";

// A pipeline megjelenítésének EGY forrás-igazsága (CONSTITUTION 8.): címke, szín, sorrend.
// A stepper, a badge-ek és a lista mind ebből dolgozik.

export type StatusMeta = { label: string; color: string };

// A címkék a FELHASZNÁLÓ munkáját beszélik, nem a gép belsejét ("Átnézésre vár", nem "DRAFTED").
export const STATUS_META: Record<LeadStatus, StatusMeta> = {
  IMPORTED: { label: "Új", color: "#9aa1ab" },
  SCRAPED: { label: "Beolvasva", color: "#3fb950" },
  SCRAPE_FAILED: { label: "Nem olvasható", color: "#f85149" },
  ANALYZED: { label: "Elemezve", color: "#58a6ff" },
  ANALYZE_FAILED: { label: "Elemzés hiba", color: "#f85149" },
  DISQUALIFIED: { label: "Nem célpont", color: "#6e7681" },
  DRAFTED: { label: "Átnézésre vár", color: "#d29922" },
  APPROVED: { label: "Jóváhagyva", color: "#8957e5" },
  EXPORTED: { label: "Exportálva", color: "#2ea043" },
};

// A boldog út lépései sorrendben (a stepper ezt mutatja).
export const MAIN_FLOW: LeadStatus[] = [
  "IMPORTED",
  "SCRAPED",
  "ANALYZED",
  "DRAFTED",
  "APPROVED",
  "EXPORTED",
];

// Mellék-állapotok (hibák) — külön, figyelmeztető jelöléssel.
export const FAILED_STATES: LeadStatus[] = ["SCRAPE_FAILED", "ANALYZE_FAILED"];

// Kizárt: elemezve, de nem célpont (pl. már online foglal) — se nem boldog-út, se nem hiba.
export const EXCLUDED_STATES: LeadStatus[] = ["DISQUALIFIED"];

export const ALL_STATUSES: LeadStatus[] = [
  ...MAIN_FLOW,
  ...EXCLUDED_STATES,
  ...FAILED_STATES,
];

export function isLeadStatus(v: string): v is LeadStatus {
  return (ALL_STATUSES as string[]).includes(v);
}
