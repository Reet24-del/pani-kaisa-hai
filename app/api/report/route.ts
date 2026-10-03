import {createHash, randomUUID} from 'node:crypto'

import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'

import {areaForPoint, type PlaceableArea} from '@/lib/geo'
import {cleanReport, coarsen, privateContactId, type RawReport} from '@/lib/reportInput'
import {intakeReport} from '@/sanity/lib/cases'
import {getWriteClient} from '@/sanity/lib/client'

/**
 * Accepting a report.
 *
 * The write token lives here, never in the browser. Everything a resident sends
 * is treated as untrusted: fields are whitelisted, numbers are clamped, and the
 * device is rate limited by a salted hash — we never store an IP address.
 * The rules themselves live in lib/reportInput.ts, where they are tested.
 */

const DEVICE_COOKIE = 'pkh_device'
const MAX_REPORTS_PER_AREA_PER_DAY = 3

export async function POST(request: Request) {
  let body: RawReport
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Send JSON.'}, {status: 400})
  }

  try {
    return await accept(body)
  } catch (error) {
    // Always answer in JSON, so the form can show a real message instead of
    // "no connection".
    console.error('[report] failed:', error)
    return NextResponse.json(
      {error: 'Could not save the report just now. Please try again in a minute.'},
      {status: 500},
    )
  }
}

async function accept(body: RawReport) {
  const client = getWriteClient()

  // Which areas and which limits exist? Readings may only point at real limits.
  const known = await client.fetch<{areas: PlaceableArea[]; parameterIds: string[]}>(
    `{
      "areas": *[_type == "area"]{_id, name, "slug": slug.current, "lat": centre.lat, "lng": centre.lng, radiusM},
      "parameterIds": *[_type == "safetyLimit"]._id
    }`,
  )

  const cleaned = cleanReport(body, {parameterIds: known.parameterIds ?? []})
  if (!cleaned.ok) {
    return NextResponse.json({error: cleaned.error}, {status: 400})
  }
  const input = cleaned.report

  // An explicit pick wins; otherwise the point decides.
  const areas = known.areas ?? []
  const matched = input.areaId
    ? (areas.find((a) => a._id === input.areaId) ?? null)
    : areaForPoint({lat: input.lat, lng: input.lng}, areas)

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

  const reportId = `report-${randomUUID()}`
  const tx = client.transaction().create({
    _id: reportId,
    _type: 'report',
    ...(matched ? {area: {_type: 'reference', _ref: matched._id}} : {}),
    // Rounded: the exact point is used above to find the area, then dropped.
    location: {_type: 'geopoint', lat: coarsen(input.lat), lng: coarsen(input.lng)},
    sourceKind: input.sourceKind,
    waterSigns: input.waterSigns,
    illness: {households: input.households, people: input.people, symptoms: input.symptoms},
    ...(input.readings.length ? {readings: input.readings} : {}),
    submittedAt: new Date().toISOString(),
    deviceHash,
  })
  if (input.contact) {
    // Kept off the report, in a document the public API does not return.
    tx.create({
      _id: privateContactId(reportId),
      _type: 'reporterContact',
      report: {_type: 'reference', _ref: reportId, _weak: true},
      ...input.contact,
    })
  }
  await tx.commit()
  const doc = {_id: reportId}

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

/** Salted so the stored hash cannot be walked back to the cookie value. */
function hashDevice(deviceId: string): string {
  const salt = process.env.DEVICE_HASH_SALT || 'pani-kaisa-hai-dev-salt'
  return createHash('sha256').update(`${salt}:${deviceId}`).digest('hex').slice(0, 32)
}
