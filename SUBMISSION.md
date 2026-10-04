---
title: "Pani Kaisa Hai? A golgappa map that warns a neighbourhood about bad water, but only after a human checks"
published: false
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

<!-- Draft. Replace the agent session TODO, then delete this comment before publishing. -->

## What I Built

Every golgappa wala in India gets asked the same thing before the first bite: *pani saaf hai na?* Is this water clean?

Nobody asks that about their own tap, borewell or tanker, even though contaminated supply is one of the most common ways a whole neighbourhood falls sick at once. The signs show up early (a sewage smell, yellow water, two kids in the same lane with loose motions) but they stay scattered across WhatsApp groups until it is too late.

**Pani Kaisa Hai?** collects those signs in under a minute, adds them up per neighbourhood against India's drinking water standard (IS 10500) and, only when the risk is real, asks a local health worker to confirm before anyone is warned.

Every neighbourhood is a golgappa on the map:

| | State | What it means |
|---|---|---|
| 🟢 | **Crisp** | No credible signal |
| 🟡 | **Soggy** | Complaints rising, boil or filter first. This one is automatic |
| 🔴 | **Phoot gaya** | Contamination confirmed by a named person. Never automatic |
| ✨ | **Fresh batch** | Fix recorded, area recovering |

The rule the whole thing rests on: **software can make a golgappa soggy, only a person can make it burst.** An AI check can score a case and push it as far as "needs verification". It can never confirm or dismiss one. Every red alert carries the name of the person who confirmed it and the reason they gave.

It is for residents, ASHA workers and residents' association volunteers in Indian cities. The demo runs on sample data for Indore.

## Demo

**Live:** https://pani-kaisa-hai.vercel.app

- `/` the golgappa map, the stall and **Shake the golgappa**, a simulator that runs the app's real scoring code. Pile on signals and watch it go soggy on its own, then notice the "health worker confirms" button stays locked until there is evidence for a person to look at
- `/area/sector-14` an area page with the state, the reason and the arithmetic behind it
- `/report` the four step report form
- `/control` the verifier queue. **Passphrase: `pani-demo`**
- `/studio` the embedded Sanity Studio

