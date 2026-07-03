"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  leadId: string;
  subject: string;
  finalMessage: string;
  approved: boolean;
  edited: boolean;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #2a3040",
  background: "#0e1117",
  color: "#e6e8ec",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: 14,
};

function btn(bg: string, disabled?: boolean): React.CSSProperties {
  return {
    padding: "9px 16px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#2a3040" : bg,
    color: "#fff",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 14,
  };
}

export default function MessageEditor(props: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(props.subject);
  const [finalMessage, setFinalMessage] = useState(props.finalMessage);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dirty =
    subject !== props.subject || finalMessage !== props.finalMessage;

  async function call(body: object, okMsg: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/messages/${props.leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      else {
        setMsg(okMsg);
        router.refresh();
      }
    } catch {
      setMsg("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/messages/${props.leadId}/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setMsg(`Hiba: ${data.error ?? "ismeretlen"}`);
      else {
        setMsg("Újragenerálva — töltsd újra az oldalt.");
        router.refresh();
      }
    } catch {
      setMsg("Hálózati hiba.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label style={{ display: "block", marginBottom: 4, color: "#9aa1ab", fontSize: 13 }}>
        Tárgy
      </label>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      <label style={{ display: "block", marginBottom: 4, color: "#9aa1ab", fontSize: 13 }}>
        Üzenet (ez megy exportba)
      </label>
      <textarea
        value={finalMessage}
        onChange={(e) => setFinalMessage(e.target.value)}
        rows={16}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        {!props.approved ? (
          <>
            <button
              onClick={() =>
                call({ action: "save", subject, finalMessage }, "Mentve.")
              }
              disabled={busy || !dirty}
              style={btn("#30363d", busy || !dirty)}
            >
              Mentés
            </button>
            <button
              onClick={() =>
                call(
                  { action: "approve", subject, finalMessage },
                  "Jóváhagyva.",
                )
              }
              disabled={busy}
              style={btn("#238636", busy)}
            >
              ✓ Jóváhagyás
            </button>
          </>
        ) : (
          <button
            onClick={() => call({ action: "unapprove" }, "Visszavonva.")}
            disabled={busy}
            style={btn("#8957e5", busy)}
          >
            Jóváhagyás visszavonása
          </button>
        )}
        <button onClick={regenerate} disabled={busy} style={btn("#30363d", busy)}>
          ↻ Újragenerálás
        </button>
        {props.edited && (
          <span style={{ color: "#d29922", fontSize: 12 }}>kézzel szerkesztve</span>
        )}
        {msg && <span style={{ color: "#9aa1ab", fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}
