"use client";

// A futószalag-állomások kliens-akciói (UX v4, globális). Minden gomb az ui/api.ts-en át hív.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(fn: () => Promise<string | null>, pending?: string) {
    setBusy(true);
    setMsg(pending ?? null);
    const result = await fn();
    setMsg(result);
    setBusy(false);
    router.refresh();
  }

  return { busy, msg, run };
}

function Note({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{msg}</div>;
}

// 2. állomás: beolvasás + elemzés egy láncban (adagolva; ha marad, jelezzük).
export function ProcessButton({ count }: { count: number }) {
  const { busy, msg, run } = useAction();

  return (
    <div>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const r = await apiCall<{
              summary: { scraped: number; analyzed: number };
            }>("/api/process", { body: { limit: 100 } });
            if (!r.ok) return `Hiba: ${r.error}`;
            const processed = Math.max(r.summary.scraped, r.summary.analyzed);
            const remaining = count - processed;
            const base = `Kész: ${r.summary.scraped} beolvasva, ${r.summary.analyzed} elemezve.`;
            return remaining > 0
              ? `${base} Még ${remaining} vár — kattints újra a következő adagért.`
              : base;
          }, "Feldolgozás fut… (1-2 perc)")
        }
      >
        {busy ? "Feldolgozás…" : `Feldolgozás indítása (${count})`}
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 3. állomás: minden elemzett + emailes lead megírása a közös sablonnal (adagolva).
export function WriteButton({ count }: { count: number }) {
  const { busy, msg, run } = useAction();

  return (
    <div>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const r = await apiCall<{ summary: { drafted: number } }>("/api/write", {
              body: { limit: 100 },
            });
            if (!r.ok) return `Hiba: ${r.error}`;
            const remaining = count - r.summary.drafted;
            const base = `Kész: ${r.summary.drafted} üzenet megírva.`;
            return remaining > 0
              ? `${base} Még ${remaining} vár — kattints újra.`
              : base;
          }, "Megírás folyamatban… (eltarthat pár percig)")
        }
      >
        {busy ? "Megírás…" : `Megírás (${count})`}
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 5. állomás: globális Instantly CSV letöltése (minden jóváhagyott).
export function ExportButton({ redownload }: { redownload: boolean }) {
  const { busy, msg, run } = useAction();

  return (
    <div>
      <Button
        variant="success"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const r = await apiCall<{ csv: string; filename: string; count: number }>(
              "/api/export",
            );
            if (!r.ok) return `Hiba: ${r.error}`;
            const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = r.filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            return `${r.count} sor letöltve — importáld az Instantly-be.`;
          }, "Export készül…")
        }
      >
        {redownload ? "CSV újratöltése" : "Instantly CSV letöltése"}
      </Button>
      <Note msg={msg} />
    </div>
  );
}
