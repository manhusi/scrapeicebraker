# ICEBREAKER — a generálás forrás-igazsága

> A Gemini icebreaker-prompt ebből a dokumentumból származik. Változtatás itt először, aztán a promptban.

## Az üzenet-architektúra (v3 — egységes horog, Bálint döntése 2026-07)

Az email egyetlen dolga: **igent kapni egy 2 perces videóra (VSL).** A tényleges ajánlat a videóban él.
Minden lead közös valósága: **Meta-hirdetésre költenek** (a Meta Ads Library-ből gyűjtöttük őket), és
**jobb megtérülést** akarnak a reklámpénzükből. Ezért EGY közös törzs megy mindenkinek.

```
Szia!                                   ← fix
{icebreaker: 1–2 mondat, Gemini}        ← EGY őszinte, konkrét megfigyelés a cégükről. Semmi más.
{közös törzs: fix, Bálint írja}         ← puha ads-említés + a videó CTA + Bálint bridge-e
```

**A kulcs-váltás: az icebreaker LE VAN VÁLASZTVA a törzsről.** Nem kell fájdalmat hidalnia, nem kell
átvezetnie semmire — a törzs (a te szöveged, a te „(Remélem nálatok nem így van), de…" bridge-eddel)
elvégzi az egész ajánlatot. Az icebreakernek EGYETLEN dolga: bebizonyítani, hogy tényleg megnéztem
őket, és ettől emberi legyen a levél. A törzs első szava (pl. „Amúgy…") pivotál az ajánlatra.

A tárgysort a Gemini írja (rövid, kisbetűs, a megfigyeléshez kötve — a nyitásért).

## ⚠️ A LEGDRÁGÁBB LECKE (v1 kudarc): ne manufaktúrázz fájdalmat

A v1 prompt kötelezővé tette, hogy minden icebreaker a „foglalás körüli kézi munkára" vezessen át, kész
sablonmondattal. Eredmény: 25-ből 19 ugyanazzal a farokkal zárt, ok-okozat nélküli ragasztások, és
olyan leadnek is állította a fájdalmat, akinek nem volt igaz. **Az icebreaker MEGFIGYEL, nem feltételez.
Ha egy állítás nincs a jelekben, NEM mondjuk ki. Nincs bridge, nincs sales — az a törzs dolga.**

> Kvalifikáció-váltás: a v2-ben az online-foglalós leadet kizártuk (mert az ajánlat az online foglalás
> volt). Az egységes ads-horognál ez **érvénytelen** — aki hirdet, az célpont, akkor is, ha már online
> foglal (neki is lehet rossz a landingje/kreatívja). A `bookingMode`-alapú kizárás KIVEZETVE.

## Mi a NAGYON JÓ icebreaker? (ez a rendszer szíve — itt dől el a reply rate)

Egy mondat, amit CSAK ENNEK a cégnek lehet elküldeni, mert olyan konkrétum van benne, amit egy
ember 20 másodperc alatt talált a weboldalukon — a legjellemzőbb, legérdekesebb részlet.

**A két teszt:**
1. Ha ez a mondat változtatás nélkül elmenne egy másik hasonló cégnek → ROSSZ.
2. Ha egy unott gyakornok meg tudná írni pusztán a cég nevéből/nichéből → ROSSZ.

**Szabályok:**
1. **1–2 rövid mondat, gyakran EGY a legjobb.** Max ~30 szó.
2. **A LEGJELLEMZŐBB, legspecifikusabb részletet válaszd** — ami megkülönbözteti őket minden más
   [ugyanolyan] cégtől: nevesített egység („a Kék Kabin"), szokatlan feature („terepjáróval viszitek
   be a vendégeket a jurtához"), konkrét szám, egy saját mondatuk. **KERÜLD a niche-generikust** (wifi,
   szauna, dézsa, „szép környezet"), amit minden konkurens is mondhat — kivéve, ha van rajta egyedi csavar.
3. **Csak tény a jelekből / a bióból.** Semmi kitaláció, semmi hallucináció. Ha kevés az adat, a
   legkonkrétabb elérhető dolgot mondd, EGY sima mondatban — soha ne tömd ki generikus dicsérettel.
4. **Tiszta megfigyelés — NULLA sales.** Tilos: ajánlat, kérdés, bármilyen bridge egy problémára,
   „gondolom nálatok is…", bármi a hirdetésről/marketingről/eredményről. Azt mind a törzs viszi.
5. **Emberi, nem robot.** Úgy olvasódjon, mint aki tényleg ott járt és megakadt a szeme valamin. Meleg,
   de nem nyálas. Egy őszinte reakció OK, ha KONKRÉT dologra szól („ezt az üvegfalat eltaláltátok") —
   de TILOS a generikus bók („szuper oldal", „lenyűgöző", „fantasztikus", bók-halmozás).
6. **Variáld a nyitást** (Feltűnt / Nézegettem / Láttam / Olvastam / Megakadt a szemem…), ne mindig ugyanaz.
7. **Tilos (anti-AI):** „nem X, hanem Y"; gondolatjel-lánc; kérdéssel kezdés; „remélem jól vagy" töltelék;
   felkiáltójel-halom; a törzs megismétlése.

## A közös törzs (Bálint írja)

A törzs a `/settings`-ben szerkeszthető közös ajánlat-sablon (EGY, mindenkinek). Puha, igaz ads-említés
(„belefutottam a hirdetésetekbe", NEM „a futó hirdetésetek" — hetekkel később lehet, hogy nem fut),
a te bevált „(Remélem nálatok nem így van), de…" bridge-ed, a videó CTA, nyomásmentes zárás. A törzs
ígéretét a **VSL** fejti ki (landing kinek, admin-automatizálás kinek). Ez a te szöveged — a rendszer
csak beilleszti az icebreaker után.

⚠️ **A videó a te feladatod:** vedd fel a ~2 perces VSL-t (mit kap, proof, nulla kockázat), MIELŐTT a
kampány kimegy — az email erre ígér igent.

## Mérés (Instantly)

Cél-referencia: a korábbi validált rendszered 10–20% reply rate. Ha ez alá megy, ELŐBB az icebreaker
konkrétságát/egyediségét nézd (2. szabály), csak utána a törzset.
