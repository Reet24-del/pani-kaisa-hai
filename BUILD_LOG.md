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

<!-- Next session: append "## Day 2 — …" here. Record prompts that failed too. -->
