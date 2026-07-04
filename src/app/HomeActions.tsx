"use client";

// A futószalag-állomások kliens-akciói. Minden gomb az ui/api.ts-en át hív (EGY forrás-igazság).

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

// 2. állomás: beolvasás + elemzés egy láncban.
export function ProcessButton({ count }: { count: number }) {
  const { busy, msg, run } = useAction();

  return (
    <div>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const limit = 100;
            const r = await apiCall<{
              summary: { scraped: number; analyzed: number; scrapeFailed: number };
            }>("/api/process", { body: { limit } });
            if (!r.ok) return `Hiba: ${r.error}`;
            
            const processedCount = Math.max(r.summary.scraped, r.summary.analyzed);
            const remaining = count - processedCount;
            
            // Ha maradt még feldolgozatlan lead, jelezzük a felhasználónak
            if (remaining > 0) {
              return `Kész: ${r.summary.scraped} beolvasva, ${r.summary.analyzed} elemezve. Még maradt ${remaining} feldolgozatlan lead, kattints újra a következő adagért!`;
            }
            return `Kész: ${r.summary.scraped} beolvasva, ${r.summary.analyzed} elemezve.`;
          }, "Feldolgozás fut… (1-2 perc)")
        }
      >
        {busy ? "Feldolgozás…" : `Feldolgozás indítása (${count})`}
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 3. állomás: egy szegmens-csoport kampányba egy kattintással.
export function GroupButton({
  segmentKey,
  targetName,
}: {
  segmentKey: string;
  targetName: string | null;
}) {
  const { busy, msg, run } = useAction();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const r = await apiCall<{ campaignName: string; added: number; created: boolean }>(
              "/api/campaigns/from-segment",
              { body: { segmentKey } },
            );
            return r.ok
              ? `${r.added} lead a(z) „${r.campaignName}” kampányban${r.created ? " (új kampány)" : ""}.`
              : `Hiba: ${r.error}`;
          })
        }
      >
        {targetName ? `→ ${targetName}` : "Új kampányba"}
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 4. állomás: üzenetek megírása egy kampányban.
export function WriteButton({
  campaignId,
  count,
}: {
  campaignId: string;
  count: number;
}) {
  const { busy, msg, run } = useAction();

  return (
    <div>
      <Button
        variant="primary"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const r = await apiCall<{ summary: { drafted: number } }>(
              `/api/campaigns/${campaignId}/generate`,
            );
            return r.ok
              ? `Kész: ${r.summary.drafted} üzenet megírva.`
              : `Hiba: ${r.error}`;
          }, "Megírás folyamatban… (eltarthat 1-2 percig)")
        }
      >
        {busy ? "Megírás…" : `Megírás (${count})`}
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 4. állomás kivétele: ajánlat nélküli kampány — inline választó, hogy ne legyen zsákutca.
export function TemplatePicker({
  campaignId,
  templates,
}: {
  campaignId: string;
  templates: { id: string; name: string }[];
}) {
  const { busy, msg, run } = useAction();
  const [templateId, setTemplateId] = useState("");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <select
        className="select"
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
      >
        <option value="">— válassz ajánlatot —</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Button
        variant="primary"
        disabled={busy || !templateId}
        onClick={() =>
          run(async () => {
            const r = await apiCall(`/api/campaigns/${campaignId}`, {
              method: "PATCH",
              body: { offerTemplateId: templateId },
            });
            return r.ok ? null : `Hiba: ${r.error}`;
          })
        }
      >
        Beállítás
      </Button>
      <Note msg={msg} />
    </div>
  );
}

// 6. állomás: Instantly CSV letöltése.
export function ExportButton({
  campaignId,
  redownload,
}: {
  campaignId: string;
  redownload: boolean;
}) {
  const { busy, msg, run } = useAction();

  return (
    <div>
      <Button
        variant="success"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const r = await apiCall<{ csv: string; filename: string; count: number }>(
              `/api/campaigns/${campaignId}/export`,
              { body: { onlyApproved: !redownload } },
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
