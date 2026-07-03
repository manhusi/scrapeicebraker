import type { LeadStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/pipeline";

export default function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        background: "#1c2230",
        color: meta.color,
        border: `1px solid ${meta.color}33`,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}
