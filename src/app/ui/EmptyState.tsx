import type { ReactNode } from "react";

// Üres állapot — mindig mondja meg, MI a következő lépés, sosem zsákutca.
export default function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="card muted" style={{ fontSize: 14 }}>
      {children}
    </div>
  );
}
