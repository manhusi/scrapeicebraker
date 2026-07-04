"use client";

// Kampány-adminisztráció (másodlagos felület): átnevezés, ajánlat-csere, archiválás.
// Munka itt NEM folyik — az a futószalagon és a review-ban van.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

type Props = {
  campaignId: string;
  name: string;
  archived: boolean;
  templateId: string | null;
  templates: { id: string; name: string }[];
};

export default function CampaignAdmin(p: Props) {
  const router = useRouter();
  const [name, setName] = useState(p.name);
  const [templateId, setTemplateId] = useState(p.templateId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: object, okMsg: string) {
    setBusy(true);
    setMsg(null);
    const r = await apiCall(`/api/campaigns/${p.campaignId}`, {
      method: "PATCH",
      body,
    });
    setBusy(false);
    setMsg(r.ok ? okMsg : `Hiba: ${r.error}`);
    if (r.ok) router.refresh();
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: "1 1 220px" }}
        />
        <Button
          variant="ghost"
          disabled={busy || name.trim() === p.name || !name.trim()}
          onClick={() => patch({ name }, "Átnevezve.")}
        >
          Átnevezés
        </Button>

        <select
          className="select"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">— nincs ajánlat —</option>
          {p.templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          disabled={busy || templateId === (p.templateId ?? "")}
          onClick={() => patch({ offerTemplateId: templateId || null }, "Ajánlat beállítva.")}
        >
          Ajánlat mentése
        </Button>

        <Button
          variant="ghost"
          disabled={busy}
          onClick={() =>
            patch(
              { status: p.archived ? "DRAFT" : "ARCHIVED" },
              p.archived ? "Visszaállítva." : "Archiválva.",
            )
          }
        >
          {p.archived ? "Visszaállítás" : "Archiválás"}
        </Button>
      </div>
      {msg && <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
