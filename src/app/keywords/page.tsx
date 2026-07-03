import Link from "next/link";
import { listKeywordsWithCounts } from "@/lib/services/keywords";
import KeywordManager, { type KeywordRow } from "./KeywordManager";

export const dynamic = "force-dynamic";

export default async function KeywordsPage() {
  let keywords: KeywordRow[] = [];
  try {
    const data = await listKeywordsWithCounts();
    keywords = data.map((k) => ({
      id: k.id,
      term: k.term,
      notes: k.notes,
      status: k.status,
      leadCount: k.leadCount,
      batchCount: k.batchCount,
    }));
  } catch {
    keywords = [];
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/" style={{ color: "#7aa2ff", textDecoration: "none" }}>
        ← Vissza
      </Link>
      <h1 style={{ fontSize: 26, marginTop: 16, marginBottom: 4 }}>
        Kulcsszó-gyűjtő
      </h1>
      <p style={{ color: "#9aa1ab", marginTop: 0 }}>
        A Meta Ads keresési kulcsszavaid egy helyen. Kulcsszó ≠ szegmens — ez
        azt mondja meg, honnan jön a lead.
      </p>
      <KeywordManager initial={keywords} />
    </main>
  );
}