{% embed https://youtu.be/EbuvB2EyRbg %}

A 98 second walkthrough told as a story. The frames are the live site, captured by a script; the narration is Murf's Hindi voice Shweta.

![The landing page: a golgappa stall asking "is this pani clean?"](https://raw.githubusercontent.com/Reet24-del/pani-kaisa-hai/main/docs/screenshots/landing.jpg)

![The map: nine crisp golgappas and one burst in Sector 14](https://raw.githubusercontent.com/Reet24-del/pani-kaisa-hai/main/docs/screenshots/map.jpg)

![Step one of the report form: where are you?](https://raw.githubusercontent.com/Reet24-del/pani-kaisa-hai/main/docs/screenshots/report.jpg)

![Sector 14 after a health worker confirmed it: Phoot gaya, what to do in English and Hindi, and who confirmed it and why](https://raw.githubusercontent.com/Reet24-del/pani-kaisa-hai/main/docs/screenshots/area-phoot-gaya.jpg)

![The control room: an empty queue and the Sector 14 alert with its verifier and reason](https://raw.githubusercontent.com/Reet24-del/pani-kaisa-hai/main/docs/screenshots/control-room.jpg)

> Early warning from residents, not a lab test. All data in the demo is sample data.

## Code

https://github.com/Reet24-del/pani-kaisa-hai

Next.js 16 (App Router, TypeScript, plain CSS Modules), Sanity Studio v6 embedded at `/studio`, an App SDK control room in `control-room/`, a Workflows definition in `sanity/workflows/`, Leaflet with OpenStreetMap tiles. 29 tests cover the risk score, the case rules (including "only a person can confirm"), the report input rules, the workflow definition and a lint for GROQ date comparisons.

## My Build Process

I built this with Claude Code over about seven sessions between 19 September and 4 October and I kept a build log the whole way (`BUILD_LOG.md` in the repo), including the parts that went badly. This section is the short version.

### Day 1: schema first, then the whole spine before the backend existed

I started with the data model, not the UI, because the product only works if evidence and decisions are kept apart:

- **`report`** is one resident's observation and it is **append-only**. Corrections are new reports, never edits. An edited evidence trail is not evidence.
- **`waterCase`** groups reports in one area and carries the verification status.
- **`alert`** is a confirmed warning and cannot exist without a `verifiedBy` and a written reason.
- **`safetyLimit`** and **`riskSettings`** hold the rules as *content*. IS 10500 thresholds carry their clause as a citation, so a wrong number is a content fix in the Studio, not a deploy.
- **`waterSource.areasServed`** stores the source to area link once and areas read it back with `references()`.
- Area state is derived but **stored**, with a reason and a timestamp, so the map is one query and every golgappa can explain itself.

Nine document types, written by hand. The Studio desk is laid out the way work arrives: Needs verification → Active alerts → Unmapped reports, then reference data.

Then I asked Claude to stop following the day-by-day plan and just build, before I even had a Sanity project. That worked because of one early decision: when the Sanity env vars are missing, the home page renders setup steps instead of crashing. One guard (`sanityConfigured`) decides whether any query runs at all, so the whole UI could be built against the schema first.

In that session: the map and area pages, the four step report form, the report API (whitelisted fields, clamped numbers, a salted device hash instead of IP addresses, 3 reports per device per area per day), the risk score as pure functions with tests, the case engine and both control rooms.

**What went wrong on Day 1:**

- `defineLive` comes from `next-sanity/live`, not the package root.
- `next build` failed because the env module threw at import time, so a build with no Sanity project was impossible. I rewrote it to fall back to a placeholder project id.
- Node's test runner needed `allowImportingTsExtensions` before `--experimental-strip-types` would accept `.ts` imports.

### Reaching past the Studio: Workflows and the App SDK

**Workflows.** The verification flow lives in `sanity/workflows/waterCase.ts` as data: intake → score → watch or needs verification → human decision → alert → resolved → closed. The AI check is a system actor that can move a case as far as `verification`. Confirming or dismissing sits in a `decide` activity whose actions are gated on the `verifier` role. An agent and a person use the same transitions, only the person can take the last one.

The engine's own validator rejected my first version twice. The workflow name had to match `^[a-z0-9][a-z0-9-]*$` and every activity needed an action carrying `status: 'done'` or the stage gate wedges. That is how I know the definition is real and not decorative.

Being honest about where it stands: Workflows is in early access and the engine is not deployed on my project yet. Until it is, the same stages and the same human-only guard run through `sanity/lib/cases.ts`, which the report route and both control rooms call. The workflow file passes `defineWorkflow`'s validator and has tests.

**App SDK.** `control-room/` is a custom app for the Sanity Dashboard: the verifier queue with live data, the evidence for each case and the confirm or dismiss decision. Confirming writes the case decision and the alert in one transaction. There is also a `/control` page in the Next app behind a passphrase, so judges can try it without a Sanity login. Both write the same fields.

**Custom Studio input.** Readings are drawn against their limit in the Studio, using the same component the control room uses, so an editor sees "780 mg/L, over the 500 acceptable limit" instead of a bare number.

### Day 2: the theme and a hard lesson about drawing people

The first palette was cool mint, which is wrong for a golgappa. I rebuilt the tokens from the stall itself: sand, tamarind, saffron, roasted brown, imli pani, fried puri.

**What failed.** I wanted a girl at the stall, pouring pani into a golgappa and reacting to each section as you scroll. Claude hand-drew her in SVG over three passes. The face worked, the arms never did: stroked limbs with separate hand shapes leave a lump where the outlines cross. After the third try the honest call was that hand-authoring a natural human figure in raw SVG paths was not going to get good, so we stopped iterating.

**What worked.** I generated her instead. One reference image from a detailed prompt, then three more moods generated *from that image as the reference*, changing only pose and expression, which is what kept her the same person. Backgrounds were cut out locally with `sharp` (flood-fill from the border, clear the big white gaps in the hair, keep small ones like eye whites, recolour the feathered edge so there is no white fringe on the dark theme). About 42 KB per pose as WebP. The image tool's schema was opaque, the free plan allowed one job at a time and I ran out of credits after four images, so the fifth mood reuses a pose.

**Scroll bug.** The first version used an IntersectionObserver and got silently stuck, because the figure itself carried `data-mood` so the observer kept picking her own mood. Then the footer never triggered because it is too short to reach the middle of the screen. One check per animation frame replaced both.

### Day 3: dressing the page as an actual stall

Feedback was that the girl was right but the page still read like a SaaS template. So it became a thela: a scalloped awning with bunting in pure CSS, a signboard headline with पानी painted huge behind it, an LED ticker reading every area's state off Sanity, a chalkboard "Aaj ka menu" with the action where the price would be and the **Shake the golgappa** simulator running the real `scoreReports` from `lib/risk.ts`.

**Bug caught by clicking, not by reading:** three fast clicks on "+" counted two, because the stepper computed `value + 1` from a stale render. Functional updates fixed it.

### Deploy day

- Vercel refused the first deploy: the Hobby plan only allows daily cron jobs and my `vercel.json` ran the case tick every 15 minutes. The tick only closes quiet cases and returns recovered areas to Crisp, so daily is enough.
- I finally checked the IS 10500 numbers I had written from memory on Day 1. Every value was right, but two **citations** were wrong (chlorine is in Table 2, bacteria in Table 6). Because limits are content, the fix was a three document patch, not a code change. That was the schema decision paying off.
- The hero said "Indore · live" right under a banner saying "Sample data". It now says demo.

### 3 October: auditing the decision path

I asked Claude to rate the project as a judge would. It gave functionality a 7, so I asked what would make it a 9.5. The answer was an audit of every path from report to alert, and it found real bugs:

- **The App SDK control room only ever wrote drafts.** `@sanity/sdk` edits the draft unless the document handle says `liveEdit: true`. Confirming in the Dashboard made a draft alert the public site never saw. Now the decision, the alert and the area turning red go in one live-edit transaction.
- **"Mark fixed" had no button,** so Fresh batch was unreachable from the control room.
- **A case could be confirmed twice,** which made two alerts. Decisions now act only on cases waiting for a person, every write is guarded by the case `_rev`, and the alert id is derived from the case.
- **Server actions trusted the page.** Server actions are public endpoints, so each one now checks the sign-in itself.
- **A reporter's phone number was one GROQ query away** on a public dataset. Contact details now live in `private.contact.<reportId>` documents. Ids with a dot sit on a path that Sanity never returns to unauthenticated requests.
- **A date filter never matched.** `submittedAt` is a string, and comparing it to `dateTime(now())` without `dateTime()` was always false. Area pages showed no reports and the rate limit never fired. There is now a test that scans every GROQ string for that mistake.

The case rules became pure functions with tests, so "the scorer can raise a case to needs verification and never past it" is tested directly. Tests went from 11 to 29.

### The last evening: a check from a stale copy

On the last evening I asked a local Claude Code session "what is left". It read an old copy of the project on my Mac that had no git remote and stopped at 21 September, so its first answer was confidently wrong. The mistake surfaced when a CLI deploy from that folder was **blocked** by Vercel: its commits were authored with an email the Hobby plan doesn't accept. That block saved me, because the deploy would have replaced the day's fixes with week-old code. Comparing the blocked deploy's metadata with the live one showed where the real repo was.

It still found things worth fixing. `/api/cron/tick` would run for anyone, because the secret check only ran *if* `CRON_SECRET` was set, and it wasn't. Now the secret is set and the route fails closed on any deployment. The citation fix had been written but never run against the live data. Two old write tokens from before the rotation were still active, and are now deleted. Then I confirmed the Sector 14 case myself in the control room and watched the area go red on the map.

### What I deliberately did not build

- Photo upload on reports. Asset uploads need the write token path designed properly and a reading carries more weight than a blurry photo.
- Sanity Functions. The scheduled tick runs as a Vercel cron calling the same `tick()` a scheduled Function would.
- A Hindi interface. The *content* is bilingual (area names, advice, alert precautions), the UI chrome is still English.

## Sanity Project Details

- **Project ID:** `ya4g5th1`
- **Dataset:** `production` (public)
- Schema: `sanity/schemaTypes/` (9 types), workflow: `sanity/workflows/waterCase.ts`, App SDK app: `control-room/`

## Agent Session

TODO: embed the build session (19 to 21 September, from the first idea to the stall redesign). The file is `agent-session/build-session-19-21-sep.jsonl` on my Mac, with the pasted token and the local passphrase already redacted. Upload it at https://dev.to/agent_sessions/new, click **Make Public** and paste the embed here.
