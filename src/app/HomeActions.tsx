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

// Egy kattintás = végigfut az EGÉSZ állományon, adagokban, élő haladással. A szerver-oldali
// batch-limit így nem korlát: a kliens addig hívja, amíg van mit csinálni (biztonsági iteráció-plafon).
function useBatchRunner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(
    step: (i: number) => Promise<{ ok: boolean; done: boolean; label: string }>,
  ) {
    setBusy(true);
    try {
      for (let i = 0; i < 200; i++) {
        const r = await step(i);
        setMsg(r.label);
        if (!r.ok || r.done) break;
      }
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return { busy, msg, run };
}

// 2. állomás: beolvasás + elemzés, végig az összes új leaden.
export function ProcessButton({ count }: { count: number }) {
  const { busy, msg, run } = useBatchRunner();
  const BATCH = 10;

  return (
    <div>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() => {
          let scraped = 0;
          let analyzed = 0;
          return run(async () => {
            const r = await apiCall<{
              summary: { scraped: number; analyzed: number; scrapeFailed: number; analyzeFailed: number };
            }>("/api/process", { body: { limit: BATCH } });
            if (!r.ok) return { ok: false, done: true, label: `Hiba: ${r.error}` };
            scraped += r.summary.scraped;
            analyzed += r.summary.analyzed;
            const s = r.summary;
            const progressed = s.scraped + s.scrapeFailed + s.analyzed + s.analyzeFailed;
            const done = progressed === 0;
            return {
              ok: true,
              done,
              label: done
                ? `Kész: ${scraped} beolvasva, ${analyzed} elemezve.`
                : `Feldolgozás fut… ${scraped} beolvasva, ${analyzed} elemezve…`,
            };
          });
        }}
      >
        {busy ? "Feldolgozás…" : `Feldolgozás indítása (${count})`}
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 3. állomás: minden elemzett + emailes lead megírása a közös sablonnal, végig.
export function WriteButton({ count }: { count: number }) {
  const { busy, msg, run } = useBatchRunner();
  const BATCH = 20;

  return (
    <div>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() => {
          let drafted = 0;
          return run(async () => {
            const r = await apiCall<{
              summary: { processed: number; drafted: number };
            }>("/api/write", { body: { limit: BATCH } });
            if (!r.ok) return { ok: false, done: true, label: `Hiba: ${r.error} (${drafted} kész)` };
            drafted += r.summary.drafted;
            // Kész, ha kevesebb leadet talált a batch-nél, vagy egy batch nem haladt (csupa hiba).
            const done = r.summary.processed < BATCH || r.summary.drafted === 0;
            return {
              ok: true,
              done,
              label: done
                ? `Kész: ${drafted} üzenet megírva.`
                : `Megírás fut… ${drafted}/${count} kész…`,
            };
          });
        }}
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
