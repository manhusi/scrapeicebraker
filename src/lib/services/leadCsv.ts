import { parse } from "csv-parse/sync";

// A page-scraper CSV → Lead mező-mapping EGY helyen (forrás-igazság, CONSTITUTION 8.).
// A mapping a docs/DOMAIN.md-ben dokumentált, valós oszlopnevekhez van kötve.

export type LeadInput = {
  businessName: string;
  pageHandle: string | null;
  pageId: string | null;
  email: string | null;
  websiteUrl: string | null;
  fbUrl: string | null;
  category: string | null;
  intro: string | null;
  followers: number | null;
  phone: string | null;
  address: string | null;
};

export type ParseResult = {
  leads: LeadInput[];
  skippedRows: number; // üres / hibás sorok, amiknek nincs használható neve
};

type CsvRow = Record<string, string | undefined>;

// Trimmelt érték vagy null (üres stringből null lesz).
function val(row: CsvRow, key: string): string | null {
  const v = row[key];
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

// followers: csak a számjegyeket tartjuk meg (pl. "1 234" → 1234).
function toInt(row: CsvRow, key: string): number | null {
  const raw = val(row, key);
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function mapRow(row: CsvRow): LeadInput {
  return {
    // businessName: title (olvasható név), fallback pageName
    businessName: val(row, "title") ?? val(row, "pageName") ?? "",
    pageHandle: val(row, "pageName"),
    pageId: val(row, "pageId"),
    email: val(row, "email"),
    // website fallback websites/0
    websiteUrl: val(row, "website") ?? val(row, "websites/0"),
    fbUrl: val(row, "facebookUrl") ?? val(row, "pageUrl"),
    category: val(row, "category"),
    intro: val(row, "intro"),
    followers: toInt(row, "followers"),
    phone: val(row, "phone"),
    address: val(row, "address"),
  };
}

// CSV szöveg → mappelt leadek. A ~80 felesleges oszlopot eldobjuk.
// Név nélküli (üres/error) sorokat kihagyjuk, és megszámoljuk.
export function parseLeadCsv(csvText: string): ParseResult {
  const records = parse(csvText, {
    columns: true,
    bom: true, // az Apify export BOM-mal jön
    skip_empty_lines: true,
    relax_column_count: true, // eltérő oszlopszámú sorokat is elfogad
    trim: true,
  }) as CsvRow[];

  const leads: LeadInput[] = [];
  let skippedRows = 0;

  for (const row of records) {
    const lead = mapRow(row);
    if (!lead.businessName) {
      skippedRows++; // nincs név → error/üres sor
      continue;
    }
    leads.push(lead);
  }

  return { leads, skippedRows };
}
