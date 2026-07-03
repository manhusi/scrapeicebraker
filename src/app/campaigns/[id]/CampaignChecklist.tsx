"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateOpt = { id: string; name: string; segmentKey: string };

type Props = {
  campaignId: string;
  leadCount: number;
  hasTemplate: boolean;
  templateName: string | null;
  pendingGenerate: number;
  draftedCount: number;
  approvedCount: number;
  exportedCount: number;
  firstDraftedLeadId: string | null;
  segments: string[];
  templates: TemplateOpt[];
};

// Vezetett checklist (Shopify setup-guide minta): számozott lépések, a soron következő aktív,
// minden lépésben EGY világos akció. A felhasználót a rendszer vezeti végig.

const stepBox = (state: "done" | "active" | "upcoming"): React.CSSProperties => ({
  display: "flex",
  gap: 14,
  padding: "16px 18px",
  borderRadius: 12,
  border: `1px solid ${state === "active" ? "#3b6cff" : "#222835"}`,
  background: state === "active" ? "#141d33" : "#141821",
  opacity: state === "upcoming" ? 0.55 : 1,
  marginBottom: 10,
});

function StepNum({ n, state }: { n: number; state: "done" | "active" | "upcoming" }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        background: state === "done" ? "#238636" : state === "active" ? "#3b6cff" : "#1c2230",
        color: state === "done" || state === "active" ? "#fff" : "#6e7681",
      }}
    >
      {state === "done" ? "✓" : n}
    </div>
  );
}

const btn = (bg: string, disabled?: boolean): React.CSSProperties => ({
  padding: "9px 18px",
  borderRadius: 8,
  border: "none",
  background: disabled ? "#2a3040" : bg,
  color: "#fff",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 14,
});

const selectStyle: React.CSSProperties = {
  padding: "9px 10px",
  borderRadius: 8,
  border: "1px solid #2a3040",
  background: "#0e1117",
  color: "#e6e8ec",
  fontSize: 14,
};

