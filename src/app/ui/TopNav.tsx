"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigáció: 3 elem (UX.md v3). A munka a Futószalagon van, minden más másodlagos.
const LINKS = [
  { href: "/", label: "Futószalag" },
  { href: "/leads", label: "Leadek" },
  { href: "/settings", label: "Beállítások" },
];

export default function TopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/")
      return (
        pathname === "/" ||
        pathname.startsWith("/review") ||
        pathname.startsWith("/import")
      );
    return pathname.startsWith(href);
  }

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--bg-hover)",
        background: "var(--bg-inset)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        className="page"
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 24px", height: 52 }}
      >
        <span style={{ fontWeight: 700, marginRight: 16, fontSize: 15 }}>
          Outreach
        </span>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: isActive(l.href) ? 600 : 400,
              color: isActive(l.href) ? "var(--text)" : "var(--text-dim)",
              background: isActive(l.href) ? "var(--bg-hover)" : "transparent",
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
