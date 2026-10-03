import 'server-only'

import {summariseCase} from '@/lib/ai'
import {OPEN_STATUSES, areaStateFor, checkDecision, checkResolution, statusAfterScore} from '@/lib/caseRules'
import {sendAlertEmail} from '@/lib/email'
import {DEFAULT_SETTINGS, breakdown, scoreReports, type ReportLike, type RiskSettings} from '@/lib/risk'
import type {AreaState} from '@/lib/states'
import {rainMm48h} from '@/lib/weather'

import {getWriteClient} from './client'

/**
 * The case engine: intake → score → (watch | needs verification) → human decision.
 *
 * Today this runs inside the report route and the control room. When Workflows
 * early access lands, the same four functions become the effects behind the
 * `waterCase` definition — the transitions and the human-only rule stay exactly
 * as they are here.
 */

async function settings(): Promise<RiskSettings> {
  const client = getWriteClient()
  const doc = await client.fetch<Partial<RiskSettings> | null>(`*[_id == "riskSettings"][0]`)
  if (!doc) return DEFAULT_SETTINGS
  return {
    ...DEFAULT_SETTINGS,
    ...doc,
    points: {...DEFAULT_SETTINGS.points, ...(doc.points ?? {})},
  } as RiskSettings
}

/** Attach a new report to its area's open case, opening one if needed, then rescore. */
export async function intakeReport(reportId: string): Promise<{caseId: string} | null> {
  const client = getWriteClient()

  const report = await client.fetch<{_id: string; areaId?: string; submittedAt: string} | null>(
    `*[_id == $id][0]{_id, "areaId": area._ref, submittedAt}`,
    {id: reportId},
  )
  if (!report?.areaId) return null // unmapped: an admin maps it first

  const open = await client.fetch<{_id: string} | null>(
    `*[_type == "waterCase" && area._ref == $areaId && status in $open]
       | order(openedAt desc)[0]{_id}`,
    {areaId: report.areaId, open: [...OPEN_STATUSES]},
  )

  let caseId = open?._id
  if (!caseId) {
    const created = await client.create({
      _type: 'waterCase',
      area: {_type: 'reference', _ref: report.areaId},
      status: 'logged',
      reports: [],
      riskScore: 0,
      openedAt: new Date().toISOString(),
    })
    caseId = created._id
  }

  await client
    .patch(caseId)
    .setIfMissing({reports: []})
    .append('reports', [{_type: 'reference', _ref: reportId, _key: reportId}])
    .set({lastSignalAt: report.submittedAt})
    .commit()

  await rescoreCase(caseId)
  return {caseId}
}

type CaseDoc = {
  _id: string
  status: string
  areaId: string
  areaName: string
  lat?: number
  lng?: number
  reports: ReportLike[]
}

/** Recompute the score, move the case as far as a machine is allowed to, refresh the area. */
export async function rescoreCase(caseId: string): Promise<void> {
  const client = getWriteClient()
  const [doc, config] = await Promise.all([
    client.fetch<CaseDoc | null>(
      `*[_id == $id][0]{
        _id, status,
        "areaId": area._ref,
        "areaName": area->name,
        "lat": area->centre.lat,
        "lng": area->centre.lng,
        "reports": reports[]->{
          _id, submittedAt, deviceHash, waterSigns, illness,
          "readings": readings[]{
            value, detected,
            "parameter": parameter->{code, parameter, unit, rule, acceptableMin, acceptableMax, permissibleMax}
          }
        }
      }`,
      {id: caseId},
    ),
    settings(),
  ])
  if (!doc) return

  // Heavy rain in the last 48 hours makes contamination likelier, so it lowers
  // the bar for asking a person to look.
  const rain =
    typeof doc.lat === 'number' && typeof doc.lng === 'number'
      ? await rainMm48h(doc.lat, doc.lng)
      : undefined

  const score = scoreReports(doc.reports ?? [], config, {rainMm48h: rain})
  const suspectedSource = await traceSource(doc.areaId)

  // A machine may push a case to "needs verification" and no further. Cases a
  // person has already acted on are never moved by the scorer.
  const status = statusAfterScore(doc.status, score.status)

  const summary = await summariseCase({
    areaName: doc.areaName,
    reports: doc.reports ?? [],
    breakdown: breakdown(score),
    bacteria: score.bacteria,
  })

  await client
    .patch(caseId)
    .set({
      riskScore: score.score,
      scoreBreakdown: breakdown(score),
      aiSummary: summary,
      status,
      ...(suspectedSource ? {suspectedSource: ref(suspectedSource)} : {}),
    })
    .commit()

  await refreshAreaState(doc.areaId)
}

