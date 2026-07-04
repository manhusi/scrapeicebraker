import { parse } from "csv-parse/sync";

// A page-scraper CSV → Lead mező-mapping EGY helyen (forrás-igazság, CONSTITUTION 8.).
// A mapping a docs/DOMAIN.md-ben dokumentált, valós oszlopnevekhez van kötve.
// Kibővítve: kis- és nagybetű független és snake_case toleráns kulcs-normalizálással.

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

type NormalizedRow = Record<string, string | null>;

// Trimmelt értékek lekérése több lehetséges kulcs-változat alapján.
function val(row: NormalizedRow, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null) {
      const t = v.trim();
      if (t.length > 0) return t;
    }
  }
  return null;
}

// followers: csak a számjegyeket tartjuk meg (pl. "1 234" → 1234).
function toInt(row: NormalizedRow, keys: string[]): number | null {
  const raw = val(row, keys);
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

function mapRow(row: NormalizedRow): LeadInput {
  return {
    // businessName: title (olvasható név), fallback pageName/name
    businessName: val(row, ["title", "pagename", "name"]) ?? "",
    pageHandle: val(row, ["pagename", "name"]),
    pageId: val(row, ["pageid", "id"]),
    email: val(row, ["email", "emails0", "emailaddress"]),
    // website fallback websites/0, websiteUrl
    websiteUrl: val(row, ["website", "websites0", "websiteurl"]),
    // fbUrl fallback pageUrl, fbUrl
    fbUrl: val(row, ["facebookurl", "pageurl", "fburl"]),
    category: val(row, ["category", "categories0", "pagecategory"]),
    intro: val(row, ["intro", "bio", "description", "about"]),
    followers: toInt(row, ["followers", "followercount", "likes", "pagelikes"]),
    phone: val(row, ["phone", "phonenumber", "telephone"]),
    address: val(row, ["address", "location", "city"]),
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
  }) as Record<string, string | undefined>[];

  const leads: LeadInput[] = [];
  let skippedRows = 0;

  for (const record of records) {
    // Normalizáljuk a kulcsokat (kisbetű, írásjelek nélkül pl. facebook_url -> facebookurl)
    const normalizedRow: NormalizedRow = {};
    for (const [key, value] of Object.entries(record)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      normalizedRow[normKey] = value !== undefined && value !== null ? String(value) : null;
    }

    const lead = mapRow(normalizedRow);
    if (!lead.businessName) {
      skippedRows++; // nincs név → error/üres sor
      continue;
    }
    leads.push(lead);
  }

  return { leads, skippedRows };
}
