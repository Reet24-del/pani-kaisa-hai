import 'server-only'

/**
 * Rainfall over the last 48 hours, from Open-Meteo (no key, no account).
 *
 * Heavy rain is when pipelines and sewers mix, so it lowers the bar for asking
 * a person to look. Cached for an hour per area, and any failure returns
 * undefined — weather is a nudge, never a blocker.
 */

const cache = new Map<string, {value: number; at: number}>()
const TTL_MS = 60 * 60 * 1000

export async function rainMm48h(lat: number, lng: number): Promise<number | undefined> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=precipitation_sum&past_days=2&forecast_days=1&timezone=auto`

  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(4000)})
    if (!response.ok) return undefined

    const data = (await response.json()) as {daily?: {precipitation_sum?: (number | null)[]}}
    const days = data.daily?.precipitation_sum ?? []
    // The first two entries are the past two days; today's forecast is ignored.
    const total = days.slice(0, 2).reduce<number>((sum, mm) => sum + (mm ?? 0), 0)

    cache.set(key, {value: total, at: Date.now()})
    return total
  } catch {
    return undefined
  }
}
