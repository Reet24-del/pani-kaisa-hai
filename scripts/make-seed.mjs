#!/usr/bin/env node
/**
 * Writes seed.ndjson: safety limits, advice, risk settings, people, areas and
 * water sources. Sample data for the demo — never presented as real readings.
 *
 *   CITY="Indore" CITY_LAT=22.7196 CITY_LNG=75.8577 node scripts/make-seed.mjs
 *   npx sanity dataset import seed.ndjson production --replace
 */

import {writeFileSync} from 'node:fs'

const CITY = process.env.CITY || 'Indore'
const LAT = Number(process.env.CITY_LAT || 22.7196)
const LNG = Number(process.env.CITY_LNG || 75.8577)

const docs = []

/* ── Safety limits — IS 10500:2012. Verify against the official text. ─────── */

docs.push(
  {
    _id: 'limit-ph',
    _type: 'safetyLimit',
    parameter: 'pH',
    code: 'ph',
    unit: '',
    rule: 'range',
    acceptableMin: 6.5,
    acceptableMax: 8.5,
    healthNote:
      'Water outside this range corrodes pipes and can taste metallic or soapy. It also makes chlorine work poorly.',
    citation: 'IS 10500:2012, Table 1 — no relaxation',
  },
  {
    _id: 'limit-tds',
    _type: 'safetyLimit',
    parameter: 'Total dissolved solids',
    code: 'tds',
    unit: 'mg/L',
    rule: 'max',
    acceptableMax: 500,
    permissibleMax: 2000,
    healthNote: 'High TDS usually means salts or sewage seepage. It tastes bitter or salty.',
    citation: 'IS 10500:2012, Table 1',
  },
  {
    _id: 'limit-turbidity',
    _type: 'safetyLimit',
    parameter: 'Turbidity',
    code: 'turbidity',
    unit: 'NTU',
    rule: 'max',
    acceptableMax: 1,
    permissibleMax: 5,
    healthNote: 'Cloudy water hides bacteria from disinfection.',
    citation: 'IS 10500:2012, Table 1',
  },
  {
    _id: 'limit-chlorine',
    _type: 'safetyLimit',
    parameter: 'Free residual chlorine',
    code: 'chlorine',
    unit: 'mg/L',
    rule: 'min',
    acceptableMin: 0.2,
    permissibleMax: 1,
    healthNote:
      'Below 0.2 mg/L the supply is no longer protected, so anything entering the pipe survives.',
    citation: 'IS 10500:2012, Table 2 (min 0.2, permissible 1)',
  },
  {
    _id: 'limit-ecoli',
    _type: 'safetyLimit',
    parameter: 'E. coli',
    code: 'ecoli',
    unit: '',
    rule: 'absent',
    healthNote: 'Direct evidence of faecal contamination. Any detection goes straight to a verifier.',
    citation: 'IS 10500:2012, Table 6 — shall not be detectable in any 100 mL sample',
  },
  {
    _id: 'limit-coliform',
    _type: 'safetyLimit',
    parameter: 'Total coliform',
    code: 'coliform',
    unit: '',
    rule: 'absent',
    healthNote: 'Shows the supply is open to contamination somewhere along the line.',
    citation: 'IS 10500:2012, Table 6 — shall not be detectable in any 100 mL sample',
  },
)

/* ── Advice per state ─────────────────────────────────────────────────────── */

docs.push(
  {
    _id: 'advice-crisp',
    _type: 'advice',
    state: 'crisp',
    headlineEn: 'No problems reported',
    headlineHi: 'कोई शिकायत नहीं',
    textEn: 'Nothing unusual has been reported here recently. Drink as usual.',
    textHi: 'यहाँ हाल में कोई शिकायत नहीं आई है। पानी सामान्य रूप से पिएँ।',
  },
  {
    _id: 'advice-soggy',
    _type: 'advice',
    state: 'soggy',
    headlineEn: 'Complaints are rising',
    headlineHi: 'शिकायतें बढ़ रही हैं',
    textEn:
      'Boil water for 1 minute before drinking, or use a filter you trust. Nobody has confirmed contamination yet.',
    textHi:
      'पीने से पहले पानी को 1 मिनट उबालें, या भरोसेमंद फ़िल्टर का पानी लें। अभी पुष्टि नहीं हुई है।',
  },
  {
    _id: 'advice-phoot',
    _type: 'advice',
    state: 'phoot',
    headlineEn: 'Do not drink the tap water',
    headlineHi: 'नल का पानी न पिएँ',
    textEn:
      'Contamination was confirmed by a health worker. Use boiled or packaged water for drinking and cooking until this is cleared.',
    textHi:
      'स्वास्थ्य कार्यकर्ता ने दूषित पानी की पुष्टि की है। जब तक सूचना न मिले, पीने और खाना बनाने के लिए उबला या पैकेज्ड पानी लें।',
  },
  {
    _id: 'advice-fresh',
    _type: 'advice',
    state: 'fresh',
    headlineEn: 'Fixed, but stay careful',
    headlineHi: 'ठीक हुआ, पर सावधानी रखें',
    textEn: 'The fix has been recorded. Keep boiling water for a few more days.',
    textHi: 'मरम्मत दर्ज हो गई है। कुछ दिन और पानी उबालकर पिएँ।',
  },
)

