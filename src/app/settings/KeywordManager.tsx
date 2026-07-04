"use client";

// Kulcsszó-gyűjtő: a Meta Ads keresési terv. Kulcsszó ≠ szegmens (DOMAIN.md).

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

export type KeywordRow = {
  id: string;
  term: string;
  notes: string | null;
  status: "PLANNED" | "IMPORTED" | "ARCHIVED";
  leadCount: number;
};

const STATUS_LABEL: Record<KeywordRow["status"], string> = {
  PLANNED: "tervezett",
  IMPORTED: "van lead",
  ARCHIVED: "archivált",
};

export default function KeywordManager({ initial }: { initial: KeywordRow[] }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setBusy(true);
    setError(null);
    const r = await apiCall("/api/keywords", { body: { term, notes } });
    setBusy(false);
    if (!r.ok) setError(r.error);
    else {
      setTerm("");
      setNotes("");
      router.refresh();
    }
  }

  async function setStatus(id: string, status: KeywordRow["status"]) {
    setBusy(true);
    await apiCall(`/api/keywords/${id}`, { method: "PATCH", body: { status } });
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          className="input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="új kulcsszó (pl. fogorvos)"
          style={{ flex: "1 1 180px" }}
        />
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="jegyzet (opcionális)"
          style={{ flex: "1 1 180px" }}
        />
        <Button type="submit" variant="primary" disabled={busy || !term.trim()}>
          Felvétel
        </Button>
      </form>
      {error && <div style={{ color: "var(--danger)", marginBottom: 10, fontSize: 13 }}>{error}</div>}

      {initial.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Még nincs kulcsszó. Vedd fel, mire fogsz keresni az Apify-ban.
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Kulcsszó</th>
              <th>Állapot</th>
              <th>Leadek</th>
              <th>Jegyzet</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((k) => (
              <tr key={k.id}>
                <td style={{ fontWeight: 600 }}>{k.term}</td>
                <td className="muted">{STATUS_LABEL[k.status]}</td>
                <td>{k.leadCount}</td>
                <td className="muted">{k.notes ?? "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      setStatus(k.id, k.status === "ARCHIVED" ? "PLANNED" : "ARCHIVED")
                    }
                  >
                    {k.status === "ARCHIVED" ? "Visszaállít" : "Archivál"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
