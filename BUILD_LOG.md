# Build log

The honest record of how this got built, kept for the DEV Sanity Challenge
writeup. Append at the end of every session, including the parts that went badly.

---

## Day 1 — 20 Sep 2026 · Scaffold and schema

**Goal:** milestone M0 from the PRD — project set up, data model in place, seed data ready.

**Done**

- `create-next-app` (TypeScript, App Router, no Tailwind). Plain CSS Modules, because `DESIGN.md` is written as CSS custom properties and an extra build layer would only get in the way.
- Installed `sanity` v6, `next-sanity` v13, vision, image-url. Studio embedded at `/studio` rather than as a separate repo, so there is one deploy and one place to run things.
- Nine document types written by hand (not generated): `area`, `waterSource`, `report`, `waterCase`, `alert`, `safetyLimit`, `advice`, `contact`, `riskSettings`.
- Studio desks that match how work arrives: Needs verification → Active alerts → Unmapped reports, then reference data.
- `scripts/make-seed.mjs` generates 28 sample documents (6 IS 10500 limits, 4 advice texts, risk settings, 3 people, 10 areas on a grid, 4 water sources). City and coordinates are environment variables, so the demo can move to any city.
- Design tokens from `DESIGN.md` in `app/globals.css`, both themes. Fonts: Baloo 2 + Hind, both loaded with the Devanagari subset so Hindi never falls back.
- The golgappa glyph component: four states where the shape differs, not just the colour.
- Home page renders the area list and, when the Sanity env vars are missing, renders the setup steps instead of crashing. Worth doing early — it means the UI can be built before the Sanity project exists.

**Decisions worth writing up**

- *Evidence and decisions are different documents.* A `report` never becomes an `alert`; a `waterCase` links them. This is what lets an alert show exactly which reports it rested on.
- *Reports are append-only.* Corrections are new reports. An edited evidence trail is not evidence.
- *Limits are content, not constants.* `safetyLimit` documents carry the IS 10500 clause as a citation, so a wrong threshold is a content fix, not a deploy.
- *Area state is derived but stored,* with a reason and a timestamp, so the map is one query and every golgappa can explain itself.

**Not done / known gaps**

- No Sanity project yet — needs a human to run `sanity login`. Everything below the env vars is untested against a real dataset.
- IS 10500 values were written from memory and still need checking against the official BIS text before the demo.
- No map, no report form, no workflow, no Control Room yet.

**Verified**

- `npx tsc --noEmit` clean.
- `npm run dev` boots; `/` renders the setup card correctly in dark mode.

---

## Day 1, later — 20 Sep 2026 · The whole spine, before the backend exists

Asked to stop working to the day-by-day plan and just build. Everything below was
written against the schema without a live Sanity project, which turned out to be
possible because of the `sanityConfigured` guard from the morning.

**Done**

- **Map and area pages.** Leaflet with OpenStreetMap tiles; the pin is the golgappa
  glyph as a `divIcon`, so both themes work through CSS variables rather than baked
  colours. Area pages show the state, the reason, 14 days of anonymised reports,
  and a "How this is decided" disclosure with the actual arithmetic.
- **Report flow.** Four steps, one question per screen: where → what you noticed →
  anyone ill → optional readings. Geolocation with a manual area picker as the
  fallback, never a dead end.
- **Report route.** Whitelisted fields, clamped numbers, salted device hash (no IP
  addresses), 3 reports per device per area per day, and point-in-circle area
  matching. Reports outside every area are kept, not dropped.
- **Risk scoring** as pure functions in `lib/risk.ts`, with 7 tests including the
  PRD's Sector 14 example (7 points → needs verification), the three-taps-from-one-phone
  case, and the bacteria override.
- **Case engine** in `sanity/lib/cases.ts`: intake → score → watch | needs
  verification → human decision → alert → resolved → closed, plus source tracing
  and Open-Meteo rainfall.
- **Two control rooms.** `/control` in the Next app (passphrase, so judges can use
  it without a Sanity login) and `control-room/`, the App SDK app for the Sanity
  Dashboard. Both write the same fields; confirming from the App SDK writes the case
  decision and the alert in one transaction.
- **The workflow definition.** `sanity/workflows/waterCase.ts` passes
  `defineWorkflow`'s own validator — the engine rejected the first version twice
  (name had to match `^[a-z0-9][a-z0-9-]*$`, and every activity needs an action
  carrying `status: 'done'` or the stage gate wedges), which is how I know the
  definition is real and not decorative.
- **Studio input** that draws a reading against its limit, sharing the component
  the control room uses.
- 11 tests, `npx tsc --noEmit` clean in both packages, and `next build` green.

**What went wrong**

- `defineLive` is exported from `next-sanity/live`, not the package root.
- `next build` failed on `/api/report`: the env module threw at import time, so a
  build with no Sanity project was impossible. Rewrote `sanity/env.ts` to fall back
  to a placeholder project id and let one guard (`sanityConfigured`) decide whether
  a query ever runs.
- Node's test runner needed `allowImportingTsExtensions` in tsconfig before
  `--experimental-strip-types` would accept `./risk.ts` imports.

**Deliberately not done**

- Photo upload on the report form — asset uploads need the write token path
  designed properly, and the readings carry more weight than a blurry photo.
- Sanity Functions deployment. The scheduled tick runs as a Vercel cron for now
  (`vercel.json`), calling the same `tick()` a Sanity scheduled Function will call.
- Hindi throughout the UI. The content is bilingual in the dataset (advice, area
  names, alert precautions); the interface is still English.

**Still blocked on a human**

`sanity login` → `sanity init` → import the seed. Nothing above has run against a
real dataset yet, so every query is unproven.

---

<!-- Next session: append "## Day 2 — …" here. Record prompts that failed too. -->
