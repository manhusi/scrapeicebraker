"use client";

// Közös ajánlat-törzs szerkesztő (Fázis 11 — egységes horog). EGY törzs, ez megy mindenkinek
// az icebreaker után. Nincs lista, nincs szegmens, nincs aktiválás-kapcsoló: amit itt mentesz,
// az az élő törzs. Mentés után a lenti gombbal frissítheted a még nem küldött drafteket.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

export default function CommonOfferEditor({ initialBody }: { initialBody: string }) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dirty = body !== savedBody;

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await apiCall<{ id: string }>("/api/offers/common", {
      method: "PUT",
      body: { body },
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(`Hiba: ${r.error}`);
      return;
    }
    setSavedBody(body);
    setMsg("Mentve. A lenti gombbal frissítheted a drafteket.");
    router.refresh();
  }

  return (
    <div>
      <textarea
        className="textarea"
        rows={12}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="A közös törzs — ez megy az icebreaker után, mindenkinek."
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
        <Button variant="primary" disabled={busy || !dirty || !body.trim()} onClick={save}>
          {busy ? "Mentés…" : "Mentés"}
        </Button>
        {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}
