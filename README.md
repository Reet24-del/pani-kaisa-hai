# Pani Kaisa Hai? 💧

**Is the water in your area safe today?**

Residents report signs of unsafe tap, borewell or tanker water in under a minute.
The app groups reports by neighbourhood, checks them against India's drinking-water
standard (IS 10500) and, only when the risk is high, asks a local health worker to
confirm before any alert goes out.

Every neighbourhood is a golgappa on the map:

| | State | Meaning |
|---|---|---|
| 🟢 | **Crisp** | No credible signal |
| 🟡 | **Soggy** | Complaints rising — boil or filter first (automatic) |
| 🔴 | **Phoot gaya** | Contamination confirmed by a person (never automatic) |
| ✨ | **Fresh batch** | Fix recorded, area recovering |

> Early warning from residents, not a lab test.

A submission for the [DEV Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16), Path 2.

## Setup

```bash
npm install
npx sanity login
npx sanity init --env .env.local        # new project, dataset: production
node scripts/make-seed.mjs              # or: CITY="Bhopal" CITY_LAT=23.2599 CITY_LNG=77.4126 node scripts/make-seed.mjs
npx sanity dataset import seed.ndjson production --replace
npm run dev
```

- App: http://localhost:3000
- Studio: http://localhost:3000/studio

For accepting reports you also need a write token (sanity.io/manage → API → Tokens,
Editor rights) in `.env.local` as `SANITY_API_WRITE_TOKEN`. See `.env.example`.

## What's in it

| Surface | Where | What it does |
|---|---|---|
| Public site | `/` | Golgappa map, area pages, four-step report form |
| Studio | `/studio` | Manage areas, sources and limits; a custom input draws readings against their limit |
| Control room (web) | `/control` | Verifier queue, usable without a Sanity login (passphrase) |
| Control room (App SDK) | `control-room/` | The same queue live inside the Sanity Dashboard |
| Workflow | `sanity/workflows/waterCase.ts` | The stages as data; passes the engine's validator |

```bash
npm test            # risk scoring + the workflow definition
npm run workflow:check
npx tsc --noEmit
node scripts/demo-story.mjs   # plays the Sector 14 story against a running app
```

## Layout

```
app/                       public site, /studio, /control, API routes
components/                shared UI (the golgappa glyph lives here)
control-room/              App SDK app for the Sanity Dashboard
lib/risk.ts                the score, as pure functions (+ tests)
lib/ai.ts, lib/email.ts    the AI summary and the municipal alert
sanity/schemaTypes/        the nine document types
sanity/lib/cases.ts        intake, scoring, decisions, the scheduled tick
sanity/workflows/          the water-case workflow definition
scripts/                   seed generator, demo story
DESIGN.md                  design system: tokens, components, screens
AGENTS.md                  rules for AI coding sessions
BUILD_LOG.md               how this was actually built
```

## The rule that makes it trustworthy

An AI check can score a case and push it as far as *needs verification*. It can
never confirm or dismiss one. Every alert carries the name of the person who
confirmed it and the reason they gave.

All data in this repo's seed file is **sample data**.
