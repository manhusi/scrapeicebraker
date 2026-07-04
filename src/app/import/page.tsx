"use client";

// Behozás (1. állomás): CSV fel → összegző → feldolgozás EGY kattintással (Bálint döntése:
// a pénzköltő lépés nem automatikus, de nem is kell érte máshova menni).

import { useState } from "react";
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
  analyzeFailed: number;
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState<ProcessSummary | null>(null);

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
      body: { limit: 50 },
    });
    setProcessing(false);
    if (!r.ok) setError(`Hiba a feldolgozásnál: ${r.error}`);
    else setProcessed(r.summary);
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

      <form onSubmit={handleSubmit} className="card">
        <label style={{ display: "block", marginBottom: 16 }}>
          <span className="field-label">Kulcsszó (melyik keresésből jött a lista)</span>
          <input
            type="text"
            className="input"
            style={{ width: "100%" }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="pl. szauna, tábor, edzőterem…"
          />
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
