# ICEBREAKER — a generálás forrás-igazsága

> A Gemini icebreaker-prompt ebből a dokumentumból származik. Változtatás itt először, aztán a promptban.

## Az üzenet-architektúra (jóváhagyva)

Az email egyetlen dolga: **igent kapni egy 2 perces videóra.** A Grand Slam Offer a videóban él, nem az emailben.

```
Szia!                                      ← fix
{icebreaker: 1–3 mondat, Gemini}           ← konkrét megfigyelés + átvezetés az admin-fájdalomra
{sablon-törzs: fix, szegmensenként}        ← megoldás 1 mondatban + proof 1 mondatban + videó CTA
```

A tárgysort is a Gemini írja (rövid, konkrét, kisbetűs, nem salesy — pl. „kiemelt időszakok foglalása").

## Az icebreaker szabályai

**Mi a jó icebreaker?** Egy mondat, amit CSAK ennek a cégnek lehet elküldeni — mert a saját
weboldalukról származó konkrétum van benne. A teszt: ha 10 másik cégnek is elmehetne, rossz.

1. **Konkrétum a signals-ból, semmi kitaláció.** Csak olyat állíthat, ami a scrape-elt jelekben
   tényleg szerepel (házak neve, előleg %, foglalási mód, ár, szolgáltatás). Hallucinált „észrevétel"
   = azonnali lebukás és bizalomvesztés.
2. **Megfigyelés, nem bók.** „Feltűnt, hogy a kiemelt időszakokra emailben megy a foglalás" — ez
   megfigyelés. „Lenyűgöző az oldalatok" — ez üres bók, tilos. Max egy fél-mondatnyi, konkrét,
   visszafogott dicséret fér bele („a bordó házatok nagyon eltalált"), ha természetes.
3. **A végén átvezetés a foglalási admin témára**, két módban:
   - **signal-mód:** ha a jelek közt VAN kézi folyamatra utaló (emailes foglalás, utalásos előleg,
     telefonos egyeztetés) → arra fut ki a megfigyelés.
   - **hedge-mód:** ha nincs ilyen jel → a bevált, nyomásmentes feltételezés: „Gondolom nálatok is
     megvan a foglalás körüli kézi kör…" (a régi copy „(Remélem nálatok nem így van), de…" mintája).
   Így a fix törzs („Pont ezt szoktam kiütni: …") mindkét esetben természetesen folytatja.
4. **Hang:** tegeződés, rövid mondatok, emberi. Mintha egy ismerősnek írnád, aki vendégházat visz.
5. **Tilos (anti-AI):** bók-halmozás; „lenyűgöző / fantasztikus / kiváló"; „nem X, hanem Y"
   reframe-ek; gondolatjel-lánc; szimmetrikus felsorolások; bármilyen tény, ami nincs a jelekben;
   kérdéssel kezdés; „remélem jól vagy" típusú töltelék.

## A fix törzs (booking_lodge, v1)

```
Pont ezt szoktam kiütni: a vendég magától foglal, az előleg azonnal beérkezik Stripe-on,
a számla magától megy ki. Egy vendégházas ügyfelem gyakorlatilag 0 perc adminnal fut így.

Csináltam róla egy 2 perces videót, hogy ez hogy nézne ki nálatok. Átdobjam?

Ha nem aktuális, az is teljesen oké.

Üdv,
Bálint
Az iPhone-omról küldve
```

Miért ilyen: egy fájdalom (kézi admin), egy proof (élő ügyfél — kacatanya-referencia, név nélkül),
egy mikro-igen CTA (videó, nem meeting), nyomásmentes zárás. Hormozi: az email a videó trailere.

⚠️ **A videó a te feladatod:** vedd fel a ~2 perces booking_lodge videót (Grand Slam Offer: mit kap,
proof, ingyen demó 1 nap alatt, nulla kockázat), MIELŐTT a kampány kimegy — az email ígéri.

## Mérés (Instantly)

Cél-referencia: a korábbi validált rendszered 10–20% reply rate-et hozott. Ha ez alá megy, előbb az
icebreaker konkrétságát nézd (1. szabály), csak utána a sablont.