/**
 * Source tracing: one pipeline feeding several areas that all went soggy at
 * once is a better explanation than three unlucky neighbourhoods.
 *
 * Only verifiers see this. Naming a tanker operator on a public page before
 * anyone has checked would be an accusation, not a warning.
 */
async function traceSource(areaId: string): Promise<string | null> {
  const client = getWriteClient()

  const sources = await client.fetch<{_id: string; affected: number}[]>(
    `*[_type == "waterSource" && references($areaId)]{
      _id,
      "affected": count(areasServed[]->[state in ["soggy", "phoot"]])
    } | order(affected desc)`,
    {areaId},
  )

  const worst = sources[0]
  return worst && worst.affected >= 2 ? worst._id : null
}

/**
 * Derive an area's golgappa state from its cases and alerts, and store it with
 * the reason. Derived, but stored: the map stays one query and every state can
 * explain itself.
 */
export async function refreshAreaState(areaId: string): Promise<AreaState> {
  const client = getWriteClient()
  const config = await settings()

  const info = await client.fetch<{
    state: AreaState
    activeAlert: {_id: string} | null
    lastResolvedAt: string | null
    openCases: {status: string; riskScore: number; scoreBreakdown?: string}[]
  }>(
    `{
      "state": *[_id == $areaId][0].state,
      "activeAlert": *[_type == "alert" && area._ref == $areaId && !defined(resolvedAt)][0]{_id},
      "lastResolvedAt": *[_type == "alert" && area._ref == $areaId && defined(resolvedAt)]
        | order(resolvedAt desc)[0].resolvedAt,
      "openCases": *[_type == "waterCase" && area._ref == $areaId && status in $open]{
        status, riskScore, scoreBreakdown
      }
    }`,
    {areaId, open: [...OPEN_STATUSES]},
  )

  const {state, reason} = areaStateFor({
    activeAlert: Boolean(info.activeAlert),
    lastResolvedAt: info.lastResolvedAt,
    openCases: info.openCases ?? [],
    quietDays: config.quietDays,
  })

  if (info.state !== state) {
    await client.patch(areaId).set({state, stateReason: reason, stateChangedAt: new Date().toISOString()}).commit()
  } else {
    await client.patch(areaId).set({stateReason: reason}).commit()
  }

  return state
}

/**
 * The human decision. Nothing else in this file may set `confirmed` — that
 * restriction is the whole point of the product.
 */
export async function decideCase(input: {
  caseId: string
  decision: 'confirm' | 'dismiss' | 'requestTest'
  reason: string
  verifierId: string
}): Promise<{ok: true; alertId?: string} | {ok: false; error: string}> {
  const {caseId, decision, verifierId} = input
  const reason = (input.reason ?? '').trim()

  const client = getWriteClient()

  const verifier = await client.fetch<{_id: string; name: string; canVerify: boolean} | null>(
    `*[_type == "contact" && _id == $id][0]{_id, name, canVerify}`,
    {id: verifierId},
  )
  if (!verifier?.canVerify) {
    return {ok: false, error: 'Only a verifier can decide a case.'}
  }

  const doc = await client.fetch<{
    _id: string
    _rev: string
    status: string
    areaId: string
    areaName: string
    scoreBreakdown?: string
    municipalEmail?: string
  } | null>(
    `*[_type == "waterCase" && _id == $id][0]{
      _id, _rev, status, scoreBreakdown,
      "areaId": area._ref,
      "areaName": area->name,
      "municipalEmail": area->municipalContact->email
    }`,
    {id: caseId},
  )
  if (!doc) return {ok: false, error: 'Case not found.'}

  // Only cases waiting on a person can be decided, once. Deciding the same case
  // twice must not issue a second alert.
  const problem = checkDecision({status: doc.status, decision, reason})
  if (problem) return {ok: false, error: problem}

  const now = new Date().toISOString()

  if (decision === 'dismiss') {
    await client
      .patch(caseId)
      .ifRevisionId(doc._rev)
      .set({status: 'dismissed', decisionReason: reason, claimedBy: ref(verifierId), claimedAt: now})
      .commit()
    await refreshAreaState(doc.areaId)
    return {ok: true}
  }

  if (decision === 'requestTest') {
    await client
      .patch(caseId)
      .ifRevisionId(doc._rev)
      .set({status: 'testRequested', decisionReason: reason, claimedBy: ref(verifierId), claimedAt: now})
      .commit()
    await refreshAreaState(doc.areaId)
    return {ok: true}
  }

  // Confirm: the decision and the alert land in one transaction, guarded by the
  // case revision, so two verifiers pressing confirm at once make one alert.
  const alertId = `alert-${caseId}`
  await client
    .transaction()
    .patch(caseId, (p) =>
      p.ifRevisionId(doc._rev).set({
        status: 'confirmed',
        decisionReason: reason,
        claimedBy: ref(verifierId),
        claimedAt: now,
      }),
    )
    .create({
      _id: alertId,
      _type: 'alert',
      area: ref(doc.areaId),
      waterCase: ref(caseId),
      severity: 'doNotDrink',
      precautionsEn:
        'Do not drink tap water. Use boiled or packaged water for drinking and cooking until this is cleared.',
      precautionsHi:
        'नल का पानी न पिएँ। जब तक सूचना न मिले, पीने और खाना बनाने के लिए उबला या पैकेज्ड पानी लें।',
      issuedAt: now,
      verifiedBy: ref(verifierId),
      reason,
    })
    .commit()
  const alert = {_id: alertId}

  await refreshAreaState(doc.areaId)

  const sent = await sendAlertEmail({
    to: doc.municipalEmail,
    areaName: doc.areaName,
    breakdown: doc.scoreBreakdown ?? '',
    verifierName: verifier.name,
    reason,
  })
  if (sent) {
    await client.patch(alert._id).set({notifiedAt: new Date().toISOString()}).commit()
  }

  return {ok: true, alertId: alert._id}
}

