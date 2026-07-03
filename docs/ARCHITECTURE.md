# ARCHITECTURE — mi hol fut

> Az architektúra egyetlen igazsága. A kód ehhez illeszkedik.

## Stack
- **Next.js (TypeScript), App Router** — egyetlen full-stack app: React frontend + API route-ok (backend).
- **PostgreSQL** — Dockerben (docker-compose), Supabase-kompatibilis sémával.
- **Prisma** — ORM + migrációk + típusgenerálás.
- **Külső API-k:** Firecrawl (weboldal-scrape), Gemini (analízis + icebreaker). Kulcsok `.env`-ből.
- **Nincs** Apify/Instantly API — a határ CSV import / CSV export.

## Rétegek (fentről lefelé a kérésnél, lentről felfelé az építésnél)
```
UI (React, App Router pages)                    ── felület
  └── API routes (/app/api/*)                   ── belépési pont
        └── Services (lib/services/*)           ── üzleti logika, egy forrás-igazság
              ├── firecrawl client (lib/firecrawl)
              ├── gemini client   (lib/gemini)
              └── prisma client   (lib/db)      ── adat
                    └── PostgreSQL              ── tárolás
```

## Elvek a kódszervezésben
- **Service réteg a logikának.** Minden Firecrawl/Gemini/DB-műveletet service-függvény burkol
  (`lib/services/*`). Az API route-ok vékonyak: bemenet-validálás → service hívás → válasz.
- **Egy kliens, egy helyen.** Firecrawl és Gemini kliens egy-egy modul; minden hívó ezt importálja
  (nincs szórt fetch a route-okban).
- **Prompt-katalógus.** A Gemini promptok egy helyen (`lib/gemini/prompts`), verziózva/kommentelve —
  ez a generálás forrás-igazsága, nem beégetett stringek a route-okban.
- **Pipeline-vezérlő.** A státusz-átmeneteket (IMPORTED→SCRAPED→…) egy helyen kezeljük, hogy a szabályok
  (fail-closed, cache) ne szóródjanak szét.

## Futtatás / infra
- `docker-compose.yml`: Postgres szolgáltatás (perzisztens volume). Az app fejlesztéskor `next dev`
  a hoston, DB Dockerben. (Opcióként az app is konténerizálható később.)
- `.env` / `.env.example`: `DATABASE_URL`, `FIRECRAWL_API_KEY`, `GEMINI_API_KEY`.
- Migráció: `prisma migrate dev` lokál, `prisma migrate deploy` (Supabase-re is ez megy majd).

## Supabase-út (későbbi)
- A Postgres séma + migrációk Supabase-re pusholhatók (`prisma migrate deploy` a Supabase DATABASE_URL-lel).
- Ezért: nincs SQLite-izmus, nincs lokál-only feature a sémában (CONSTITUTION 2.).
