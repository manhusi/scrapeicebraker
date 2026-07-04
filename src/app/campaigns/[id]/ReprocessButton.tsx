"use client";

// Újra-feldolgozás gomb (Fázis 9): a kampány nem-jóváhagyott leadjeit újraelemzi és az
// icebreakereket újraírja a jelenlegi logikával. Prompt-hangolás után ezzel frissíthető a kampány.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

type Summary = {
  considered: number;
  reanalyzed: number;
  disqualified: number;
  regenerated: number;
  keptEdited: number;
  failed: number;
};

export default function ReprocessButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg("Újra-feldolgozás fut… (elemzés + megírás, eltarthat pár percig)");
    const r = await apiCall<{ summary: Summary }>(
      `/api/campaigns/${campaignId}/reprocess`,
    );
    setBusy(false);
    if (!r.ok) {
      setMsg(`Hiba: ${r.error}`);
      return;
    }
    const s = r.summary;
    setMsg(
      `Kész: ${s.regenerated} icebreaker újraírva, ${s.disqualified} nem célpont lett` +
        (s.keptEdited > 0 ? `, ${s.keptEdited} kézzel szerkesztett megőrizve` : "") +
        (s.failed > 0 ? `, ${s.failed} hiba` : "") +
        ".",
    );
    router.refresh();
  }

  return (
    <div style={{ marginTop: 12 }}>
      <Button variant="ghost" disabled={busy} onClick={run}>
        {busy ? "Újra-feldolgozás…" : "↻ Újra-feldolgozás (elemzés + icebreaker frissítése)"}
      </Button>
      <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>
        A jóváhagyott üzeneteket és a kézi szerkesztéseket nem bántja. Gemini-kreditbe kerül.
      </div>
      {msg && <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
