/**
 * The risk score. Deliberately simple arithmetic, because every golgappa has to
 * be able to explain itself in one line on a public page.
 *
 * Pure functions only — no Sanity, no network — so the rules can be read, tested
 * and argued with on their own.
 */

export type LimitRule = 'max' | 'min' | 'range' | 'absent'

export type Limit = {
  code?: string
  parameter?: string
  unit?: string
  rule: LimitRule
  acceptableMin?: number
  acceptableMax?: number
  permissibleMax?: number
}

export type Reading = {
  value?: number
  detected?: boolean
  parameter?: Limit | null
}

export type ReportLike = {
  _id: string
  submittedAt: string
  deviceHash?: string
  waterSigns?: string[]
  illness?: {households?: number; people?: number}
  readings?: Reading[]
}

export type RiskSettings = {
  windowHours: number
  watchAt: number
  verifyAt: number
  quietDays: number
  rainMm: number
  points: {
    report: number
    illHousehold: number
    overAcceptable: number
    overPermissible: number
    heavyRain: number
  }
}

export const DEFAULT_SETTINGS: RiskSettings = {
  windowHours: 72,
  watchAt: 3,
  verifyAt: 6,
  quietDays: 5,
  rainMm: 40,
  points: {report: 1, illHousehold: 2, overAcceptable: 2, overPermissible: 3, heavyRain: 1},
}

export type Verdict = 'ok' | 'overAcceptable' | 'overPermissible' | 'detected' | 'unknown'

/** Judge one reading against its limit. Bacteria are a yes/no, everything else is a number. */
export function judgeReading(reading: Reading): Verdict {
  const limit = reading.parameter
  if (!limit) return 'unknown'

  if (limit.rule === 'absent') {
    if (reading.detected === true) return 'detected'
    if (reading.detected === false) return 'ok'
    return 'unknown'
  }

  const value = reading.value
  if (typeof value !== 'number' || Number.isNaN(value)) return 'unknown'

  switch (limit.rule) {
    case 'max': {
      if (limit.acceptableMax === undefined) return 'unknown'
      if (value <= limit.acceptableMax) return 'ok'
      if (limit.permissibleMax !== undefined && value <= limit.permissibleMax) {
        return 'overAcceptable'
      }
      return 'overPermissible'
    }
    case 'min': {
      if (limit.acceptableMin === undefined) return 'unknown'
      if (value >= limit.acceptableMin) return 'ok'
      // No chlorine at all means the supply is not protected at all.
      return value <= 0 ? 'overPermissible' : 'overAcceptable'
    }
    case 'range': {
      const {acceptableMin: lo, acceptableMax: hi} = limit
      if (lo === undefined || hi === undefined) return 'unknown'
      if (value >= lo && value <= hi) return 'ok'
      // More than a full unit outside the band (pH 5.4, pH 9.7) is not a rounding error.
      const distance = value < lo ? lo - value : value - hi
      return distance > 1 ? 'overPermissible' : 'overAcceptable'
    }
    default:
      return 'unknown'
  }
}

export type ScoreLine = {label: string; points: number}

export type Score = {
  score: number
  lines: ScoreLine[]
  /** Bacteria found: goes to a human whatever the score says. */
  bacteria: boolean
  reportsCounted: number
  status: CaseStatus
  reason: string
}

export type CaseStatus = 'logged' | 'watch' | 'needsVerification'

export function scoreReports(
  reports: ReportLike[],
  settings: RiskSettings = DEFAULT_SETTINGS,
  options: {now?: Date; rainMm48h?: number} = {},
): Score {
  const now = options.now ?? new Date()
  const cutoff = now.getTime() - settings.windowHours * 3600_000

  const inWindow = reports.filter((r) => {
    const t = Date.parse(r.submittedAt)
    return Number.isFinite(t) && t >= cutoff
  })

  const lines: ScoreLine[] = []
  let bacteria = false

  // One point per unique reporter, not per submission: three taps from one
  // phone is one person, not a pattern.
  const devices = new Set<string>()
  for (const r of inWindow) {
    const hasSign = (r.waterSigns ?? []).length > 0
    if (!hasSign) continue
    devices.add(r.deviceHash || r._id)
  }
  if (devices.size > 0) {
    lines.push({
      label: `${devices.size} report${devices.size === 1 ? '' : 's'}`,
      points: devices.size * settings.points.report,
    })
  }

  const illHouseholds = inWindow.reduce((sum, r) => sum + (r.illness?.households ?? 0), 0)
  if (illHouseholds > 0) {
    lines.push({
      label: `${illHouseholds} household${illHouseholds === 1 ? '' : 's'} ill`,
      points: illHouseholds * settings.points.illHousehold,
    })
  }

  for (const r of inWindow) {
    for (const reading of r.readings ?? []) {
      const verdict = judgeReading(reading)
      const name = reading.parameter?.parameter ?? reading.parameter?.code ?? 'reading'
      if (verdict === 'detected') {
        bacteria = true
        lines.push({label: `${name} detected`, points: 0})
      } else if (verdict === 'overAcceptable') {
        lines.push({
          label: `${name} ${reading.value} over acceptable limit`,
          points: settings.points.overAcceptable,
        })
      } else if (verdict === 'overPermissible') {
        lines.push({
          label: `${name} ${reading.value} over permissible limit`,
          points: settings.points.overPermissible,
        })
      }
    }
  }

  if (options.rainMm48h !== undefined && options.rainMm48h >= settings.rainMm) {
    lines.push({
      label: `heavy rain (${Math.round(options.rainMm48h)} mm in 48 h)`,
      points: settings.points.heavyRain,
    })
  }

  const score = lines.reduce((sum, line) => sum + line.points, 0)

  const status: CaseStatus = bacteria
    ? 'needsVerification'
    : score >= settings.verifyAt
      ? 'needsVerification'
      : score >= settings.watchAt
        ? 'watch'
        : 'logged'

  const reason = bacteria
    ? `${describe(lines)} — bacteria found, sent to a health worker`
    : describe(lines) || 'No reports in the scoring window.'

  return {score, lines, bacteria, reportsCounted: inWindow.length, status, reason}
}

function describe(lines: ScoreLine[]): string {
  if (lines.length === 0) return ''
  return lines.map((l) => l.label).join(' · ')
}

/** The one-line sum shown to verifiers: "3 reports (+3) · 1 household ill (+2) = 5". */
export function breakdown(score: Score): string {
  if (score.lines.length === 0) return 'Nothing in the scoring window.'
  const parts = score.lines.map((l) => (l.points ? `${l.label} (+${l.points})` : l.label))
  return `${parts.join(' · ')} = ${score.score}`
}
