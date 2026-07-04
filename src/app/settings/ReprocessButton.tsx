"use client";

// Globális újra-feldolgozás (UX v4): miután átírtad a közös törzset vagy hangoltunk a prompton,
// ezzel frissíted az összes nem-küldött draftet. A jóváhagyott/kézi szerkesztett munkát nem bántja.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

type Summary = {
  considered: number;
  reanalyzed: number;
  regenerated: number;
  keptEdited: number;
  failed: number;
};

export default function ReprocessButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg("Frissítés fut… (elemzés + icebreaker, eltarthat pár percig)");
    const r = await apiCall<{ summary: Summary }>("/api/reprocess", {
      body: { limit: 100 },
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(`Hiba: ${r.error}`);
      return;
    }
    const s = r.summary;
    setMsg(
      `Kész: ${s.regenerated} icebreaker újraírva` +
        (s.keptEdited > 0 ? `, ${s.keptEdited} kézi szerkesztés megőrizve` : "") +
        (s.failed > 0 ? `, ${s.failed} kihagyva (nincs email)` : "") +
        ".",
    );
    router.refresh();
  }

  return (
    <div>
      <Button variant="ghost" disabled={busy} onClick={run}>
        {busy ? "Frissítés…" : "↻ Draftek frissítése az új törzzsel/prompttal"}
      </Button>
      <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>
        A jóváhagyott és a kézzel szerkesztett üzeneteket nem bántja. Gemini-kreditbe kerül.
      </div>
      {msg && <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