/* ── Risk settings ────────────────────────────────────────────────────────── */

docs.push({
  _id: 'riskSettings',
  _type: 'riskSettings',
  windowHours: 72,
  watchAt: 3,
  verifyAt: 6,
  quietDays: 5,
  rainMm: 40,
  points: {
    report: 1,
    illHousehold: 2,
    overAcceptable: 2,
    overPermissible: 3,
    heavyRain: 1,
  },
})

/* ── People (sample) ──────────────────────────────────────────────────────── */

docs.push(
  {
    _id: 'person-asha',
    _type: 'contact',
    name: 'Asha D. (sample)',
    role: 'asha',
    email: 'asha@example.com',
    canVerify: true,
  },
  {
    _id: 'person-rwa',
    _type: 'contact',
    name: 'R. Mehta (sample)',
    role: 'rwa',
    email: 'rwa@example.com',
    canVerify: true,
  },
  {
    _id: 'person-municipal',
    _type: 'contact',
    name: 'Water Works Desk (sample)',
    role: 'municipal',
    email: 'waterworks@example.com',
    canVerify: false,
  },
)

/* ── Areas ────────────────────────────────────────────────────────────────── */

const areaNames = [
  ['Sector 14', 'सेक्टर 14'],
  ['Sector 5', 'सेक्टर 5'],
  ['Ward 22', 'वार्ड 22'],
  ['Nehru Colony', 'नेहरू कॉलोनी'],
  ['Gandhi Nagar', 'गांधी नगर'],
  ['Shanti Vihar', 'शांति विहार'],
  ['Green Park', 'ग्रीन पार्क'],
  ['Model Town', 'मॉडल टाउन'],
  ['Saraswati Colony', 'सरस्वती कॉलोनी'],
  ['Ambedkar Nagar', 'अंबेडकर नगर'],
]

// Spread the areas on a rough 4-column grid, about 1.2 km apart.
const STEP = 0.011
const areaIds = []

areaNames.forEach(([name, nameHi], i) => {
  const row = Math.floor(i / 4)
  const col = i % 4
  const _id = `area-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  areaIds.push(_id)
  docs.push({
    _id,
    _type: 'area',
    name,
    nameHi,
    slug: {_type: 'slug', current: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')},
    city: CITY,
    centre: {
      _type: 'geopoint',
      lat: Number((LAT + (row - 1) * STEP).toFixed(6)),
      lng: Number((LNG + (col - 1.5) * STEP).toFixed(6)),
    },
    radiusM: 600,
    state: 'crisp',
    stateReason: 'No reports in the last 14 days.',
    stateChangedAt: new Date().toISOString(),
    municipalContact: {_type: 'reference', _ref: 'person-municipal'},
  })
})

/* ── Water sources ────────────────────────────────────────────────────────── */

const ref = (id) => ({_type: 'reference', _ref: id, _key: id})

docs.push(
  {
    _id: 'source-pipeline-7',
    _type: 'waterSource',
    name: 'Pipeline 7',
    kind: 'pipeline',
    operator: `${CITY} Municipal Corporation (sample)`,
    areasServed: [areaIds[0], areaIds[1], areaIds[2]].map(ref),
  },
  {
    _id: 'source-pipeline-3',
    _type: 'waterSource',
    name: 'Pipeline 3',
    kind: 'pipeline',
    operator: `${CITY} Municipal Corporation (sample)`,
    areasServed: [areaIds[3], areaIds[4], areaIds[5]].map(ref),
  },
  {
    _id: 'source-borewell-north',
    _type: 'waterSource',
    name: 'North borewell cluster',
    kind: 'borewell',
    operator: 'Society-run (sample)',
    areasServed: [areaIds[6], areaIds[7]].map(ref),
  },
  {
    _id: 'source-tanker-a',
    _type: 'waterSource',
    name: 'Tanker route A',
    kind: 'tanker',
    operator: 'Private operator (sample)',
    areasServed: [areaIds[8], areaIds[9]].map(ref),
  },
)

const out = docs.map((d) => JSON.stringify(d)).join('\n') + '\n'
writeFileSync('seed.ndjson', out)
console.log(`Wrote seed.ndjson — ${docs.length} documents for ${CITY}.`)
console.log('Import with: npx sanity dataset import seed.ndjson production --replace')
