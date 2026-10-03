/**
 * The rules of the case engine as pure functions, so they can be tested
 * without a dataset. `sanity/lib/cases.ts` does the reading and writing and
 * asks these functions what is allowed.
 *
 * Kept free of imports on purpose: the control room app reuses the same rules.
 */

import type {AreaState} from './states.ts'

export const MIN_REASON = 10

/** Cases still collecting evidence or waiting on a person. */
export const OPEN_STATUSES = ['logged', 'watch', 'needsVerification', 'testRequested'] as const

/** Statuses a person can decide from. */
export const DECIDABLE_STATUSES = ['needsVerification', 'testRequested'] as const

/**
 * Statuses only a person sets. The scorer never moves a case out of these,
 * including "testRequested": new reports add evidence, they do not undo a
 * health worker asking for a lab test.
 */
export const HUMAN_STATUSES = ['testRequested', 'confirmed', 'dismissed', 'resolved', 'closed'] as const

export type Decision = 'confirm' | 'dismiss' | 'requestTest'

/** What the scorer is allowed to set, given what a person already decided. */
export function statusAfterScore(current: string | undefined, scored: string): string {
  if (current && (HUMAN_STATUSES as readonly string[]).includes(current)) return current
  // The scorer can raise a case as far as "needs verification" and no further.
  return ['logged', 'watch', 'needsVerification'].includes(scored) ? scored : 'needsVerification'
}

/** Returns an error message, or null when the decision may go ahead. */
export function checkDecision(input: {
  status: string | undefined
  decision: string
  reason: string
}): string | null {
  if (!['confirm', 'dismiss', 'requestTest'].includes(input.decision)) {
    return 'Unknown decision.'
  }
  if ((input.reason ?? '').trim().length < MIN_REASON) {
    return `Write a reason of at least ${MIN_REASON} characters. It goes on the record.`
  }
  if (!input.status || !(DECIDABLE_STATUSES as readonly string[]).includes(input.status)) {
    return input.status === 'confirmed'
      ? 'This case is already confirmed. Refresh to see the alert.'
      : 'This case is no longer waiting on a decision. Refresh the queue.'
  }
  if (input.status === 'testRequested' && input.decision === 'requestTest') {
    return 'A test is already requested for this case.'
  }
  return null
}

/** Returns an error message, or null when the alert may be marked fixed. */
export function checkResolution(input: {note: string; alreadyResolved: boolean}): string | null {
  if (input.alreadyResolved) return 'This alert is already marked fixed.'
  if ((input.note ?? '').trim().length < MIN_REASON) {
    return `Say what was fixed in at least ${MIN_REASON} characters. Residents read this.`
  }
  return null
}

export type OpenCase = {status: string; riskScore?: number; scoreBreakdown?: string}

/**
 * An area's golgappa state, worst signal first:
 * a live alert → phoot; a recent fix → fresh; a case a person or the scorer
 * flagged → soggy; anything else → crisp, with an honest reason.
 */
export function areaStateFor(input: {
  activeAlert: boolean
  lastResolvedAt: string | null
  openCases: OpenCase[]
  quietDays: number
  now?: number
}): {state: AreaState; reason: string} {
  const now = input.now ?? Date.now()

  if (input.activeAlert) {
    return {state: 'phoot', reason: 'Contamination confirmed by a health worker.'}
  }

  if (input.lastResolvedAt) {
    const t = Date.parse(input.lastResolvedAt)
    if (Number.isFinite(t) && now - t < input.quietDays * 86_400_000) {
      return {state: 'fresh', reason: 'Fix recorded. Keep boiling water for a few days.'}
    }
  }

  const cases = [...(input.openCases ?? [])]
  const testing = cases.find((c) => c.status === 'testRequested')
  if (testing) {
    return {
      state: 'soggy',
      reason: 'A health worker has asked for a lab test. Boil or filter until the result is in.',
    }
  }

  const worst = cases.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))[0]
  if (worst && (worst.status === 'watch' || worst.status === 'needsVerification')) {
    return {state: 'soggy', reason: worst.scoreBreakdown ?? 'Complaints are rising.'}
  }
  if (worst) {
    // Reports exist but don't add up to a signal yet. Say so, rather than
    // claiming nothing was reported.
    return {state: 'crisp', reason: `${worst.scoreBreakdown ?? 'Some reports'}. Not enough to act on yet.`}
  }
  return {state: 'crisp', reason: 'No reports in the last few days.'}
}
