"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Kampányok" },
  { href: "/leads", label: "Lead-raktár" },
  { href: "/keywords", label: "Kulcsszavak" },
];

export default function TopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/")
      return pathname === "/" || pathname.startsWith("/campaigns");
    return pathname.startsWith(href);
  }

  return (
    <nav
      style={{
        borderBottom: "1px solid #1c2230",
        background: "#0e1117",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 52,
        }}
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
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: isActive(l.href) ? 600 : 400,
              color: isActive(l.href) ? "#fff" : "#9aa1ab",
              background: isActive(l.href) ? "#1c2230" : "transparent",
            }}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/import"
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            borderRadius: 8,
            background: "#3b6cff",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          + Import
        </Link>
      </div>
    </nav>
  );
}
