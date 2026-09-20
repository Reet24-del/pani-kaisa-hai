import type {AreaState} from '../states'

/**
 * The shapes the UI reads. Both backends — Sanity and the in-memory demo —
 * return these, so no page knows or cares which one is answering.
 */

export type AreaSummary = {
  _id: string
  name: string
  nameHi?: string
  city: string
  state: AreaState
  stateReason?: string
  stateChangedAt?: string
  slug: string
  lat: number
  lng: number
  radiusM?: number
}

export type LimitSummary = {
  _id: string
  parameter: string
  code: string
  unit?: string
  rule: string
  acceptableMin?: number
  acceptableMax?: number
  permissibleMax?: number
}

export type ReadingView = {
  value?: number
  detected?: boolean
  method?: string
  parameter?: LimitSummary
}

export type ReportView = {
  _id: string
  submittedAt: string
  waterSigns?: string[]
  sourceKind?: string
  peopleIll?: number
  readings?: ReadingView[]
}

export type AreaDetail = AreaSummary & {
  advice?: {headlineEn: string; headlineHi?: string; textEn: string; textHi?: string}
  activeAlert?: {
    severity: string
    precautionsEn: string
    precautionsHi?: string
    issuedAt: string
    verifiedBy?: {name: string; role: string}
  }
  reports?: ReportView[]
  sources?: {_id: string; name: string; kind: string}[]
}

export type CaseView = {
  _id: string
  riskScore: number
  scoreBreakdown?: string
  aiSummary?: string
  status: string
  openedAt?: string
  area?: {_id: string; name: string; slug: string; state: string}
  claimedBy?: {name: string}
  suspectedSource?: {name: string; kind: string}
  reports?: ReportView[]
}

export type QueueView = {
  needsVerification: CaseView[]
  watch: {_id: string; riskScore: number; scoreBreakdown?: string; area?: {name: string; slug: string}}[]
  alerts: {_id: string; issuedAt: string; area?: {name: string}; verifiedBy?: {name: string}}[]
  verifiers: {_id: string; name: string; role: string}[]
}

export type SubmitReportInput = {
  lat: number
  lng: number
  areaId?: string | null
  sourceKind: string
  waterSigns: string[]
  households: number
  people: number
  symptoms: string[]
  readings: {parameterId: string; value?: number; detected?: boolean; method?: string}[]
  contact?: {phone?: string; email?: string}
  deviceHash: string
}

export type SubmitReportResult =
  | {ok: true; area: {name: string; slug: string} | null; unmapped: boolean; caseId?: string}
  | {ok: false; status: number; error: string}

export type DecisionInput = {
  caseId: string
  decision: 'confirm' | 'dismiss' | 'requestTest'
  reason: string
  verifierId: string
}
