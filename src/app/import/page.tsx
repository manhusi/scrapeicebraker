"use client";

// Behozás (1. állomás): CSV fel → összegző → feldolgozás EGY kattintással.
// Új: Meta Ads CSV előkészítő (preprocessor) kliens-oldalon.

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

type ImportSummary = {
  totalRows: number;
  inserted: number;
  skippedErrorRows: number;
  skippedDuplicateInFile: number;
  skippedAlreadyExists: number;
};

type ProcessSummary = {
  scraped: number;
  scrapeFailed: number;
  analyzed: number;
  disqualified: number;
  analyzeFailed: number;
};

// --- HELPEREK A META ADS CSV ELŐKÉSZÍTŐHÖZ ---

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

function parseCsvLines(text: string, sep: string = ","): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = "";

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          entry += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        entry += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === sep) {
        row.push(entry);
        entry = "";
      } else if (c === '\n' || c === '\r') {
        row.push(entry);
        entry = "";
        if (row.some(cell => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        if (c === '\r' && next === '\n') {
          i++; // Skip \n
        }
      } else {
        entry += c;
      }
    }
  }
  if (entry || row.length > 0) {
    row.push(entry);
    lines.push(row);
  }
  return lines;
}

function cleanFacebookUrl(url: string): string | null {
  const clean = url.trim();
  if (!clean) return null;
  if (!/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\//i.test(clean)) {
    return null;
  }

  const lower = clean.toLowerCase();
  if (
    lower.includes("/posts/") ||
    lower.includes("/permalink/") ||
    lower.includes("/groups/") ||
    lower.includes("/videos/") ||
    lower.includes("/photos/") ||
    lower.includes("/ads/") ||
    lower.includes("/sharer/")
  ) {
    return null;
  }

  try {
    const parsed = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("facebook.com") && !host.includes("fb.com")) return null;

    if (parsed.pathname === "/profile.php") {
      const id = parsed.searchParams.get("id");
      if (id) {
        return `https://www.facebook.com/profile.php?id=${id}`;
      }
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    
    if (parts[0] === "pages" && parts[2]) {
      return `https://www.facebook.com/pages/${parts[1]}/${parts[2]}`;
    }
    if (parts[0] === "people" && parts[1]) {
      return `https://www.facebook.com/people/${parts[1]}`;
    }

    const slug = parts[0];
    const blacklistedSlugs = ["home", "login", "campaign", "ads", "about", "services", "reviews", "photos"];
    if (blacklistedSlugs.includes(slug.toLowerCase())) return null;

    return `https://www.facebook.com/${slug}`;
  } catch {
    const match = clean.match(/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/([a-zA-Z0-9\._\-]+)/i);
    if (match && match[4]) {
      const slug = match[4];
      if (slug === "profile.php") {
        const idMatch = clean.match(/id=([0-9]+)/);
        if (idMatch) return `https://www.facebook.com/profile.php?id=${idMatch[1]}`;
        return null;
      }
      const blacklistedSlugs = ["home", "login", "campaign", "ads", "about", "services", "reviews", "photos"];
      if (blacklistedSlugs.includes(slug.toLowerCase())) return null;
      return `https://www.facebook.com/${slug}`;
    }
    return null;
  }
}

function constructFacebookUrl(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;

  if (/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\//i.test(clean)) {
    return cleanFacebookUrl(clean);
  }

  if (/^[0-9]+$/.test(clean)) {
    return `https://www.facebook.com/${clean}`;
  }

  if (/^[a-zA-Z0-9\._\-]+$/.test(clean)) {
    const blacklisted = ["home", "login", "campaign", "ads", "about", "services", "reviews", "photos"];
    if (blacklisted.includes(clean.toLowerCase())) return null;
    return `https://www.facebook.com/${clean}`;
  }

  return null;
}

