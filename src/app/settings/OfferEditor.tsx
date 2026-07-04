"use client";

// Ajánlat-sablon szerkesztő (Fázis 8). Szerkeszd helyben a törzset, kapcsold az aktívat,
// vagy hozz létre újat. Nincs kemény törlés — a deaktiválás kiveszi az új választásból.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

export type OfferRow = {
  id: string;
  segmentKey: string;
  name: string;
  body: string;
  active: boolean;
};

type SegmentOpt = { key: string; name: string };

export default function OfferEditor({
  offers,
  segments,
}: {
  offers: OfferRow[];
  segments: SegmentOpt[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div>
      {offers.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>
          Még nincs ajánlat-sablon. Hozz létre egyet lent.
        </p>
      ) : (
        offers.map((o) => (
          <OfferItem key={o.id} offer={o} segments={segments} />
        ))
      )}

      <div style={{ marginTop: 14 }}>
        {creating ? (
          <NewOffer segments={segments} onDone={() => setCreating(false)} />
        ) : (
          <Button variant="ghost" onClick={() => setCreating(true)}>
            + Új ajánlat-sablon
          </Button>
        )}
      </div>
    </div>
  );
}

function segName(segments: SegmentOpt[], key: string) {
  return segments.find((s) => s.key === key)?.name ?? key;
}

function OfferItem({
  offer,
  segments,
}: {
  offer: OfferRow;
  segments: SegmentOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(offer.name);
  const [body, setBody] = useState(offer.body);
  const [segmentKey, setSegmentKey] = useState(offer.segmentKey);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dirty =
    name !== offer.name || body !== offer.body || segmentKey !== offer.segmentKey;

  async function patch(patchBody: object, okMsg: string) {
    setBusy(true);
    setMsg(null);
    const r = await apiCall(`/api/offers/${offer.id}`, {
      method: "PATCH",
      body: patchBody,
    });
    setBusy(false);
    setMsg(r.ok ? okMsg : `Hiba: ${r.error}`);
    if (r.ok) router.refresh();
  }

  return (
    <div
      className="card"
      style={{ marginBottom: 10, opacity: offer.active ? 1 : 0.6 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn btn-ghost"
          style={{ border: "none", padding: 0, background: "transparent", fontSize: 14 }}
        >
          <strong>{offer.name}</strong>
          <span className="muted"> · {segName(segments, offer.segmentKey)}</span>
          {!offer.active && <span className="faint"> · inaktív</span>}
          <span className="faint"> {open ? "▲" : "▼"}</span>
        </button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => patch({ active: !offer.active }, offer.active ? "Deaktiválva." : "Aktiválva.")}
        >
          {offer.active ? "Deaktiválás" : "Aktiválás"}
        </Button>
      </div>

      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flex: "1 1 240px" }}
            />
            <select
              className="select"
              value={segmentKey}
              onChange={(e) => setSegmentKey(e.target.value)}
            >
              {segments.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="textarea"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
            <Button
              variant="primary"
              disabled={busy || !dirty}
              onClick={() => patch({ name, body, segmentKey }, "Mentve.")}
            >
              Mentés
            </Button>
            {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function NewOffer({
  segments,
  onDone,
}: {
  segments: SegmentOpt[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [segmentKey, setSegmentKey] = useState(segments[0]?.key ?? "");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setMsg(null);
    const r = await apiCall("/api/offers", {
      body: { segmentKey, name, body },
    });
    setBusy(false);
    if (!r.ok) return setMsg(`Hiba: ${r.error}`);
    router.refresh();
    onDone();
  }

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <input
          className="input"
          placeholder="sablon neve"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: "1 1 240px" }}
        />
        <select
          className="select"
          value={segmentKey}
          onChange={(e) => setSegmentKey(e.target.value)}
        >
          {segments.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="textarea"
        rows={10}
        placeholder="az ajánlat törzse — ez megy az icebreaker után az emailbe"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
        <Button
          variant="primary"
          disabled={busy || !name.trim() || !body.trim()}
          onClick={create}
        >
          Létrehozás
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onDone}>
          Mégse
        </Button>
        {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}
