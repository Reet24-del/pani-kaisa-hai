#!/usr/bin/env node
/**
 * Plays the Sector 14 story from the PRD against a running app, so the demo
 * video can be recorded in one take.
 *
 *   node scripts/demo-story.mjs                       # localhost:3000, first area
 *   BASE=https://… AREA=sector-14 node scripts/demo-story.mjs
 *
 * Three neighbours report a smell, one household is ill, one TDS reading is
 * over the limit: score 7, which sends the case to the control room.
 */

const BASE = process.env.BASE || 'http://localhost:3000'
const AREA_SLUG = process.env.AREA || 'sector-14'
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

if (!PROJECT_ID) {
  console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID (it is in .env.local) before running this.')
  process.exit(1)
}

const groq = async (query) => {
  const url = `https://${PROJECT_ID}.api.sanity.io/v2026-09-20/data/query/${DATASET}?query=${encodeURIComponent(query)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`GROQ failed: ${response.status}`)
  return (await response.json()).result
}

const area = await groq(
  `*[_type == "area" && slug.current == "${AREA_SLUG}"][0]{_id, name, "lat": centre.lat, "lng": centre.lng}`,
)
if (!area) {
  console.error(`No area with slug "${AREA_SLUG}". Import the seed data first.`)
  process.exit(1)
}

const tds = await groq(`*[_type == "safetyLimit" && code == "tds"][0]._id`)

// Three different phones: the scorer counts unique reporters, not submissions.
const reports = [
  {waterSigns: ['smell'], people: 0},
  {waterSigns: ['smell', 'colour'], people: 0},
  {
    waterSigns: ['smell'],
    people: 2,
    households: 1,
    symptoms: ['diarrhoea'],
    readings: tds ? [{parameterId: tds, value: 780, method: 'strip'}] : [],
  },
]

console.log(`Playing the story in ${area.name} against ${BASE}\n`)

for (const [i, report] of reports.entries()) {
  const response = await fetch(`${BASE}/api/report`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      lat: area.lat + (Math.random() - 0.5) * 0.002,
      lng: area.lng + (Math.random() - 0.5) * 0.002,
      areaId: area._id,
      sourceKind: 'pipeline',
      ...report,
    }),
  })
  const data = await response.json().catch(() => ({}))
  console.log(`  report ${i + 1}: ${response.status} ${data.error ?? 'sent'}`)
  await new Promise((resolve) => setTimeout(resolve, 1200))
}

const state = await groq(`*[_id == "${area._id}"][0]{state, stateReason}`)
const cases = await groq(
  `*[_type == "waterCase" && area._ref == "${area._id}"] | order(_createdAt desc)[0]{status, riskScore, scoreBreakdown}`,
)

console.log(`\n${area.name} is now: ${state?.state} — ${state?.stateReason}`)
console.log(`Case: ${cases?.status} · score ${cases?.riskScore} · ${cases?.scoreBreakdown}`)
console.log(`\nOpen ${BASE}/control to confirm it as a health worker.`)
