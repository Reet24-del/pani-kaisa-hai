/**
 * Turning what a resident sends into what gets stored.
 *
 * Everything from the browser is untrusted: fields are whitelisted, numbers
 * clamped, references checked against documents that exist, and the two
 * things that could identify a person are handled separately:
 *
 * - the point is rounded to about 100 m before it is stored, which is enough to
 *   place a report in an area and not enough to find a house;
 * - a phone number or email never goes on the report. It goes in a private
 *   document (see `privateContactId`) that only signed-in Studio users and
 *   the server can read, even though the dataset itself is public.
 *
 * Pure on purpose, so every rule here has a test.
 */

export const SIGNS = ['smell', 'colour', 'taste', 'particles'] as const
export const SOURCES = ['pipeline', 'borewell', 'tanker', 'ro', 'unknown'] as const
export const METHODS = ['strip', 'meter', 'lab'] as const
export const SYMPTOMS = ['diarrhoea', 'vomiting', 'fever', 'jaundice'] as const

export type RawReport = {
  lat?: unknown
  lng?: unknown
  areaId?: unknown
  sourceKind?: unknown
  waterSigns?: unknown
  households?: unknown
  people?: unknown
  symptoms?: unknown
  readings?: unknown
  contact?: unknown
}

export type CleanReading = {
  _type: 'reading'
  _key: string
  parameter: {_type: 'reference'; _ref: string}
  value?: number
  detected?: boolean
  method: string
}

export type CleanReport = {
  lat: number
  lng: number
  areaId: string | null
  sourceKind: string
  waterSigns: string[]
  households: number
  people: number
  symptoms: string[]
  readings: CleanReading[]
  contact: {phone?: string; email?: string} | null
}

export function cleanReport(
  body: RawReport,
  known: {parameterIds: readonly string[]},
): {ok: true; report: CleanReport} | {ok: false; error: string} {
  const lat = Number(body?.lat)
  const lng = Number(body?.lng)
  if (
    body?.lat == null ||
    body?.lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return {ok: false, error: 'Pick where you are first.'}
  }

  const waterSigns = onlyFrom(body.waterSigns, SIGNS)
  const people = clamp(body.people, 0, 200)
  const households = clamp(body.households, 0, 100)

  if (waterSigns.length === 0 && people === 0) {
    return {ok: false, error: 'Tell us at least one thing you noticed, or how many people are ill.'}
  }

  const sourceKind = (SOURCES as readonly string[]).includes(String(body.sourceKind))
    ? String(body.sourceKind)
    : 'unknown'

  const readings: CleanReading[] = (Array.isArray(body.readings) ? body.readings : [])
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .filter((r) => typeof r.parameterId === 'string' && known.parameterIds.includes(r.parameterId))
    .filter(
      (r) => (typeof r.value === 'number' && Number.isFinite(r.value)) || typeof r.detected === 'boolean',
    )
    .slice(0, 6)
    .map((r, i) => ({
      _type: 'reading' as const,
      _key: `reading-${i}`,
      parameter: {_type: 'reference' as const, _ref: r.parameterId as string},
      ...(typeof r.value === 'number' ? {value: Math.min(100_000, Math.max(0, r.value))} : {}),
      ...(typeof r.detected === 'boolean' ? {detected: r.detected} : {}),
      method: (METHODS as readonly string[]).includes(String(r.method)) ? String(r.method) : 'strip',
    }))

  return {
    ok: true,
    report: {
      lat,
      lng,
      areaId: typeof body.areaId === 'string' && body.areaId ? body.areaId : null,
      sourceKind,
      waterSigns,
      households: households || (people > 0 ? 1 : 0),
      people,
      symptoms: onlyFrom(body.symptoms, SYMPTOMS),
      readings,
      contact: cleanContact(body.contact),
    },
  }
}

/** About 110 m at the equator. Enough to place a report, not to find a door. */
export function coarsen(value: number): number {
  return Math.round(value * 1000) / 1000
}

/**
 * Documents whose id contains a dot sit on a "path", and Sanity does not
 * return them to unauthenticated requests even on a public dataset. That is
 * how drafts stay private, and it is where reporter contact details live.
 */
export function privateContactId(reportId: string): string {
  return `private.contact.${reportId}`
}

function cleanContact(raw: unknown): {phone?: string; email?: string} | null {
  if (!raw || typeof raw !== 'object') return null
  const {phone, email} = raw as {phone?: unknown; email?: unknown}

  const digits = typeof phone === 'string' ? phone.replace(/[^\d+]/g, '').slice(0, 16) : ''
  const cleanPhone = /^\+?\d{6,15}$/.test(digits) ? digits : undefined

  const trimmed = typeof email === 'string' ? email.trim().slice(0, 120) : ''
  const cleanEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : undefined

  return cleanPhone || cleanEmail
    ? {...(cleanPhone ? {phone: cleanPhone} : {}), ...(cleanEmail ? {email: cleanEmail} : {})}
    : null
}

function onlyFrom<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((v): v is T => (allowed as readonly unknown[]).includes(v)))]
}

function clamp(value: unknown, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(min, Math.round(n)))
}