export default function CampaignChecklist(p: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [segment, setSegment] = useState(p.segments[0] ?? "");
  const [templateId, setTemplateId] = useState("");

  // A lépések állapota — ebből adódik, melyik az aktív.
  const step1: "done" | "active" = p.leadCount > 0 ? "done" : "active";
  const step2: "done" | "active" | "upcoming" =
    p.hasTemplate ? "done" : step1 === "done" ? "active" : "upcoming";
  const written = p.draftedCount + p.approvedCount;
  const step3: "done" | "active" | "upcoming" =
    written > 0 && p.pendingGenerate === 0
      ? "done"
      : step2 === "done"
        ? "active"
        : "upcoming";
  const step4: "done" | "active" | "upcoming" =
    written > 0 && p.draftedCount === 0
      ? "done"
      : p.draftedCount > 0
        ? "active"
        : "upcoming";
  const allExported =
    p.exportedCount > 0 && p.approvedCount === 0 && p.draftedCount === 0;
  const step5: "done" | "active" | "upcoming" = allExported
    ? "done"
    : p.approvedCount > 0
      ? "active"
      : "upcoming";

  async function api(path: string, body?: object) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, {
        method: body ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      else router.refresh();
      return data;
    } catch {
      setMsg("Hálózati hiba.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function setTemplate() {
    if (!templateId) return;
    setBusy(true);
    setMsg(null);
    try {
      await fetch(`/api/campaigns/${p.campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerTemplateId: templateId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addLeads() {
    const data = await api(`/api/campaigns/${p.campaignId}/leads`, {
      segmentKey: segment,
    });
    if (data?.ok) setMsg(`${data.added} lead hozzáadva.`);
  }

  async function generate() {
    setMsg("Megírás folyamatban… (eltarthat 1-2 percig)");
    const data = await api(`/api/campaigns/${p.campaignId}/generate`, {});
    if (data?.ok)
      setMsg(`Kész: ${data.summary.drafted} üzenet megírva.`);
  }

  async function exportCsv() {
    setBusy(true);
    setMsg("Export készül…");
    try {
      const res = await fetch(`/api/campaigns/${p.campaignId}/export`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
        return;
      }
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg(`${data.count} sor letöltve — importáld az Instantly-be.`);
      router.refresh();
    } catch {
      setMsg("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* 1. Leadek */}
      <div style={stepBox(step1)}>
        <StepNum n={1} state={step1} />
        <div style={{ flex: 1 }}>
          <strong>Leadek a kampányban</strong>
          <span style={{ color: "#9aa1ab", marginLeft: 8, fontSize: 13 }}>
            {p.leadCount} lead
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} style={selectStyle}>
              {p.segments.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={addLeads} disabled={busy} style={btn("#30363d", busy)}>
              + Hozzáadás szegmensből
            </button>
          </div>
        </div>
      </div>

      {/* 2. Ajánlat */}
      <div style={stepBox(step2)}>
        <StepNum n={2} state={step2} />
        <div style={{ flex: 1 }}>
          <strong>Ajánlat kiválasztása</strong>
          {p.hasTemplate ? (
            <span style={{ color: "#3fb950", marginLeft: 8, fontSize: 13 }}>
              {p.templateName}
            </span>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                style={selectStyle}
              >
                <option value="">— válassz ajánlatot —</option>
                {p.templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.segmentKey} · {t.name}
                  </option>
                ))}
              </select>
              <button onClick={setTemplate} disabled={busy || !templateId} style={btn("#3b6cff", busy || !templateId)}>
                Beállítás
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Megírás */}
      <div style={stepBox(step3)}>
        <StepNum n={3} state={step3} />
        <div style={{ flex: 1 }}>
          <strong>Üzenetek megírása</strong>
          <span style={{ color: "#9aa1ab", marginLeft: 8, fontSize: 13 }}>
            {written} megírva{p.pendingGenerate > 0 && ` · ${p.pendingGenerate} vár`}
          </span>
          {step3 !== "upcoming" && p.pendingGenerate > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={generate} disabled={busy} style={btn("#d29922", busy)}>
                ✍ Megírás indítása ({p.pendingGenerate})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Átnézés */}
      <div style={stepBox(step4)}>
        <StepNum n={4} state={step4} />
        <div style={{ flex: 1 }}>
          <strong>Átnézés és jóváhagyás</strong>
          <span style={{ color: "#9aa1ab", marginLeft: 8, fontSize: 13 }}>
            {p.approvedCount}/{written} jóváhagyva
          </span>
          {p.draftedCount > 0 && p.firstDraftedLeadId && (
            <div style={{ marginTop: 10 }}>
              <Link
                href={`/leads/${p.firstDraftedLeadId}`}
                style={{ ...btn("#8957e5"), display: "inline-block", textDecoration: "none" }}
              >
                👁 Átnézés indítása ({p.draftedCount})
              </Link>
              <span style={{ color: "#6e7681", fontSize: 12, marginLeft: 10 }}>
                egyenként, előző/következő gombokkal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Export */}
      <div style={stepBox(step5)}>
        <StepNum n={5} state={step5} />
        <div style={{ flex: 1 }}>
          <strong>Export Instantly-be</strong>
          <span style={{ color: "#9aa1ab", marginLeft: 8, fontSize: 13 }}>
            {allExported
              ? `${p.exportedCount} üzenet exportálva`
              : step5 === "active"
                ? `${p.approvedCount} jóváhagyott üzenet kész`
                : "a jóváhagyás után nyílik meg"}
          </span>
          {(step5 === "active" || allExported) && (
            <div style={{ marginTop: 10 }}>
              <button onClick={exportCsv} disabled={busy} style={btn("#2ea043", busy)}>
                {allExported ? "↓ CSV újratöltése" : "📤 Instantly CSV letöltése"}
              </button>
            </div>
          )}
        </div>
      </div>

      {msg && <div style={{ color: "#9aa1ab", fontSize: 13, marginTop: 6 }}>{msg}</div>}
    </div>
  );
}
