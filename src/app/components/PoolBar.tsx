"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type CampaignOpt = { id: string; name: string };

type Props = {
  processable: number;
  unassignedBySegment: { segmentKey: string; count: number }[];
  failed: number;
  campaigns: CampaignOpt[];
};

// A lead-raktár: ami még nincs kampányban. A szegmens-chipek CSELEKVŐK — ott helyben
// hozzáadod őket egy kampányhoz (UX: a rendszer vezet, nincs zsákutca-szöveg).
export default function PoolBar(p: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const hasAnything =
    p.processable > 0 || p.unassignedBySegment.length > 0 || p.failed > 0;

  async function runProcess() {
    setBusy(true);
    setMsg("Feldolgozás fut… (beolvasás + elemzés, 1-2 perc)");
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      else {
        setMsg(`Kész: ${data.summary.scraped} beolvasva, ${data.summary.analyzed} elemezve.`);
        router.refresh();
      }
    } catch {
      setMsg("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  }

  async function addToCampaign(campaignId: string, segmentKey: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      else {
        setMsg(`${data.added} lead hozzáadva a kampányhoz.`);
        router.refresh();
      }
    } catch {
      setMsg("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: "#10141c",
        border: "1px dashed #2a3040",
        borderRadius: 12,
        padding: "16px 20px",
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, color: "#9aa1ab" }}>
          <strong style={{ color: "#c7ccd4" }}>Lead-raktár</strong> — ami még nincs kampányban
        </div>
        <Link href="/import" style={{ color: "#7aa2ff", fontSize: 13, textDecoration: "none" }}>
          + új CSV importálása
        </Link>
      </div>

      {!hasAnything ? (
        <p style={{ color: "#6e7681", fontSize: 13, margin: "10px 0 0" }}>
          A raktár üres — minden lead kampányban van. Importálj új CSV-t az utánpótláshoz.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {p.processable > 0 && (
            <div>
              <button
                onClick={runProcess}
                disabled={busy}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: busy ? "#2a3040" : "#3b6cff",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "Feldolgozás…" : `⚙ ${p.processable} új lead feldolgozása (beolvasás + elemzés)`}
              </button>
            </div>
          )}

          {p.unassignedBySegment.map((s) => (
            <SegmentRow
              key={s.segmentKey}
              segmentKey={s.segmentKey}
              count={s.count}
              campaigns={p.campaigns}
              busy={busy}
              onAdd={addToCampaign}
            />
          ))}

          {p.failed > 0 && (
            <Link
              href="/leads?status=SCRAPE_FAILED"
              style={{
                fontSize: 13,
                color: "#f85149",
                textDecoration: "none",
              }}
            >
              ⚠ {p.failed} lead nem olvasható/elemezhető — megnézem
            </Link>
          )}
        </div>
      )}
      {msg && <div style={{ color: "#9aa1ab", fontSize: 13, marginTop: 10 }}>{msg}</div>}
    </div>
  );
}

// Egy szegmens-sor: "custom_manufacturer 7 → [kampány ▾] [Hozzáad]".
function SegmentRow({
  segmentKey,
  count,
  campaigns,
  busy,
  onAdd,
}: {
  segmentKey: string;
  count: number;
  campaigns: CampaignOpt[];
  busy: boolean;
  onAdd: (campaignId: string, segmentKey: string) => void;
}) {
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, minWidth: 210 }}>
        <span style={{ color: "#58a6ff" }}>{segmentKey}</span>{" "}
        <strong>{count}</strong> — kampányra vár
      </span>
      {campaigns.length === 0 ? (
        <span style={{ color: "#6e7681", fontSize: 12 }}>
          előbb hozz létre kampányt lent
        </span>
      ) : (
        <>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #2a3040",
              background: "#0e1117",
              color: "#e6e8ec",
              fontSize: 13,
            }}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => onAdd(campaignId, segmentKey)}
            disabled={busy || !campaignId}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: busy || !campaignId ? "#2a3040" : "#30363d",
              color: "#fff",
              fontSize: 13,
              cursor: busy || !campaignId ? "not-allowed" : "pointer",
            }}
          >
            + Hozzáad
          </button>
        </>
      )}
    </div>
  );
}
