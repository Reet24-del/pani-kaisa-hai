#!/usr/bin/env node
/**
 * One-off: corrects the IS 10500 table numbers on the safetyLimit documents
 * already in the dataset, without re-importing the seed (which would wipe
 * reports and cases).
 *
 *   node --env-file=.env.local scripts/fix-citations.mjs
 *
 * Chlorine is in Table 2 (general parameters); E. coli and total coliform are
 * in Table 6 (bacteriological quality). The values themselves were right.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_API_WRITE_TOKEN

if (!PROJECT_ID || !TOKEN) {
  console.error('Needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (run with --env-file=.env.local).')
  process.exit(1)
}

const fixes = {
  'limit-chlorine': 'IS 10500:2012, Table 2 (min 0.2, permissible 1)',
  'limit-ecoli': 'IS 10500:2012, Table 6 — shall not be detectable in any 100 mL sample',
  'limit-coliform': 'IS 10500:2012, Table 6 — shall not be detectable in any 100 mL sample',
}

const mutations = Object.entries(fixes).map(([id, citation]) => ({
  patch: {id, set: {citation}},
}))

const response = await fetch(
  `https://${PROJECT_ID}.api.sanity.io/v2026-09-20/data/mutate/${DATASET}`,
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}`},
    body: JSON.stringify({mutations}),
  },
)

if (!response.ok) {
  console.error(`Patch failed: ${response.status} ${await response.text()}`)
  process.exit(1)
}
console.log(`Updated ${mutations.length} citations.`)
