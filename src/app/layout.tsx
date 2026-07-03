import type { Metadata } from "next";
import type { ReactNode } from "react";
import TopNav from "@/app/components/TopNav";

export const metadata: Metadata = {
  title: "Outreach Automation",
  description: "Személyre szabott outreach pipeline",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#0b0d12",
          color: "#e6e8ec",
        }}
      >
        <TopNav />
        {children}
      </body>
    </html>
  );
}