/** The fix is done: the area starts recovering. */
export async function resolveAlert(input: {
  alertId: string
  note: string
  verifierId: string
}): Promise<{ok: true} | {ok: false; error: string}> {
  const client = getWriteClient()
  const note = (input.note ?? '').trim()

  const [verifier, alert] = await Promise.all([
    client.fetch<{canVerify: boolean} | null>(`*[_type == "contact" && _id == $id][0]{canVerify}`, {
      id: input.verifierId,
    }),
    client.fetch<{_rev: string; areaId: string; caseId: string; resolvedAt?: string} | null>(
      `*[_type == "alert" && _id == $id][0]{_rev, resolvedAt, "areaId": area._ref, "caseId": waterCase._ref}`,
      {id: input.alertId},
    ),
  ])
  if (!verifier?.canVerify) return {ok: false, error: 'Only a verifier can mark an alert fixed.'}
  if (!alert) return {ok: false, error: 'Alert not found.'}

  const problem = checkResolution({note, alreadyResolved: Boolean(alert.resolvedAt)})
  if (problem) return {ok: false, error: problem}

  const now = new Date().toISOString()
  const tx = client
    .transaction()
    .patch(input.alertId, (p) =>
      p.ifRevisionId(alert._rev).set({resolvedAt: now, resolutionNote: note, resolvedBy: ref(input.verifierId)}),
    )
  if (alert.caseId) tx.patch(alert.caseId, (p) => p.set({status: 'resolved'}))
  await tx.commit()

  await refreshAreaState(alert.areaId)
  return {ok: true}
}

/**
 * The scheduled tick: quiet cases close, recovered areas go back to crisp.
 * Runs from /api/cron/tick until it moves into a Sanity scheduled Function.
 */
export async function tick(): Promise<{closed: number; recovered: number}> {
  const client = getWriteClient()
  const config = await settings()

  const staleCases = await client.fetch<{_id: string; areaId: string}[]>(
    `*[_type == "waterCase" && status in ["logged", "watch"]
       && (!defined(lastSignalAt) || dateTime(lastSignalAt) < dateTime($cutoff))]{_id, "areaId": area._ref}`,
    {cutoff: new Date(Date.now() - config.windowHours * 3600_000).toISOString()},
  )

  for (const c of staleCases) {
    await client.patch(c._id).set({status: 'closed'}).commit()
  }

  const freshAreas = await client.fetch<{_id: string}[]>(
    `*[_type == "area" && state == "fresh" && dateTime(stateChangedAt) < dateTime($cutoff)]{_id}`,
    {cutoff: new Date(Date.now() - config.quietDays * 86_400_000).toISOString()},
  )

  // Then reconcile every area, not only the ones touched above. A decision made
  // in the Studio or the Dashboard app writes the case directly, so this is the
  // backstop that keeps every golgappa honest at least once a day.
  const allAreas = await client.fetch<string[]>(`*[_type == "area"]._id`)
  for (const areaId of allAreas) {
    await refreshAreaState(areaId)
  }

  return {closed: staleCases.length, recovered: freshAreas.length}
}

function ref(id: string) {
  return {_type: 'reference' as const, _ref: id}
}
