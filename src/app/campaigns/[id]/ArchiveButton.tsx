"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArchiveButton({
  campaignId,
  archived,
}: {
  campaignId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: archived ? "DRAFT" : "ARCHIVED" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: "1px solid #2a3040",
        background: "transparent",
        color: "#9aa1ab",
        cursor: busy ? "wait" : "pointer",
        fontSize: 13,
      }}
    >
      {archived ? "Visszaállítás" : "Archiválás"}
    </button>
  );
}
