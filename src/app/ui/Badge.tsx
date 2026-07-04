import type { LeadStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/pipeline";

// Lead-státusz címke — a felirat és a szín forrás-igazsága a lib/pipeline.ts.
export default function Badge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="badge" style={{ color: meta.color }}>
      {meta.label}
    </span>
  );
}
