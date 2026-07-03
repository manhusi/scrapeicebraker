# CONSTITUTION — áthághatatlan szabályok

> Egy helyen a korlátok, hogy ne fejből kelljen tartani őket, és a rendszer rollback-barát maradjon.
> Ha egy szabályt meg kell szegni, az explicit döntés a felhasználóval — sose csendben.

## Adat & séma
1. **Séma csak Prisma migrációval.** Sose kézi `ALTER`/`CREATE` az élő DB-n. A séma forrás-igazsága a
   `prisma/schema.prisma` + a migrációk.
2. **Supabase-kompatibilis Postgres.** Standard Postgres feature-ök; semmi SQLite-specifikus.
   A cél: a séma és a migrációk 1:1 pusholhatók legyenek Supabase-re.
3. **Zárt katalógusok.** Új szegmens, státusz, tábla, route CSAK explicit döntéssel, spec-first
   (`DOMAIN.md` frissítése) — sose menet közben „kitalálva".

## Külső API (Firecrawl, Gemini) — pénz és fail-closed
4. **Idempotencia + cache.** Ugyanazt a weboldalt/leadet nem scrape-eljük/generáljuk kétszer feleslegesen.
   Már meglévő eredmény újrahasználódik, hacsak nincs explicit „újra" kérés.
5. **Fail-closed, a lead sose vész el.** Hibánál a lead státusza `*_FAILED` lesz, a hiba naplózva,
   a folyamat többi része megy tovább. Egy elesett lead nem dönti be a batch-et.
6. **Rate-limit + retry.** Külső hívás mindig kötegelt, tempózott, exponenciális retry-jal.
7. **Kulcsok `.env`-ben.** `FIRECRAWL_API_KEY`, `GEMINI_API_KEY` sose kódban, sose gitben.
   `.env.example` mutatja a szükséges kulcsokat, a valódi `.env` gitignore-olt.

## Kód & logika
8. **Egy forrás-igazság.** Ha egy logika/prompt/érték két helyen kell, EGY modulba emeljük, amit minden
   hívó importál. Másolás tilos (elcsúsznak és csendben hazudnak).
9. **Rétegenként építünk.** Kontraktus (séma/típus) → adat (migráció) → logika (service/endpoint) →
   felület (UI). Egyszerre egy réteg, mindegyik a stabil alsóra épül.
10. **Verifikáció valóságban.** „Kész" = bizonyítva. Pure logika → unit teszt. Endpoint/UI → tényleges
    futtatás valós eredménnyel. Sose „nézd meg kézzel", sose feltételezés.

## Küldés & biztonság (kimenő üzenetek)
11. **A rendszer nem küld — csak CSV-t exportál.** A tényleges kiküldés Instantly-ben, emberi kézzel
    történik. Nincs automatikus e-mail-küldés ebből az appból (amíg nincs explicit döntés az Instantly API-ról).
12. **Semmi kimenő üzenet emberi jóváhagyás vagy explicit auto-mód beállítás nélkül.** Az auto/hibrid
    kapcsoló globális Setting, alapértéke **hibrid** (jóváhagyás kötelező).
