import {createHash, randomUUID} from 'node:crypto'

import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'

import {areaForPoint, type PlaceableArea} from '@/lib/geo'
import {intakeReport} from '@/sanity/lib/cases'
import {getWriteClient} from '@/sanity/lib/client'

/**
 * Accepting a report.
 *
 * The write token lives here, never in the browser. Everything a resident sends
 * is treated as untrusted: fields are whitelisted, numbers are clamped, and the
 * device is rate limited by a salted hash — we never store an IP address.
 */

const SIGNS = ['smell', 'colour', 'taste', 'particles'] as const
const SOURCES = ['pipeline', 'borewell', 'tanker', 'ro', 'unknown'] as const
const METHODS = ['strip', 'meter', 'lab'] as const

const DEVICE_COOKIE = 'pkh_device'
const MAX_REPORTS_PER_AREA_PER_DAY = 3

type Body = {
  lat?: number
  lng?: number
  areaId?: string
  sourceKind?: string
  waterSigns?: string[]
  households?: number
  people?: number
  symptoms?: string[]
  readings?: {parameterId?: string; value?: number; detected?: boolean; method?: string}[]
  contact?: {phone?: string; email?: string}
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Send JSON.'}, {status: 400})
  }

  const lat = Number(body.lat)
  const lng = Number(body.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({error: 'Pick where you are first.'}, {status: 400})
  }

  const waterSigns = (body.waterSigns ?? []).filter((s): s is (typeof SIGNS)[number] =>
    (SIGNS as readonly string[]).includes(s),
  )
  const people = clamp(body.people, 0, 200)
  const households = clamp(body.households, 0, 100)

  if (waterSigns.length === 0 && people === 0) {
    return NextResponse.json(
      {error: 'Tell us at least one thing you noticed, or how many people are ill.'},
      {status: 400},
    )
  }

  const sourceKind = (SOURCES as readonly string[]).includes(body.sourceKind ?? '')
    ? body.sourceKind!
    : 'unknown'

  const client = getWriteClient()

  // Which area is this? An explicit pick wins; otherwise the point decides.
  const areas = await client.fetch<PlaceableArea[]>(
    `*[_type == "area"]{_id, name, "slug": slug.current, "lat": centre.lat, "lng": centre.lng, radiusM}`,
  )
  const matched = body.areaId
    ? (areas.find((a) => a._id === body.areaId) ?? null)
    : areaForPoint({lat, lng}, areas)

  // Rate limit per device per area. Three taps from one phone is one person.
  const jar = await cookies()
  let deviceId = jar.get(DEVICE_COOKIE)?.value
  const isNewDevice = !deviceId
  if (!deviceId) deviceId = randomUUID()
  const deviceHash = hashDevice(deviceId)

  if (matched) {
    const recent = await client.fetch<number>(
      `count(*[_type == "report" && deviceHash == $hash && area._ref == $areaId
        && dateTime(submittedAt) > dateTime(now()) - 60*60*24])`,
      {hash: deviceHash, areaId: matched._id},
    )
    if (recent >= MAX_REPORTS_PER_AREA_PER_DAY) {
      return NextResponse.json(
        {
          error:
            'You have already sent 3 reports for this area today. A health worker is looking at them.',
        },
        {status: 429},
      )
    }
  }

  const readings = (body.readings ?? [])
    .filter((r) => r.parameterId && (typeof r.value === 'number' || typeof r.detected === 'boolean'))
    .slice(0, 6)
    .map((r, i) => ({
      _type: 'reading',
      _key: `reading-${i}`,
      parameter: {_type: 'reference', _ref: r.parameterId},
      ...(typeof r.value === 'number' ? {value: r.value} : {}),
      ...(typeof r.detected === 'boolean' ? {detected: r.detected} : {}),
      method: (METHODS as readonly string[]).includes(r.method ?? '') ? r.method : 'strip',
    }))

  const doc = await client.create({
    _type: 'report',
    ...(matched ? {area: {_type: 'reference', _ref: matched._id}} : {}),
    location: {_type: 'geopoint', lat, lng},
    sourceKind,
    waterSigns,
    illness: {
      households: households || (people > 0 ? 1 : 0),
      people,
      symptoms: (body.symptoms ?? []).slice(0, 4),
    },
    ...(readings.length ? {readings} : {}),
    submittedAt: new Date().toISOString(),
    deviceHash,
    ...(body.contact?.phone || body.contact?.email
      ? {contact: {phone: body.contact.phone, email: body.contact.email}}
      : {}),
  })

  // Score it straight away so the resident sees an honest state on the next screen.
  let caseId: string | undefined
  try {
    const result = await intakeReport(doc._id)
    caseId = result?.caseId
  } catch (error) {
    console.error('[report] intake failed; the report is saved and the tick will pick it up:', error)
  }

  const response = NextResponse.json({
    ok: true,
    area: matched ? {name: matched.name, slug: matched.slug} : null,
    unmapped: !matched,
    caseId,
  })

  if (isNewDevice) {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }

  return response
}

function clamp(value: unknown, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Salted so the stored hash cannot be walked back to the cookie value. */
function hashDevice(deviceId: string): string {
  const salt = process.env.DEVICE_HASH_SALT || 'pani-kaisa-hai-dev-salt'
  return createHash('sha256').update(`${salt}:${deviceId}`).digest('hex').slice(0, 32)
}
