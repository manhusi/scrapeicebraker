"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  processed: number;
  drafted: number;
  failed: number;
  skipped: number;
};

export default function GenerateButton({ pending }: { pending: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      } else {
        const s = data.summary as Summary;
        setMsg(
          `Kész: ${s.drafted} draft, ${s.skipped} kihagyva (nincs sablon/email), ${s.failed} hibás.`,
        );
        router.refresh();
      }
    } catch {
      setMsg("Hálózati hiba a generálás közben.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={handleGenerate}
        disabled={loading || pending === 0}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          border: "none",
          background: loading || pending === 0 ? "#2a3040" : "#d29922",
          color: "#fff",
          fontWeight: 600,
          cursor: loading || pending === 0 ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "Generálás folyamatban…" : `Üzenet-draftok (${pending})`}
      </button>
      {msg && <span style={{ color: "#9aa1ab", fontSize: 13 }}>{msg}</span>}
    </div>
  );
}
