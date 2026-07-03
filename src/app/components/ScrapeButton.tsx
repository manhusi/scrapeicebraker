"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  processed: number;
  scraped: number;
  failed: number;
  skippedCached: number;
  skippedNoUrl: number;
};

export default function ScrapeButton({ pending }: { pending: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleScrape() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/scrape", {
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
          `Kész: ${s.scraped} scrape-elve, ${s.failed} blokkolt/hibás, ${s.skippedCached} gyorsítótárból.`,
        );
        router.refresh(); // frissítsük a státuszokat
      }
    } catch {
      setMsg("Hálózati hiba a scrape közben.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={handleScrape}
        disabled={loading || pending === 0}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          border: "none",
          background: loading || pending === 0 ? "#2a3040" : "#8957e5",
          color: "#fff",
          fontWeight: 600,
          cursor: loading || pending === 0 ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {loading
          ? "Scrape folyamatban…"
          : `Weboldalak scrape-elése (${pending})`}
      </button>
      {msg && <span style={{ color: "#9aa1ab", fontSize: 13 }}>{msg}</span>}
    </div>
  );
}
