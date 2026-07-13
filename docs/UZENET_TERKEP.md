# ÜZENET-TÉRKÉP — kulcsszó → email-irányultság (angle)

> Bővíthető térkép. Bal oldalon a kulcsszó-csoport, jobb oldalon hogy MELYIK email-angle megy rá és MIÉRT.
> Az angle-ök teljes szövege lent (2. rész). Új kulcsszó jön → a 3. rész sablonsorával bővíted.
> Kapcsolódó: `docs/CELPIAC.md` (a kulcsszavak), `docs/OUTREACH_UZENET.md` (a V7/V8 törzs-audit),
> `docs/ICEBREAKER.md` (a personalizált nyitó, ami MINDEN angle előtt ugyanúgy fut).

---

## 0. Az alapelv — a váz közös, a DIAGNÓZIS + PROOF cserélődik

Minden email ugyanaz a csontváz (ez a validált V7 struktúra):

```
{icebreaker: personalizált, Gemini}   ← MINDIG ugyanúgy készül, angle-független (ICEBREAKER.md)
{pivot: "Amúgy a hirdetésetekbe futottam bele…"}   ← közös
{DIAGNÓZIS: mi a rés náluk}           ← EZ VÁLTOZIK angle szerint
{PROOF: a te konkrét számod}          ← EZ VÁLTOZIK angle szerint
{videó CTA: "Csináltam egy 2 perces videót… Átküldhetem?"}   ← közös
{soft close: "Ha nem aktuális, az is oké."}   ← közös
Üdv, Bálint / Az iPhone-omról küldve  ← közös
```

Tehát nem 3 külön emailt találsz ki nulláról — **egy bizonyított vázban cserélsz ki 2 mondatot.**
A videó minden angle-nél ott van a végén; a különbség az, hogy a levél MI FELÉ hangolja a fejet,
mielőtt igent mond a videóra.

**Operatív modell:** mivel a leadeket úgyis kulcsszó-batchenként importálod, a legtisztább, ha
**egy batch = egy kampány = egy angle**. Az adott kampány „Közös ajánlat" törzsébe az az angle megy,
amit a térkép mond. Nem kell leadenként dönteni — a kulcsszó már eldöntötte.

---

## 1. A 3 ANGLE — mit adsz el és kinek

Te bármit vállalsz (kreatív, landing, hirdetéskezelés, automata). Ezért nem a szolgáltatás a kérdés,
hanem hogy **melyik rés a legfájóbb annak a kulcsszónak**, és melyik proofod üt rá a legjobban.

| Angle | A rés, amire ráüt | A proof mögötte | Kinek a legjobb |
|---|---|---|---|
| **A) Anti-reklám** (kreatív + hirdetéskezelés) | „a hirdetésed egy pillanat alatt reklámnak látszik, ezért továbbgörgetik" | 418 → 1094 jelentkező ugyanabból a büdzséből; Wayfinite 64k követő 0 Ft-ból | **Bárki, aki hirdet.** Ez a legszélesebb és a te megkülönböztetőd (ügynökség nem gyárt gyilkos UGC-t). High-ticketnél a legjobb, mert ott egy jobb kreatív = sok pénz. |
| **B) Landing / konverzió** (Wohnen-játék) | „a hirdetés idehozza, de a kattintás egy kaotikus oldalon/webshopon elszivárog" | mobil faház: hirdetés + konvertáló landing | Ahol a KATTINTÁS UTÁN vész el a pénz: gyártók, drága termékek, webshopok gyenge oldallal. |
| **C) Foglalás / automata** (Kacatanya-játék) | „megvan az érdeklődő, de a foglalás/jelentkezés/fizetés kézi, és közben kihűl vagy elvész" | kacatanya.hu: dupla foglalás, 0 perc admin | Ahol az ADMIN a szűk keresztmetszet: szálláshelyek, táborok, időpontos szolgáltatások. |

**Döntési szabály (melyik menjen egy kulcsszóra):**
1. Ha a fő fájdalom a **kézi foglalás/jelentkezés/időpont** → **C**.
2. Ha ad, de a **kattintás utáni oldal** a gyenge (webshop, gyártó katalógus-oldala) → **B**.
3. Minden más esetben, és ha bizonytalan → **A**. Az anti-reklám az alapértelmezett, mert
   mindenkinek igaz, aki hirdet, és ez a te fegyvered, amit más nem ad.

> **Bálint-szempont (high-ticket szűrő):** az A angle-t vidd előre a magas jegyárú körökre
> (fogászat, hajbeültetés, faház, ablak, napelem), mert ott egy retainer könnyen kitermeli magát.
> A kis-ticketes körök (műköröm, fodrász) mehetnek, de a volumen-játék, nem a retainer-játék.

