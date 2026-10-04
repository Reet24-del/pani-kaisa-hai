import {OPEN_STATUSES, areaStateFor} from './caseRules.ts'
import {DEFAULT_SETTINGS, type RiskSettings} from './risk.ts'
import type {AreaState} from './states.ts'

/**
 * The scheduled tick, written against the smallest slice of a Sanity client so
 * the same code runs in two places: the Vercel cron route (with the app's write
 * token) and the Sanity scheduled Function in `functions/daily-tick/` (with its
 * robot token). Relative imports only, so the Function's bundler can follow them.
 */
export interface TickClient {
  fetch<T>(query: string, params?: Record<string, unknown>): Promise<T>
  patch(id: string): {set(attrs: Record<string, unknown>): {commit(): Promise<unknown>}}
}

export async function loadSettings(client: TickClient): Promise<RiskSettings> {
  const doc = await client.fetch<Partial<RiskSettings> | null>(`*[_id == "riskSettings"][0]`)
  if (!doc) return DEFAULT_SETTINGS
  return {
    ...DEFAULT_SETTINGS,
    ...doc,
    points: {...DEFAULT_SETTINGS.points, ...(doc.points ?? {})},
  } as RiskSettings
}

/**
 * Derive an area's golgappa state from its cases and alerts, and store it with
 * the reason. Derived, but stored: the map stays one query and every state can
 * explain itself.
 */
export async function refreshAreaStateWith(
  client: TickClient,
  areaId: string,
  config?: RiskSettings,
): Promise<AreaState> {
  const settings = config ?? (await loadSettings(client))

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
    quietDays: settings.quietDays,
  })

  if (info.state !== state) {
    await client.patch(areaId).set({state, stateReason: reason, stateChangedAt: new Date().toISOString()}).commit()
  } else {
    await client.patch(areaId).set({stateReason: reason}).commit()
  }

  return state
}

/** Quiet cases close, recovered areas go back to crisp, and every area is re-derived. */
export async function runTick(
  client: TickClient,
  now: number = Date.now(),
): Promise<{closed: number; recovered: number}> {
  const config = await loadSettings(client)

  const staleCases = await client.fetch<{_id: string; areaId: string}[]>(
    `*[_type == "waterCase" && status in ["logged", "watch"]
       && (!defined(lastSignalAt) || dateTime(lastSignalAt) < dateTime($cutoff))]{_id, "areaId": area._ref}`,
    {cutoff: new Date(now - config.windowHours * 3600_000).toISOString()},
  )

  for (const c of staleCases) {
    await client.patch(c._id).set({status: 'closed'}).commit()
  }

  const freshAreas = await client.fetch<{_id: string}[]>(
    `*[_type == "area" && state == "fresh" && dateTime(stateChangedAt) < dateTime($cutoff)]{_id}`,
    {cutoff: new Date(now - config.quietDays * 86_400_000).toISOString()},
  )

  // Then reconcile every area, not only the ones touched above. A decision made
  // in the Studio or the Dashboard app writes the case directly, so this is the
  // backstop that keeps every golgappa honest at least once a day.
  const allAreas = await client.fetch<string[]>(`*[_type == "area"]._id`)
  for (const areaId of allAreas) {
    await refreshAreaStateWith(client, areaId, config)
  }

  return {closed: staleCases.length, recovered: freshAreas.length}
}
