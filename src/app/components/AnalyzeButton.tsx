"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  processed: number;
  analyzed: number;
  failed: number;
  skipped: number;
};

export default function AnalyzeButton({ pending }: { pending: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      } else {
        const s = data.summary as Summary;
        setMsg(`Kész: ${s.analyzed} elemezve, ${s.failed} hibás.`);
        router.refresh();
      }
    } catch {
      setMsg("Hálózati hiba az analízis közben.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={handleAnalyze}
        disabled={loading || pending === 0}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          border: "none",
          background: loading || pending === 0 ? "#2a3040" : "#238636",
          color: "#fff",
          fontWeight: 600,
          cursor: loading || pending === 0 ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "Analízis folyamatban…" : `Analízis + szegmentálás (${pending})`}
      </button>
      {msg && <span style={{ color: "#9aa1ab", fontSize: 13 }}>{msg}</span>}
    </div>
  );
}