---

## 2. AZ ANGLE-ÖK TELJES SZÖVEGE

Mindegyik az `{icebreaker}` UTÁN kezdődik (a Gemini-nyitó a levél elején van, angle-független).

### A) ANTI-REKLÁM — kreatív + hirdetéskezelés (a legszélesebb, ez a default)

```
Amúgy a hirdetésetekbe futottam bele, úgy jutottam el hozzátok.

(Lehet, nálatok pont bejön), de a legtöbb hirdetésnél ugyanaz a baj: egy pillanat alatt
látszik rajta, hogy reklám, és az ujjuk már görget is tovább.

Én olyan videókat csinálok, amikről senki nem mondja meg, hogy hirdetés — organikus posztként
olvadnak a feedbe, ezért végig is nézik. Egy éles kampányban ugyanakkora napi büdzséből az
ügynökségi plakát 418 jelentkezőt hozott, ugyanez videóban 1094-et.

Csináltam egy 2 perces videót arról, hogy a ti terméketekből milyen ilyet hoznék ki. Átküldhetem?

Ha nem aktuális, az is oké.

Üdv, Bálint
Az iPhone-omról küldve
```

Miért működik: a diagnózis (`reklámnak látszik → továbbgörgetik`) mindenkinek igaz, aki hirdet,
és a proof egy nyers számpár a saját kampányodból, nem egy jelző. A „terméketekből" szó a végén
finoman személyre húzza, de bármelyik iparágra igaz marad.

### B) LANDING / KONVERZIÓ — Wohnen-játék (gyártó, drága termék, webshop)

```
Amúgy a hirdetésetekbe futottam bele, úgy jutottam el hozzátok.

(Remélem, nálatok nem így van), de a legtöbbeknél ugyanazt látom: a hirdetés idehozza az
érdeklődőt, aztán a kattintás után egy zsúfolt oldalon elveszik, mielőtt tényleg vevő lenne belőle.

A mobil faházas ügyfélnél pont ezt raktuk helyre: a hirdetésből nem a katalógus-főoldalra,
hanem egy tiszta, egyetlen döntésre kihegyezett oldalra érkeztek — és érezhetően többen mentek
végig a jelentkezésig.

Csináltam egy 2 perces videót arról, hogy nálatok hol csúszik el ez az út, és mit lehet vele
kezdeni. Átküldhetem?

Ha nem aktuális, az is oké.

Üdv, Bálint
Az iPhone-omról küldve
```

> ⚠️ Ebben a „mobil faházas ügyfélnél" proof cserélhető a Káca Tanyára is; a landing-résnél a faház
> a pontosabb proof. Ha van már landing-számod (pl. konverziós arány előtte/utána), az ide beírandó.

### C) FOGLALÁS / AUTOMATA — Kacatanya-játék (szállás, tábor, időpont)

```
Amúgy a hirdetésetekbe futottam bele, úgy jutottam el hozzátok.

(Remélem, nálatok gördülékeny), de a legtöbb helyen ugyanaz a szűk keresztmetszet: a hirdetés
elhozza az érdeklődőt, de a foglalás/egyeztetés kézzel megy, és közben páran kihűlnek vagy elvesznek.

A Káca Tanyánál pont ezt kötöttük össze: a jelentkezés, a fizetés és a számlázás magától lefut,
emberi kéz nélkül — dupla annyi foglalás lett, nulla perc adminnal, akár éjjel is.

Csináltam egy 2 perces videót arról, hogy nálatok hol lehetne ugyanezt automatizálni. Átküldhetem?

Ha nem aktuális, az is oké.

Üdv, Bálint
Az iPhone-omról küldve
```

---

## 3. A TÉRKÉP — kulcsszó-csoport → angle

Sorrend: elsődleges angle **vastagon**, zárójelben a másodlagos (ha kvalifikáláskor kiderül, hogy
inkább az fáj). A kulcsszó-részletek a `docs/CELPIAC.md`-ben.

### `custom_manufacturer` — egyedi / magas jegyárú gyártó
| Kulcsszó-csoport | Angle | Miért |
|---|---|---|
| dézsa, hordószauna, jégkád, jakuzzi, medence | **A** (B) | vizuális termék, videóban gyönyörű; a kreatív a wedge. Landing másodlagos. |
| mobilház, faház, konténerház, tiny house | **A** (B) | bizonyított terep; a faház-landing proof is a tiéd, könnyű B-re váltani. |
| ablak, nyílászáró, kapu, kerítés, garázskapu | **A** (B) | óriási hirdetői kör, high-ticket, unalmas plakátokkal hirdetnek → anti-reklám berobban. |
| napelem, hőszivattyú, klíma, kandalló | **A** | támogatás-vezérelt, tömeg hirdet egyforma kreatívval; a videó megkülönböztet. |
| egyedi bútor, konyhabútor, beépített szekrény | **A** (B) | vizuális, magas ticket. |
| pergola, télikert, teraszbeépítés, kertépítés | **A** | előtte-utána videó nagyot üt. |

