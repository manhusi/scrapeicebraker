"use client";

// Az üzenet-szerkesztés EGYETLEN felülete (UX v4, globális). Jóváhagyás után automatikusan
// a következő átnézésre váró üzenetre lép.

import { useState } from "react";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

type Props = {
  leadId: string;
  subject: string;
  finalMessage: string;
  messageStatus: "DRAFT" | "APPROVED" | "EXPORTED";
  edited: boolean;
  nextDraftedId: string | null;
};

export default function ReviewPanel(p: Props) {
  const [subject, setSubject] = useState(p.subject);
  const [finalMessage, setFinalMessage] = useState(p.finalMessage);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const readOnly = p.messageStatus === "EXPORTED";

  function goNext() {
    window.location.href = p.nextDraftedId
      ? `/review?lead=${p.nextDraftedId}`
      : `/review`;
  }

  async function approve() {
    setBusy(true);
    setMsg(null);
    const r = await apiCall(`/api/messages/${p.leadId}`, {
      method: "PATCH",
      body: { action: "approve", subject, finalMessage },
    });
    setBusy(false);
    if (!r.ok) return setMsg(`Hiba: ${r.error}`);
    goNext();
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await apiCall(`/api/messages/${p.leadId}`, {
      method: "PATCH",
      body: { action: "save", subject, finalMessage },
    });
    setBusy(false);
    setMsg(r.ok ? "Mentve." : `Hiba: ${r.error}`);
    if (r.ok) window.location.reload();
  }

  async function unapprove() {
    setBusy(true);
    const r = await apiCall(`/api/messages/${p.leadId}`, {
      method: "PATCH",
      body: { action: "unapprove" },
    });
    setBusy(false);
    setMsg(r.ok ? "Visszatéve átnézésre." : `Hiba: ${r.error}`);
    if (r.ok) window.location.reload();
  }

  async function ban() {
    if (
      !window.confirm(
        "Biztosan eldobod ezt a vállalkozást? Kimarad az exportból, és ha később újra behúzod, a rendszer már-megvan-ként átugorja. (Kézzel visszavehető.)",
      )
    )
      return;
    setBusy(true);
    setMsg(null);
    const r = await apiCall(`/api/messages/${p.leadId}`, {
      method: "PATCH",
      body: { action: "ban" },
    });
    setBusy(false);
    if (!r.ok) return setMsg(`Hiba: ${r.error}`);
    goNext();
  }

  async function regenerate() {
    setBusy(true);
    setMsg("Újraírás folyamatban…");
    const r = await apiCall(`/api/messages/${p.leadId}/regenerate`);
    setBusy(false);
    setMsg(r.ok ? "Újraírva." : `Hiba: ${r.error}`);
    if (r.ok) window.location.reload();
  }

  const dirty = subject !== p.subject || finalMessage !== p.finalMessage;

  return (
    <div>
      <label className="field-label">Tárgy</label>
      <input
        className="input"
        style={{ width: "100%", marginBottom: 12 }}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={readOnly}
      />

      <label className="field-label">Üzenet (ez megy exportba)</label>
      <textarea
        className="textarea"
        rows={16}
        value={finalMessage}
        onChange={(e) => setFinalMessage(e.target.value)}
        disabled={readOnly}
      />

      <div
        style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}
      >
        {p.messageStatus === "DRAFT" && (
          <>
            <Button variant="success" onClick={approve} disabled={busy}>
              ✓ Jóváhagyás {p.nextDraftedId ? "és következő" : ""}
            </Button>
            {p.nextDraftedId && (
              <Button variant="ghost" onClick={goNext} disabled={busy}>
                Kihagyás
              </Button>
            )}
            <Button variant="ghost" onClick={save} disabled={busy || !dirty}>
              Mentés
            </Button>
            <Button variant="ghost" onClick={regenerate} disabled={busy}>
              ↻ Újraírás
            </Button>
            <Button variant="danger" onClick={ban} disabled={busy}>
              🚫 Törlés
            </Button>
          </>
        )}
        {p.messageStatus === "APPROVED" && (
          <Button variant="purple" onClick={unapprove} disabled={busy}>
            Jóváhagyás visszavonása
          </Button>
        )}
        {readOnly && (
          <span className="faint" style={{ fontSize: 13 }}>
            Ez az üzenet már exportálva lett — nem szerkeszthető.
          </span>
        )}
        {p.edited && !readOnly && (
          <span style={{ color: "var(--warn)", fontSize: 12 }}>kézzel szerkesztve</span>
        )}
        {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}
