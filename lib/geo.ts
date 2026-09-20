/** Distance helpers. Areas are circles (centre + radius) in v1 — see the PRD's open questions. */

const EARTH_RADIUS_M = 6_371_000

export function distanceM(a: {lat: number; lng: number}, b: {lat: number; lng: number}): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export type PlaceableArea = {_id: string; name: string; slug: string; lat: number; lng: number; radiusM?: number}

/**
 * The area a point falls in, or null when it falls outside every circle.
 * A report outside every area is still kept — it goes to the "Unmapped
 * reports" desk so an admin can extend the map, instead of being dropped.
 */
export function areaForPoint(
  point: {lat: number; lng: number},
  areas: PlaceableArea[],
): PlaceableArea | null {
  let best: {area: PlaceableArea; distance: number} | null = null

  for (const area of areas) {
    if (typeof area.lat !== 'number' || typeof area.lng !== 'number') continue
    const distance = distanceM(point, area)
    if (distance <= (area.radiusM ?? 500) && (!best || distance < best.distance)) {
      best = {area, distance}
    }
  }

  return best?.area ?? null
}
