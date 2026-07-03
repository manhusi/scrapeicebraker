"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateOpt = { id: string; name: string; segmentKey: string };

export default function CampaignCreate({
  templates,
}: {
  templates: TemplateOpt[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, offerTemplateId: templateId || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "hiba");
      else {
        setName("");
        setTemplateId("");
        router.push(`/campaigns/${data.campaign.id}`);
      }
    } catch {
      setError("hálózati hiba");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={create}
      style={{
        background: "#141821",
        border: "1px solid #222835",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="új kampány neve"
          style={{
            flex: "1 1 220px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2a3040",
            background: "#0e1117",
            color: "#e6e8ec",
          }}
        />
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2a3040",
            background: "#0e1117",
            color: "#e6e8ec",
          }}
        >
          <option value="">— ajánlat-sablon (később is választható) —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.segmentKey} · {t.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: busy || !name.trim() ? "#2a3040" : "#3b6cff",
            color: "#fff",
            fontWeight: 600,
            cursor: busy || !name.trim() ? "not-allowed" : "pointer",
          }}
        >
          Létrehozás
        </button>
      </div>
      {error && <div style={{ color: "#f85149", marginTop: 10 }}>{error}</div>}
    </form>
  );
}
