"use client";

// Profil-morzsa szerkesztő (Fázis 8). A `voice` kulcs löket-hordozó (a generálás olvassa),
// ezért jelezzük. Szerkeszd a content-et, vagy vegyél fel új kulcsot.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/ui/Button";
import { apiCall } from "@/app/ui/api";

export type ProfileRow = { key: string; content: string };

export default function ProfileEditor({ profile }: { profile: ProfileRow[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      {profile.map((p) => (
        <ProfileItem key={p.key} row={p} />
      ))}

      <div style={{ marginTop: 12 }}>
        {adding ? (
          <NewProfile onDone={() => setAdding(false)} existing={profile.map((p) => p.key)} />
        ) : (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            + Új kulcs
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileItem({ row }: { row: ProfileRow }) {
  const router = useRouter();
  const [content, setContent] = useState(row.content);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await apiCall("/api/profile", {
      method: "PUT",
      body: { key: row.key, content },
    });
    setBusy(false);
    setMsg(r.ok ? "Mentve." : `Hiba: ${r.error}`);
    if (r.ok) router.refresh();
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div className="field-label">
        {row.key}
        {row.key === "voice" && (
          <span className="faint"> · a megírás hangját vezérli</span>
        )}
      </div>
      <textarea
        className="textarea"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
        <Button
          variant="primary"
          disabled={busy || content === row.content}
          onClick={save}
        >
          Mentés
        </Button>
        {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      </div>
    </div>
  );
}

function NewProfile({
  onDone,
  existing,
}: {
  onDone: () => void;
  existing: string[];
}) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    const k = key.trim();
    if (existing.includes(k)) {
      setMsg("Ez a kulcs már létezik — szerkeszd fent.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await apiCall("/api/profile", {
      method: "PUT",
      body: { key: k, content },
    });
    setBusy(false);
    if (!r.ok) return setMsg(`Hiba: ${r.error}`);
    router.refresh();
    onDone();
  }

  return (
    <div className="card">
      <input
        className="input"
        placeholder="kulcs (pl. proof_ads)"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <textarea
        className="textarea"
        rows={3}
        placeholder="tartalom"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
        <Button
          variant="primary"
          disabled={busy || !key.trim() || !content.trim()}
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
