# Pani Kaisa Hai? — notes for agents

A golgappa-faced early-warning app for unsafe neighbourhood drinking water.
Built for the DEV Sanity Challenge, Path 2. Deadline: 4 Oct 2026.

## Read first

- `DESIGN.md` — colours, type, the golgappa glyph rules, component and screen specs. Follow it; don't invent new tokens.
- `BUILD_LOG.md` — append to it every session. The challenge judges the honesty of the build writeup above everything else, so record the prompts that failed too.

## Stack

Next.js 16 (App Router, TypeScript, plain CSS Modules — no Tailwind) · Sanity v6 Studio embedded at `/studio` · Sanity Functions and Workflows (later milestones) · App SDK Control Room (later, separate app).

## Shape of the data

Evidence and decisions are separate document types, and that separation is the point of the project:

- `report` — one resident's observation. **Append-only**: corrections are new reports, never edits.
- `waterCase` — groups reports in one area and carries the verification status.
- `alert` — a confirmed warning. Always has a named `verifiedBy`.
- `safetyLimit` / `riskSettings` — the rules, kept as content so they can be corrected without a deploy.
- `waterSource.areasServed` stores the source → area relationship **once**; areas read it back with `references()`.

## Rules that must not be broken

1. Only a human can confirm or dismiss a case. An AI check may score a case and move it to `needsVerification`, never past it.
2. No alert exists without a verifier and a written reason.
3. Public pages never show a reporter's exact location, contact details, or a suspected source before confirmation.
4. Every public page carries "Early warning from residents, not a lab test."
5. The write token stays server-side. `getWriteClient()` is for route handlers and Functions only.

## Commands

```bash
npm run dev                                              # app + studio
node scripts/make-seed.mjs                               # writes seed.ndjson
npx sanity dataset import seed.ndjson production --replace
npx tsc --noEmit
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
