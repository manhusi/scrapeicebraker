import { prisma } from "@/lib/db";

// Admin-logika EGY helyen (CONSTITUTION 8., Fázis 8): ajánlat-sablonok és profil-morzsák
// szerkesztése. A séma stabil (nincs migráció) — ez tiszta logika a meglévő táblákon.

async function assertSegmentExists(segmentKey: string) {
  const seg = await prisma.segment.findUnique({ where: { key: segmentKey } });
  if (!seg) throw new Error(`Nincs ilyen szegmens: ${segmentKey}`);
}

export async function createOfferTemplate(input: {
  segmentKey: string;
  name: string;
  body: string;
}) {
  const name = input.name.trim();
  const body = input.body.trim();
  if (!name) throw new Error("A sablon neve nem lehet üres.");
  if (!body) throw new Error("A sablon törzse nem lehet üres.");
  await assertSegmentExists(input.segmentKey);
  return prisma.offerTemplate.create({
    data: { segmentKey: input.segmentKey, name, body, active: true },
  });
}

export async function updateOfferTemplate(
  id: string,
  patch: { name?: string; body?: string; active?: boolean; segmentKey?: string },
) {
  const data: {
    name?: string;
    body?: string;
    active?: boolean;
    segmentKey?: string;
  } = {};

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("A sablon neve nem lehet üres.");
    data.name = name;
  }
  if (patch.body !== undefined) {
    const body = patch.body.trim();
    if (!body) throw new Error("A sablon törzse nem lehet üres.");
    data.body = body;
  }
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.segmentKey !== undefined) {
    await assertSegmentExists(patch.segmentKey);
    data.segmentKey = patch.segmentKey;
  }

  return prisma.offerTemplate.update({ where: { id }, data });
}

// Profil-morzsa létrehozása/frissítése kulcs szerint (upsert — a `voice` sose tűnhet el).
export async function upsertProfile(key: string, content: string) {
  const k = key.trim();
  if (!k) throw new Error("A kulcs nem lehet üres.");
  return prisma.myProfile.upsert({
    where: { key: k },
    create: { key: k, content: content.trim() },
    update: { content: content.trim() },
  });
}
