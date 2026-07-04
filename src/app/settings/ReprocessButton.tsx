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
    const BATCH = 20;
    let skip = 0;
    let regenerated = 0;
    let keptEdited = 0;
    let failed = 0;
    try {
      // Offset-lapozás: a reprocess nem üríti a poolt, ezért skip-pel haladunk végig.
      for (let i = 0; i < 200; i++) {
        setMsg(`Frissítés fut… ${regenerated} újraírva…`);
        const r = await apiCall<{ summary: Summary }>("/api/reprocess", {
          body: { limit: BATCH, skip },
        });
        if (!r.ok) {
          setMsg(`Hiba: ${r.error} (${regenerated} kész)`);
          return;
        }
        const s = r.summary;
        regenerated += s.regenerated;
        keptEdited += s.keptEdited;
        failed += s.failed;
        skip += s.considered;
        if (s.considered < BATCH) break; // utolsó lap
      }
      setMsg(
        `Kész: ${regenerated} icebreaker újraírva` +
          (keptEdited > 0 ? `, ${keptEdited} kézi szerkesztés megőrizve` : "") +
          (failed > 0 ? `, ${failed} kihagyva (nincs email)` : "") +
          ".",
      );
    } finally {
      setBusy(false);
      router.refresh();
    }
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
