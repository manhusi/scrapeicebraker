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

## ⚠️ A LEGDRÁGÁBB LECKE (v1 kudarc, 2026-07): ne manufaktúrázz fájdalmat

A v1 prompt KÖTELEZŐVÉ tette, hogy minden icebreaker a „foglalás körüli kézi munkára" vezessen át,
és odaadta a kész mondatot: *„Gondolom nálatok is megvan a foglalás körüli kézi kör."* Eredmény
(25 draftból mérve): **19 majdnem szó szerint ezzel zárt.** Ez három sebet ütött:
- **ok-okozat nélküli ragasztás:** vendég-extra (SUP-ajándék, jakuzzi) + „Gondolom kézi munka" = nonszensz;
- **ismétlés:** ugyanaz a farok 19×, azonnali lebukás;
- **HAZUGSÁG:** olyan leadnek is állította a kézi fájdalmat, akinek a saját jeleink szerint MÁR van
  online foglaló-naptára (Wishkó, StagLand). Pontosan a régi scraper hibája: az ajánlat premisszáját
  ténynek adta el.

**Alapelv mostantól: az icebreaker MEGFIGYEL, nem feltételez fájdalmat. Ha egy állítás nincs a jelekben,
NEM mondjuk ki.** A fájdalmat nem az icebreaker gyártja — a KVALIFIKÁCIÓ dönti el (lásd lent), és csak
a valódi célponthoz megyünk.

## Kvalifikáció — kinek NEM írunk (a truth-first kapu)

Az analízis minden leadre eldönti a `bookingMode`-ot a jelekből: `manual` | `online` | `unknown`.
- `online` = van működő foglaló-naptár / online fizetés / harmadik feles foglalórendszer
  (szallas.hu, booking.com, nethotelbooking.net, dátumválasztós ár-naptár).
- A foglalás-fájdalom szegmenseknél (`booking_lodge`, `service_wellness`, `event_program`) az
  `online` lead **DISQUALIFIED** — NEM kap üzenetet (a mi ajánlatunk épp az online foglalás; nekik
  már megvan). Látható „Nem célpont" listában marad, kézzel visszavehető, ha tévedtünk.
- Így az icebreaker CSAK `manual`/`unknown` leadre fut → az admin-premissza legalább plauzibilis.

## Az icebreaker szabályai

**Mi a jó icebreaker?** Egy mondat, amit CSAK ennek a cégnek lehet elküldeni — mert a saját
weboldalukról származó konkrétum van benne. A teszt: ha 10 másik cégnek is elmehetne, rossz.

1. **Konkrétum a signals-ból, semmi kitaláció.** Csak olyat állíthat, ami a scrape-elt jelekben
   tényleg szerepel (házak neve, előleg %, foglalási mód, ár, szolgáltatás). Hallucinált „észrevétel"
   = azonnali lebukás és bizalomvesztés.
2. **Megfigyelés, nem bók.** „Feltűnt, hogy a kiemelt időszakokra emailben megy a foglalás" — ez
   megfigyelés. „Lenyűgöző az oldalatok" — ez üres bók, tilos. Max egy fél-mondatnyi, konkrét,
   visszafogott dicséret fér bele („a bordó házatok nagyon eltalált"), ha természetes.
3. **Válaszd a foglaláshoz KÖTHETŐ megfigyelést.** Ha a jelekben van foglalási/fizetési/admin részlet
   (foglalási mód, előleg %, ár-megjelenítés, elérhetőség kezelése), ARRA építs — mert a fix törzs
   („Pont ezt szoktam kiütni: …") ezt folytatja. Puszta vendég-extrát (jakuzzi, reggeli) csak akkor
   emelj ki, ha nincs jobb, és akkor se ragassz rá kézi-munka állítást.
4. **Az átvezetés IGAZ és VÁLTOZatos — nincs sablonmondat:**
   - Ha a jelek közt VAN kézi folyamat (emailes/telefonos egyeztetés, utalásos előleg, „kérje
     kollégáink segítségét", kézi számlázás) → a megfigyelés MAGA ez, természetesen folytatja a törzset.
   - Ha NINCS ilyen jel → a megfigyelés önmagában áll, VAGY egy könnyed, KONKRÉT-hoz kötött, más-más
     szóval megfogalmazott feltételezés zárja — sose tényként, sose kétszer ugyanúgy.
   - **TILOS a „foglalás körüli kézi kör" sablonmondat** (és bármely visszatérő farok). A teszt: ha a
     záró mondatod egy másik leadre változtatás nélkül elmenne, rossz.
5. **Ne szivárogtasd a törzset.** Az icebreaker SOHA ne tartalmazza / ne azzal végződjön, hogy
   „Pont ezt szoktam kiütni:" — az a fix törzs első sora, a rendszer teszi hozzá.
6. **Hang:** tegeződés, rövid mondatok, emberi. Mintha egy ismerősnek írnád, aki vendégházat visz.
7. **Tilos (anti-AI):** bók-halmozás; „lenyűgöző / fantasztikus / kiváló"; „nem X, hanem Y"
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
