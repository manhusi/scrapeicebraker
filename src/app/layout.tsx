import type { Metadata } from "next";
import type { ReactNode } from "react";
import TopNav from "@/app/ui/TopNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outreach",
  description: "Személyre szabott outreach — a futószalag",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
