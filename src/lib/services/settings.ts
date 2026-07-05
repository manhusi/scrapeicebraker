import { prisma } from "@/lib/db";

// Admin-logika EGY helyen (CONSTITUTION 8.): a KÖZÖS ajánlat-törzs és a profil-morzsák.
// Fázis 11 (egységes horog): nincs per-szegmens / per-kampány sablon — MINDENKI ugyanazt a
// közös törzset kapja. A séma stabil (nincs migráció); a `segmentKey` a séma miatt kötelező,
// de a modellben irreleváns. A tábla marad (rollback-barát), a UI csak egy törzset kezel.

// A KÖZÖS ajánlat-sablon EGY forrás-igazsága: az egyetlen aktív OfferTemplate.
// Mind a megírás (generateMessage), mind a home-jelző (conveyor) innen olvas.
export async function getCommonTemplate() {
  return prisma.offerTemplate.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
}

// A közös törzs mentése. Invariáns: PONTOSAN EGY aktív sablon lehet — a mentés ezt
// tranzakcióban kikényszeríti (a többit deaktiválja), így sose kétséges, mi megy ki.
export async function saveCommonBody(body: string) {
  const text = body.trim();
  if (!text) throw new Error("A közös törzs nem lehet üres.");

  return prisma.$transaction(async (tx) => {
    const current = await tx.offerTemplate.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });

    if (current) {
      // Minden más aktívat deaktiválunk → marad az egy élő közös törzs.
      await tx.offerTemplate.updateMany({
        where: { active: true, id: { not: current.id } },
        data: { active: false },
      });
      return tx.offerTemplate.update({
        where: { id: current.id },
        data: { body: text, active: true },
      });
    }

    // Nincs aktív sablon (üres DB / mindet deaktiválták): hozzunk létre egyet.
    // A segmentKey séma-kötelező, de az egységes horogban irreleváns — az első
    // elérhető szegmenst kapja technikai értékként.
    const seg = await tx.segment.findFirst({ orderBy: { key: "asc" } });
    if (!seg) {
      throw new Error("Nincs egyetlen szegmens sem — előbb seedeld a szegmenseket.");
    }
    await tx.offerTemplate.updateMany({
      where: { active: true },
      data: { active: false },
    });
    return tx.offerTemplate.create({
      data: { segmentKey: seg.key, name: "Közös törzs", body: text, active: true },
    });
  });
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
