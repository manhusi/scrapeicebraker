import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import { STATUS_META, MAIN_FLOW, FAILED_STATES } from "@/lib/pipeline";

// Kattintható pipeline-stepper: minden lépés a szűrt lead-listára visz (/leads?status=X).
// Ez a "lépkedni a lépések között + egyértelmű jelölések" magja.
export default function PipelineStepper({
  counts,
  active,
}: {
  counts: Record<string, number>;
  active?: LeadStatus;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        {MAIN_FLOW.map((st, i) => {
          const meta = STATUS_META[st];
          const isActive = active === st;
          return (
            <div key={st} style={{ display: "flex", alignItems: "center" }}>
              <Link
                href={`/leads?status=${st}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "8px 14px",
                  borderRadius: 10,
                  textDecoration: "none",
                  background: isActive ? "#1c2230" : "transparent",
                  border: `1px solid ${isActive ? meta.color : "#222835"}`,
                  minWidth: 78,
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, color: meta.color }}>
                  {counts[st] ?? 0}
                </span>
                <span style={{ fontSize: 11, color: "#9aa1ab" }}>{meta.label}</span>
              </Link>
              {i < MAIN_FLOW.length - 1 && (
                <span style={{ color: "#3a4150", margin: "0 2px" }}>→</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {FAILED_STATES.map((st) => {
          const meta = STATUS_META[st];
          const count = counts[st] ?? 0;
          if (count === 0) return null;
          return (
            <Link
              key={st}
              href={`/leads?status=${st}`}
              style={{
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 999,
                textDecoration: "none",
                background: "#2a1518",
                border: "1px solid #5a2530",
                color: meta.color,
              }}
            >
              ⚠ {meta.label}: {count}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