### `product_ecom` — fix áras termék + hirdetés
| Kulcsszó-csoport | Angle | Miért |
|---|---|---|
| matrac, ergonomikus szék, bútor webshop | **A** (B) | erős hirdetők, a kreatív + landing a két rés. |
| lakberendezés, lámpa, szőnyeg, grill webshop | **B** (A) | itt gyakran a webshop-oldal a gyenge láncszem. |
| étrend-kiegészítő, kozmetikum, ékszer webshop | **A** | UGC-kreatív a műfaj lelke; ide jó a Wayfinite-proof is. |
| gyerekjáték, babatermék, kisállat webshop | **A** (B) | rajongó közönség, videóra hálás. |

### `booking_lodge` — foglalás-alapú szálláshely
| Kulcsszó-csoport | Angle | Miért |
|---|---|---|
| vendégház, apartman, panzió | **C** (A) | a kézi foglalás + OTA-jutalék a fő fájdalom. |
| glamping, jurta, A-frame, erdei kabin, lombház | **C** (A) | élmény-szállás, jó marzs; automata + (ha kell) jobb kreatív. |
| privát wellness, jakuzzis apartman, szaunás faház | **A** (C) | itt a „romantikus hétvége" kreatív is óriási, ezért A előre. |
| borbirtok / pincészet szállás | **C** (A) | csomag-foglalás automata. |

### `service_wellness` — időpont-alapú szolgáltatás
| Kulcsszó-csoport | Angle | Miért |
|---|---|---|
| fogászat, implantátum, hajbeültetés, plasztika | **A** (C) | LEGNAGYOBB büdzsék; drága nekik a lead → jobb kreatív = sok pénz. No-show ellen C másodlagos. |
| szépségszalon, sminktetoválás, kozmetika | **A** (C) | vizuális eredmény, videóra tökéletes; időpont-automata másodlagos. |
| masszázs, gyógytorna, személyi edző, jóga stúdió | **C** (A) | bérletes/időpontos, a no-show és a holtidő fáj. |
| autókozmetika, detailing, autófóliázás | **A** | előtte-utána videó műfaj. |

### `event_program` — program / tábor / foglalkozás
| Kulcsszó-csoport | Angle | Miért |
|---|---|---|
| gyerektábor, sporttábor, művészeti/robotika tábor | **C** (A) | szülő fizet előre, a jelentkezés-Excel a fájdalom. |
| jóga elvonulás, workshop, főzőtanfolyam, borkóstoló | **C** (A) | jelentkezés + fizetés automata; a „elvonulás" kulcsszó C-vel már működött. |
| élményvezetés, tandemugrás, szabadulószoba, quad | **A** (C) | erős vizuális élmény → videó-kreatív előre. |
| csapatépítés, rendezvényhelyszín, esküvői helyszín | **C** (A) | ajánlatkérés + foglalás automata. |

---

## 4. SABLONSOR — így bővítsd a térképet

Új kulcsszó jön? Tedd fel 3 kérdést, és a válasz megadja az angle-t:

1. **Kézi a foglalás/jelentkezés/időpont náluk?** → ha igen, **C**.
2. **Ad, de a kattintás utáni oldal (webshop/katalógus) gyenge?** → ha igen, **B**.
3. **Egyébként / high-ticket / erős vizuális termék?** → **A**.

Aztán írd be egy sorba a megfelelő archetípus táblájába:

```
| <új kulcsszó-csoport> | **<A/B/C>** (<másodlagos>) | <egy fél mondat: miért ez a rés a legfájóbb> |
```

## 5. Nyitott döntések / TODO

- [ ] A győztes törzs (V7/V8) beírása a `/settings`-be — ez ma nyitott (ROADMAP Fázis 12).
- [ ] A B és C angle proof-számának élesítése: ha lesz landing-konverziós számod és foglalás-növekmény
      számod, cseréld a jelzős fordulatokat („érezhetően többen") konkrét számra, ahogy az A-nál a 418→1094.
- [ ] Angle-onként külön kampány-teszt: melyik angle hozza a legjobb pozitív rátát AZONOS kulcsszó-körön
      (pl. faház: A vs B). Egyszerre egy változó (lásd OUTREACH_UZENET.md 4. pont).
- [ ] Follow-up (F1/F2) az OUTREACH_UZENET.md-ből MINDEN angle alá bemegy, változatlanul.