function detectFacebookColumn(rows: string[][]): number {
  if (rows.length === 0) return -1;
  const header = rows[0];

  const targetHeaders = [
    "snapshot/page_profile_uri",
    "page_profile_uri",
    "page_id",
    "pageid",
    "snapshot/page_id",
    "page_id_snapshot"
  ];
  for (const target of targetHeaders) {
    const idx = header.findIndex(h => h.trim().toLowerCase() === target);
    if (idx !== -1) return idx;
  }

  const partialHeaders = [
    "page_profile_uri",
    "page_id",
    "pageid",
    "page_url",
    "pageurl",
    "facebook",
    "fb_page",
    "page_link"
  ];
  for (const partial of partialHeaders) {
    const idx = header.findIndex(h => h.trim().toLowerCase().includes(partial));
    if (idx !== -1) return idx;
  }

  const colScores = new Array(header.length).fill(0);
  const rowsToScan = rows.slice(1, Math.min(rows.length, 50));
  for (const r of rowsToScan) {
    for (let colIdx = 0; colIdx < r.length; colIdx++) {
      const val = r[colIdx];
      if (val && /facebook\.com|fb\.com/i.test(val)) {
        colScores[colIdx]++;
      }
    }
  }

  let maxScore = 0;
  let bestColIdx = -1;
  for (let i = 0; i < colScores.length; i++) {
    if (colScores[i] > maxScore) {
      maxScore = colScores[i];
      bestColIdx = i;
    }
  }

  if (maxScore > 0) return bestColIdx;

  return -1;
}

