import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function extractUrlComponents(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/profile.php") {
      const id = parsed.searchParams.get("id");
      if (id) return { pageId: id, slug: null, fullUrl: url };
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return { pageId: null, slug: null, fullUrl: url };
    
    const last = parts[parts.length - 1];
    if (/^[0-9]+$/.test(last)) {
      return { pageId: last, slug: null, fullUrl: url };
    } else {
      return { pageId: null, slug: last.toLowerCase(), fullUrl: url };
    }
  } catch {
    const idMatch = url.match(/id=([0-9]+)/);
    if (idMatch) return { pageId: idMatch[1], slug: null, fullUrl: url };
    
    const slugMatch = url.match(/facebook\.com\/([a-zA-Z0-9\._\-]+)/i);
    if (slugMatch && slugMatch[1]) {
      const s = slugMatch[1];
      if (/^[0-9]+$/.test(s)) return { pageId: s, slug: null, fullUrl: url };
      return { pageId: null, slug: s.toLowerCase(), fullUrl: url };
    }
    return { pageId: null, slug: null, fullUrl: url };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const urls: string[] = body.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: true, existingUrls: [] });
    }

    const pageIds: string[] = [];
    const slugs: string[] = [];
    const fullUrls: string[] = [];

    for (const url of urls) {
      fullUrls.push(url);
      try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        const alternativeHost = host.startsWith("www.") ? host.substring(4) : `www.${host}`;
        fullUrls.push(url.replace(host, alternativeHost));
      } catch {}

      const comps = extractUrlComponents(url);
      if (comps.pageId) pageIds.push(comps.pageId);
      if (comps.slug) slugs.push(comps.slug);
    }

    const existing = await prisma.lead.findMany({
      where: {
        OR: [
          { pageId: { in: pageIds } },
          { pageHandle: { in: slugs } },
          { fbUrl: { in: fullUrls } }
        ]
      },
      select: {
        pageId: true,
        pageHandle: true,
        fbUrl: true
      }
    });

    const existSetPageId = new Set(existing.map(e => e.pageId).filter(Boolean));
    const existSetSlug = new Set(existing.map(e => e.pageHandle?.toLowerCase()).filter(Boolean));
    const existSetFbUrl = new Set(existing.map(e => e.fbUrl?.toLowerCase()).filter(Boolean));

    const existingUrls = urls.filter(url => {
      const comps = extractUrlComponents(url);
      if (comps.pageId && comps.pageId && existSetPageId.has(comps.pageId)) return true;
      if (comps.slug && existSetSlug.has(comps.slug.toLowerCase())) return true;
      if (existSetFbUrl.has(url.toLowerCase())) return true;
      
      try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        const alternativeHost = host.startsWith("www.") ? host.substring(4) : `www.${host}`;
        const altUrl = url.replace(host, alternativeHost);
        if (existSetFbUrl.has(altUrl.toLowerCase())) return true;
      } catch {}

      return false;
    });

    return NextResponse.json({ ok: true, existingUrls });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "hiba" },
      { status: 500 }
    );
  }
}
