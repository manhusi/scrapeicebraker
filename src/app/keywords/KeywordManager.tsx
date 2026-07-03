"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type KeywordRow = {
  id: string;
  term: string;
  notes: string | null;
  status: "PLANNED" | "IMPORTED" | "ARCHIVED";
  leadCount: number;
  batchCount: number;
};

const box: React.CSSProperties = {
  background: "#141821",
  border: "1px solid #222835",
  borderRadius: 12,
  padding: 20,
};

const STATUS_COLOR: Record<KeywordRow["status"], string> = {
  PLANNED: "#9aa1ab",
  IMPORTED: "#3fb950",
  ARCHIVED: "#6e7681",
};

export default function KeywordManager({ initial }: { initial: KeywordRow[] }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "hiba");
      else {
        setTerm("");
        setNotes("");
        router.refresh();
      }
    } catch {
      setError("hálózati hiba");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, status: KeywordRow["status"]) {
    setBusy(true);
    try {
      await fetch(`/api/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={addKeyword} style={{ ...box, marginTop: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="új kulcsszó (pl. fogorvos)"
            style={{
              flex: "1 1 200px",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #2a3040",
              background: "#0e1117",
              color: "#e6e8ec",
            }}
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="jegyzet (opcionális)"
            style={{
              flex: "1 1 200px",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #2a3040",
              background: "#0e1117",
              color: "#e6e8ec",
            }}
          />
          <button
            type="submit"
            disabled={busy || !term.trim()}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: busy || !term.trim() ? "#2a3040" : "#3b6cff",
              color: "#fff",
              fontWeight: 600,
              cursor: busy || !term.trim() ? "not-allowed" : "pointer",
            }}
          >
            Hozzáadás
          </button>
        </div>
        {error && (
          <div style={{ color: "#f85149", marginTop: 10 }}>{error}</div>
        )}
      </form>

      <div style={{ ...box, marginTop: 16 }}>
        {initial.length === 0 ? (
          <p style={{ color: "#9aa1ab" }}>
            Még nincs kulcsszó. Vegyél fel egyet fent, vagy importálj egy CSV-t
            kulcsszóval.
          </p>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ color: "#9aa1ab", textAlign: "left" }}>
                <th style={{ padding: "6px 8px" }}>Kulcsszó</th>
                <th style={{ padding: "6px 8px" }}>Státusz</th>
                <th style={{ padding: "6px 8px" }}>Leadek</th>
                <th style={{ padding: "6px 8px" }}>Importok</th>
                <th style={{ padding: "6px 8px" }}>Jegyzet</th>
                <th style={{ padding: "6px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {initial.map((k) => (
                <tr key={k.id} style={{ borderTop: "1px solid #1c2230" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>
                    {k.term}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span style={{ color: STATUS_COLOR[k.status] }}>
                      ● {k.status}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px" }}>{k.leadCount}</td>
                  <td style={{ padding: "6px 8px", color: "#9aa1ab" }}>
                    {k.batchCount}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#9aa1ab" }}>
                    {k.notes ?? "—"}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>
                    {k.status === "ARCHIVED" ? (
                      <button
                        onClick={() => changeStatus(k.id, "PLANNED")}
                        disabled={busy}
                        style={ghostBtn}
                      >
                        Visszaállít
                      </button>
                    ) : (
                      <button
                        onClick={() => changeStatus(k.id, "ARCHIVED")}
                        disabled={busy}
                        style={ghostBtn}
                      >
                        Archivál
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: 6,
  border: "1px solid #2a3040",
  background: "transparent",
  color: "#9aa1ab",
  cursor: "pointer",
  fontSize: 12,
};