// --- FŐ OLDAL KOMPONENS ---

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState<ProcessSummary | null>(null);

  // Meta Ads CSV előkészítő állapotok
  const [adsFile, setAdsFile] = useState<File | null>(null);
  const [adsTotalCount, setAdsTotalCount] = useState<number | null>(null);
  const [adsUniqueUrls, setAdsUniqueUrls] = useState<string[]>([]);
  const [adsDetectedCol, setAdsDetectedCol] = useState<string | null>(null);
  const [adsParsing, setAdsParsing] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [adsCopied, setAdsCopied] = useState(false);
  const [adsExistingCount, setAdsExistingCount] = useState<number | null>(null);

  // Kulcsszavak legördülő állapotok
  const [keywordsList, setKeywordsList] = useState<{ id: string; term: string; status: string }[]>([]);
  const [isCustomKeyword, setIsCustomKeyword] = useState(false);

  useEffect(() => {
    async function loadKeywords() {
      try {
        const res = await fetch("/api/keywords");
        const data = await res.json();
        if (res.ok && data.ok) {
          const sorted = data.keywords.sort((a: any, b: any) => a.term.localeCompare(b.term, "hu"));
          setKeywordsList(sorted);
        }
      } catch (e) {
        console.error("Hiba a kulcsszavak lekérésekor:", e);
      }
    }
    loadKeywords();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setSummary(null);
    setProcessed(null);

    const form = new FormData();
    form.append("file", file);
    form.append("keyword", keyword);

    try {
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "Ismeretlen hiba az importnál.");
      else setSummary(data.summary as ImportSummary);
    } catch {
      setError("Hálózati hiba az import közben.");
    } finally {
      setBusy(false);
    }
  }

  async function runProcess() {
    setProcessing(true);
    setError(null);
    const r = await apiCall<{ summary: ProcessSummary }>("/api/process", {
      body: { limit: 100 },
    });
    setProcessing(false);
    if (!r.ok) setError(`Hiba a feldolgozásnál: ${r.error}`);
    else setProcessed(r.summary);
  }

  // Meta Ads fájl feldolgozása
  async function handleAdsFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAdsFile(file);
    if (!file) {
      setAdsUniqueUrls([]);
      setAdsTotalCount(null);
      setAdsDetectedCol(null);
      setAdsExistingCount(null);
      setAdsError(null);
      return;
    }

    setAdsParsing(true);
    setAdsError(null);
    setAdsCopied(false);
    setAdsExistingCount(null);

    try {
      const text = await file.text();
      const sep = detectSeparator(text);
      const rows = parseCsvLines(text, sep);
      if (rows.length < 2) {
        throw new Error("A CSV fájl üres vagy hiányzik belőle a fejléc.");
      }

      const colIdx = detectFacebookColumn(rows);
      if (colIdx === -1) {
        throw new Error(
          "Nem találtunk Facebook oldalt (vagy page_id-t) tartalmazó oszlopot a CSV-ben. Győződj meg róla, hogy a hirdetés-export tartalmazza a Facebook oldal azonosítóját."
        );
      }

      const headerName = rows[0][colIdx] || `#${colIdx + 1}`;
      setAdsDetectedCol(headerName);

      const uniqueSet = new Set<string>();
      for (let i = 1; i < rows.length; i++) {
        const val = rows[i][colIdx];
        if (val) {
          const cleaned = constructFacebookUrl(val);
          if (cleaned) {
            uniqueSet.add(cleaned);
          }
        }
      }

      const allUniqueUrls = Array.from(uniqueSet);
      setAdsTotalCount(rows.length - 1);

      if (allUniqueUrls.length === 0) {
        setAdsUniqueUrls([]);
        setAdsExistingCount(0);
        return;
      }

      // Ellenőrizzük a meglévőket az API-n keresztül
      const res = await fetch("/api/import/check-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: allUniqueUrls })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Hiba a meglévő leadek ellenőrzésekor.");
      }

      const existingUrlsSet = new Set<string>(data.existingUrls);
      const newUrls = allUniqueUrls.filter(url => !existingUrlsSet.has(url));

      setAdsUniqueUrls(newUrls.sort());
      setAdsExistingCount(existingUrlsSet.size);
    } catch (err) {
      setAdsError(err instanceof Error ? err.message : "Hiba történt a fájl feldolgozása közben.");
      setAdsUniqueUrls([]);
      setAdsTotalCount(null);
      setAdsDetectedCol(null);
      setAdsExistingCount(null);
    } finally {
      setAdsParsing(false);
    }
  }

  function copyToClipboard() {
    if (adsUniqueUrls.length === 0) return;
    navigator.clipboard.writeText(adsUniqueUrls.join("\n"));
    setAdsCopied(true);
    setTimeout(() => setAdsCopied(false), 2000);
  }

  function downloadTxtFile() {
    if (adsUniqueUrls.length === 0) return;
    const blob = new Blob([adsUniqueUrls.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apify_input_${adsFile ? adsFile.name.replace(/\.[^/.]+$/, "") : "fb_pages"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        ← Futószalag
      </Link>
      <h1 style={{ marginTop: 16 }}>Behozás</h1>
      <p className="page-lead">
        Apify CSV feltöltése. A duplikátumok automatikusan kimaradnak, semmi nem vész el.
      </p>

      {/* Meta Ads preprocessor szekció */}
      <section className="card" style={{ marginBottom: 24, borderTop: "2px solid var(--purple)" }}>
        <h2 style={{ fontSize: 17, marginTop: 0, color: "var(--purple)" }}>
          Meta Ads CSV előkészítő (Opcionális)
        </h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Húzd be ide a nyers Meta Ads keresési exportot. Kiszűrjük az egyedi Facebook oldalakat, 
          hogy közvetlenül be tudd őket másolni az Apify Facebook Page Scraperbe.
        </p>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="field-label" style={{ fontSize: 12, marginBottom: 6 }}>Nyers Meta Ads CSV feltöltése</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleAdsFileChange}
            style={{ color: "var(--text-dim)", fontSize: 13 }}
            disabled={adsParsing}
          />
        </label>

        {adsParsing && <div className="muted" style={{ fontSize: 13 }}>Fájl elemzése…</div>}

        {adsError && (
          <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>
            ⚠ {adsError}
          </div>
        )}

        {adsTotalCount !== null && (
          <div style={{ marginTop: 16 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
              Talált Facebook oszlop: <strong>{adsDetectedCol}</strong> · Összes sor: <strong>{adsTotalCount}</strong>
              <br />
              Adatbázisban már meglévő (kiszűrt): <strong style={{ color: "var(--warn)" }}>{adsExistingCount ?? 0}</strong> · Új letöltendő oldalak: <strong style={{ color: "var(--success)" }}>{adsUniqueUrls.length}</strong>
            </div>

            {adsUniqueUrls.length > 0 ? (
              <>
                <textarea
                  className="textarea"
                  style={{
                    width: "100%",
                    height: "150px",
                    fontFamily: "monospace",
                    fontSize: 12,
                    backgroundColor: "var(--bg-inset)",
                    color: "var(--text-dim)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px",
                    marginBottom: "12px",
                  }}
                  readOnly
                  value={adsUniqueUrls.join("\n")}
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="purple" onClick={copyToClipboard}>
                    {adsCopied ? "✓ Másolva!" : "Másolás vágólapra"}
                  </Button>
                  <Button variant="ghost" onClick={downloadTxtFile}>
                    Letöltés .txt-ként
                  </Button>
                </div>
              </>
            ) : (
              <div className="card" style={{ backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent-text)", fontSize: 13, marginTop: 12 }}>
                ✓ Szuper! Az összes kinyert Facebook oldal szerepel már az adatbázisodban. Nem kell semmit lekaparnod az Apify-on!
              </div>
            )}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="card">
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Végleges Apify import</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>
          Amikor megvan az Apify Facebook Page Scraper export CSV fájl, töltsd fel itt.
        </p>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span className="field-label">Kulcsszó (melyik keresésből jött a lista)</span>
          <select
            className="select"
            style={{ width: "100%", marginBottom: isCustomKeyword ? 10 : 0 }}
            value={isCustomKeyword ? "custom" : keyword}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") {
                setIsCustomKeyword(true);
                setKeyword("");
              } else {
                setIsCustomKeyword(false);
                setKeyword(val);
              }
            }}
          >
            <option value="">— válassz a kulcsszavak közül —</option>
            {keywordsList.map((k) => (
              <option key={k.id} value={k.term}>
                {k.term} ({k.status === "PLANNED" ? "tervezett" : "behozott"})
              </option>
            ))}
            <option value="custom">➔ Új kulcsszó megadása…</option>
          </select>

          {isCustomKeyword && (
            <input
              type="text"
              className="input"
              style={{ width: "100%", marginTop: 8 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Írd be az új kulcsszót (pl. szauna, tábor…)"
              required
            />
          )}
        </label>

        <label style={{ display: "block", marginBottom: 20 }}>
          <span className="field-label">CSV fájl</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ color: "var(--text-dim)" }}
          />
        </label>

        <Button type="submit" variant="primary" disabled={!file || busy}>
          {busy ? "Importálás…" : "Import indítása"}
        </Button>
      </form>

      {error && (
        <div className="card" style={{ marginTop: 16, borderColor: "var(--danger-border)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {summary && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 17, marginTop: 0 }}>Import kész ✓</h2>
          <ul className="muted" style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>
              <strong style={{ color: "var(--success)" }}>{summary.inserted}</strong>{" "}
              új lead behozva
            </li>
            <li>{summary.skippedAlreadyExists} kihagyva (már bent volt)</li>
            <li>{summary.skippedDuplicateInFile} kihagyva (fájlon belüli dupla)</li>
            <li>{summary.skippedErrorRows} kihagyva (üres/hibás sor)</li>
          </ul>

          {/* A következő lépés helyben — nem kell keresgélni. */}
          {!processed && (
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" onClick={runProcess} disabled={processing}>
                {processing
                  ? "Feldolgozás fut… (1-2 perc)"
                  : "Feldolgozás indítása (beolvasás + elemzés)"}
              </Button>
            </div>
          )}
        </div>
      )}

      {processed && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 17, marginTop: 0 }}>Feldolgozás kész ✓</h2>
          <ul className="muted" style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>{processed.scraped} weboldal beolvasva</li>
            <li>{processed.analyzed} lead elemezve</li>
            {processed.disqualified > 0 && (
              <li>{processed.disqualified} nem célpont (már online foglal)</li>
            )}
            {processed.scrapeFailed + processed.analyzeFailed > 0 && (
              <li style={{ color: "var(--danger)" }}>
                {processed.scrapeFailed + processed.analyzeFailed} hiba — a futószalagon látod
              </li>
            )}
          </ul>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            → Futószalag (csoportosítás)
          </Link>
        </div>
      )}
    </main>
  );
}
