"use client";

import { useState } from "react";
import Link from "next/link";

type ImportSummary = {
  batchId: string;
  totalRows: number;
  inserted: number;
  skippedErrorRows: number;
  skippedDuplicateInFile: number;
  skippedAlreadyExists: number;
};

const box: React.CSSProperties = {
  background: "#141821",
  border: "1px solid #222835",
  borderRadius: 12,
  padding: 20,
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setSummary(null);

    const form = new FormData();
    form.append("file", file);
    form.append("keyword", keyword);

    try {
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Ismeretlen hiba az importnál.");
      } else {
        setSummary(data.summary as ImportSummary);
      }
    } catch {
      setError("Hálózati hiba az import közben.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/" style={{ color: "#7aa2ff", textDecoration: "none" }}>
        ← Vissza
      </Link>
      <h1 style={{ fontSize: 26, marginTop: 16, marginBottom: 4 }}>
        Lead import
      </h1>
      <p style={{ color: "#9aa1ab", marginTop: 0 }}>
        Apify page-scraper CSV feltöltése. A duplikátumok (pageId) automatikusan
        kimaradnak.
      </p>

      <form onSubmit={handleSubmit} style={{ ...box, marginTop: 24 }}>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ marginBottom: 6, color: "#c7ccd4" }}>
            Kulcsszó (opcionális)
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="pl. szauna, tábor, edzőterem…"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #2a3040",
              background: "#0e1117",
              color: "#e6e8ec",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 20 }}>
          <div style={{ marginBottom: 6, color: "#c7ccd4" }}>CSV fájl</div>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ color: "#c7ccd4" }}
          />
        </label>

        <button
          type="submit"
          disabled={!file || loading}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: !file || loading ? "#2a3040" : "#3b6cff",
            color: "#fff",
            fontWeight: 600,
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Importálás…" : "Import indítása"}
        </button>
      </form>

      {error && (
        <div
          style={{
            ...box,
            marginTop: 20,
            borderColor: "#5a2530",
            color: "#f85149",
          }}
        >
          {error}
        </div>
      )}

      {summary && (
        <div style={{ ...box, marginTop: 20 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Import kész ✅</h2>
          <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>
              <strong style={{ color: "#3fb950" }}>{summary.inserted}</strong> új
              lead beszúrva
            </li>
            <li>{summary.totalRows} hasznos sor a fájlban</li>
            <li>{summary.skippedAlreadyExists} kihagyva (már a DB-ben)</li>
            <li>{summary.skippedDuplicateInFile} kihagyva (fájlon belüli dupla)</li>
            <li>{summary.skippedErrorRows} kihagyva (üres/hibás sor)</li>
          </ul>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 16,
              color: "#7aa2ff",
              textDecoration: "none",
            }}
          >
            → Leadek megtekintése
          </Link>
        </div>
      )}
    </main>
  );
}
