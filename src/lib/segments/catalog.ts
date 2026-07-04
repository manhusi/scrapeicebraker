import { prisma } from "@/lib/db";

// A 6 FÁJDALOM-archetípus — a kezdő szegmens-katalógus forrás-igazsága (CONSTITUTION 8., DOMAIN.md).
// A seed idempotens: csak a hiányzót hozza létre, admin-szerkesztést nem ír felül (Fázis 8).
// A `description` a Geminit is vezérli a szegmentálásnál — a fájdalom + kinek szól.

export type SegmentDef = {
  key: string;
  name: string;
  description: string;
};

export const SEGMENT_CATALOG: SegmentDef[] = [
  {
    key: "booking_lodge",
    name: "Foglalás-alapú szálláshely",
    description:
      "Szálláshely/vendégház/apartman, ahol előleggel foglalni kell. Fájdalom: OTA-jutalék (booking.com/szállás.hu 15-20%), kézi telefonos egyeztetés, utalásos előleg, kézi számlázás, no-show. Megoldás: saját foglalómotor Stripe + számlázz.hu automatikával (proof: kacatanya.hu).",
  },
  {
    key: "custom_manufacturer",
    name: "Egyedi / magas jegyárú gyártó",
    description:
      "Egyedi vagy magas árú terméket gyárt ajánlatkérésre (pl. dézsa, szauna, faház, kiülő, filagória). Fájdalom: lassú ajánlatadás, az érdeklődő addig a konkurenshez megy, sok nézelődő rabolja az időt. Megoldás: gyors árkalkulátor/kvalifikáló űrlap + automata follow-up (ajánlat-gép).",
  },
  {
    key: "product_ecom",
    name: "Fix áras termék + hirdetés",
    description:
      "Fix áras terméket árul készletről, aktívan hirdet (ezért van az ads libraryben), de a landing gyenge, ég a hirdetési pénz. Megoldás: hirdetéskezelés + konvertáló landing page (proof: mobil faházas cég).",
  },
  {
    key: "service_wellness",
    name: "Időpont-alapú szolgáltatás",
    description:
      "Időpont-alapú szolgáltatás (spa, wellness, masszázs, kezelés, szépségszalon, egészségügy). Fájdalom: no-show (a meg nem jelent vendég 100% veszteség), üres időpontok holtidőben, telefonos időpont-egyeztetés. Megoldás: online időpontfoglalás előleggel + visszatérő-vendég kampányok.",
  },
  {
    key: "event_program",
    name: "Program / tábor / foglalkozás",
    description:
      "Tábor, kurzus, program, foglalkozás, ahol jelentkezni és fizetni kell (csoportoknak/szülőknek). Fájdalom: kézi jelentkezés-kezelés, fizetés-követés, számlázás — sok adminisztráció. Megoldás: automatizált jelentkezés + fizetés + számla (0 perc admin).",
  },
  {
    key: "unclear",
    name: "Nem egyértelmű (emberi átnézés)",
    description:
      "Nem sorolható be biztosan egyik fájdalom-archetípusba sem a rendelkezésre álló tartalomból. Fail-closed: emberi átnézés kell, nem küldünk rossz ajánlatot.",
  },
];

export const SEGMENT_KEYS = SEGMENT_CATALOG.map((s) => s.key);

// A foglalás-fájdalom szegmensek: ezeknél az ajánlatunk MAGA az online foglalás+fizetés,
// ezért aki már online foglal, az NEM célpont (DISQUALIFIED). Lásd docs/ICEBREAKER.md.
export const BOOKING_PAIN_SEGMENTS = new Set([
  "booking_lodge",
  "service_wellness",
  "event_program",
]);

// Idempotens seed: hiányzót létrehoz, meglévőt békén hagy (admin-szerkesztés védett).
export async function seedSegments(): Promise<{ created: number; existing: number }> {
  let created = 0;
  let existing = 0;
  for (const seg of SEGMENT_CATALOG) {
    const found = await prisma.segment.findUnique({ where: { key: seg.key } });
    if (found) {
      existing++;
      continue;
    }
    await prisma.segment.create({ data: seg });
    created++;
  }
  return { created, existing };
}
