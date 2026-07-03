# UX — a felület elveinek forrás-igazsága

> Minden UI-döntés ehhez igazodik. A mérce: „a világ összes vállalkozója tudja használni panasz nélkül."

## A 4 elv

1. **A rendszer vezet, nem a felhasználó keresgél.** A dashboard tetején mindig EGY kiemelt
   „Következő lépés" kártya (`lib/services/nextAction.ts` számolja, prioritás: átnézés → export →
   megírás → feldolgozás → szervezés → import). A felhasználó sosem kérdezi: „most mit csináljak?"

2. **Egy képernyő = egy elsődleges akció.** Nincs három egyenrangú gomb egymás mellett. Ami másodlagos,
   az vizuálisan is az (szürke, kisebb, lentebb, összecsukva).

3. **A gép belseje rejtve.** A felhasználó nem „scrape-el" és „szegmentál" — a gép „feldolgoz" (a
   beolvasás+elemzés EGY láncban fut: `processLeads.ts`). A státusz-címkék a teendőt mondják
   („Átnézésre vár"), nem a gép állapotát („DRAFTED"). Címkék egy helyen: `lib/pipeline.ts`.

4. **Vezetett checklist a folyamatokhoz.** A kampány oldala számozott lépések (Shopify setup-guide
   minta): 1. Leadek → 2. Ajánlat → 3. Megírás → 4. Átnézés → 5. Export. Kész = zöld pipa, a soron
   következő kék és nyitott, a jövőbeli halvány. Mindig látszik, hol tartasz.

## Az IA gerince: EGY KAMPÁNY = EGY IGAZSÁG

A kampány a fő (és egyetlen) munkafelület. Minden más raktár vagy utánpótlás:
- A **home a kampánylista**: minden kártya a SAJÁT következő lépését mutatja (`campaignNextStep`).
- A **Lead-raktár** (kampányon kívüli leadek) egy sáv a kampánylista alatt + a `/leads` nézet.
  Az import a raktárba tölt (egy CSV több szegmenst hoz), a kampány onnan szívja fel a magáét.
- A **review prev/next a kampányon BELÜL lépked** — két párhuzamos kampány sosem keveredik.

## Oldal-térkép

| Oldal | Szerep | Elsődleges akció |
|---|---|---|
| `/` (home) | kampánylista + raktár-sáv | kampány megnyitása (kártya-CTA) |
| `/campaigns/[id]` | vezetett 5 lépéses checklist | a soron következő lépés |
| `/leads` | Lead-raktár: kereshető állomány (másodlagos) | lead megnyitása |
| `/leads/[id]` | egy cég teljes útja + üzenet-review | Jóváhagyás (+ prev/next a kampányon belül) |
| `/keywords` | kulcsszó-gyűjtő (utánpótlás-terv) | kulcsszó felvétele |
| `/import` | CSV be a raktárba | feltöltés |

## Nyelv
Magyar, tegeződő, hétköznapi. Tilos a szakzsargon a felületen: nem „scrape", hanem „beolvasás";
nem „generálás", hanem „megírás"; nem „draft", hanem „átnézésre vár".
