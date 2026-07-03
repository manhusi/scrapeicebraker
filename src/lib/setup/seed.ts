import { prisma } from "@/lib/db";
import { seedSegments } from "@/lib/segments/catalog";

// Idempotens kezdő-adatok: MyProfile, OfferTemplate (booking_lodge v1), Setting.
// Meglévő sort NEM ír felül (az admin-szerkesztés védett, Fázis 8).
// A sablon-törzs forrás-igazsága: docs/ICEBREAKER.md.

const MY_PROFILE_SEED: { key: string; content: string }[] = [
  {
    key: "about_me",
    content:
      "Dékány Bálint — full-funnel builder: Meta hirdetéskezelés, konvertáló landing/weboldal, videó, AI-automatizáció. Foglalás+fizetés rendszereket építek kisvállalkozásoknak (Stripe + számlázz.hu automatikával).",
  },
  {
    key: "proof_booking",
    content:
      "kacatanya.hu — élő foglalórendszer: előleges foglalás, Stripe + számlázz.hu automata számlázás, email lista, mini CRM. Az ügyfél gyakorlatilag 0 perc adminnal fut.",
  },
  {
    key: "voice",
    content:
      "Tegeződés. Rövid, emberi mondatok, mintha egy ismerősödnek írnál, aki vendégházat visz. Nulla korporát duma, nulla nyomulás, nulla túlzás.",
  },
];

// Az icebreakernek ehhez az első mondathoz kell átvezetnie (lásd prompts.bodyOpening).
export const BOOKING_BODY_OPENING = "Pont ezt szoktam kiütni:";

const BOOKING_LODGE_TEMPLATE = {
  segmentKey: "booking_lodge",
  name: "Direkt Foglalás Gép — videó CTA (v1)",
  body: `Pont ezt szoktam kiütni: a vendég magától foglal, az előleg azonnal beérkezik Stripe-on, a számla magától megy ki. Egy vendégházas ügyfelem gyakorlatilag 0 perc adminnal fut így.

Csináltam róla egy 2 perces videót, hogy ez hogy nézne ki nálatok. Átdobjam?

Ha nem aktuális, az is teljesen oké.

Üdv,
Bálint
Az iPhone-omról küldve`,
};

const SETTINGS_SEED: { key: string; value: string }[] = [
  // hybrid = minden draftot te hagysz jóvá; auto = jóváhagyás nélkül mehet exportba (CONSTITUTION 12.)
  { key: "offer_mode", value: "hybrid" },
];

export async function seedAll(): Promise<{
  segments: { created: number; existing: number };
  profile: number;
  templates: number;
  settings: number;
}> {
  const segments = await seedSegments();

  let profile = 0;
  for (const p of MY_PROFILE_SEED) {
    const found = await prisma.myProfile.findUnique({ where: { key: p.key } });
    if (!found) {
      await prisma.myProfile.create({ data: p });
      profile++;
    }
  }

  let templates = 0;
  const existingTemplate = await prisma.offerTemplate.findFirst({
    where: { segmentKey: BOOKING_LODGE_TEMPLATE.segmentKey },
  });
  if (!existingTemplate) {
    await prisma.offerTemplate.create({ data: BOOKING_LODGE_TEMPLATE });
    templates++;
  }

  let settings = 0;
  for (const s of SETTINGS_SEED) {
    const found = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!found) {
      await prisma.setting.create({ data: s });
      settings++;
    }
  }

  return { segments, profile, templates, settings };
}
